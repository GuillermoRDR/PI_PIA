
(function () {
  'use strict';

  function mostrar(icon, title, text) {
    if (typeof Swal === 'undefined') {
      console.error(`${title}: ${text}`);
      return Promise.resolve();
    }

    return Swal.fire({
      icon,
      title,
      text,
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#1e2e86'
    });
  }

  async function error(error, mensajeAlternativo = 'Ocurrió un error inesperado.') {
    const status = error?.status || 0;
    const mensaje = error?.message || mensajeAlternativo;

    if (status === 401) {
      await mostrar(
        'warning',
        'Sesión expirada',
        'Debes iniciar sesión para continuar.'
      );

      window.location.href = '/inicioSesion';
      return;
    }

    if (status === 403) {
      return mostrar('warning', 'Acceso denegado', mensaje);
    }

    if (status === 404) {
      return mostrar('warning', 'No encontrado', mensaje);
    }

    if (status === 400 || status === 409 || status === 422) {
      return mostrar('warning', 'Atención', mensaje);
    }

    if (status === 429) {
      return mostrar(
        'warning',
        'Demasiadas solicitudes',
        'Espera un momento antes de volver a intentarlo.'
      );
    }

    if (status >= 500) {
      return mostrar(
        'error',
        'Error del servidor',
        'No pudimos completar la operación. Inténtalo más tarde.'
      );
    }

    if (error instanceof TypeError) {
      return mostrar(
        'error',
        'Error de conexión',
        'No se pudo establecer comunicación con el servidor.'
      );
    }

    return mostrar('error', 'Ocurrió un problema', mensaje);
  }

  async function peticion(url, opciones = {}) {
    const respuesta = await fetch(url, {
      credentials: 'same-origin',
      ...opciones
    });

    const tipo = respuesta.headers.get('content-type') || '';
    let datos = {};

    if (tipo.includes('application/json')) {
      datos = await respuesta.json();
    }

    if (!respuesta.ok) {
      const fallo = new Error(
        datos.error || `La solicitud falló (HTTP ${respuesta.status}).`
      );

      fallo.status = respuesta.status;
      throw fallo;
    }

    if (!tipo.includes('application/json')) {
      throw new Error('El servidor devolvió una respuesta inesperada.');
    }

    return datos;
  }

  window.Alertas = { mostrar, error, peticion };
})();
