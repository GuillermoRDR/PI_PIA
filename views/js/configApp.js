document.addEventListener("DOMContentLoaded", () => {
  const btnCS = document.getElementById('btnCS');

  cerrarSesion(btnCS);
});

function cerrarSesion(btnCS) {
  if (btnCS) {
    btnCS.addEventListener("click", async () => {
      try {
        const respuesta = await fetch('/api/usuario/cerrarSesion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const datos = await respuesta.json();

        if (respuesta.status === 200) {
          Swal.fire({
            icon: 'success',
            title: 'Cierre de Sesión',
            showConfirmButton: false,
            timer: 1000,
            timerProgressBar: true,
            text: datos.mensaje || 'Sesión cerrada correctamente'
          }).then(() => {
            window.location.href = '/inicioSesion';
          })
        } else if (respuesta.status === 401) {
          Swal.fire({
            icon: 'warning',
            title: 'Operación no autorizada',
            text: datos.error || 'Por favor inicia sesión para realizar esta operación'
          }).then(() => {
            window.location.href = '/inicioSesion';
          })
        } else{
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: datos.error || 'Ocurrió un error inesperado.'
          });
        }    
      } catch (errorRed) {
        Swal.fire({
          icon: 'error',
          title: 'Sin conexión',
          text: errorRed || 'No se pudo conectar con el servidor.'
        });
      }
    });
  }
}