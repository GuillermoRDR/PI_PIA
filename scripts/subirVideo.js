const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const bucket = require('../config/firebase');

const TIPOS = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

async function subir(rutaLocal, carpeta) {
  const ext = path.extname(rutaLocal).toLowerCase();
  const tipo = TIPOS[ext];
  if (!tipo) throw new Error(`Extensión no soportada: ${ext}`);

  const destino = `${carpeta}/${Date.now()}_${path.basename(rutaLocal).replace(/\s+/g, '_')}`;
  await bucket.upload(rutaLocal, { destination: destino, metadata: { contentType: tipo } });
  await bucket.file(destino).makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${destino}`;
}

async function main() {
  const [rutaVideo, titulo, rutaMiniatura, descripcion] = process.argv.slice(2);

  if (!rutaVideo || !titulo) {
    console.error('Uso: node scripts/subirVideo.js "<video>" "<título>" ["<miniatura>"] ["<descripción>"]');
    process.exit(1);
  }
  if (!fs.existsSync(rutaVideo)) throw new Error(`No existe el archivo: ${rutaVideo}`);
  if (rutaMiniatura && !fs.existsSync(rutaMiniatura)) throw new Error(`No existe la miniatura: ${rutaMiniatura}`);

  console.log('Subiendo video...');
  const archivoUrl = await subir(rutaVideo, 'videos');
  const miniaturaUrl = rutaMiniatura ? await subir(rutaMiniatura, 'videos/miniaturas') : null;

  const r = await pool.query(`
    INSERT INTO recurso_multimedia (titulo, descripcion, tipo_recurso, archivo_url, miniatura_url)
    VALUES ($1, $2, 'video', $3, $4)
    RETURNING multimedia_id
  `, [titulo, descripcion || null, archivoUrl, miniaturaUrl]);

  console.log(`Listo. multimedia_id = ${r.rows[0].multimedia_id}`);
  console.log(archivoUrl);
}

main()
  .catch((e) => { console.error('Error:', e.message); process.exitCode = 1; })
  .finally(() => pool.end());