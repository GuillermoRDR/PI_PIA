
const recompensas = require('../models/mRecompensas');

async function obtenerEstado(req, res) {
  try {
    const usuarioId = req.session.usuarioId;

    const [resumen, coleccion] = await Promise.all([
      recompensas.obtenerResumen(usuarioId),
      recompensas.obtenerColeccion(usuarioId)
    ]);

    res.json({
      resumen,
      coleccion
    });

  } catch (error) {
    console.error('Error al consultar recompensas:', error);

    res.status(500).json({
      error: 'No se pudieron cargar las recompensas'
    });
  }
}

async function canjear(req, res) {
  try {
    const usuarioId = req.session.usuarioId;

    const resultado =
      await recompensas.canjearCarta(usuarioId);

    res.json({
      mensaje: 'Carta desbloqueada correctamente',
      ...resultado
    });

  } catch (error) {
    console.error('Error al canjear:', error);

    const erroresEsperados = [
      'Puntos insuficientes',
      'Coleccion completa',
      'Usuario no encontrado'
    ];

    if (erroresEsperados.includes(error.message)) {
      return res.status(400).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'No se pudo completar el canje'
    });
  }
}

async function cambiarFavorita(req, res) {
  try {
    const usuarioId = req.session.usuarioId;
    const cartaId = Number(req.params.cartaId);

    if (!Number.isSafeInteger(cartaId) || cartaId <= 0) {
      return res.status(400).json({
        error: 'Identificador de carta inválido'
      });
    }

    const resultado =
      await recompensas.establecerFavorita(
        usuarioId,
        cartaId
      );

    res.json({
      mensaje: resultado.carta_favorita_id
        ? 'Carta establecida como favorita'
        : 'Carta eliminada de favoritos',
      ...resultado
    });

  } catch (error) {
    if (error.message === 'No posees esta carta') {
      return res.status(403).json({
        error: error.message
      });
    }

    console.error('Error al actualizar favorita:', error);

    res.status(500).json({
      error: 'No se pudo actualizar la carta favorita'
    });
  }
}

async function consultarFavorita(req, res) {
  try {
    const carta =
      await recompensas.obtenerCartaFavorita(
        req.session.usuarioId
      );

    res.json({ carta });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'No se pudo consultar la carta favorita'
    });
  }
}

module.exports = { obtenerEstado, canjear, cambiarFavorita, consultarFavorita };
