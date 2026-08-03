/**
 * Conceptos: el catálogo de gastos que se ve como botones en la pantalla
 * principal.
 *
 * `Categoria` y `Subcategoria` no son de la app: las completa a mano el
 * administrador en la planilla, para enlazar estos gastos con otro proyecto. La
 * app nunca las escribe ni las muestra — de acá sale solo un `sinCategorizar`
 * que le sirve al admin para saber que le falta completarlas.
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

/**
 * Catálogo con el que arranca una planilla nueva.
 *
 * Existe para que la primera pantalla no aparezca vacía: sin conceptos no hay
 * ningún botón para tocar y no se puede cargar nada. Se siembra una sola vez,
 * al crear la hoja, y desde ahí se edita en la planilla o desde la app.
 */
const CONCEPTOS_INICIALES = [
  ['Supermercado', '🛒'],
  ['Nafta', '⛽'],
  ['Farmacia', '💊'],
  ['Delivery', '🍔'],
  ['Servicios', '💡'],
  ['Internet', '📺'],
];

function obtenerHojaConceptos() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  const existiaAntes = libro.getSheetByName(HOJA_CONCEPTOS) !== null;
  const hoja = obtenerHoja(HOJA_CONCEPTOS, COLUMNAS_CONCEPTOS);

  if (!existiaAntes) {
    CONCEPTOS_INICIALES.forEach(function (inicial, indice) {
      hoja.appendRow([
        'C' + String(indice + 1).padStart(2, '0'),
        inicial[0],
        inicial[1],
        'SI',
        '',
        '',
      ]);
    });
  }

  return hoja;
}

function leerConceptos() {
  const filas = obtenerHojaConceptos().getDataRange().getValues();
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

function ejecutarObtenerConceptos() {
  const conceptos = leerConceptos().map(function (concepto) {
    return {
      id: concepto.id,
      nombre: concepto.nombre,
      emoji: concepto.emoji,
      fijo: concepto.fijo,
      // Ni `Categoria` ni `Subcategoria` salen de la planilla: solo si faltan.
      sinCategorizar: concepto.categoria === '' || concepto.subcategoria === '',
    };
  });

  return responder({
    estado: 'ok',
    mensaje: conceptos.length + ' concepto(s).',
    datos: { conceptos: conceptos },
  });
}
