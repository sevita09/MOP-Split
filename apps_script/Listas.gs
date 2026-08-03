/**
 * Listas de gastos y quién participa en cada una.
 *
 * `Lista_Personas` es una tabla puente y resuelve dos cosas a la vez: quién
 * participa de la lista, y cómo se agrupan a la hora de deber. La columna
 * `Unidad` es el propio código de la persona cuando va sola, o un código
 * compartido cuando dos o más comparten la plata (Mamá y Papá).
 *
 * Esa distinción es el corazón del cálculo: **la división es por cabeza pero el
 * balance es por unidad**. En una lista de 4 personas donde Mamá y Papá son una
 * unidad, cada gasto se divide en 4 partes, pero esa unidad debe 2 de esas 4.
 * Por eso el agrupamiento vive por lista y no en la hoja `Personas`: los mismos
 * dos pueden ir juntos en una lista y separados en otra.
 */

const HOJA_LISTAS = 'Listas';
const COLUMNAS_LISTAS = ['ID_Lista', 'Nombre', 'Mes', 'Año', 'Estado', 'Dueño'];

const HOJA_LISTA_PERSONAS = 'Lista_Personas';
const COLUMNAS_LISTA_PERSONAS = ['ID_Lista', 'Codigo_Persona', 'Unidad'];

const ESTADO_ABIERTA = 'Abierta';
const ESTADO_CERRADA = 'Cerrada';

function leerListas() {
  const filas = obtenerHoja(HOJA_LISTAS, COLUMNAS_LISTAS).getDataRange().getValues();
  filas.shift();

  return filas
    .filter(function (fila) {
      return String(fila[0]).trim() !== '';
    })
    .map(function (fila) {
      return {
        id: String(fila[0]).trim(),
        nombre: String(fila[1]).trim(),
        mes: Number(fila[2]),
        anio: Number(fila[3]),
        estado: String(fila[4]).trim(),
        dueño: String(fila[5]).trim(),
      };
    });
}

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
