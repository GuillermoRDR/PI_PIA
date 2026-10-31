
const pool = require('../config/db');

const COSTO_CARTA = 100;

async function obtenerResumen(usuarioId) {
  const resultado = await pool.query(`
    SELECT
      u.usuario_id,
      COALESCE(s.saldo, 0)::INT AS puntos,
      COUNT(uc.carta_id)::INT AS cartas_obtenidas,
      (SELECT COUNT(*) FROM carta)::INT AS cartas_disponibles
    FROM usuario u
    LEFT JOIN vista_saldo_puntos s
      ON s.usuario_id = u.usuario_id
    LEFT JOIN usuario_carta uc
      ON uc.usuario_id = u.usuario_id
    WHERE u.usuario_id = $1
    GROUP BY u.usuario_id, s.saldo
  `, [usuarioId]);

  if (!resultado.rows.length) {
    throw new Error('Usuario no encontrado');
  }

  return {
    ...resultado.rows[0],
    costo_carta: COSTO_CARTA
  };
}


async function obtenerColeccion(usuarioId) {
  const resultado = await pool.query(`
    SELECT
      c.carta_id,
      c.titulo,
      c.descripcion,
      c.imagen_url,
      c.rareza,
      e.equipo_id,
      e.nombre AS equipo,
      (uc.usuario_carta_id IS NOT NULL) AS obtenida,
      (c.carta_id = u.carta_favorita_id) AS favorita,
      uc.obtenida_en
    FROM carta c
    JOIN equipo e
      ON e.equipo_id = c.equipo_id
    JOIN usuario u
      ON u.usuario_id = $1
    LEFT JOIN usuario_carta uc
      ON uc.carta_id = c.carta_id
     AND uc.usuario_id = u.usuario_id
    ORDER BY e.nombre
  `, [usuarioId]);

  return resultado.rows;
}


async function canjearCarta(usuarioId) {
  const db = await pool.connect();

  try {
    await db.query('BEGIN');

    const resultado = await db.query(`
      SELECT
        carta_obtenida_id,
        equipo_obtenido_id,
        saldo_restante
      FROM canjear_carta_aleatoria($1)
    `, [usuarioId]);

    const canje = resultado.rows[0];

    const carta = await db.query(`
      SELECT
        c.carta_id,
        c.titulo,
        c.descripcion,
        c.imagen_url,
        e.nombre AS equipo
      FROM carta c
      JOIN equipo e
        ON e.equipo_id = c.equipo_id
      WHERE c.carta_id = $1
    `, [canje.carta_obtenida_id]);

    await db.query('COMMIT');

    return {
      carta: carta.rows[0],
      saldo_restante: Number(canje.saldo_restante)
    };

  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally {
    db.release();
  }
}


async function establecerFavorita(usuarioId, cartaId) {
  const db = await pool.connect();

  try {
    await db.query('BEGIN');

    const usuario = await db.query(`
      SELECT carta_favorita_id
      FROM usuario
      WHERE usuario_id = $1
      FOR UPDATE
    `, [usuarioId]);

    if (!usuario.rows.length) {
      throw new Error('Usuario no encontrado');
    }

    const actual = usuario.rows[0].carta_favorita_id;

    const nuevaFavorita = actual === cartaId ? null : cartaId;

    if (nuevaFavorita !== null) {
      const propiedad = await db.query(`
        SELECT 1
        FROM usuario_carta
        WHERE usuario_id = $1
          AND carta_id = $2
      `, [usuarioId, nuevaFavorita]);

      if (!propiedad.rows.length) {
        throw new Error('No posees esta carta');
      }
    }

    await db.query(`
      UPDATE usuario
      SET carta_favorita_id = $1
      WHERE usuario_id = $2
    `, [nuevaFavorita, usuarioId]);

    await db.query('COMMIT');

    return {
      carta_favorita_id: nuevaFavorita
    };

  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally {
    db.release();
  }
}

async function obtenerCartaFavorita(usuarioId) {
  const resultado = await pool.query(`
    SELECT
      c.carta_id,
      c.titulo,
      c.descripcion,
      c.imagen_url,
      c.rareza,
      e.nombre AS equipo
    FROM usuario u
    JOIN usuario_carta uc
      ON uc.usuario_id = u.usuario_id
     AND uc.carta_id = u.carta_favorita_id
    JOIN carta c
      ON c.carta_id = uc.carta_id
    JOIN equipo e
      ON e.equipo_id = c.equipo_id
    WHERE u.usuario_id = $1
  `, [usuarioId]);

  return resultado.rows[0] || null;
}


module.exports = { obtenerResumen, obtenerColeccion, canjearCarta, establecerFavorita, obtenerCartaFavorita };
