
const express = require('express');
const router = express.Router();

const controlador = require('../controllers/cRecompensas');
const { protegerRuta } = require('../controllers/middleware');

router.use(protegerRuta);

router.get('/', controlador.obtenerEstado);
router.get('/favorita', controlador.consultarFavorita);

router.post('/canjear', controlador.canjear);

router.patch('/favorita/:cartaId', controlador.cambiarFavorita);

module.exports = router;