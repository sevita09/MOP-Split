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
