(function () {
  'use strict';

  const lista = document.getElementById('lista-videos');
  const vacio = document.getElementById('vacio-videos');
  const buscador = document.getElementById('bus');

  let videos = [];

  function normalizar(texto) {
    return String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function mostrarVacio(texto) {
    vacio.textContent = texto;
    vacio.classList.toggle('oculto', !texto);
  }

  function crearMiniatura(video) {
    if (video.miniatura_url) {
      const img = document.createElement('img');
      img.className = 'vmini';
      img.src = video.miniatura_url;
      img.alt = '';
      img.loading = 'lazy';
      return img;
    }
    const v = document.createElement('video');
    v.className = 'vmini';
    v.muted = true;
    v.playsInline = true;
    v.preload = 'metadata';
    v.src = video.archivo_url + '#t=0.5';
    return v;
  }

  function pintar() {
    const q = normalizar(buscador.value);
    const visibles = q ? videos.filter((v) => normalizar(v.titulo).includes(q)) : videos;

    lista.replaceChildren();

    if (!visibles.length) {
      mostrarVacio(
        q ? 'No hay videos que coincidan con "' + buscador.value.trim() + '".'
          : 'Todavía no hay videos disponibles.'
      );
      return;
    }
    mostrarVacio('');

    for (const video of visibles) {
      const tarjeta = document.createElement('button');
      tarjeta.type = 'button';
      tarjeta.className = 'vcard';
      tarjeta.dataset.video = video.archivo_url;
      tarjeta.title = video.titulo;
      tarjeta.addEventListener('click', () => openf(tarjeta));

      const titulo = document.createElement('span');
      titulo.className = 'vtitulo';
      titulo.textContent = video.titulo;

      tarjeta.append(crearMiniatura(video), titulo);
      lista.appendChild(tarjeta);
    }
  }

  async function cargar() {
    try {
      const datos = await Alertas.peticion('/api/videos');
      videos = datos.videos || [];
      pintar();
    } catch (error) {
      mostrarVacio('No se pudieron cargar los videos.');
      Alertas.error(error, 'No se pudieron cargar los videos.');
    }
  }

  buscador.addEventListener('input', pintar);
  cargar();
})();