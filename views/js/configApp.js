document.addEventListener("DOMContentLoaded", () => {
  const btnCS = document.getElementById('btnCS');

  cerrarSesion(btnCS);
});

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
