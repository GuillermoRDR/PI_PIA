const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const bucket = require('../config/firebase');

const TIPOS = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

async function main() {
  const rutaFoto = process.argv[2];

  if (!rutaFoto) {
    console.error('Uso: node scripts/subirFotoPrecargada.js "<foto>"');
    process.exit(1);
  }
  if (!fs.existsSync(rutaFoto)) throw new Error(`No existe el archivo: ${rutaFoto}`);

  const extension = path.extname(rutaFoto).toLowerCase();
  const tipo = TIPOS[extension];
  if (!tipo) throw new Error(`Formato no permitido: ${extension}`);

  const rutaStorage = `precargadas/${Date.now()}${extension}`;
  console.log('Subiendo foto...');
  await bucket.upload(rutaFoto, { destination: rutaStorage, metadata: { contentType: tipo } });
  await bucket.file(rutaStorage).makePublic();

  const imagenUrl = `https://storage.googleapis.com/${bucket.name}/${rutaStorage}`;

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query('INSERT INTO foto_precargada (imagen_url) VALUES ($1)', [imagenUrl]);
        const r = await cliente.query(`
      INSERT INTO foto_usuario (usuario_id, imagen_url, es_precargada)
      SELECT usuario_id, $1::text, TRUE FROM usuario
    `, [imagenUrl]);
    await cliente.query('COMMIT');
    console.log(`Listo. Agregada al catálogo y a ${r.rowCount} usuarios.`);
    console.log(imagenUrl);
  } catch (error) {
    await cliente.query('ROLLBACK');
    await bucket.file(rutaStorage).delete({ ignoreNotFound: true }).catch(() => {});
    throw error;
  } finally {
    cliente.release();
  }
}

main()
  .catch((e) => { console.error('Error:', e.message); process.exitCode = 1; })
  .finally(() => pool.end());