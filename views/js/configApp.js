document.addEventListener("DOMContentLoaded", () => {
  const btnCS = document.getElementById('btnCS');
  const musicToggle = document.getElementById('musicToggle');
  const sfxToggle = document.getElementById('sfxToggle');

  cerrarSesion(btnCS);
  iniciarAudio(musicToggle, sfxToggle);
});

function iniciarAudio(musicToggle, sfxToggle) {
  if (!window.BateaAudio) return;

  if (musicToggle) {
    musicToggle.checked = BateaAudio.musicaActiva();

    musicToggle.addEventListener('change', () => {
      BateaAudio.setMusica(musicToggle.checked);
    });
  }

  if (sfxToggle) {
    sfxToggle.checked = BateaAudio.efectosActivos();

    sfxToggle.addEventListener('change', () => {
      BateaAudio.setEfectos(sfxToggle.checked);

      if (sfxToggle.checked) {
        BateaAudio.reproducirEfecto('/media/music/golpe.wav');
      }
    });
  }
}

function cerrarSesion(btnCS) {
  if (!btnCS) return;

  btnCS.addEventListener('click', async () => {
    btnCS.disabled = true;

    try {
      const datos = await Alertas.peticion(
        '/api/usuario/cerrarSesion',
        { method: 'POST' }
      );

      await Swal.fire({
        icon: 'success',
        title: 'Sesión cerrada',
        text: datos.mensaje || 'Hasta pronto.',
        timer: 1200,
        showConfirmButton: false
      });

      window.location.href = '/inicioSesion';

    } catch (error) {
      await Alertas.error(error);
    } finally {
      btnCS.disabled = false;
    }
  });
}
