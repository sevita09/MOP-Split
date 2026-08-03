/**
 * Sesiones: qué celulares están habilitados y como quién.
 *
 * Resuelve un problema puntual: hasta acá, cada pedido **declaraba** de quién
 * venía, y la planilla le creía. Cualquiera con el código familiar podía armar
 * un pedido a mano poniendo el código de otro. Da igual mientras todo sea
 * lectura, pero deja de dar igual apenas haya permisos de verdad (editar un
 * gasto ajeno, cerrar una lista que no es tuya).
 *
 * Con esto el celular ya no dice quién es: presenta un token que **solo la
 * planilla pudo haber emitido**, y de ahí sale la identidad. El PIN se valida
 * una sola vez, al crear la sesión.
 *
 * Las sesiones **no vencen**, a propósito: que la app le pida el PIN cada tanto
 * a gente grande es una molestia sin contrapartida real. Se revocan borrando la
 * fila, que además permite sacar un celular perdido sin cambiarle el PIN a
 * nadie más.
 */

const HOJA_SESIONES = 'Sesiones';
const COLUMNAS_SESIONES = ['Token', 'Codigo_Persona', 'Creada'];

/** `getUuid` usa el generador de Google, no `Math.random`, que es predecible. */
function crearSesion(codigoPersona) {
  const token = Utilities.getUuid();
  obtenerHoja(HOJA_SESIONES, COLUMNAS_SESIONES).appendRow([
    token,
    codigoPersona,
    new Date(),
  ]);
  return token;
}

/** La persona detrás del token, o `null` si el token no existe. */
function personaDeLaSesion(datos) {
  const token = String(datos.sesion || '').trim();
  if (token === '') return null;

  const filas = obtenerHoja(HOJA_SESIONES, COLUMNAS_SESIONES).getDataRange().getValues();
  filas.shift();

  const fila = filas.filter(function (candidata) {
    return String(candidata[0]).trim() === token;
  })[0];

  if (!fila) return null;

  const codigo = String(fila[1]).trim();

  // Se relee de `Personas` en vez de confiar en lo guardado: si al usuario le
  // sacaron el admin o lo borraron, tiene que valer desde el próximo pedido.
  return (
    leerPersonas().filter(function (persona) {
      return persona.codigo === codigo;
    })[0] || null
  );
}

/**
 * Corre una acción solo si hay sesión válida.
 *
 * El código `SIN_SESION` lo mira la app para volver al ingreso sola, en vez de
 * mostrar un error que el usuario no sabría cómo resolver.
 */
function exigirSesion(persona, accion) {
  if (!persona) {
    return responder({
      estado: 'error',
      codigo: 'SIN_SESION',
      mensaje: 'La sesión ya no vale. Volvé a poner tu PIN.',
    });
  }
  return accion(persona);
}

function ejecutarCerrarSesion(datos) {
  const token = String(datos.sesion || '').trim();
  if (token === '') {
    return responder({ estado: 'ok', mensaje: 'No había sesión que cerrar.' });
  }

  const hoja = obtenerHoja(HOJA_SESIONES, COLUMNAS_SESIONES);
  const filas = hoja.getDataRange().getValues();

  // Se recorre de abajo hacia arriba: borrar una fila corre las de abajo, y
  // yendo al revés se saltearían filas.
  for (let indice = filas.length - 1; indice >= 1; indice--) {
    if (String(filas[indice][0]).trim() === token) {
      hoja.deleteRow(indice + 1);
    }
  }

  return responder({ estado: 'ok', mensaje: 'Sesión cerrada.' });
}
