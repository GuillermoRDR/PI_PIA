'use strict';

let escenaAR = null;
let modeloAR = null;
let targetAR = null;

let iniciandoAR = false;
let seguimientoIniciado = false;

let animacionAR = null;
let confetiAR = null;

AFRAME.registerComponent('control-animacion', {
  tick: function (time, delta) {
    const animacion = this.el.__animacionAR;

    if (!animacion || !animacion.reproduciendo) {
      return;
    }

    animacion.mixer.update(
      Math.min(delta / 1000, 0.1)
    );
  }
});

document.addEventListener('DOMContentLoaded', iniciarAR);

async function iniciarAR() {
  if (iniciandoAR) return;

  iniciandoAR = true;

  escenaAR = document.querySelector('a-scene');

  const contenedorTarget = document.getElementById('ar-target-container');

  targetAR = null;
  modeloAR = null;

  const botonAnimar = document.getElementById('mov');

  const parametros = new URLSearchParams(
    window.location.search
  );

  const parametroTarget = parametros.get('target');

  const targetIndex = Number(parametroTarget);

  if (
    parametroTarget === null ||
    parametroTarget.trim() === '' ||
    !Number.isInteger(targetIndex) ||
    targetIndex < 0 ||
    targetIndex > 14
  ) {
    mostrarError('Marcador inválido');
    return;
  }


  if (!escenaAR || !contenedorTarget || !botonAnimar) {
    mostrarError('Faltan elementos de la escena AR');
    return;
  }

  // Crear el marcador con su índice definitivo.
  targetAR = document.createElement('a-entity');

  targetAR.id = 'ar-target';

  targetAR.setAttribute(
    'mindar-image-target',
    `targetIndex: ${targetIndex}`
  );

  // Crear la entidad que contendrá el GLB.
  modeloAR = document.createElement('a-entity');

  modeloAR.id = 'modelo-3d';

  modeloAR.setAttribute('position', '0 0 0');
  modeloAR.setAttribute('rotation', '0 0 0');
  modeloAR.setAttribute('scale', '2 2 2');

  targetAR.appendChild(modeloAR);

  // Incorporar el marcador a la escena.
  contenedorTarget.appendChild(targetAR);

  console.log(
    'Marcador creado:',
    targetAR.getAttribute('mindar-image-target')
  );


  botonAnimar.disabled = true;
  botonAnimar.textContent = 'Cargando...';

  console.log('================================');
  console.log('BATEA - Inicializando AR');
  console.log('Target solicitado:', targetIndex);
  console.log('================================');

  try {
    await esperarEscena(escenaAR);

    console.log('Escena A-Frame lista');

    console.log(
      'Marcador configurado:',
      targetAR.getAttribute('mindar-image-target')
    );

    registrarEventosAR(targetIndex);

    const respuesta = await fetch(
      `/api/ar/equipos/${targetIndex}`
    );

    console.log(
      'Estado de la API:',
      respuesta.status
    );

    if (!respuesta.ok) {
      throw new Error(
        `No se pudo consultar el equipo (HTTP ${respuesta.status})`
      );
    }

    const datos = await respuesta.json();
    const equipo = datos.equipo;

    if (!equipo) {
      throw new Error(
        'La API no devolvió información del equipo'
      );
    }

    console.log('Equipo recibido:', equipo.nombre);
    console.log('Modelo URL:', equipo.modelo_url);

    mostrarInformacionEquipo(equipo);

    if (equipo.modelo_url) {
      prepararModelo(
        equipo.modelo_url,
        botonAnimar
      );
    } else {
      mostrarError(
        'Este equipo todavía no tiene modelo 3D'
      );
    }

    await iniciarSeguimientoAR();

  } catch (error) {
    console.error(
      'Error durante la inicialización AR:',
      error
    );

    mostrarError(error.message);
  }
}

function esperarEscena(escena) {
  return new Promise((resolve, reject) => {
    if (escena.hasLoaded) {
      resolve();
      return;
    }

    const alCargar = () => {
      escena.removeEventListener('loaded', alCargar);
      resolve();
    };

    escena.addEventListener(
      'loaded',
      alCargar,
      { once: true }
    );
  });
}

function registrarEventosAR(targetIndex) {

  escenaAR.addEventListener('arReady', () => {
    console.log('MindAR: sistema preparado');
  });

  escenaAR.addEventListener('arError', (evento) => {
    console.error(
      'MindAR: error de inicialización',
      evento.detail
    );
  });

  targetAR.addEventListener('targetFound', () => {
    console.log(
      'TARGET FOUND:',
      targetIndex
    );

    console.log(
      'Marcador visible:',
      targetAR.object3D.visible
    );
  });

  targetAR.addEventListener('targetLost', () => {
    console.log(
      'TARGET LOST:',
      targetIndex
    );
  });
}

