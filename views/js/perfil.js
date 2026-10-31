document.addEventListener("DOMContentLoaded", () => {
  const foto = document.getElementById('fotoPerfil');
  const nombre = document.getElementById('nombreUsuario');
  const info = document.getElementById('infoUsuario');
  const bio = document.getElementById('textoBio');

  actualizarPerfil(foto, nombre, info, bio);
});

async function actualizarPerfil(foto, nombre, info, bio) {
  try {
    const respuesta = await fetch('/api/usuario/perfil', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const usuario = await respuesta.json();

    if (respuesta.status === 404 || respuesta.status === 401) {
      return Swal.fire({
        icon: 'error',
        title: 'Error de autenticación',
        text: usuario.error || 'Por favor, inicia sesión para ver tu perfil.'
      }).then(() => {
        window.location.href = '/inicioSesion';
      });
    }

    if (!respuesta.ok) {
      throw new Error(usuario.error || 'Error al obtener datos');
    }

    if (usuario.foto_perfil_url) {
      foto.src = usuario.foto_perfil_url;
    }

    nombre.textContent = usuario.nombre || 'Usuario sin nombre';

    if (usuario.creado_en) {
      const fecha = new Date(usuario.creado_en);
      const anio = fecha.getFullYear();
      info.textContent = `Se unió en ${anio}.`;
    } else {
      info.textContent = 'Miembro de la plataforma';
    }

    bio.textContent = usuario.biografia || 'Sin biografía disponible.';

    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });

    Toast.fire({
      icon: 'success',
      title: 'Perfil cargado correctamente'
    });

  } catch (error) {
    console.error('Error al cargar perfil:', error);
    Swal.fire({
      icon: 'error',
      title: 'Sin conexión',
      text: 'No se pudo conectar con el servidor.'
    });
  }
}


async function cargarCartaFavorita() {
  const contenedor = document.getElementById(
    'perfil-carta-favorita'
  );

  if (!contenedor) return;

  try {
    const respuesta = await fetch(
      '/api/recompensas/favorita',
      { credentials: 'same-origin' }
    );

    if (!respuesta.ok) {
      throw new Error('Error al cargar la favorita');
    }

    const { carta } = await respuesta.json();

    contenedor.replaceChildren();

    if (!carta) {
      const mensaje = document.createElement('p');

      mensaje.textContent =
        'Todavía no has seleccionado una carta favorita.';

      contenedor.appendChild(mensaje);
      return;
    }

    const imagen = document.createElement('img');
    imagen.alt = carta.titulo;

    if (carta.imagen_url) {
      imagen.src = carta.imagen_url;
    } else {
      imagen.hidden = true;
    }

    const titulo = document.createElement('h3');
    titulo.textContent = carta.titulo;

    const estrellas = document.createElement('p');
    estrellas.textContent =
      '★'.repeat(carta.rareza) +
      '☆'.repeat(5 - carta.rareza);

    contenedor.append(imagen, titulo, estrellas);

  } catch (error) {
    contenedor.textContent =
      'No se pudo cargar la carta favorita.';
  }
}

cargarCartaFavorita();
