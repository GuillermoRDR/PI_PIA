
const express = require('express');
const router = express.Router();

const controlador = require('../controllers/cAR');

router.get('/equipos', controlador.listarEquipos);
router.get('/equipos/:targetIndex', controlador.consultarEquipo);

module.exports = router;
