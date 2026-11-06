
const mAR = require('../models/mAR');

async function listarEquipos(req, res) {
  try {
    const equipos = await mAR.obtenerEquiposAR();

    res.json({ equipos });
  } catch (error) {
    console.error('Error al consultar equipos AR:', error);

    res.status(500).json({
      error: 'No se pudo cargar el catálogo AR'
    });
  }
}

async function consultarEquipo(req, res) {
  try {
    const targetIndex = Number(req.params.targetIndex);

    if (
      !Number.isInteger(targetIndex) ||
      targetIndex < 0 ||
      targetIndex > 14
    ) {
      return res.status(400).json({
        error: 'Índice de marcador inválido'
      });
    }

    const equipo =
      await mAR.obtenerEquipoPorTarget(targetIndex);

    if (!equipo) {
      return res.status(404).json({
        error: 'Equipo no encontrado'
      });
    }

    res.json({ equipo });
  } catch (error) {
    console.error('Error al consultar equipo AR:', error);

    res.status(500).json({
      error: 'No se pudo consultar el equipo'
    });
  }
}

module.exports = {
  listarEquipos,
  consultarEquipo
};
