/**
 * Personas: quiénes pueden usar la app.
 *
 * `Codigo` es un identificador estable que nunca cambia — es a lo que apuntan
 * los gastos y las listas. El `PIN` es aparte justamente para poder cambiarlo
 * sin romper esas referencias.
 *
 * El PIN nunca sale de la planilla: `OBTENER_PERSONAS` devuelve nombres y
 * códigos, y la validación se hace acá adentro con `LOGIN`.
 */

const HOJA_PERSONAS = 'Personas';
const COLUMNAS_PERSONAS = ['Codigo', 'Nombre', 'PIN', 'Admin'];

/** Un PIN de 6 dígitos, como se decidió al diseñar el ingreso. */
const LARGO_PIN = 6;

function obtenerHojaPersonas() {
  const hoja = obtenerHoja(HOJA_PERSONAS, COLUMNAS_PERSONAS);

  // El PIN puede empezar con cero. Si la columna queda como número, Sheets se
  // come ese cero y el ingreso falla sin que se entienda por qué.
  hoja.getRange('C:C').setNumberFormat('@');
  // Y el nombre podría tomarse por una fecha, igual que en Listas.
  hoja.getRange('B2:B').setNumberFormat('@');

  return hoja;
}

function leerPersonas() {
  const filas = obtenerHojaPersonas().getDataRange().getValues();
  filas.shift();

  return filas
    .filter(function (fila) {
      return String(fila[0]).trim() !== '';
    })
    .map(function (fila) {
      return {
        codigo: String(fila[0]).trim(),
        nombre: String(fila[1]).trim(),
        pin: String(fila[2]).trim(),
        admin: String(fila[3]).trim().toUpperCase() === 'SI',
      };
    });
}

/** Códigos correlativos P01, P02… Se busca el primero libre por si se borró una fila. */
function generarCodigoPersona(existentes) {
  const usados = existentes.map(function (persona) {
    return persona.codigo;
  });

  let numero = 1;
  while (usados.indexOf('P' + String(numero).padStart(2, '0')) !== -1) {
    numero++;
  }

  return 'P' + String(numero).padStart(2, '0');
}

/**
 * Crea la primera persona, que queda como Admin.
 *
 * Solo funciona con la hoja vacía, y por eso no pide autenticación: si pidiera
 * PIN no habría forma de arrancar, porque todavía no existe nadie con PIN.
 * Apenas hay una persona cargada, esta puerta se cierra sola y las siguientes
 * se agregan a mano en la planilla.
 */
function ejecutarCrearPrimeraPersona(datos) {
  const existentes = leerPersonas();

  if (existentes.length > 0) {
    return responder({
      estado: 'error',
      mensaje: 'La planilla ya tiene personas cargadas. Agregá las demás a mano.',
    });
  }

  const nombre = String(datos.nombre || '').trim();
  const pin = String(datos.pin || '').trim();

  if (nombre === '') {
    return responder({ estado: 'error', mensaje: 'Falta el nombre.' });
  }

  if (!new RegExp('^\\d{' + LARGO_PIN + '}$').test(pin)) {
    return responder({
      estado: 'error',
      mensaje: 'El PIN tiene que ser de ' + LARGO_PIN + ' dígitos.',
    });
  }

  const codigo = generarCodigoPersona(existentes);
  obtenerHojaPersonas().appendRow([codigo, nombre, pin, 'SI']);

  return responder({
    estado: 'ok',
    mensaje: 'Listo, ' + nombre + '. Quedaste como administrador.',
    datos: {
      persona: { codigo: codigo, nombre: nombre, admin: true },
      sesion: crearSesion(codigo),
    },
  });
}

/**
 * Valida el PIN de una persona.
 *
 * El mensaje de error es el mismo para "no existe ese código" y "el PIN no
 * coincide": si fueran distintos, probando códigos se podría averiguar quién
 * está cargado en la planilla.
 */
function ejecutarLogin(datos) {
  const codigo = String(datos.codigo || '').trim();
  const pin = String(datos.pin || '').trim();

  const persona = leerPersonas().filter(function (candidata) {
    return candidata.codigo === codigo;
  })[0];

  if (!persona || persona.pin !== pin) {
    return responder({ estado: 'error', mensaje: 'El PIN no coincide.' });
  }

  return responder({
    estado: 'ok',
    mensaje: 'Hola, ' + persona.nombre + '.',
    datos: {
      persona: { codigo: persona.codigo, nombre: persona.nombre, admin: persona.admin },
      sesion: crearSesion(persona.codigo),
    },
  });
}

function ejecutarObtenerPersonas() {
  const personas = leerPersonas().map(function (persona) {
    return { codigo: persona.codigo, nombre: persona.nombre, admin: persona.admin };
  });

  return responder({
    estado: 'ok',
    mensaje: personas.length + ' persona(s) en la planilla.',
    datos: { personas: personas },
  });
}
