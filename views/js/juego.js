const $ = id => document.getElementById(id);

const pantallas = ['introduccion', 'juego', 'resultado'];

function mostrarPantalla(nombre) {
  for (const id of pantallas) {
    $(id).hidden = id !== nombre;
  }
}

const MAX_STRIKES = 3;
const PENALIZACION_STRIKE = 50;
const AUMENTO_VELOCIDAD = 0.25;
const VELOCIDAD_MAXIMA = 10;
const META_PUNTOS = 1000;
const HITOS = [100, 500, 1000];
const POSICIONES_BARRA = [[0, 0], [100, 0.18], [500, 0.58], [1000, 1]];
const PUNTOS_SINGLE = 1;
const PUNTOS_DOBLE = 2;
const PUNTOS_TRIPLE = 3;
const BONO_HOME_RUN = 0.005;
const RESTA_STRIKE = 20;
const DIVISOR_RECOMPENSA = 10;

function calcularResultado() {
  const golpesNormales =
    singles * PUNTOS_SINGLE +
    dobles * PUNTOS_DOBLE +
    triples * PUNTOS_TRIPLE;
  const multiplicador = Math.pow(1 + BONO_HOME_RUN, homeRuns);
  const puntuacionFinal = Math.max(
    0,
    Math.round((puntos + golpesNormales) * multiplicador - strikes * RESTA_STRIKE)
  );
  const puntosRecompensa = Math.max(
    0,
    Math.round((puntos / DIVISOR_RECOMPENSA + golpesNormales) * multiplicador - strikes * RESTA_STRIKE)
  );
  return { puntuacionFinal, puntosRecompensa };
}

function mostrarResultado({ puntuacionFinal, puntosRecompensa }) {
  $('resultado-puntaje').textContent = `Puntaje del juego: ${puntuacionFinal}`;
  $('resultado-recompensa').textContent = `Puntaje de recompensas: ${puntosRecompensa}`;
}

let strikes = 0;
let lanzamientos = 0;
let vueltas = 0;
let multiplicador = 1;
let posicion = 0;
let direccion = 1;
let ultimoTiempo = 0;
let estado = 'inactivo';
let frame = 0;
let puntos = 0;
let golpes = 0;
let homeRuns = 0;
let singles = 0;
let dobles = 0;
let triples = 0;
let ultimaZona = null;
let partidaPendiente = null;


let pistaActual = null;

const MUSICA = {
  intro: new Audio('media/music/intro.mp3'),
  juego: new Audio('media/music/juego.mp3'),
  victoria: new Audio('media/music/victoria.mp3'),
  derrota: new Audio('media/music/derrota.mp3')
};

const EFECTOS = {
  nivel: new Audio('media/music/nivel.wav'),
  golpe: new Audio('media/music/golpe.wav'),
  homerun: new Audio('media/music/homerun.wav'),
  strike: new Audio('media/music/strike.wav'),
  boton: new Audio('media/music/boton.wav')
};

MUSICA.intro.loop = true;
MUSICA.juego.loop = true;

for (const pista of Object.values(MUSICA)) {
  pista.volume = 0.4;
}

for (const efecto of Object.values(EFECTOS)) {
  efecto.volume = 0.8;
}

EFECTOS.nivel.volume = 0.3;

function cambiarMusica(nombre) {
  if (pistaActual) {
    MUSICA[pistaActual].pause();
    MUSICA[pistaActual].currentTime = 0;
  }

  pistaActual = nombre;

  if (BateaAudio.musicaActiva()) {
    MUSICA[nombre].play().catch(() => {});
  }
}

function reproducirEfecto(nombre) {
  if (!BateaAudio.efectosActivos()) return;

  const efecto = EFECTOS[nombre];
  efecto.currentTime = 0;
  efecto.play().catch(() => {});
}

function reanudarMusica() {
  document.removeEventListener('pointerdown', reanudarMusica);
  document.removeEventListener('keydown', reanudarMusica);
  document.removeEventListener('click', reanudarMusica);
  document.removeEventListener('touchend', reanudarMusica);

  if (pistaActual === 'intro' && BateaAudio.musicaActiva()) {
    MUSICA.intro.play().catch(() => {});
  }
}

