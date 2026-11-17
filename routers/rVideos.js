const express = require('express');
const router = express.Router();

const controlador = require('../controllers/cVideos');
const { protegerRuta } = require('../controllers/middleware');

router.use(protegerRuta);

router.get('/', controlador.listar);

module.exports = router;