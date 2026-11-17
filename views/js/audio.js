(() => {
  const CLAVE_MUSICA = 'batea_musica';
  const CLAVE_EFECTOS = 'batea_efectos';
  const RUTA_POR_DEFECTO = '/media/music/Principal.mp3';
  const VOLUMEN = 0.4;
  const etiqueta = document.currentScript;
  const rutaMusica = (etiqueta && etiqueta.dataset.musica) || RUTA_POR_DEFECTO;
  const sinMusica = !!(etiqueta && etiqueta.hasAttribute('data-sin-musica'));

  let pista = null;
  let esperandoToque = false;

  function leer(clave) {
    try {
      return localStorage.getItem(clave);
    } catch (error) {
      return null;
    }
  }

  function guardar(clave, valor) {
    try {
      localStorage.setItem(clave, valor);
    } catch (error) {}
  }

  function activo(clave) {
    return leer(clave) !== '0';
  }

  function obtenerPista() {
    if (pista) return pista;

    pista = new Audio(rutaMusica);
    pista.loop = true;
    pista.volume = VOLUMEN;

    return pista;
  }

  function esperarToque() {
    if (esperandoToque) return;
    esperandoToque = true;

    const alTocar = () => {
      document.removeEventListener('click', alTocar);
      document.removeEventListener('touchend', alTocar);
      document.removeEventListener('keydown', alTocar);
      esperandoToque = false;
      reproducirMusica();
    };

    document.addEventListener('click', alTocar);
    document.addEventListener('touchend', alTocar);
    document.addEventListener('keydown', alTocar);
  }

  function reproducirMusica() {
    if (sinMusica || !activo(CLAVE_MUSICA)) return;
    if (document.visibilityState === 'hidden') return;

    obtenerPista().play().catch(esperarToque);
  }

  function pausarMusica() {
    if (pista) pista.pause();
  }

  function setMusica(valor) {
    guardar(CLAVE_MUSICA, valor ? '1' : '0');

    if (valor) {
      reproducirMusica();
    } else {
      pausarMusica();
    }
  }

  function setEfectos(valor) {
    guardar(CLAVE_EFECTOS, valor ? '1' : '0');
  }

  function reproducirEfecto(ruta, volumen) {
    if (!activo(CLAVE_EFECTOS)) return;

    const efecto = new Audio(ruta);
    efecto.volume = volumen === undefined ? 0.8 : volumen;
    efecto.play().catch(() => {});
  }

  window.BateaAudio = {
    musicaActiva: () => activo(CLAVE_MUSICA),
    efectosActivos: () => activo(CLAVE_EFECTOS),
    setMusica,
    setEfectos,
    reproducirEfecto
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      pausarMusica();
    } else {
      reproducirMusica();
    }
  });

  window.addEventListener('pageshow', (evento) => {
    if (evento.persisted) reproducirMusica();
  });

  reproducirMusica();
})();