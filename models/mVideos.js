const pool = require('../config/db');

async function listar() {
  const r = await pool.query(`
    SELECT multimedia_id, titulo, descripcion, archivo_url, miniatura_url, creado_en
    FROM recurso_multimedia
    WHERE tipo_recurso = 'video'
    ORDER BY creado_en DESC, multimedia_id DESC
  `);
  return r.rows;
}

module.exports = { listar };