async function iniciarSeguimientoAR() {
  if (seguimientoIniciado) return;

  const sistema = escenaAR.systems['mindar-image-system'];

  if (!sistema) {
    throw new Error(
      'No se encontró el sistema mindar-image-system'
    );
  }

  console.log('Iniciando cámara y seguimiento...');

  try {
    await sistema.start();

    seguimientoIniciado = true;

    console.log('MindAR iniciado correctamente');
    console.log(
      'Target configurado:',
      targetAR.getAttribute('mindar-image-target')
    );
  } catch (error) {
    console.error('Error al iniciar MindAR:', error);
    throw error;
  }
}


function prepararModelo(url, botonAnimar) {

  modeloAR.addEventListener(
    'model-loaded',
    (evento) => {

      console.log(
        'Modelo GLB cargado:',
        url
      );

      const objeto = evento.detail.model;

      if (!objeto) {
        mostrarError(
          'El GLB no contiene un objeto 3D'
        );
        return;
      }

      console.log('Objeto 3D:', objeto);

      diagnosticarModelo(objeto);

      configurarAnimaciones(
        modeloAR,
        botonAnimar,
        objeto
      );
    },
    { once: true }
  );

  modeloAR.addEventListener(
    'model-error',
    (evento) => {

      console.error(
        'Error al cargar GLB:',
        evento.detail
      );

      console.error(
        'Archivo solicitado:',
        url
      );

      mostrarError(
        'No se pudo cargar el modelo 3D'
      );
    },
    { once: true }
  );

  console.log('Intentando cargar:', url);

  modeloAR.setAttribute(
    'gltf-model',
    url
  );
}

function diagnosticarModelo(objeto) {

  let cantidadMallas = 0;
  let verticesInvalidos = 0;

  objeto.traverse((nodo) => {

    if (!nodo.isMesh) return;

    cantidadMallas++;

    const posiciones =
      nodo.geometry?.attributes?.position;

    if (!posiciones) return;

    for (let i = 0; i < posiciones.count; i++) {

      const x = posiciones.getX(i);
      const y = posiciones.getY(i);
      const z = posiciones.getZ(i);

      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(z)
      ) {
        verticesInvalidos++;
      }
    }
  });

  console.log(
    'Cantidad de mallas:',
    cantidadMallas
  );

  console.log(
    'Vértices inválidos:',
    verticesInvalidos
  );

  if (verticesInvalidos > 0) {
    console.warn(
      'El modelo contiene geometría inválida'
    );
  }

  try {
    objeto.updateMatrixWorld(true);

    const caja = new AFRAME.THREE.Box3()
      .setFromObject(objeto);

    const tamaño = caja.getSize(
      new AFRAME.THREE.Vector3()
    );

    console.log(
      'Dimensiones del GLB:',
      tamaño
    );

  } catch (error) {
    console.warn(
      'No se pudieron calcular las dimensiones:',
      error
    );
  }
}

function configurarAnimaciones(
  modelo,
  boton,
  objeto
) {

  const clips =
    modelo.components['gltf-model']
      ?.model?.animations ||
    objeto.animations ||
    [];

  console.log(
    'Animaciones encontradas:',
    clips.length
  );

  if (!clips.length) {
    boton.textContent = 'Sin animación';
    boton.disabled = true;
    return;
  }

  const THREE = AFRAME.THREE;

  const mixer = new THREE.AnimationMixer(objeto);

  const accion = mixer.clipAction(clips[0]);

  accion.setLoop(
    THREE.LoopRepeat,
    Infinity
  );

  accion.play();
  accion.paused = true;

  animacionAR = {
    mixer,
    accion,
    reproduciendo: false
  };

  modelo.__animacionAR = animacionAR;

  modelo.setAttribute(
    'control-animacion',
    ''
  );

  boton.disabled = false;
  boton.textContent = 'Animar';

  boton.addEventListener('click', () => {

    animacionAR.reproduciendo =
      !animacionAR.reproduciendo;

    accion.paused =
      !animacionAR.reproduciendo;

    boton.textContent =
      animacionAR.reproduciendo
        ? 'Pausar animación'
        : 'Animar';

    boton.classList.toggle(
      'activo',
      animacionAR.reproduciendo
    );
  });
}

function mostrarInformacionEquipo(equipo) {

  document.getElementById(
    'ar-equipo-nombre'
  ).textContent =
    equipo.nombre || 'Equipo desconocido';

  document.getElementById(
    'ar-equipo-historia'
  ).textContent =
    equipo.historia ||
    'Historia no disponible.';

  document.getElementById(
    'ar-equipo-descripcion'
  ).textContent =
    equipo.descripcion ||
    'Sin descripción.';

  document.getElementById(
    'ar-equipo-ciudad'
  ).textContent =
    equipo.ciudad ||
    'No disponible.';

  const logo = document.getElementById(
    'ar-equipo-logo'
  );

  if (equipo.logo_url) {
    logo.src = equipo.logo_url;
    logo.alt = `Logo de ${equipo.nombre}`;
    logo.hidden = false;
  } else {
    logo.removeAttribute('src');
    logo.hidden = true;
  }
}


function openfi() {
  document.getElementById(
    'extendfi'
  ).classList.add('showfi');
}