document.addEventListener('pointerdown', reanudarMusica);
document.addEventListener('keydown', reanudarMusica);
document.addEventListener('click', reanudarMusica);
document.addEventListener('touchend', reanudarMusica);

cambiarMusica('intro');

const ZONAS = [
  { hasta: 0.35, nombre: 'Strike',   rango: '0 puntos',   velocidad: 0.55, color: 'rojo' },
  { hasta: 0.64, nombre: 'Single',   rango: '35 puntos',  velocidad: 0.8,  color: 'naranja' },
  { hasta: 0.82, nombre: 'Double',   rango: '64 puntos',  velocidad: 1.0,  color: 'amarillo' },
  { hasta: 0.92, nombre: 'Triple',   rango: '82 puntos',  velocidad: 1.3,  color: 'verde' },
  { hasta: 1.01, nombre: 'Home Run', rango: '100 puntos', velocidad: 1.5,  color: 'azul' }
];

function zonaActual(p) {
  return ZONAS.find(z => p < z.hasta);
}

function lanzar() {
  estado = 'corriendo';
  posicion = 0;
  direccion = 1;
  vueltas = 0;
  ultimaZona = zonaActual(0);
  multiplicador = Math.min(VELOCIDAD_MAXIMA, 1 + lanzamientos * AUMENTO_VELOCIDAD);
  ultimoTiempo = performance.now();
  frame = requestAnimationFrame(avanzar);
}

function avanzar(ahora) {
  if (estado !== 'corriendo') return;

  const dt = Math.max(0, Math.min(ahora - ultimoTiempo, 50)) / 1000;
  ultimoTiempo = ahora;

  posicion += direccion * zonaActual(posicion).velocidad * multiplicador * dt;

  if (posicion >= 1) {
    posicion = 1;
    if (vueltas >= 1) {
      $('bate').style.setProperty('--p', 1);
      registrarStrike('Strike!!!');
      return;
    }
    direccion = -1;
  } else if (direccion === -1 && posicion <= 0) {
    posicion = 0;
    direccion = 1;
    vueltas++;
  }

  $('bate').style.setProperty('--p', posicion);

  const zona = zonaActual(posicion);

  if (zona !== ultimaZona) {
    reproducirEfecto('nivel');
    ultimaZona = zona;
  }

  $('zona').textContent =
    `${zona.nombre} · ${zona.rango} · speed x${multiplicador.toFixed(1)}` +
    (strikes === MAX_STRIKES - 1 ? ' · FINAL PITCH!' : '');

  frame = requestAnimationFrame(avanzar);
}

function mostrarMensaje(texto) {
  const mensaje = $('mensaje');
  mensaje.textContent = texto;
  mensaje.classList.add('visible');
  setTimeout(() => mensaje.classList.remove('visible'), 800);
}

function batear() {
  if (estado !== 'corriendo') return;

  cancelAnimationFrame(frame);
  estado = 'espera';

  if (posicion < 0.35) {
    registrarStrike('Strike!!!');
    return;
  }

  const esHomeRun = posicion >= 0.92;
  const obtenidos = esHomeRun ? 100 : Math.max(5, Math.round(posicion * 100));

  reproducirEfecto(esHomeRun ? 'homerun' : 'golpe');

  lanzamientos++;
  golpes++;
  if (esHomeRun) homeRuns++;
  else if (posicion >= 0.82) triples++;
  else if (posicion >= 0.64) dobles++;
  else singles++;
  puntos = Math.min(META_PUNTOS, puntos + obtenidos);

  const nombre =
    posicion >= 0.92 ? 'Home Run!!!' :
    posicion >= 0.82 ? 'Triple!!!' :
    posicion >= 0.64 ? 'Double!!!' : 'Single!!!';

  mostrarMensaje(`${nombre} +${obtenidos}`);
  actualizarMarcador();

  if (puntos >= META_PUNTOS) {
    setTimeout(() => terminar(true), 1200);
    return;
  }

  setTimeout(lanzar, 1000);
}

