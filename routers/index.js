const express = require('express');
const path = require('path');
const router = express.Router();
const usuariosRouter = require("./rUsuario");
const protegerRuta = require('../controllers/middleware');

router.get('/', (req, res) =>{
  res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
});

router.get('/inicioSesion', (req, res) =>{
  res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
});

router.get('/principal', protegerRuta.protegerRuta, (req, res) =>{
  res.sendFile(path.join(__dirname, '..','views', 'principal.html'))
});

router.get('/perfil', protegerRuta.protegerRuta, (req, res) =>{
  res.sendFile(path.join(__dirname, '..','views', 'usuario.html'))
});

router.get('/configuracion', protegerRuta.protegerRuta, (req, res) =>{
  res.sendFile(path.join(__dirname, '..','views', 'configuracion.html'))
});

router.use("/api/usuario", usuariosRouter);

module.exports = router;  