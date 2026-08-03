/**
 * Conceptos: el catálogo de gastos que se ve como botones en la pantalla
 * principal.
 *
 * `Categoria` y `Subcategoria` no son de la app: las completa a mano el
 * administrador en la planilla, para enlazar estos gastos con otro proyecto. La
 * app nunca las escribe ni las muestra.
 */

const HOJA_CONCEPTOS = 'Conceptos';
const COLUMNAS_CONCEPTOS = [
  'ID_Concepto',
  'Nombre',
  'Emoji',
  'Fijo',
  'Categoria',
  'Subcategoria',
];

function leerConceptos() {
  const filas = obtenerHoja(HOJA_CONCEPTOS, COLUMNAS_CONCEPTOS).getDataRange().getValues();
  filas.shift();

  return filas
    .filter(function (fila) {
      return String(fila[0]).trim() !== '';
    })
    .map(function (fila) {
      return {
        id: String(fila[0]).trim(),
        nombre: String(fila[1]).trim(),
        emoji: String(fila[2]).trim(),
        fijo: String(fila[3]).trim().toUpperCase() === 'SI',
        categoria: String(fila[4]).trim(),
        subcategoria: String(fila[5]).trim(),
      };
    });
}
