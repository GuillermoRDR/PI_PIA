const juego = require('../models/mJuego');

const ERRORES_ESPERADOS = {
  'Partida no válida o ya finalizada': 409,
  'Resultado de partida no válido': 400
};

function manejarError(res, error) {
  const status = ERRORES_ESPERADOS[error.message];

  if (status) {
    return res.status(status).json({ error: error.message });
  }

  console.error('Error interno del juego:', error);
  return res.status(500).json({ error: 'Ocurrió un error interno en el juego.' });
}

function entero(valor, maximo) {
  return Number.isSafeInteger(valor) && valor >= 0 && (maximo === undefined || valor <= maximo);
}

async function iniciar(req, res) {
  try {
    const partidaId = await juego.iniciarPartida(req.session.usuarioId);
    res.status(201).json({ partida_id: partidaId });
  } catch (error) {
    manejarError(res, error);
  }
}

async function finalizar(req, res) {
  try {
    const { partida_id, puntuacion, singles, dobles, triples, homeRuns, strikes } = req.body;

    const validos =
      Number.isSafeInteger(partida_id) && partida_id > 0 &&
      entero(puntuacion, 1000) &&
      entero(singles) &&
      entero(dobles) &&
      entero(triples) &&
      entero(homeRuns) &&
      entero(strikes, 3);

    if (!validos) {
      return res.status(400).json({ error: 'Datos de partida inválidos' });
    }

    const resultado = await juego.finalizarPartida(
      req.session.usuarioId,
      partida_id,
      { puntuacion, singles, dobles, triples, homeRuns, strikes }
    );

    res.json(resultado);
  } catch (error) {
    manejarError(res, error);
  }
}

module.exports = { iniciar, finalizar };