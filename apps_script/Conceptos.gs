/**
 * Conceptos: el catálogo de gastos que se ve como botones en la pantalla
 * principal.
 *
 * `Categoria` y `Subcategoria` no son de la app: las completa a mano el
 * administrador en la planilla, para enlazar estos gastos con otro proyecto. La
 * app nunca las escribe ni las muestra — de acá sale solo un `sinCategorizar`
 * que le sirve al admin para saber que le falta completarlas.
 *
 * `Negativo` en SI marca plata que vuelve en vez de plata que sale, como un
 * reembolso de una compra de un mes ya cerrado. Sus gastos se guardan con `Monto`
 * en cero y el importe en `Descuento`. Lo decide la planilla al guardar, así que
 * ningún celular puede cambiarlo. Una celda en blanco vale NO.
 */

const HOJA_CONCEPTOS = 'Conceptos';
const COLUMNAS_CONCEPTOS = [
  'ID_Concepto',
  'Nombre',
  'Emoji',
  'Fijo',
  'Categoria',
  'Subcategoria',
  'Negativo',
];

/** Posición de `Negativo`, contando desde 1 como cuenta Sheets. */
const COLUMNA_NEGATIVO = 7;

const CONCEPTO_DESCUENTOS_PASADOS = ['Descuentos pasados', '🏷️'];

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
  // Mismo motivo que en Listas: un concepto llamado "Enero 25" no es una fecha.
  hoja.getRange('B2:B').setNumberFormat('@');

  if (!existiaAntes) {
    CONCEPTOS_INICIALES.forEach(function (inicial, indice) {
      hoja.appendRow([
        'C' + String(indice + 1).padStart(2, '0'),
        inicial[0],
        inicial[1],
        'SI',
        '',
        '',
        'NO',
      ]);
    });
    hoja.appendRow([
      'C' + String(CONCEPTOS_INICIALES.length + 1).padStart(2, '0'),
      CONCEPTO_DESCUENTOS_PASADOS[0],
      CONCEPTO_DESCUENTOS_PASADOS[1],
      'SI',
      '',
      '',
      'SI',
    ]);
  } else if (hoja.getLastColumn() < COLUMNA_NEGATIVO) {
    agregarColumnaNegativo(hoja);
  }

  return hoja;
}

/**
 * Pone al día una planilla creada antes de que existiera `Negativo`.
 *
 * Corre una sola vez, porque después la columna ya está. Por eso, si el
 * administrador borra el concepto más adelante, no vuelve a aparecer.
 *
 * Si ya había un concepto con ese nombre se lo marca en vez de crear otro, igual
 * que en `crearOReusarConcepto`. Sus gastos ya cargados quedan como estaban.
 */
function agregarColumnaNegativo(hoja) {
  // El encabezado va primero: `leerConceptos` pasa otra vez por
  // `obtenerHojaConceptos`, y sin la columna volvería a entrar acá para siempre.
  hoja.getRange(1, COLUMNA_NEGATIVO).setValue('Negativo');

  const nombre = CONCEPTO_DESCUENTOS_PASADOS[0];
  const filas = hoja.getDataRange().getValues();

  for (let indice = 1; indice < filas.length; indice++) {
    if (normalizarNombre(filas[indice][1]) === normalizarNombre(nombre)) {
      hoja.getRange(indice + 1, COLUMNA_NEGATIVO).setValue('SI');
      return;
    }
  }

  const id = generarIdConcepto(leerConceptos());
  hoja.appendRow([id, nombre, CONCEPTO_DESCUENTOS_PASADOS[1], 'SI', '', '', 'SI']);
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
        negativo: String(fila[6]).trim().toUpperCase() === 'SI',
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
  const concepto = crearOReusarConcepto(datos.nombre, datos.emoji);

  if (concepto === null) {
    return responder({ estado: 'error', mensaje: 'Falta el nombre del gasto.' });
  }

  return responder({
    estado: 'ok',
    mensaje: 'Concepto "' + concepto.nombre + '" listo.',
    datos: { concepto: concepto },
  });
}

/**
 * Devuelve el concepto, creándolo si no estaba. `null` si falta el nombre.
 *
 * Está separado del evento para que `CREAR_GASTO` lo use también: cargar un
 * gasto de algo nuevo era dos viajes a la planilla, casi ocho segundos de
 * espera, y con esto es uno.
 */
function crearOReusarConcepto(nombreCrudo, emojiCrudo) {
  const nombre = String(nombreCrudo || '').trim();
  const emoji = String(emojiCrudo || '').trim() || '🧾';

  if (nombre === '') return null;

  const existentes = leerConceptos();
  const repetido = existentes.filter(function (concepto) {
    return normalizarNombre(concepto.nombre) === normalizarNombre(nombre);
  })[0];

  if (repetido) {
    return {
      id: repetido.id,
      nombre: repetido.nombre,
      emoji: repetido.emoji,
      fijo: repetido.fijo,
      sinCategorizar: repetido.categoria === '' || repetido.subcategoria === '',
      negativo: repetido.negativo,
    };
  }

  const id = generarIdConcepto(existentes);
  obtenerHojaConceptos().appendRow([id, nombre, emoji, 'NO', '', '', 'NO']);

  return {
    id: id,
    nombre: nombre,
    emoji: emoji,
    fijo: false,
    sinCategorizar: true,
    negativo: false,
  };
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

    // Mismo criterio que en Gastos.gs: una celda ilegible no vale cero, que
    // acá pondría el concepto al fondo del orden como si fuera viejísimo.
    const momento = comoMomento(gasto.fecha);
    if (momento === null) return;

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
      negativo: concepto.negativo,
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
