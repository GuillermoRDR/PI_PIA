function protegerRuta(req, res, next) {
  if (req.session?.usuarioId) {
    return next();
  }

  return res.status(401).json({
    error: 'No autorizado. Por favor inicia sesión.'
  });
}

function protegerPagina(req, res, next) {
  if (req.session?.usuarioId) {
    return next();
  }

  return res.redirect('/inicioSesion');
}

module.exports = {
  protegerRuta,
  protegerPagina
};
