const { initializeApp, cert } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const cuentaServicio = require('./pi-pia-firebase-adminsdk-fbsvc-75c067d767.json');

initializeApp({
  credential: cert(cuentaServicio),
  storageBucket: 'pi-pia.firebasestorage.app'
});

const bucket = getStorage().bucket();

module.exports = bucket;