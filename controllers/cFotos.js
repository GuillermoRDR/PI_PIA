const mFotos = require('../models/mFotos');
const bucket = require('../config/firebase');

const TIPOS_PERMITIDOS = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp'
};

function idValido(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function listar(req, res) {
  try {
    const fotos = await mFotos.listarPorUsuario(req.session.usuarioId);
    res.json({ fotos });
  } catch (error) {
    console.error('Error al listar fotos:', error);
    res.status(500).json({ error: 'No se pudieron cargar tus fotos' });
  }
}

async function subir(req, res) {
  try {
    const usuarioId = req.session.usuarioId;

    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ninguna imagen.' });
    }

    const extension = TIPOS_PERMITIDOS[req.file.mimetype];
    if (!extension) {
      return res.status(400).json({ error: 'Formato no permitido. Usa PNG, JPG o WEBP.' });
    }

    let equipoId = null;
    if (req.body.equipo_id !== undefined && req.body.equipo_id !== '') {
      equipoId = idValido(req.body.equipo_id);
      if (!equipoId) {
        return res.status(400).json({ error: 'Equipo inválido.' });
      }
    }

    const rutaStorage = `fotos/${usuarioId}/${Date.now()}.${extension}`;
    const archivo = bucket.file(rutaStorage);

    await archivo.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
      resumable: false
    });
    await archivo.makePublic();

    const imagenUrl = `https://storage.googleapis.com/${bucket.name}/${rutaStorage}`;

    let foto;
    try {
      foto = await mFotos.crear(usuarioId, equipoId, imagenUrl, rutaStorage);
    } catch (errorBD) {
      await archivo.delete({ ignoreNotFound: true }).catch(() => {});
      if (errorBD.code === '23503') {
        return res.status(400).json({ error: 'El equipo indicado no existe.' });
      }
      throw errorBD;
    }

    res.status(201).json({ mensaje: 'Foto guardada en tu galería', foto });
  } catch (error) {
    console.error('Error al subir foto:', error);
    res.status(500).json({ error: 'No se pudo guardar la foto' });
  }
}

async function marcarFavorita(req, res) {
  try {
    const fotoId = idValido(req.params.id);
    if (!fotoId) return res.status(400).json({ error: 'Foto inválida.' });

    if (typeof req.body.es_favorita !== 'boolean') {
      return res.status(400).json({ error: 'es_favorita debe ser true o false.' });
    }

    const foto = await mFotos.cambiarFavorita(
      fotoId, req.session.usuarioId, req.body.es_favorita
    );
    if (!foto) return res.status(404).json({ error: 'Foto no encontrada.' });

    res.json({ foto });
  } catch (error) {
    console.error('Error al marcar favorita:', error);
    res.status(500).json({ error: 'No se pudo actualizar la foto' });
  }
}

async function eliminar(req, res) {
  try {
    const fotoId = idValido(req.params.id);
    if (!fotoId) return res.status(400).json({ error: 'Foto inválida.' });

    const existente = await mFotos.obtenerPorId(fotoId, req.session.usuarioId);
    if (!existente) return res.status(404).json({ error: 'Foto no encontrada.' });

    if (existente.es_precargada) {
      return res.status(403).json({ error: 'Las fotos precargadas no se pueden eliminar.' });
    }

    const foto = await mFotos.eliminar(fotoId, req.session.usuarioId);
    if (!foto) return res.status(404).json({ error: 'Foto no encontrada.' });

    if (foto.ruta_storage) {
      try {
        await bucket.file(foto.ruta_storage).delete({ ignoreNotFound: true });
      } catch (errorStorage) {
        console.warn('La foto se borró de la BD pero no del bucket:', errorStorage.message);
      }
    }

    res.json({ mensaje: 'Foto eliminada' });
  } catch (error) {
    console.error('Error al eliminar foto:', error);
    res.status(500).json({ error: 'No se pudo eliminar la foto' });
  }
}

module.exports = { listar, subir, marcarFavorita, eliminar };