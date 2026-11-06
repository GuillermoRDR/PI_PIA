const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/cUsuario');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const protegerRuta = require('../controllers/middleware');

router.get('/perfil', protegerRuta.protegerRuta, usuarioController.obtenerPerfilUsuario);
router.get('/principal', protegerRuta.protegerRuta);
router.get('/puntuaciones', protegerRuta.protegerRuta, usuarioController.consultarPuntuaciones);
router.post('/registro', upload.single('fotoPerfil'), usuarioController.registrarUsuario);
router.post('/inicioSesion', usuarioController.inicioSesionUsuario);
router.post('/cerrarSesion', protegerRuta.protegerRuta, usuarioController.cerrarSesionUsuario);

module.exports = router;