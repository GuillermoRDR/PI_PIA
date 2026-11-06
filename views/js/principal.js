let escena = null;
let escaneoActivo = false;
let sesion = 0;
let equipoActivo = null;
let registro = new Map();
let confeti = null;
let iniciando = false;

const $ = (id) => document.getElementById(id);


AFRAME.registerComponent('batea-animacion', {
  tick: function (_tiempo, delta) {
    const anim = this.el.__animacion;

    if (
      !anim ||
      !anim.reproduciendo ||
      !equipoActivo ||
      equipoActivo.modelo !== this.el
    ) {
      return;
    }

    anim.mixer.update(Math.min(delta / 1000, 0.1));
  }
});

document.addEventListener('DOMContentLoaded', () => {
  cargarUsuario();
  $('conf').addEventListener('click', () => location.assign('/configuracion'));
  $('usu').addEventListener('click', () => location.assign('/perfil'));
  $('tri').addEventListener('click', () => location.assign('/trivia'));
  $('gal').addEventListener('click', () => location.assign('galeria.html'));
  $('esc').addEventListener('click', abrirEscaner);
  $('hide').addEventListener('click', cerrarEscaner);
  $('arTri').addEventListener('click', () => location.assign('/trivia'));
  $('arGal').addEventListener('click', () => location.assign('galeria.html'));
  $('arInfo').addEventListener('click', () => $('extendfi').classList.add('showfi'));
  $('hidefi').addEventListener('click', () => $('extendfi').classList.remove('showfi'));
  $('con').addEventListener('click', lanzarConfeti);
  $('mov').addEventListener('click', alternarAnimacion);
  $('arFoto').addEventListener('click', tomarFoto);
  $('fotoCerrar').addEventListener('click', cerrarFoto);
  window.addEventListener('pagehide', cerrarEscaner);
  document.querySelectorAll('.equipo-tab').forEach(boton => {
    boton.addEventListener('click', () => {
      const tab = boton.dataset.tab;
      document.querySelectorAll('.equipo-tab')
        .forEach(b => b.classList.remove('activo'));
      document.querySelectorAll('.equipo-seccion')
        .forEach(seccion => {
          seccion.hidden = true;
          seccion.classList.remove('activo');
        });
      boton.classList.add('activo');

      const seccion = document.getElementById(`tab-${tab}`);

      if (seccion) {
        seccion.hidden = false;
        seccion.classList.add('activo');
      }
    });
  });

});

function actualizarEstado(texto) {
  $('scanStatus').textContent = texto;
}

function esperarCarga(el) {
  if (el.hasLoaded) return Promise.resolve();
  return new Promise(resolve => el.addEventListener('loaded', resolve, { once: true }));
}

