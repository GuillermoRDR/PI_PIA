const mVideos = require('../models/mVideos');

async function listar(req, res) {
  try {
    const videos = await mVideos.listar();
    res.json({ videos });
  } catch (error) {
    console.error('Error al listar videos:', error);
    res.status(500).json({ error: 'No se pudieron cargar los videos' });
  }
}

module.exports = { listar };