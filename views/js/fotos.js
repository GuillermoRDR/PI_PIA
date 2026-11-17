(function () {
  'use strict';

  const lista = document.getElementById('lista');
  const vacio = document.getElementById('vacio');
  const chkFav = document.getElementById('fav');
  const extend = document.getElementById('extend');
  const grande = document.getElementById('extendf');
  const btnCerrar = document.getElementById('hide');
  const btnShare = document.getElementById('share');
  const btnFav = document.getElementById('favf');
  const btnBorrar = document.getElementById('delete');

  let fotos = [];
  let actual = null;
  let ocupado = false;

  function fechaCorta(iso) {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function mostrarVacio(texto) {
    vacio.textContent = texto;
    vacio.classList.toggle('oculto', !texto);
  }

  function pintar() {
    const visibles = chkFav.checked ? fotos.filter((f) => f.es_favorita) : fotos;
    lista.replaceChildren();

    if (!visibles.length) {
      mostrarVacio(
        chkFav.checked
          ? 'Aún no tienes fotos favoritas.'
          : 'Todavía no tienes fotos. Toma una desde el escáner AR y guárdala en tu galería.'
      );
      return;
    }
    mostrarVacio('');

    for (const foto of visibles) {
      const marco = document.createElement('div');
      marco.className = 'mini-marco' + (foto.es_favorita ? ' es-fav' : '');

      const img = document.createElement('img');
      img.className = 'mini';
      img.src = foto.imagen_url;
      img.alt = 'Foto del ' + fechaCorta(foto.creada_en);
      img.loading = 'lazy';
      img.addEventListener('click', () => abrir(foto));

      marco.appendChild(img);
      lista.appendChild(marco);
    }
  }

  function actualizarBotonFav() {
    const esFav = !!(actual && actual.es_favorita);
    btnFav.classList.toggle('activa', esFav);
    btnFav.title = esFav ? 'Quitar de favoritas' : 'Marcar como favorita';
    btnFav.setAttribute('aria-pressed', String(esFav));
  }

    function abrir(foto) {
    actual = foto;
    grande.src = foto.imagen_url;
    btnBorrar.style.display = foto.es_precargada ? 'none' : '';
    actualizarBotonFav();
    extend.classList.add('show');
  }

  function cerrar() {
    extend.classList.remove('show');
    grande.removeAttribute('src');
    actual = null;
  }

  async function cargar() {
    try {
      const datos = await Alertas.peticion('/api/fotos');
      fotos = datos.fotos || [];
      pintar();
    } catch (error) {
      mostrarVacio('No se pudieron cargar tus fotos.');
      Alertas.error(error, 'No se pudieron cargar tus fotos.');
    }
  }

  async function alternarFavorita() {
    if (!actual || ocupado) return;
    ocupado = true;
    const nuevo = !actual.es_favorita;
    try {
      await Alertas.peticion('/api/fotos/' + actual.foto_id + '/favorita', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ es_favorita: nuevo })
      });
      actual.es_favorita = nuevo;
      actualizarBotonFav();
      pintar();
    } catch (error) {
      Alertas.error(error, 'No se pudo actualizar la foto.');
    } finally {
      ocupado = false;
    }
  }

    async function eliminar() {
    if (!actual || ocupado || actual.es_precargada) return;

    if (typeof Swal !== 'undefined') {
      const r = await Swal.fire({
        icon: 'warning',
        title: '¿Eliminar esta foto?',
        text: 'Esta acción no se puede deshacer.',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#AE120A'
      });
      if (!r.isConfirmed) return;
    } else if (!window.confirm('¿Eliminar esta foto?')) {
      return;
    }

    ocupado = true;
    const id = actual.foto_id;
    try {
      await Alertas.peticion('/api/fotos/' + id, { method: 'DELETE' });
      fotos = fotos.filter((f) => f.foto_id !== id);
      cerrar();
      pintar();
    } catch (error) {
      Alertas.error(error, 'No se pudo eliminar la foto.');
    } finally {
      ocupado = false;
    }
  }

  async function compartir() {
    if (!actual) return;
    const datos = { title: 'Mi foto BATEA', text: '¡Mira mi foto de BATEA!', url: actual.imagen_url };

    try {
      if (navigator.share) {
        await navigator.share(datos);
        return;
      }
      await navigator.clipboard.writeText(actual.imagen_url);
      Alertas.mostrar('success', 'Enlace copiado', 'Pega el enlace donde quieras compartir tu foto.');
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      Alertas.mostrar('info', 'Comparte tu foto', actual.imagen_url);
    }
  }

  chkFav.addEventListener('change', pintar);
  btnCerrar.addEventListener('click', cerrar);
  btnShare.addEventListener('click', compartir);
  btnFav.addEventListener('click', alternarFavorita);
  btnBorrar.addEventListener('click', eliminar);
  extend.addEventListener('click', (e) => { if (e.target === extend) cerrar(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && extend.classList.contains('show')) cerrar(); });

  cargar();
})();