async function abrirEscaner() {
  if (escaneoActivo || iniciando) return;
  iniciando = true;
  const token = ++sesion;
  $('extend').classList.add('show', 'ar-view');
  $('arControls').hidden = true;
  actualizarEstado('Preparando escáner...');
  $('mov').disabled = true;
  $('mov').textContent = 'Animar';

  try {
    const respuesta = await fetch('/api/ar/equipos');
    if (!respuesta.ok) throw new Error(`Error del catálogo: HTTP ${respuesta.status}`);
    const { equipos } = await respuesta.json();
    if (!Array.isArray(equipos)) throw new Error('El catálogo AR no contiene equipos');
    if (token !== sesion) return;

    registro = new Map();
    equipoActivo = null;
    const nuevaEscena = document.createElement('a-scene');

    nuevaEscena.setAttribute('mindar-image', `imageTargetSrc: /targets.mind;autoStart: false;uiLoading: 
      no;uiScanning: no;uiError: no;filterMinCF: 0.001; filterBeta: 0.001;`);
    nuevaEscena.setAttribute('embedded', '');
    nuevaEscena.setAttribute('color-space', 'sRGB');
    nuevaEscena.setAttribute('renderer', 'colorManagement: true;');
    nuevaEscena.setAttribute('vr-mode-ui', 'enabled: false');
    nuevaEscena.setAttribute('device-orientation-permission-ui', 'enabled: false');

    const camara = document.createElement('a-camera');
    camara.setAttribute('position', '0 0 0');
    camara.setAttribute('look-controls', 'enabled: false');
    nuevaEscena.appendChild(camara);
    const ambiental = document.createElement('a-light');
    ambiental.setAttribute('type', 'ambient');
    ambiental.setAttribute('intensity', '1.5');
    nuevaEscena.appendChild(ambiental);
    const direccional = document.createElement('a-light');
    direccional.setAttribute('type', 'directional');
    direccional.setAttribute('position', '1 2 3');
    direccional.setAttribute('intensity', '1');
    nuevaEscena.appendChild(direccional);

    // Los quince anchors se crean ANTES de conectar la escena al DOM.
    for (const equipo of equipos) {
      const indice = Number(equipo.target_index_e);
      if (!Number.isInteger(indice) || indice < 0 || indice > 14 || registro.has(indice)) continue;
      const target = document.createElement('a-entity');
      target.setAttribute('mindar-image-target', `targetIndex: ${indice}`);
      const modelo = document.createElement('a-entity');
      modelo.setAttribute('position', '0 0 0');
      modelo.setAttribute('rotation', '0 0 0');
      modelo.setAttribute('scale', '1 1 1');
      modelo.setAttribute('batea-animacion', '');
      target.appendChild(modelo);
      const entrada = { equipo, indice, target, modelo, cargando: false, cargado: false, animacion: null };
      registro.set(indice, entrada);
      target.addEventListener('targetFound', () => {
        if (token === sesion && escaneoActivo) seleccionarEquipo(entrada);
      });
      target.addEventListener('targetLost', () => {
        if (token !== sesion || !escaneoActivo) return;
        if (equipoActivo === entrada) actualizarEstado(`Vuelve a enfocar: ${equipo.nombre}`);
      });
      nuevaEscena.appendChild(target);
    }
    if (!registro.size) throw new Error('No hay marcadores AR válidos');

    nuevaEscena.addEventListener('arReady', () => {
      if (token === sesion && !equipoActivo) actualizarEstado('Escanea el logo de un equipo');
    });
    nuevaEscena.addEventListener('arError', (e) => {
      if (token === sesion) actualizarEstado('Error al iniciar la cámara');
      console.error('MindAR arError', e.detail);
    });

    escena = nuevaEscena;
    $('arContainer').replaceChildren(nuevaEscena);
    await esperarCarga(nuevaEscena);
    if (token !== sesion) return;
    escaneoActivo = true;
    await nuevaEscena.systems['mindar-image-system'].start();
    console.log('Batea: MindAR activo con', registro.size, 'marcadores');
  } catch (error) {
    console.error('Error al abrir el escáner:', error);
    actualizarEstado(error.message || 'No se pudo iniciar el escáner');
    escaneoActivo = false;
    if (escena) {
      try { await escena.systems?.['mindar-image-system']?.stop(); } catch (_) { }
      escena.remove(); escena = null;
    }
  } finally {
    iniciando = false;
  }
}

function seleccionarEquipo(entrada) {
  if (equipoActivo !== entrada) {

    // Detener y reiniciar la animación anterior.
    if (equipoActivo?.animacion) {
      const anterior = equipoActivo.animacion;

      anterior.reproduciendo = false;
      anterior.accion.paused = true;
      anterior.accion.reset();
    }

    // Ocultar todos los modelos anteriores.
    for (const otro of registro.values()) {
      otro.modelo.object3D.visible = false;
    }

    equipoActivo = entrada;

    // Reiniciar el estado del nuevo modelo.
    if (entrada.animacion) {
      entrada.animacion.reproduciendo = false;
      entrada.animacion.accion.paused = true;
      entrada.animacion.accion.reset();
    }

    mostrarInformacionEquipo(entrada.equipo);

    $('arControls').hidden = false;
  }

  entrada.modelo.object3D.visible = true;

  actualizarEstado(entrada.equipo.nombre);
  actualizarBotonAnimacion();

  if (!entrada.cargado && !entrada.cargando) {
    cargarModelo(entrada);
  }
}

