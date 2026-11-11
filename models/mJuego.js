const pool = require('../config/db');

const META_PUNTOS = 1000;
const MAX_STRIKES = 3;
const MAX_PUNTOS_SINGLE = 64;
const MAX_PUNTOS_DOBLE = 82;
const MAX_PUNTOS_TRIPLE = 92;
const MAX_PUNTOS_HOME_RUN = 100;

const PUNTOS_SINGLE = 1;
const PUNTOS_DOBLE = 2;
const PUNTOS_TRIPLE = 3;
const BONO_HOME_RUN = 0.005;
const RESTA_STRIKE = 20;
const DIVISOR_RECOMPENSA = 10;

function calcularResultado({ puntuacion, singles, dobles, triples, homeRuns, strikes }) {
  const golpesNormales =
    singles * PUNTOS_SINGLE +
    dobles * PUNTOS_DOBLE +
    triples * PUNTOS_TRIPLE;
  const multiplicador = Math.pow(1 + BONO_HOME_RUN, homeRuns);
  const puntuacionFinal = Math.max(
    0,
    Math.round((puntuacion + golpesNormales) * multiplicador - strikes * RESTA_STRIKE)
  );
  const puntosRecompensa = Math.max(
    0,
    Math.round((puntuacion / DIVISOR_RECOMPENSA + golpesNormales) * multiplicador - strikes * RESTA_STRIKE)
  );
  return { puntuacionFinal, puntosRecompensa };
}

async function iniciarPartida(usuarioId) {
  const resultado = await pool.query(
    `INSERT INTO partida_juego (usuario_id)
     VALUES ($1)
     RETURNING partida_id`,
    [usuarioId]
  );
  return resultado.rows[0].partida_id;
}

async function finalizarPartida(usuarioId, partidaId, datos) {
  const { puntuacion, singles, dobles, triples, homeRuns, strikes } = datos;
  const db = await pool.connect();

  try {
    await db.query('BEGIN');

    const partida = await db.query(
      `SELECT EXTRACT(EPOCH FROM (NOW() - iniciada_en)) AS segundos
       FROM partida_juego
       WHERE partida_id = $1
         AND usuario_id = $2
         AND estado = 'en_progreso'
       FOR UPDATE`,
      [partidaId, usuarioId]
    );

    if (!partida.rows.length) {
      throw new Error('Partida no válida o ya finalizada');
    }

    const segundos = Number(partida.rows[0].segundos);
    const lanzamientos = singles + dobles + triples + homeRuns + strikes;
    const maximoPosible =
      singles * MAX_PUNTOS_SINGLE +
      dobles * MAX_PUNTOS_DOBLE +
      triples * MAX_PUNTOS_TRIPLE +
      homeRuns * MAX_PUNTOS_HOME_RUN;
    const gano = puntuacion >= META_PUNTOS;

    const valida =
      strikes <= MAX_STRIKES &&
      puntuacion <= META_PUNTOS &&
      puntuacion <= maximoPosible &&
      (gano ? strikes < MAX_STRIKES : strikes === MAX_STRIKES) &&
      segundos >= lanzamientos;

    if (!valida) {
      throw new Error('Resultado de partida no válido');
    }

    const { puntuacionFinal, puntosRecompensa } = calcularResultado(datos);

    await db.query(
      `UPDATE partida_juego
       SET puntuacion = $2,
           estado = 'completada',
           finalizada_en = NOW()
       WHERE partida_id = $1`,
      [partidaId, puntuacionFinal]
    );

    if (puntosRecompensa > 0) {
      await db.query(
        `INSERT INTO movimiento_puntos
           (usuario_id, cantidad, origen, partida_id)
         VALUES ($1, $2, 'juego', $3)`,
        [usuarioId, puntosRecompensa, partidaId]
      );
    }

    await db.query('COMMIT');

    return {
      partida_id: partidaId,
      puntuacion: puntuacionFinal,
      puntos_obtenidos: puntosRecompensa
    };

  } catch (error) {
    await db.query('ROLLBACK');
    throw error;
  } finally {
    db.release();
  }
}

module.exports = { iniciarPartida, finalizarPartida, calcularResultado };