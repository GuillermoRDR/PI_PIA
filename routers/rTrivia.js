
const express = require('express');
const router = express.Router();

const controlador = require('../controllers/cTrivia');
const { protegerRuta } = require('../controllers/middleware');

router.use(protegerRuta);

router.post('/iniciar', controlador.iniciar);
router.get('/:intentoId', controlador.obtener);
router.post('/responder', controlador.responder);
router.post('/finalizar', controlador.finalizar);

module.exports = router;