const express = require('express');
const router = express.Router();

const controlador = require('../controllers/cJuego');
const { protegerRuta } = require('../controllers/middleware');

router.use(protegerRuta);

router.post('/iniciar', controlador.iniciar);
router.post('/finalizar', controlador.finalizar);

module.exports = router;