function protegerRuta(req, res, next) {
  if (req.session && req.session.usuarioId) {
    console.log('Se validó la sesión correctamente.');
    return next();
  }
  return res.status(401).json({ error: 'No autorizado. Por favor inicia sesión.' });
}

module.exports = { protegerRuta };