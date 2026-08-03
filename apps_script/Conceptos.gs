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

/** Identificadores correlativos C01, C02… Se busca el primero libre. */
function generarIdConcepto(existentes) {
  const usados = existentes.map(function (concepto) {
    return concepto.id;
  });

  let numero = 1;
  while (usados.indexOf('C' + String(numero).padStart(2, '0')) !== -1) {
    numero++;
  }

  return 'C' + String(numero).padStart(2, '0');
}

/** Para comparar nombres: "  Farmacia " y "farmacia" son el mismo concepto. */
function normalizarNombre(nombre) {
  return String(nombre).trim().toLowerCase();
}

/**
 * Crea un concepto que la app no tenía.
 *
 * Nace con `Fijo` en NO y sin categoría: esas dos columnas las completa a mano
 * el administrador, y hasta que lo haga la app le muestra un punto rojo.
 *
 * Si ya existe uno con el mismo nombre se devuelve ese en vez de crear otro:
 * dos personas cargando "Farmacia" el mismo día no tienen que terminar con dos
 * conceptos iguales, que después dividirían el historial en dos.
 */
function ejecutarCrearConcepto(datos) {
  const nombre = String(datos.nombre || '').trim();
  const emoji = String(datos.emoji || '').trim() || '🧾';

  if (nombre === '') {
    return responder({ estado: 'error', mensaje: 'Falta el nombre del gasto.' });
  }

  const existentes = leerConceptos();
  const repetido = existentes.filter(function (concepto) {
    return normalizarNombre(concepto.nombre) === normalizarNombre(nombre);
  })[0];

  if (repetido) {
    return responder({
      estado: 'ok',
      mensaje: 'Ya existía "' + repetido.nombre + '".',
      datos: {
        concepto: {
          id: repetido.id,
          nombre: repetido.nombre,
          emoji: repetido.emoji,
          fijo: repetido.fijo,
          sinCategorizar: repetido.categoria === '' || repetido.subcategoria === '',
        },
      },
    });
  }

  const id = generarIdConcepto(existentes);
  obtenerHojaConceptos().appendRow([id, nombre, emoji, 'NO', '', '']);

  return responder({
    estado: 'ok',
    mensaje: 'Concepto "' + nombre + '" creado.',
    datos: {
      concepto: { id: id, nombre: nombre, emoji: emoji, fijo: false, sinCategorizar: true },
    },
  });
}

/**
 * El catálogo, con lo que hace falta para ordenarlo.
 *
 * `usos` cuenta en todas las listas y `ultimoUsoEnLista` mira solo la lista
 * abierta en el celular. El orden en sí lo arma la app: es la parte con lógica
 * y allá está cubierta por tests, acá no.
 */
function ejecutarObtenerConceptos(datos) {
  const idLista = String(datos.idLista || '').trim();

  const usos = {};
  const ultimoUsoEnLista = {};

  leerGastos().forEach(function (gasto) {
    usos[gasto.idConcepto] = (usos[gasto.idConcepto] || 0) + 1;

    if (idLista === '' || gasto.idLista !== idLista) return;

    const momento = gasto.fecha instanceof Date ? gasto.fecha.getTime() : 0;
    if (!ultimoUsoEnLista[gasto.idConcepto] || momento > ultimoUsoEnLista[gasto.idConcepto]) {
      ultimoUsoEnLista[gasto.idConcepto] = momento;
    }
  });

  const conceptos = leerConceptos().map(function (concepto) {
    return {
      id: concepto.id,
      nombre: concepto.nombre,
      emoji: concepto.emoji,
      fijo: concepto.fijo,
      // Ni `Categoria` ni `Subcategoria` salen de la planilla: solo si faltan.
      sinCategorizar: concepto.categoria === '' || concepto.subcategoria === '',
      usos: usos[concepto.id] || 0,
      ultimoUsoEnLista: ultimoUsoEnLista[concepto.id] || null,
    };
  });

  return responder({
    estado: 'ok',
    mensaje: conceptos.length + ' concepto(s).',
    datos: { conceptos: conceptos },
  });
}
