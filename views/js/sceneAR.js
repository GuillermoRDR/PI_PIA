document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const targetIndex = urlParams.get('target') || '0';

  const catalogoModelos = {
    '0': { nombre: 'Jugador', path: 'models/jugador.glb', scale: '2.0 2.0 2.0', rotation: '0 0 0' },
    '1': { nombre: 'Bate', path: 'models/bate.glb', scale: '0.5 0.5 0.5', rotation: '0 0 0' },
    '2': { nombre: 'Gorra', path: 'models/gorra.glb', scale: '0.3 0.3 0.3', rotation: '0 0 0' }
  };
  const infoModelo = catalogoModelos[targetIndex] || catalogoModelos['0'];
  const arTarget = document.getElementById('ar-target');
  const entidadModelo = document.getElementById('modelo-3d');

  const botonGirar = document.getElementById('mov');

  let estaRotando = false;

  if (arTarget && entidadModelo) {
    arTarget.setAttribute('mindar-image-target', `targetIndex: ${targetIndex}`);

    entidadModelo.setAttribute('gltf-model', infoModelo.path);
    entidadModelo.setAttribute('scale', infoModelo.scale);
    entidadModelo.setAttribute('rotation', infoModelo.rotation);

    console.log(`Cargando experiencia AR para: ${infoModelo.nombre} (Target Index: ${targetIndex})`);

    arTarget.addEventListener('targetFound', () => {
      console.log(`¡Target ${targetIndex} visible en cámara!`);
    });

    arTarget.addEventListener('targetLost', () => {
      console.log(`Target ${targetIndex} fuera de foco.`);
    });
  }

  if (botonGirar && entidadModelo) {
    botonGirar.addEventListener('click', () => {
      estaRotando = !estaRotando;

      if (estaRotando) {
        botonGirar.style.background = '#889FDC';
        entidadModelo.components.animation.animation.play();
      } else {
        entidadModelo.setAttribute('rotation', infoModelo.rotation);
        botonGirar.style.background = '';
        entidadModelo.components.animation.animation.pause();
      }
    });
  }
});