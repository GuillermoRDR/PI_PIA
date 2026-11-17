const bucket = require('../config/firebase');

(async () => {
  await bucket.setCorsConfiguration([{
    origin: ['*'],
    method: ['GET', 'HEAD'],
    responseHeader: ['Content-Type', 'Range'],
    maxAgeSeconds: 3600
  }]);
  console.log('CORS configurado en', bucket.name);
})().catch((e) => {
  console.error('No se pudo configurar CORS:', e.message);
  process.exit(1);
});