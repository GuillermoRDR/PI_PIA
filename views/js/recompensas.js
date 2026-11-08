
const $ = id => document.getElementById(id);
const NOMBRES_RAREZA = {
  1: 'Común',
  2: 'Poco común',
  3: 'Rara',
  4: 'Épica',
  5: 'Legendaria'
};

let cartaSeleccionada = null;
let estado = null;
let canjeando = false;


async function solicitar(url, metodo = 'GET') {
  return Alertas.peticion(url, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}


async function cargarRecompensas() {
  estado = await solicitar('/api/recompensas');

  mostrarResumen();
  mostrarColeccion();
}

function mostrarResumen() {

  const resumen = estado.resumen;

  $('saldo').textContent = resumen.puntos;
  $('costo').textContent = resumen.costo_carta;

  $('progreso').textContent =
    `${resumen.cartas_obtenidas} de ` +
    `${resumen.cartas_disponibles} cartas`;

  const coleccionCompleta =
    resumen.cartas_disponibles > 0 &&
    resumen.cartas_obtenidas >= resumen.cartas_disponibles;

  const puedeCanjear =
    resumen.puntos >= resumen.costo_carta &&
    !coleccionCompleta &&
    resumen.cartas_disponibles > 0;

  $('canjear').disabled = !puedeCanjear || canjeando;

  if (resumen.cartas_disponibles === 0) {
    $('mensaje').textContent =
      'Todavía no hay cartas disponibles.';
  } else if (coleccionCompleta) {
    $('mensaje').textContent =
      '¡Has completado tu colección!';
  } else if (!puedeCanjear) {
    $('mensaje').textContent =
      'Sigue jugando para reunir más puntos.';
  } else {
    $('mensaje').textContent =
      '¡Tienes puntos suficientes para una carta!';
  }
}

function mostrarColeccion() {
  const contenedor = $('cartas');
  contenedor.replaceChildren();

  for (const carta of estado.coleccion) {
    const elemento = document.createElement(carta.obtenida ? 'button' : 'article');

    elemento.className = 'carta';

    if (carta.obtenida) {
      elemento.type = 'button';
      elemento.classList.add('obtenida');

      elemento.addEventListener('click', () => {
        abrirDetalleCarta(carta);
      });
    } else {
      elemento.classList.add('bloqueada');
    }

    const titulo = document.createElement('h3');
    titulo.textContent = carta.obtenida
      ? carta.titulo
      : 'CARTA BLOQUEADA';

    if (carta.obtenida) {
      const imagen = document.createElement('img');

      if (carta.imagen_url) {
        imagen.src = carta.imagen_url;
      }

      imagen.alt = carta.titulo;
      imagen.loading = 'lazy';

      elemento.appendChild(imagen);
    } else {
      const reverso = document.createElement('div');
      reverso.className = 'reverso';
      reverso.textContent = '?';

      elemento.appendChild(reverso);
    }
    if (carta.obtenida) {
      elemento.appendChild(crearEstrellas(carta.rareza));

      if (carta.favorita) {
        elemento.classList.add('favorita');
      }
    }

    elemento.appendChild(titulo);
    contenedor.appendChild(elemento);
  }
}

function abrirDetalleCarta(carta) {
  cartaSeleccionada = carta;

  mostrarRarezaDetalle(carta);
  actualizarBotonFavorita(carta);

  $('mensaje-carta').textContent = '';
  $('detalle-titulo').textContent = carta.titulo;

  $('detalle-equipo').textContent =
    carta.equipo || '';

  $('detalle-descripcion').textContent =
    carta.descripcion || 'Sin descripción disponible.';

  if (carta.imagen_url) {
    $('detalle-imagen').src = carta.imagen_url;
    $('detalle-imagen').hidden = false;
  } else {
    $('detalle-imagen').removeAttribute('src');
    $('detalle-imagen').hidden = true;
  }

  $('detalle-imagen').alt = carta.titulo;

  if (carta.obtenida_en) {
    const fecha = new Date(carta.obtenida_en);

    $('detalle-fecha').textContent =
      `Obtenida el ${fecha.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}`;
  } else {
    $('detalle-fecha').textContent = '';
  }

  $('modal-carta').showModal();
}

async function canjearCarta() {
  if (canjeando || $('canjear').disabled) return;

  canjeando = true;
  $('canjear').disabled = true;
  $('mensaje').textContent = 'Canjeando puntos...';

  try {
    const resultado = await solicitar('/api/recompensas/canjear', 'POST');

    $('premio-nombre').textContent = resultado.carta.titulo;

    if (resultado.carta.imagen_url) {
      $('premio-imagen').src = resultado.carta.imagen_url;
      $('premio-imagen').hidden = false;
    } else {
      $('premio-imagen').removeAttribute('src');
      $('premio-imagen').hidden = true;
    }

    $('premio-imagen').alt = resultado.carta.titulo;

    await cargarRecompensas();

    $('modal-premio').showModal();


  } catch (error) {
    console.error('Error al canjear carta:', error);

    $('mensaje').textContent =
      'No se pudo completar el canje.';

    await Alertas.error(error);
  } finally {
    canjeando = false;

    if (estado) {
      const resumen = estado.resumen;

      $('canjear').disabled = !(resumen.puntos >= resumen.costo_carta && resumen.cartas_disponibles > 0 && resumen.cartas_obtenidas < resumen.cartas_disponibles);
    }
  }
}

$('canjear').addEventListener(
  'click',
  canjearCarta
);

$('cerrar-carta').addEventListener('click', () => {
  $('modal-carta').close();
});

$('cerrar-premio').addEventListener('click', () => {
  $('modal-premio').close();
});

for (const id of ['modal-carta', 'modal-premio']) {
  const modal = $(id);

  modal.addEventListener('click', event => {
    if (event.target === modal) {
      modal.close();
    }
  });
}

function crearEstrellas(rareza) {
  const cantidad = Math.max(
    1,
    Math.min(5, Number(rareza) || 1)
  );

  const estrellas = document.createElement('span');
  estrellas.className = 'estrellas';
  estrellas.textContent =
    '★'.repeat(cantidad) +
    '☆'.repeat(5 - cantidad);

  estrellas.setAttribute(
    'aria-label',
    `${cantidad} de 5 estrellas`
  );

  return estrellas;
}

function mostrarRarezaDetalle(carta) {
  const contenedor = $('detalle-estrellas');
  contenedor.replaceChildren(
    crearEstrellas(carta.rareza)
  );

  $('detalle-rareza').textContent =
    NOMBRES_RAREZA[carta.rareza] || 'Común';
}

function actualizarBotonFavorita(carta) {
  $('boton-favorita').textContent = carta.favorita
    ? 'QUITAR DE FAVORITAS'
    : 'AGREGAR A FAVORITAS';

  $('boton-favorita').classList.toggle(
    'activa',
    carta.favorita
  );
}


async function cambiarFavorita() {
  if (!cartaSeleccionada) return;

  const boton = $('boton-favorita');
  boton.disabled = true;

  try {
    const datos = await solicitar(
      `/api/recompensas/favorita/${cartaSeleccionada.carta_id}`,
      'PATCH'
    );

    const favoritaId = datos.carta_favorita_id;

    for (const carta of estado.coleccion) {
      carta.favorita =
        carta.carta_id === favoritaId;
    }

    cartaSeleccionada.favorita =
      cartaSeleccionada.carta_id === favoritaId;

    actualizarBotonFavorita(cartaSeleccionada);
    mostrarColeccion();

    $('mensaje-carta').textContent = datos.mensaje;

  } catch (error) {
    $('mensaje-carta').textContent =
      'No se pudo actualizar la carta favorita.';

    await Alertas.error(error);
  } finally {
    boton.disabled = false;
  }
}

$('boton-favorita').addEventListener(
  'click',
  cambiarFavorita
);

async function compartirCarta() {
  if (!cartaSeleccionada) return;

  const carta = cartaSeleccionada;

  const texto =
    `¡Mira mi carta de Batea!\n` +
    `${carta.titulo}\n` +
    `Rareza: ${NOMBRES_RAREZA[carta.rareza]}`;

  const datos = {
    title: `Carta de Batea: ${carta.titulo}`,
    text: texto,
    url: carta.imagen_url || window.location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(datos);
    } else {
      await navigator.clipboard.writeText(
        `${texto}\n${datos.url}`
      );

      $('mensaje-carta').textContent =
        'Información copiada al portapapeles';
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error al compartir carta:', error);

      await Alertas.mostrar(
        'error',
        'No se pudo compartir',
        'Verifica los permisos del navegador e inténtalo nuevamente.'
      );
    }
  }
}

$('boton-compartir').addEventListener(
  'click',
  compartirCarta
);

cargarRecompensas().catch(async error => {
  console.error('Error al cargar recompensas:', error);

  $('mensaje').textContent =
    'No se pudo cargar tu colección.';

  $('canjear').disabled = true;

  await Alertas.error(error);
});