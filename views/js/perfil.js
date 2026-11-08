
document.addEventListener('DOMContentLoaded', () => {
  inicializarPerfil();
});


async function inicializarPerfil() {
  try {
    await cargarDatosUsuario();

    const resultados = await Promise.allSettled([
      cargarPuntuaciones(),
      cargarCartaFavorita()
    ]);

  } catch (error) {
    console.error('Error al cargar perfil:', error);

    if (error.status === 404) {
      await Alertas.mostrar(
        'error',
        'Perfil no encontrado',
        'No encontramos la información de tu cuenta.'
      );
      return;
    }

    await Alertas.error(error);
  }
}

async function obtenerJSON(url) {
  return Alertas.peticion(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  });
}


async function cargarDatosUsuario() {
  const usuario = await obtenerJSON(
    '/api/usuario/perfil'
  );

  const foto = document.getElementById('fotoPerfil');
  const nombre = document.getElementById('nombreUsuario');
  const info = document.getElementById('infoUsuario');

  if (usuario.foto_perfil_url) {
    foto.src = usuario.foto_perfil_url;
  }

  nombre.textContent =
    usuario.nombre || 'Usuario sin nombre';

  if (usuario.creado_en) {
    const fecha = new Date(usuario.creado_en);

    info.textContent =
      `Se unió en ${fecha.getFullYear()}.`;
  } else {
    info.textContent = 'Miembro de la plataforma';
  }
}

async function cargarPuntuaciones() {
  const trivia = document.getElementById('maxTrivia');
  const juego = document.getElementById('maxJuego');

  try {
    const datos = await obtenerJSON('/api/usuario/puntuaciones');

    trivia.textContent = datos.max_trivia ?? 0;

    const JUEGO_DISPONIBLE = false;

    if (JUEGO_DISPONIBLE) {
      juego.textContent = datos.max_juego ?? 0;
      juego.classList.remove('pendiente');
    } else {
      juego.textContent = 'Próximamente';
      juego.classList.add('pendiente');
    }

  } catch (error) {
    console.error('Error al cargar puntuaciones:', error);

    trivia.textContent = '—';
    juego.textContent = 'No disponible';

    await Alertas.error(error);
  }
}

async function cargarCartaFavorita() {
  const contenedor = document.getElementById('perfil-carta-favorita');

  try {
    const { carta } = await obtenerJSON('/api/recompensas/favorita');

    contenedor.replaceChildren();

    if (!carta) {
      const mensaje = document.createElement('p');

      mensaje.className = 'carta-vacia';
      mensaje.textContent = 'Todavía no has seleccionado una carta favorita. ' + 'Puedes elegirla desde tu colección.'
      contenedor.appendChild(mensaje);
      return;
    }

    if (carta.imagen_url) {
      const imagen = document.createElement('img');

      imagen.className = 'carta-favorita-imagen';
      imagen.src = carta.imagen_url;
      imagen.alt = `Carta de ${carta.titulo}`;

      contenedor.appendChild(imagen);
    }

    const titulo = document.createElement('h3');

    titulo.className = 'carta-favorita-titulo';
    titulo.textContent = carta.titulo;

    contenedor.appendChild(titulo);

    const equipo = document.createElement('p');

    equipo.className = 'carta-favorita-equipo';
    equipo.textContent = carta.equipo || '';

    contenedor.appendChild(equipo);

    const rareza = Math.max(1, Math.min(5, Number(carta.rareza) || 1));

    const estrellas = document.createElement('p');

    estrellas.className = 'carta-favorita-estrellas';
    estrellas.textContent = '★'.repeat(rareza) + '☆'.repeat(5 - rareza);

    estrellas.setAttribute('aria-label', `${rareza} de 5 estrellas`);

    contenedor.appendChild(estrellas);

  } catch (error) {
    console.error('Error al cargar carta favorita:', error);

    contenedor.textContent =
      'No se pudo cargar la carta favorita.';

    await Alertas.error(error);
  }
}