function registrarStrike(texto) {
  estado = 'espera';
  strikes++;
  lanzamientos++;

  reproducirEfecto('strike');

  const perdidos = Math.min(puntos, PENALIZACION_STRIKE);
  puntos -= perdidos;

  mostrarMensaje(perdidos ? `${texto} -${perdidos}` : texto);
  actualizarMarcador();

  if (strikes >= MAX_STRIKES) {
    setTimeout(() => terminar(false), 1100);
  } else {
    setTimeout(lanzar, 1000);
  }
}

function posicionBarra(valor) {
  const t = Math.min(valor, META_PUNTOS);
  for (let i = 1; i < POSICIONES_BARRA.length; i++) {
    const [p1, y1] = POSICIONES_BARRA[i - 1];
    const [p2, y2] = POSICIONES_BARRA[i];
    if (t <= p2) {
      return y1 + ((t - p1) / (p2 - p1)) * (y2 - y1);
    }
  }
  return 1;
}

function dibujarMarcas() {
  document.querySelectorAll('.marca').forEach(m => m.remove());
  for (const hito of HITOS) {
    const marca = document.createElement('span');
    marca.className = 'marca';
    marca.textContent = hito;
    marca.style.bottom = `${posicionBarra(hito) * 100}%`;
    $('barra').appendChild(marca);
  }
}

function actualizarMarcador() {
  $('puntos').textContent = `${puntos} pts`;
  $('barra-relleno').style.height = `${posicionBarra(puntos) * 100}%`;
  document.querySelectorAll('.strike').forEach((el, i) => {
    el.classList.toggle('activo', i < strikes);
  });
}

function terminar(victoria) {
  estado = 'terminado';

  cambiarMusica(victoria ? 'victoria' : 'derrota');

  $('resultado-titulo').textContent =
    victoria ? 'Ganaste!!!' : 'Out!!! Estás fuera.';
  $('resultado-estadisticas').textContent =
    `Singles: ${singles} · Doubles: ${dobles} · Triples: ${triples} · Home Runs: ${homeRuns} · Strikes: ${strikes}`;
  mostrarResultado(calcularResultado());

  mostrarPantalla('resultado');
  guardarPartida();
}

function comenzarJuego() {
  puntos = 0;
  strikes = 0;
  golpes = 0;
  homeRuns = 0;
  singles = 0;
  dobles = 0;
  triples = 0;
  lanzamientos = 0;
  iniciarPartidaServidor();

  reproducirEfecto('boton');
  cambiarMusica('juego');

  mostrarPantalla('juego');
  dibujarMarcas();
  actualizarMarcador();
  lanzar();
}

$('comenzar').addEventListener('click', comenzarJuego);
$('otra').addEventListener('click', comenzarJuego);

$('escenario').addEventListener('pointerdown', batear);

document.addEventListener('keydown', evento => {
  if (evento.code === 'Space' && estado === 'corriendo') {
    evento.preventDefault();
    batear();
  }
});

async function enviar(url, cuerpo) {
  const respuesta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo || {})
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error || 'Error de servidor');
  return datos;
}

function iniciarPartidaServidor() {
  partidaPendiente = enviar('/api/juego/iniciar')
    .then(d => d.partida_id)
    .catch(() => null);
}

async function guardarPartida() {
  const resumen = { puntuacion: puntos, singles, dobles, triples, homeRuns, strikes };
  const aviso = $('resultado-guardado');
  aviso.textContent = 'Guardando partida...';

  const partidaId = await partidaPendiente;
  if (!partidaId) {
    aviso.textContent = 'Inicia sesión para guardar tus puntos.';
    return;
  }

  try {
    const r = await enviar('/api/juego/finalizar', { partida_id: partidaId, ...resumen });
    mostrarResultado({ puntuacionFinal: r.puntuacion, puntosRecompensa: r.puntos_obtenidos });
    aviso.textContent = 'Partida guardada.';
  } catch {
    aviso.textContent = 'No se pudo guardar la partida.';
  }
}