
const pool = require('../config/db');

async function iniciarIntento(usuarioId) {
  const db = await pool.connect();

  try {
    await db.query('BEGIN');

    // Serializa la creación de intentos del usuario.
    await db.query(
      'SELECT usuario_id FROM usuario WHERE usuario_id = $1 FOR UPDATE',
      [usuarioId]
    );

    // Reutilizar un intento pendiente, si existe.
    const pendiente = await db.query(`
      SELECT intento_id
      FROM intento_trivia
      WHERE usuario_id = $1
        AND estado = 'en_progreso'
      ORDER BY intento_id DESC
      LIMIT 1
    `, [usuarioId]);

    if (pendiente.rows.length) {
      await db.query('COMMIT');
      return pendiente.rows[0].intento_id;
    }

    const trivia = await db.query(`
      SELECT trivia_id
      FROM trivia
      WHERE activa = TRUE
      ORDER BY trivia_id
      LIMIT 1
    `);

    if (!trivia.rows.length) {
      throw new Error('No existe una trivia activa');
    }

    const triviaId = trivia.rows[0].trivia_id;

    // Priorizar preguntas nunca asignadas al usuario.
    const preguntas = await db.query(`
      SELECT p.pregunta_id
      FROM pregunta_trivia p
      WHERE p.trivia_id = $2
        AND (
          SELECT COUNT(*)
          FROM opcion_respuesta o
          WHERE o.pregunta_id = p.pregunta_id
        ) = 4
        AND (
          SELECT COUNT(*)
          FROM opcion_respuesta o
          WHERE o.pregunta_id = p.pregunta_id
            AND o.es_correcta = TRUE
        ) = 1
      ORDER BY
        CASE WHEN EXISTS (
          SELECT 1
          FROM intento_pregunta ip
          JOIN intento_trivia i
            ON i.intento_id = ip.intento_id
          WHERE i.usuario_id = $1
            AND ip.pregunta_id = p.pregunta_id
        ) THEN 1 ELSE 0 END,
        RANDOM()
      LIMIT 5
    `, [usuarioId, triviaId]);

    if (preguntas.rows.length !== 5) {
      throw new Error('No hay suficientes preguntas válidas');
    }

    const intento = await db.query(`
      INSERT INTO intento_trivia (usuario_id, trivia_id)
      VALUES ($1, $2)
      RETURNING intento_id
    `, [usuarioId, triviaId]);

    const intentoId = intento.rows[0].intento_id;

    for (let i = 0; i < preguntas.rows.length; i++) {
      await db.query(`
        INSERT INTO intento_pregunta
          (intento_id, pregunta_id, posicion)
        VALUES ($1, $2, $3)
      `, [intentoId, preguntas.rows[i].pregunta_id, i + 1]);
    }

    await db.query('COMMIT');
    return intentoId;

  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally {
    db.release();
  }
}

async function obtenerPreguntas(intentoId, usuarioId) {
  const intento = await pool.query(`
    SELECT intento_id
    FROM intento_trivia
    WHERE intento_id = $1
      AND usuario_id = $2
      AND estado = 'en_progreso'
  `, [intentoId, usuarioId]);

  if (!intento.rows.length) {
    throw new Error('Intento no disponible');
  }

  const resultado = await pool.query(`
    SELECT
      ip.posicion,
      p.pregunta_id,
      p.enunciado,
      p.imagen_url, 
      e.nombre AS equipo,
      o.opcion_id,
      o.texto_opcion,
      ru.opcion_id AS respuesta_guardada
    FROM intento_pregunta ip
    JOIN pregunta_trivia p
      ON p.pregunta_id = ip.pregunta_id
    JOIN equipo e
      ON e.equipo_id = p.equipo_id
    JOIN opcion_respuesta o
      ON o.pregunta_id = p.pregunta_id
    LEFT JOIN respuesta_usuario ru
      ON ru.intento_id = ip.intento_id
     AND ru.pregunta_id = p.pregunta_id
    WHERE ip.intento_id = $1
    ORDER BY ip.posicion, o.opcion_id
  `, [intentoId]);

  const preguntas = new Map();

  for (const fila of resultado.rows) {
    if (!preguntas.has(fila.pregunta_id)) {
      preguntas.set(fila.pregunta_id, {
        pregunta_id: fila.pregunta_id,
        posicion: fila.posicion,
        enunciado: fila.enunciado,
        imagen_url: fila.imagen_url,
        equipo: fila.equipo,
        respuesta_guardada: fila.respuesta_guardada,
        opciones: []
      });
    }

    preguntas.get(fila.pregunta_id).opciones.push({
      opcion_id: fila.opcion_id,
      texto: fila.texto_opcion
    });
  }

  return [...preguntas.values()];
}

async function responder(usuarioId, intentoId, preguntaId, opcionId) {
  const db = await pool.connect();

  try {
    await db.query('BEGIN');

    const intento = await db.query(`
      SELECT intento_id, trivia_id
      FROM intento_trivia
      WHERE intento_id = $1
        AND usuario_id = $2
        AND estado = 'en_progreso'
      FOR UPDATE
    `, [intentoId, usuarioId]);

    if (!intento.rows.length) {
      throw new Error('Intento no válido');
    }

    const valida = await db.query(`
      SELECT 1
      FROM intento_pregunta ip
      JOIN pregunta_trivia p
        ON p.pregunta_id = ip.pregunta_id
      JOIN opcion_respuesta o
        ON o.pregunta_id = p.pregunta_id
      WHERE ip.intento_id = $1
        AND ip.pregunta_id = $2
        AND o.opcion_id = $3
        AND p.trivia_id = $4
    `, [
      intentoId,
      preguntaId,
      opcionId,
      intento.rows[0].trivia_id
    ]);

    if (!valida.rows.length) {
      throw new Error('Pregunta u opción inválida');
    }

    await db.query(`
      INSERT INTO respuesta_usuario
        (intento_id, trivia_id, pregunta_id, opcion_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (intento_id, pregunta_id)
      DO NOTHING
    `, [
      intentoId,
      intento.rows[0].trivia_id,
      preguntaId,
      opcionId
    ]);

    await db.query('COMMIT');

  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally {
    db.release();
  }
}

async function finalizarIntento(usuarioId, intentoId) {
  const db = await pool.connect();

  try {
    await db.query('BEGIN');

    // Mismo bloqueo utilizado al iniciar y responder.
    await db.query(`
      SELECT usuario_id
      FROM usuario
      WHERE usuario_id = $1
      FOR UPDATE
    `, [usuarioId]);

    const intento = await db.query(`
      SELECT intento_id
      FROM intento_trivia
      WHERE intento_id = $1
        AND usuario_id = $2
        AND estado = 'en_progreso'
      FOR UPDATE
    `, [intentoId, usuarioId]);

    if (!intento.rows.length) {
      throw new Error('Intento ya finalizado o no válido');
    }

    const resultado = await db.query(`
      SELECT
        COUNT(*)::INT AS respondidas,
        COUNT(*) FILTER (
          WHERE o.es_correcta
        )::INT AS correctas,
        COALESCE(
          SUM(
            CASE
              WHEN o.es_correcta THEN p.puntos_otorgados
              ELSE 0
            END
          ), 0
        )::INT AS puntos
      FROM intento_pregunta ip
      LEFT JOIN respuesta_usuario ru
        ON ru.intento_id = ip.intento_id
       AND ru.pregunta_id = ip.pregunta_id
      LEFT JOIN opcion_respuesta o
        ON o.opcion_id = ru.opcion_id
      JOIN pregunta_trivia p
        ON p.pregunta_id = ip.pregunta_id
      WHERE ip.intento_id = $1
        AND ru.respuesta_id IS NOT NULL
    `, [intentoId]);

    const { respondidas, correctas, puntos } = resultado.rows[0];

    if (respondidas !== 5) {
      throw new Error('Debes responder las cinco preguntas');
    }

    await db.query(`
      UPDATE intento_trivia
      SET estado = 'completado',
          puntaje_obtenido = $2,
          completado_en = NOW()
      WHERE intento_id = $1
    `, [intentoId, puntos]);

    if (puntos > 0) {
      await db.query(`
        INSERT INTO movimiento_puntos
          (usuario_id, cantidad, origen, intento_id)
        VALUES ($1, $2, 'trivia', $3)
      `, [usuarioId, puntos, intentoId]);
    }

    await db.query('COMMIT');

    return {
      intento_id: intentoId,
      respondidas,
      correctas,
      puntos_obtenidos: puntos
    };

  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally {
    db.release();
  }
}

module.exports = {
  iniciarIntento,
  obtenerPreguntas,
  responder,
  finalizarIntento
};