function closefi() {
  document.getElementById(
    'extendfi'
  ).classList.remove('showfi');
}

function openf() {
  document.getElementById(
    'extend'
  ).classList.add('show');
}

function closef() {
  document.getElementById(
    'extend'
  ).classList.remove('show');
}

function obtenerConfeti() {

  if (confetiAR) return confetiAR;

  const canvas = document.getElementById(
    'confettiCanvas'
  );

  if (!canvas || typeof confetti === 'undefined') {
    console.warn(
      'Canvas o biblioteca de confeti no disponible'
    );
    return null;
  }

  confetiAR = confetti.create(canvas, {
    resize: true,
    useWorker: false
  });

  return confetiAR;
}

function lanzarConfeti() {

  const lanzar = obtenerConfeti();

  if (!lanzar) return;

  lanzar({
    particleCount: 150,
    spread: 90,
    origin: { y: 0.6 },
    colors: [
      '#0339A6',
      '#FFB300',
      '#CA2407',
      '#FFFFFF'
    ]
  });
}

function tomarFoto() {

  const escena = document.querySelector('a-scene');

  if (!escena) {
    alert('La escena AR no está disponible.');
    return;
  }

  const arCanvas =
    escena.canvas ||
    escena.renderer?.domElement;

  const video =
    document.querySelector('video');

  if (!arCanvas) {
    alert(
      'La escena todavía no está lista.'
    );
    return;
  }

  const width = arCanvas.width;
  const height = arCanvas.height;

  if (!width || !height) {
    alert(
      'El canvas AR no tiene dimensiones válidas.'
    );
    return;
  }

  const outCanvas =
    document.createElement('canvas');

  outCanvas.width = width;
  outCanvas.height = height;

  const ctx = outCanvas.getContext('2d');

  if (
    video &&
    video.readyState >= 2 &&
    video.videoWidth > 0
  ) {

    const videoRatio =
      video.videoWidth / video.videoHeight;

    const canvasRatio =
      width / height;

    let drawWidth;
    let drawHeight;
    let offsetX;
    let offsetY;

    if (videoRatio > canvasRatio) {

      drawHeight = height;
      drawWidth = height * videoRatio;

      offsetX = (width - drawWidth) / 2;
      offsetY = 0;

    } else {

      drawWidth = width;
      drawHeight = width / videoRatio;

      offsetX = 0;
      offsetY = (height - drawHeight) / 2;
    }

    const transform =
      window.getComputedStyle(video).transform;

    const isMirrored =
      transform &&
      transform !== 'none' &&
      transform.startsWith('matrix') &&
      parseFloat(
        transform.split('(')[1].split(',')[0]
      ) < 0;

    ctx.save();

    if (isMirrored) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);

      ctx.drawImage(
        video,
        width - offsetX - drawWidth,
        offsetY,
        drawWidth,
        drawHeight
      );
    } else {
      ctx.drawImage(
        video,
        offsetX,
        offsetY,
        drawWidth,
        drawHeight
      );
    }

    ctx.restore();
  }

  try {
    ctx.drawImage(
      arCanvas,
      0,
      0,
      width,
      height
    );
  } catch (error) {
    console.error(
      'Error al capturar el modelo:',
      error
    );
  }

  const canvasConfeti =
    document.getElementById('confettiCanvas');

  if (
    canvasConfeti &&
    canvasConfeti.width > 0 &&
    canvasConfeti.height > 0
  ) {
    try {
      ctx.drawImage(
        canvasConfeti,
        0,
        0,
        width,
        height
      );
    } catch (error) {
      console.warn(
        'No se pudo capturar el confeti:',
        error
      );
    }
  }

  try {

    const dataURL =
      outCanvas.toDataURL('image/png');

    document.getElementById(
      'fotoPreview'
    ).src = dataURL;

    document.getElementById(
      'fotoDescargar'
    ).href = dataURL;

    document.getElementById(
      'fotoOverlay'
    ).classList.add('show');

  } catch (error) {

    console.error(
      'Error al generar la fotografía:',
      error
    );

    alert(
      'No se pudo generar la fotografía.'
    );
  }
}

function cerrarFoto() {

  document.getElementById(
    'fotoOverlay'
  ).classList.remove('show');

  document.getElementById(
    'fotoPreview'
  ).src = '';
}

function mostrarError(mensaje) {

  console.error('BATEA AR:', mensaje);

  const boton = document.getElementById(
    'mov'
  );

  if (boton) {
    boton.disabled = true;
    boton.textContent = mensaje;
  }
}

window.addEventListener('pagehide', () => {

  if (!seguimientoIniciado || !escenaAR) {
    return;
  }

  const sistema = escenaAR?.systems?.['mindar-image-system'];

  if (sistema && seguimientoIniciado) {
    Promise.resolve(sistema.stop()).catch((error) => {
      console.warn('Error al detener MindAR:', error);
    });
  }

  seguimientoIniciado = false;

  seguimientoIniciado = false;
});
