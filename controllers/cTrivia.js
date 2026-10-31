
const trivia = require('../models/mTrivia');

function manejarError(res, error) {
  console.error('Error de trivia:', error);
  return res.status(400).json({
    error: error.message
  });
}

async function iniciar(req, res) {
  try {
    const usuarioId = req.session.usuarioId;
    const intentoId = await trivia.iniciarIntento(usuarioId);
    const preguntas = await trivia.obtenerPreguntas(
      intentoId, usuarioId
    );

    res.json({
      intento_id: intentoId,
      preguntas
    });
  } catch (error) {
    manejarError(res, error);
  }
}

async function obtener(req, res) {
  try {
    const preguntas = await trivia.obtenerPreguntas(
      Number(req.params.intentoId),
      req.session.usuarioId
    );

    res.json({ preguntas });
  } catch (error) {
    manejarError(res, error);
  }
}

async function responder(req, res) {
  try {
    const { intento_id, pregunta_id, opcion_id } = req.body;

    if (![intento_id, pregunta_id, opcion_id]
      .every(Number.isSafeInteger)) {
      return res.status(400).json({
        error: 'Identificadores inválidos'
      });
    }

    await trivia.responder(
      req.session.usuarioId,
      intento_id,
      pregunta_id,
      opcion_id
    );

    res.json({ mensaje: 'Respuesta registrada' });
  } catch (error) {
    manejarError(res, error);
  }
}

async function finalizar(req, res) {
  try {
    const { intento_id } = req.body;

    if (!Number.isSafeInteger(intento_id)) {
      return res.status(400).json({
        error: 'Identificador inválido'
      });
    }

    const resultado = await trivia.finalizarIntento(
      req.session.usuarioId,
      intento_id
    );

    res.json(resultado);
  } catch (error) {
    manejarError(res, error);
  }
}

module.exports = {
  iniciar,
  obtener,
  responder,
  finalizar
};
