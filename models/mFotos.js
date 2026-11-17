const pool = require('../config/db');

async function listarPorUsuario(usuarioId) {
  const r = await pool.query(`
    SELECT foto_id, equipo_id, imagen_url, es_favorita, es_precargada, creada_en
    FROM foto_usuario
    WHERE usuario_id = $1
    ORDER BY creada_en DESC, foto_id DESC
  `, [usuarioId]);
  return r.rows;
}

async function obtenerPorId(fotoId, usuarioId) {
  const r = await pool.query(`
    SELECT foto_id, es_precargada
    FROM foto_usuario
    WHERE foto_id = $1 AND usuario_id = $2
  `, [fotoId, usuarioId]);
  return r.rows[0] || null;
}

async function crear(usuarioId, equipoId, imagenUrl, rutaStorage) {
  const r = await pool.query(`
    INSERT INTO foto_usuario (usuario_id, equipo_id, imagen_url, ruta_storage)
    VALUES ($1, $2, $3, $4)
    RETURNING foto_id, equipo_id, imagen_url, es_favorita, es_precargada, creada_en
  `, [usuarioId, equipoId, imagenUrl, rutaStorage]);
  return r.rows[0];
}

async function cambiarFavorita(fotoId, usuarioId, esFavorita) {
  const r = await pool.query(`
    UPDATE foto_usuario
    SET es_favorita = $3
    WHERE foto_id = $1 AND usuario_id = $2
    RETURNING foto_id, es_favorita
  `, [fotoId, usuarioId, esFavorita]);
  return r.rows[0] || null;
}

async function eliminar(fotoId, usuarioId) {
  const r = await pool.query(`
    DELETE FROM foto_usuario
    WHERE foto_id = $1 AND usuario_id = $2 AND es_precargada = FALSE
    RETURNING foto_id, ruta_storage
  `, [fotoId, usuarioId]);
  return r.rows[0] || null;
}

async function precargarParaUsuario(usuarioId) {
  await pool.query(`
    INSERT INTO foto_usuario (usuario_id, imagen_url, es_precargada)
    SELECT $1::int, imagen_url, TRUE
    FROM foto_precargada
    ORDER BY precargada_id DESC
  `, [usuarioId]);
}

module.exports = { listarPorUsuario, obtenerPorId, crear, cambiarFavorita, eliminar, precargarParaUsuario };