function cargarModelo(entrada) {
  const url = entrada.equipo.modelo_url;
  if (!url) {
    console.warn('Equipo sin modelo:', entrada.equipo.nombre);
    actualizarEstado(`${entrada.equipo.nombre}: sin modelo 3D`);
    return;
  }
  entrada.cargando = true;
  if (equipoActivo === entrada) actualizarEstado(`Cargando jugador: ${entrada.equipo.nombre}`);
  entrada.modelo.addEventListener('model-loaded', (evento) => {
    entrada.cargando = false;
    entrada.cargado = true;
    const objeto = evento.detail.model;
    const clips = objeto?.animations || [];
    if (clips.length) {
      const mixer = new AFRAME.THREE.AnimationMixer(objeto);
      const accion = mixer.clipAction(clips[0]);
      accion.setLoop(AFRAME.THREE.LoopRepeat, Infinity);
      accion.play();
      accion.paused = true;
      accion.reset();
      accion.paused = true;
      entrada.animacion = { mixer, accion, reproduciendo: false };
      entrada.modelo.__animacion = entrada.animacion;
    }
    console.log('GLB cargado:', url, 'animaciones:', clips.length);
    if (equipoActivo === entrada) {
      actualizarEstado(entrada.equipo.nombre);
      actualizarBotonAnimacion();
    }
  }, { once: true });
  entrada.modelo.addEventListener('model-error', (e) => {
    entrada.cargando = false;
    console.error('Error GLB:', url, e.detail);
    if (equipoActivo === entrada) actualizarEstado('No se pudo cargar el jugador');
  }, { once: true });
  entrada.modelo.setAttribute('gltf-model', url);
}

function actualizarBotonAnimacion() {
  const anim = equipoActivo?.animacion;
  $('mov').disabled = !anim;
  $('mov').textContent = !anim ? (equipoActivo?.cargado ? 'Sin animación' : 'Cargando...')
    : anim.reproduciendo ? 'Pausar animación' : 'Animar';
  $('mov').classList.toggle('activo', Boolean(anim?.reproduciendo));
}

function alternarAnimacion() {
  if (!equipoActivo?.animacion) return;

  const anim = equipoActivo.animacion;

  if (anim.reproduciendo) {
    anim.reproduciendo = false;
    anim.accion.paused = true;
  } else {
    anim.reproduciendo = true;
    anim.accion.paused = false;
  }

  actualizarBotonAnimacion();
}


function mostrarInformacionEquipo(equipo) {
  $('ar-equipo-nombre').textContent =
    equipo.nombre || 'Equipo desconocido';

  $('ar-equipo-historia').textContent =
    equipo.historia || 'Historia no disponible.';

  $('ar-equipo-descripcion').textContent =
    equipo.descripcion || 'Sin descripción.';

  $('ar-equipo-ciudad').textContent =
    equipo.ciudad || 'No disponible.';

  const logo = $('ar-equipo-logo');

  logo.hidden = !equipo.logo_url;

  if (equipo.logo_url) {
    logo.src = equipo.logo_url;
    logo.alt = `Logo de ${equipo.nombre}`;
  } else {
    logo.removeAttribute('src');
  }

  // Actualizar también las estadísticas.
  mostrarEstadisticasEquipo(equipo);
}

