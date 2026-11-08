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
      const boton = form.querySelector('[type="submit"]');

      if (boton) boton.disabled = true;

      try {
        const datos = await Alertas.peticion(
          '/api/usuario/registro',
          {
            method: 'POST',
            body: formData
          }
        );

        await Swal.fire({
          icon: 'success',
          title: '¡Registro exitoso!',
          text: datos.mensaje || 'Tu cuenta fue creada correctamente.',
          timer: 2000,
          showConfirmButton: false
        });

        window.location.href = '/inicioSesion';

      } catch (error) {
        await Alertas.error(error);
      } finally {
        if (boton) boton.disabled = false;
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