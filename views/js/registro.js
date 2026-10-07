document.addEventListener("DOMContentLoaded", () => {
  const fotoPrevis = document.getElementById("fotoPrevis");
  const fotoSelecciona = document.getElementById("fotoSelecciona");
  const fotoIngresa = document.getElementById("fotoIngresa");

  previsImagen(fotoPrevis, fotoSelecciona, fotoIngresa);

  const form = document.getElementById('form');

  if (form) {
    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      const nombre = document.getElementById('nombre').value.trim();
      const correo = document.getElementById('correo').value.trim();
      const contra = document.getElementById('contra').value;
      const verificarContra = document.getElementById('verificarContra').value; 

      const esValido = validarDatos(nombre, correo, contra, verificarContra, fotoIngresa);
      if (!esValido) return;

      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('email', correo);
      formData.append('contra', contra);
      formData.append('verificarContra', verificarContra);
      if (fotoIngresa.files[0]) {
        formData.append('fotoPerfil', fotoIngresa.files[0]);
      }

      try {
        const respuesta = await fetch('/api/usuario/registro', {
          method: 'POST',
          body: formData
        });

        const datos = await respuesta.json();

        if (respuesta.status === 201) {
          Swal.fire({
            icon: 'success',
            title: '¡Registro exitoso!',
            text: 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            window.location.href = '/inicioSesion';
          });

        } else if (respuesta.status === 400) {
          Swal.fire({
            icon: 'warning',
            title: 'Atención',
            text: datos.error || 'Por favor verifica los datos ingresados.'
          });

        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error de Servidor',
            text: 'Ocurrió un problema en el servidor. Inténtalo más tarde.'
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

function validarDatos(nombre, correo, contra, verificarContra, fotoIngresa) {
  const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const contraRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  if (nombre.length < 3 || nombre.length > 100) {
    Swal.fire('Nombre inválido', 'El nombre debe tener entre 3 y 100 caracteres.', 'warning');
    return false;
  }

  if (!correoRegex.test(correo) || correo.length > 150) {
    Swal.fire('Correo inválido', 'Ingresa un formato de correo válido (máximo 150 caracteres).', 'warning');
    return false;
  }

  if (!contraRegex.test(contra)) {
    Swal.fire('Contraseña débil', 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.', 'warning');
    return false;
  }

  if (contra !== verificarContra) {
    Swal.fire('Error', 'Las contraseñas no coinciden.', 'warning');
    return false;
  }

  if (fotoIngresa && fotoIngresa.files.length > 0) {
    const foto = fotoIngresa.files[0];
    const tamanoMaximoMB = 2;
    const tiposPermitidos = ['image/png', 'image/jpeg', 'image/webp'];

    if (!tiposPermitidos.includes(foto.type)) {
      Swal.fire('Imagen no permitida', 'Formato no válido. Usa PNG, JPEG o WEBP.', 'warning');
      return false;
    }

    if (foto.size > tamanoMaximoMB * 1024 * 1024) {
      Swal.fire('Imagen muy pesada', `La imagen no debe superar los ${tamanoMaximoMB} MB.`, 'warning');
      return false;
    }
  }

  return true;
}

function previsImagen(fotoPrevis, fotoSelecciona, fotoIngresa) {
  if (fotoPrevis && fotoIngresa && fotoSelecciona) {
    fotoPrevis.addEventListener("click", () => fotoIngresa.click());
    fotoSelecciona.addEventListener("click", () => fotoIngresa.click());

    fotoIngresa.addEventListener("change", (e) => {
      const archivo = e.target.files[0];
      if (archivo) {
        const lector = new FileReader();
        lector.onload = (event) => {
          fotoPrevis.src = event.target.result;
        };
        lector.readAsDataURL(archivo);
      }
    });
  }
}