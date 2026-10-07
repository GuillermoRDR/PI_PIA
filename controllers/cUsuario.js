const bcrypt = require('bcrypt');
const usuarioModel = require('../models/mUsuario');
const bucket = require('../config/firebase');

async function registrarUsuario(req, res) {
  try {
    const { nombre, email, contra, verificarContra } = req.body;

    if (!nombre || !email || !contra) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    if (contra !== verificarContra) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden.' });
    }

    const usuarioExistente = await usuarioModel.obtenerPorEmail(email);
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    const saltRounds = 10;
    const contraHash = await bcrypt.hash(contra, saltRounds);

    let fotoPerfilUrl = null;

    if (req.file) {
      const file = req.file;
      const nombreArchivo = `perfiles/${Date.now()}_${file.originalname}`;
      const blob = bucket.file(nombreArchivo);

      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });

      await new Promise((resolve, reject) => {
        blobStream.on('error', (error) => reject(error));
        blobStream.on('finish', async () => {
          await blob.makePublic();
          fotoPerfilUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
          resolve();
        });
        blobStream.end(file.buffer);
      });
    }

    await usuarioModel.crearUsuario(nombre, email, contraHash, fotoPerfilUrl);

    return res.status(201).json({ mensaje: 'Usuario registrado con éxito' });
  } catch (error) {
    console.error('Error al registrar usuario;', error);
    return res.status(500).json({ error: 'Ocurrió un error en el servidor, reintenta más tarde.' });
  }
}

async function inicioSesionUsuario(req, res) {
  try {
    const { correo, contra } = req.body;

    const usuario = await usuarioModel.obtenerPorEmail(correo);
    if (!usuario) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    const coincide = await bcrypt.compare(contra, usuario.contrasena_hash);
    if (!coincide) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    req.session.usuarioId = usuario.usuario_id;
    req.session.email = usuario.email;

    return res.status(200).json({ mensaje: 'Inicio de sesión exitoso' });

  } catch (error) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

function cerrarSesionUsuario(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'No se pudo cerrar la sesión' });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ mensaje: 'Sesión cerrada correctamente' });
  });
}

async function obtenerPerfilUsuario(req, res) {
  try {
    const usuarioId = req.session.usuarioId; 
    
    const usuario = await usuarioModel.obtenerPorId(usuarioId); 

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.status(200).json(usuario);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener la información del perfil' });
  }
}

module.exports = { registrarUsuario, inicioSesionUsuario, cerrarSesionUsuario, obtenerPerfilUsuario };