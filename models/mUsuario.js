const pool = require('../config/db');

async function obtenerPorEmail(email) {
  const query = 'SELECT * FROM usuario WHERE email = $1'
  const result = await pool.query(query, [email]);
  return result.rows[0];
}

async function crearUsuario(nombre, email, contrasenaHash, fotoPerfilUrl = null) {
  const query = `INSERT INTO usuario (nombre, email, contrasena_hash, foto_perfil_url)
  VALUES ($1, $2, $3, $4)
  RETURNING usuario_id;`;
  const result = await pool.query(query, [nombre, email, contrasenaHash, fotoPerfilUrl]);
  return result.rows[0];
}

async function obtenerPorId(idUsuario){
  const query = 'SELECT * FROM usuario where usuario_id = $1'
  const result = await pool.query(query, [idUsuario]);
  return result.rows[0];
}

module.exports = { obtenerPorEmail, crearUsuario, obtenerPorId };