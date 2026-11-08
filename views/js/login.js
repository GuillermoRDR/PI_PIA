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


      const boton = form.querySelector('[type="submit"]');

      if (boton) boton.disabled = true;

      try {
        const datos = await Alertas.peticion(
          '/api/usuario/inicioSesion',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ correo, contra })
          }
        );

        await Swal.fire({
          icon: 'success',
          title: '¡Bienvenido a Batea!',
          text: datos.mensaje || 'Inicio de sesión exitoso.',
          timer: 1500,
          showConfirmButton: false
        });

        window.location.href = '/principal';

      } catch (error) {
        if (error.status === 401) {
          await Alertas.mostrar(
            'warning',
            'Credenciales incorrectas',
            'Verifica tu correo electrónico y contraseña.'
          );
        } else {
          await Alertas.error(error);
        }
      } finally {
        if (boton) boton.disabled = false;
      }

    });
  }
}); 