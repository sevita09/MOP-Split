/**
 * Quién participa de cada lista y cómo se agrupan a la hora de deber.
 *
 * `Lista_Personas` es una tabla puente que resuelve las dos cosas a la vez. La
 * columna `Unidad` es el propio código de la persona cuando va sola, o un
 * código compartido cuando dos o más comparten la plata.
 *
 * Esa distinción es el corazón del cálculo: **la división es por cabeza pero el
 * balance es por unidad**. En una lista de 4 personas donde dos de ellas son una
 * unidad, cada gasto se divide en 4 partes, pero esa unidad debe 2 de esas 4.
 *
 * Por eso el agrupamiento vive por lista y no en la hoja `Personas`: los mismos
 * dos pueden ir juntos en una lista y separados en otra.
 */

const HOJA_LISTA_PERSONAS = 'Lista_Personas';
const COLUMNAS_LISTA_PERSONAS = ['ID_Lista', 'Codigo_Persona', 'Unidad'];

function leerListaPersonas() {
  const filas = obtenerHoja(HOJA_LISTA_PERSONAS, COLUMNAS_LISTA_PERSONAS)
    .getDataRange()
    .getValues();
  filas.shift();

  return filas
    .filter(function (fila) {
      return String(fila[0]).trim() !== '';
    })
    .map(function (fila) {
      return {
        idLista: String(fila[0]).trim(),
        codigoPersona: String(fila[1]).trim(),
        unidad: String(fila[2]).trim(),
      };
    });
}

/**
 * Reparte a cada participante su unidad de balance.
 *
 * Quien va solo tiene por unidad su propio código. Quien está agrupado comparte
 * una unidad con los suyos, armada concatenando los códigos (`U-P01-P02`): así,
 * mirando la planilla a ojo, se ve quiénes cuentan como uno sin tener que
 * cruzar con ninguna otra hoja.
 */
function repartirUnidades(participantes, grupos) {
  const unidadPorPersona = {};

  participantes.forEach(function (codigo) {
    unidadPorPersona[codigo] = codigo;
  });

  grupos.forEach(function (grupo) {
    const ordenado = grupo.slice().sort();
    const unidad = 'U-' + ordenado.join('-');
    ordenado.forEach(function (codigo) {
      unidadPorPersona[codigo] = unidad;
    });
  });

  return unidadPorPersona;
}

