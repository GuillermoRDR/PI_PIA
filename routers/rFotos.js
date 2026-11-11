const express = require('express');
const multer = require('multer');
const router = express.Router();

const controlador = require('../controllers/cFotos');
const { protegerRuta } = require('../controllers/middleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

router.use(protegerRuta);

router.get('/', controlador.listar);
router.post('/', upload.single('foto'), controlador.subir);
router.patch('/:id/favorita', controlador.marcarFavorita);
router.delete('/:id', controlador.eliminar);

module.exports = router;