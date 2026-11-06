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

async function obtenerPorId(idUsuario) {
  const query = `SELECT usuario_id, nombre, email, foto_perfil_url, equipo_favorito_id, creado_en
    FROM usuario
    WHERE usuario_id = $1`;

  const result = await pool.query(query, [idUsuario]);
  return result.rows[0];
}

async function obtenerPuntuacionesMaximas(usuarioId) {
  const resultado = await pool.query(`
    SELECT
      u.usuario_id,

      COALESCE((
        SELECT MAX(it.puntaje_obtenido)
        FROM intento_trivia it
        WHERE it.usuario_id = u.usuario_id
          AND it.estado = 'completado'
      ), 0)::INT AS max_trivia,

      COALESCE((
        SELECT MAX(pj.puntuacion)
        FROM partida_juego pj
        WHERE pj.usuario_id = u.usuario_id
          AND pj.estado = 'completada'
      ), 0)::INT AS max_juego

    FROM usuario u
    WHERE u.usuario_id = $1
  `, [usuarioId]);

  return resultado.rows[0] || null;
}


module.exports = { obtenerPorEmail, crearUsuario, obtenerPorId, obtenerPuntuacionesMaximas };