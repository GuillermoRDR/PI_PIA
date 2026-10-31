const express = require('express');
const path = require('path');
const router = express.Router();
const usuariosRouter = require("./rUsuario");
const protegerRuta = require('../controllers/middleware');
const triviaRouter = require('./rTrivia');
const recompensasRouter = require('./rRecompensas');

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'principal.html'));
});

router.get('/registro', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'registro.html'))
});

router.get('/inicioSesion', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
});

router.get('/principal', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'principal.html'))
});

router.get('/perfil', protegerRuta.protegerRuta, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'usuario.html'))
});

router.get('/configuracion', protegerRuta.protegerRuta, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'configuracion.html'))
});

router.get('/trivia', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'trivia.html'));
});

router.get('/recompensas', protegerRuta.protegerRuta, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'views', 'recompensas.html'));
});

router.use("/api/usuario", usuariosRouter);
router.use('/api/trivia', triviaRouter);
router.use('/api/recompensas', recompensasRouter);

module.exports = router;  