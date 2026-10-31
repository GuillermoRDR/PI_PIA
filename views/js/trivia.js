
let intentoId = null;
let preguntas = [];
let indice = 0;
let procesando = false;

const $ = id => document.getElementById(id);

const pantallas = [
  'introduccion',
  'juego',
  'resultado'
];

function mostrarPantalla(nombre) {
  for (const id of pantallas) {
    $(id).hidden = id !== nombre;
  }

  $('error-general').hidden = true;
}

function mostrarError(error) {
  $('error-general').textContent = error.message;
  $('error-general').hidden = false;
}

async function peticion(url, metodo = 'GET', datos = null) {
  const opciones = {
    method: metodo,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (datos !== null) {
    opciones.body = JSON.stringify(datos);
  }

  const respuesta = await fetch(url, opciones);
  const contenido = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      contenido.error || 'Ocurrió un error'
    );
  }

  return contenido;
}

async function comenzarTrivia() {
  if (procesando) return;

  procesando = true;
  $('comenzar').disabled = true;

  try {
    const datos = await peticion(
      '/api/trivia/iniciar',
      'POST'
    );

    intentoId = datos.intento_id;
    preguntas = datos.preguntas;

    if (preguntas.length !== 5) {
      throw new Error('No se recibieron cinco preguntas');
    }

    // Primera pregunta que todavía no tiene respuesta.
    const pendiente = preguntas.findIndex(
      p => p.respuesta_guardada == null
    );

    mostrarPantalla('juego');

    if (pendiente === -1) {
      // Todas las preguntas ya estaban respondidas.
      await finalizarTrivia();
    } else {
      indice = pendiente;
      mostrarPregunta();
    }

  } catch (error) {
    mostrarError(error);
  } finally {
    procesando = false;
    $('comenzar').disabled = false;
  }
}

function mostrarPregunta() {
  const pregunta = preguntas[indice];

  $('progreso').textContent =
    `Pregunta ${indice + 1} de ${preguntas.length}`;

  $('progreso-barra').style.width =
    `${((indice + 1) / preguntas.length) * 100}%`;

  $('preguntan').textContent =
    `PREGUNTA ${indice + 1}`;

  $('pregunta').textContent = pregunta.enunciado;

  $('equipo-pregunta').textContent = pregunta.equipo || '';

  const contenedorImagen = $('contenedor-imagen');
  const imagen = $('miniatura');

  imagen.onerror = null;
  imagen.removeAttribute('src');
  contenedorImagen.hidden = true;

  if (pregunta.imagen_url) {
    imagen.alt = `Ilustración: ${pregunta.enunciado}`;

    imagen.onload = () => {
      contenedorImagen.hidden = false;
    };

    imagen.onerror = () => {
      contenedorImagen.hidden = true;
      console.warn(
        'No se pudo cargar la imagen:',
        pregunta.imagen_url
      );
    };

    imagen.src = pregunta.imagen_url;
  }

  $('mensaje').textContent = '';
  $('siguiente').hidden = true;

  const contenedor = $('opciones');
  contenedor.replaceChildren();

  const respondida = pregunta.respuesta_guardada != null;

  for (const opcion of pregunta.opciones) {
    const boton = document.createElement('button');

    boton.type = 'button';
    boton.className = 'boton-opcion';
    boton.textContent = opcion.texto;

    if (respondida) {
      boton.disabled = true;

      if (opcion.opcion_id === pregunta.respuesta_guardada) {
        boton.classList.add('seleccionada');
      }
    } else {
      boton.addEventListener('click', () => {
        responderPregunta(pregunta, opcion);
      });
    }

    contenedor.appendChild(boton);
  }

  if (respondida) {
    $('mensaje').textContent = 'Respuesta guardada';
    habilitarSiguiente();
  }
}

async function responderPregunta(pregunta, opcion) {
  if (procesando || pregunta.respuesta_guardada != null) {
    return;
  }

  procesando = true;

  const botones = [
    ...document.querySelectorAll('.boton-opcion')
  ];

  botones.forEach(boton => boton.disabled = true);

  try {
    await peticion('/api/trivia/responder', 'POST', {
      intento_id: intentoId,
      pregunta_id: pregunta.pregunta_id,
      opcion_id: opcion.opcion_id
    });

    pregunta.respuesta_guardada = opcion.opcion_id;

    mostrarPregunta();

  } catch (error) {
    botones.forEach(boton => boton.disabled = false);
    $('mensaje').textContent = error.message;
  } finally {
    procesando = false;
  }
}

function habilitarSiguiente() {
  $('siguiente').hidden = false;

  $('siguiente').textContent =
    indice === preguntas.length - 1
      ? 'VER RESULTADOS'
      : 'SIGUIENTE PREGUNTA';
}

async function siguientePregunta() {
  if (procesando) return;

  if (indice < preguntas.length - 1) {
    indice++;
    mostrarPregunta();
  } else {
    await finalizarTrivia();
  }
}

async function finalizarTrivia() {
  if (procesando && !$('siguiente').hidden) return;

  $('siguiente').disabled = true;

  try {
    const datos = await peticion(
      '/api/trivia/finalizar',
      'POST',
      { intento_id: intentoId }
    );

    $('aciertos').textContent =
      `${datos.correctas}/5`;

    $('puntos').textContent =
      datos.puntos_obtenidos;

    $('resumen').textContent =
      `Has conseguido ${datos.puntos_obtenidos} ` +
      'puntos para tu colección de cartas.';

    mostrarPantalla('resultado');

  } catch (error) {
    mostrarError(error);
  } finally {
    $('siguiente').disabled = false;
  }
}

$('comenzar').addEventListener(
  'click',
  comenzarTrivia
);

$('siguiente').addEventListener(
  'click',
  siguientePregunta
);

$('reiniciar').addEventListener('click', () => {
  intentoId = null;
  preguntas = [];
  indice = 0;
  mostrarPantalla('introduccion');
});

mostrarPantalla('introduccion');