function mostrarEstadisticasEquipo(equipo) {

  const asignar = (id, valor) => {
    $(id).textContent =
      valor === null || valor === undefined
        ? '—'
        : valor;
  };

  const tieneEstadisticas =
    equipo.temporada !== null &&
    equipo.temporada !== undefined;

  $('stat-mensaje').hidden = tieneEstadisticas;

  asignar('stat-temporada', equipo.temporada);
  asignar('stat-posicion', equipo.posicion);
  asignar('stat-juegos', equipo.juegos_jugados);
  asignar('stat-victorias', equipo.victorias);
  asignar('stat-derrotas', equipo.derrotas);

  const porcentaje = equipo.porcentaje_victorias;

  asignar(
    'stat-porcentaje',
    porcentaje == null
      ? null
      : Number(porcentaje).toFixed(3)
  );

  asignar(
    'stat-carreras-anotadas',
    equipo.carreras_anotadas
  );

  asignar(
    'stat-carreras-permitidas',
    equipo.carreras_permitidas
  );

  const anotadas = equipo.carreras_anotadas;
  const permitidas = equipo.carreras_permitidas;

  const diferencial =
    anotadas == null || permitidas == null
      ? null
      : Number(anotadas) - Number(permitidas);

  asignar(
    'stat-diferencial',
    diferencial == null
      ? null
      : diferencial > 0
        ? `+${diferencial}`
        : diferencial
  );
}

function lanzarConfeti() {
  if (!confeti) {
    if (typeof window.confetti !== 'function') return;
    confeti = window.confetti.create($('confettiCanvas'), { resize: true, useWorker: false });
  }
  confeti({
    particleCount: 150, spread: 90, origin: { y: .6 },
    colors: ['#0339A6', '#FFB300', '#CA2407', '#FFFFFF']
  });
}

function tomarFoto() {
  if (!escena?.renderer) return;
  const render = escena.renderer.domElement;
  const video = [...document.querySelectorAll('video')].find(v => v.readyState >= 2 && v.videoWidth);
  const ancho = render.width, alto = render.height;
  if (!ancho || !alto) return;
  const canvas = document.createElement('canvas');
  canvas.width = ancho; canvas.height = alto;
  const ctx = canvas.getContext('2d');
  if (video) {
    const factor = Math.max(ancho / video.videoWidth, alto / video.videoHeight);
    const w = video.videoWidth * factor, h = video.videoHeight * factor;
    ctx.drawImage(video, (ancho - w) / 2, (alto - h) / 2, w, h);
  }
  ctx.drawImage(render, 0, 0, ancho, alto);
  const conf = $('confettiCanvas');
  if (conf.width && conf.height) ctx.drawImage(conf, 0, 0, ancho, alto);
  try {
    const imagen = canvas.toDataURL('image/png');
    $('fotoPreview').src = imagen;
    $('fotoDescargar').href = imagen;
    $('fotoOverlay').classList.add('show');
  } catch (error) { console.error('No se pudo capturar:', error); }
}

function cerrarFoto() {
  $('fotoOverlay').classList.remove('show');
  $('fotoPreview').removeAttribute('src');
}

async function cerrarEscaner() {
  ++sesion;
  escaneoActivo = false;
  iniciando = false;
  $('extend').classList.remove('show', 'ar-view');
  $('extendfi').classList.remove('showfi');
  cerrarFoto();
  $('arControls').hidden = true;
  const anterior = escena;
  escena = null;
  equipoActivo = null;
  registro.clear();
  if (anterior) {
    try { await anterior.systems?.['mindar-image-system']?.stop(); }
    catch (error) { console.warn('Error al detener MindAR:', error); }
    anterior.remove();
  }
  $('arContainer').replaceChildren();
  confeti = null;
}

async function cargarUsuario() {
  const nombre = $('nombreUsuario');
  const foto = $('prof');
  const fotoDefault = '/media/imagenes/fedep.png';

  try {
    const respuesta = await fetch('/api/usuario/perfil', {
      method: 'GET',
      credentials: 'same-origin'
    });

    if (!respuesta.ok) {
      throw new Error(`HTTP ${respuesta.status}`);
    }

    const usuario = await respuesta.json();

    nombre.textContent = usuario.nombre || 'Usuario';

    foto.onerror = () => {
      foto.onerror = null;
      foto.src = fotoDefault;
    };

    foto.src = usuario.foto_perfil_url || fotoDefault;
    foto.alt = `Foto de perfil de ${usuario.nombre || 'usuario'}`;

  } catch (error) {
    console.error('Error al cargar el usuario:', error);

    nombre.textContent = 'Usuario';
    foto.src = fotoDefault;
  }
}


