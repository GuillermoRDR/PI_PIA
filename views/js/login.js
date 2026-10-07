document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('formIS');
  const Toast = Swal.mixin({
    toast: 'true',
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true
  })

  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      const correo = document.getElementById('correo').value.trim();
      const contra = document.getElementById('contra').value;

      if (!correo || !contra) {
        Toast.fire({ icon: 'warning', title: 'Por favor ingresa correo y contraseña.' });
        return;
      }

      try {
        const respuesta = await fetch('/api/usuario/inicioSesion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo, contra })
        });
        const datos = await respuesta.json();

        if (respuesta.status === 200) {
          Toast.fire({
            icon: 'success',
            title: '¡Inicio de sesion exitoso!',
          }).then(() => {
            window.location.href = '/principal';
          });
        } else if (respuesta.status === 401) {
          Swal.fire({
            icon: 'warning',
            title: 'Credenciales invalidas',
            text: datos.error || 'Correo o contraseña incorrectos.'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error de Servidor',
            text: datos.error || 'Ocurrio un problema en el servidor. Inténtalo más tarde.'
          });
        }
      } catch (errorRed) {
        Swal.fire({
          icon: 'error',
          title: 'Sin conexión',
          text: 'No se pudo conectar con el servidor.'
        });
      }
    });
  }
}); 