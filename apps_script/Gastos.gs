/**
 * Gastos cargados en cada lista.
 *
 * `Monto` se guarda como número con decimales y no como centavos enteros: la
 * planilla se lee y se corrige a mano, y ver `123456` donde va `1234,56` sería
 * una fuente de errores mucho más real que el redondeo.
 *
 * `Descuento` arranca en cero. El valor que entra al balance es
 * `Monto − Descuento`, para poder registrar un reembolso posterior sin tocar el
 * monto original de la compra.
 */

const HOJA_GASTOS = 'Gastos';
const COLUMNAS_GASTOS = [
  'ID_Gasto',
  'ID_Lista',
  'ID_Concepto',
  'Monto',
  'Codigo_Persona_Pago',
  'Fecha',
  'Descuento',
];

function obtenerHojaGastos() {
  const hoja = obtenerHoja(HOJA_GASTOS, COLUMNAS_GASTOS);
  hoja.getRange('D2:D').setNumberFormat('#,##0.00');
  hoja.getRange('G2:G').setNumberFormat('#,##0.00');
  return hoja;
}

function leerGastos() {
  const filas = obtenerHojaGastos().getDataRange().getValues();
  filas.shift();

  return filas
    .filter(function (fila) {
      return String(fila[0]).trim() !== '';
    })
    .map(function (fila) {
      return {
        id: String(fila[0]).trim(),
        idLista: String(fila[1]).trim(),
        idConcepto: String(fila[2]).trim(),
        monto: Number(fila[3]) || 0,
        codigoPersonaPago: String(fila[4]).trim(),
        fecha: fila[5],
        descuento: Number(fila[6]) || 0,
      };
    });
}

/** Identificadores correlativos G0001, G0002… Se busca el primero libre. */
function generarIdGasto(existentes) {
  const usados = existentes.map(function (gasto) {
    return gasto.id;
  });

  let numero = 1;
  while (usados.indexOf('G' + String(numero).padStart(4, '0')) !== -1) {
    numero++;
  }

  return 'G' + String(numero).padStart(4, '0');
}

/**
 * Carga un gasto en una lista.
 *
 * Quién pagó sale de la sesión, nunca del pedido: si viniera del cliente,
 * cualquiera podría cargar un gasto a nombre de otro y correrle el balance.
 */
function ejecutarCrearGasto(datos, quien) {
  const idLista = String(datos.idLista || '').trim();
  const idConcepto = String(datos.idConcepto || '').trim();
  const monto = Number(datos.monto);

  if (!(monto > 0)) {
    return responder({ estado: 'error', mensaje: 'El monto tiene que ser mayor a cero.' });
  }

  const lista = leerListas().filter(function (candidata) {
    return candidata.id === idLista;
  })[0];

  if (!lista) {
    return responder({ estado: 'error', mensaje: 'No existe esa lista.' });
  }

  if (lista.estado !== ESTADO_ABIERTA) {
    return responder({
      estado: 'error',
      mensaje: 'La lista está cerrada: no se le pueden cargar gastos.',
    });
  }

  const participa = leerListaPersonas().some(function (participacion) {
    return participacion.idLista === idLista && participacion.codigoPersona === quien.codigo;
  });

  if (!participa) {
    return responder({ estado: 'error', mensaje: 'No participás de esa lista.' });
  }

  const existeElConcepto = leerConceptos().some(function (concepto) {
    return concepto.id === idConcepto;
  });

  if (!existeElConcepto) {
    return responder({ estado: 'error', mensaje: 'No existe ese concepto.' });
  }

  const id = generarIdGasto(leerGastos());
  obtenerHojaGastos().appendRow([
    id,
    idLista,
    idConcepto,
    monto,
    quien.codigo,
    new Date(),
    0,
  ]);

  return responder({ estado: 'ok', mensaje: 'Gasto cargado.', datos: { id: id } });
}
