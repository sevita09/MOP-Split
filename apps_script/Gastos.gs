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
  // Sin formato de fecha, la celda puede volver como texto o como número de
  // serie, y la app termina mostrando cualquier cosa.
  hoja.getRange('F2:F').setNumberFormat('dd/MM/yyyy HH:mm');
  return hoja;
}

/**
 * Pasa a milisegundos lo que haya en la celda de fecha.
 *
 * No alcanza con mirar si es un `Date`: según cómo quedó formateada la columna,
 * la misma fecha puede volver como objeto, como texto o como el número de serie
 * de Sheets —días desde el 30/12/1899—. Antes acá había un `: 0` de red de
 * seguridad, y era peor que el problema: `0` es el 1/1/1970 UTC, que en
 * Argentina se muestra como "31 dic" y parece una fecha de verdad.
 */
function comoMomento(valor) {
  if (valor instanceof Date) return valor.getTime();

  if (typeof valor === 'number' && valor > 0) {
    const DIAS_HASTA_1970 = 25569;
    const MS_POR_DIA = 86400000;
    return Math.round((valor - DIAS_HASTA_1970) * MS_POR_DIA);
  }

  const deTexto = comoMomentoDesdeTexto(valor);
  if (deTexto !== null) return deTexto;

  const interpretada = new Date(valor);
  // `null` avisa "no se pudo": la app lo muestra como sin fecha en vez de
  // inventar una.
  return isNaN(interpretada.getTime()) ? null : interpretada.getTime();
}

/**
 * Interpreta un texto con fecha escrita como acá: día, mes, año.
 *
 * Va antes que `new Date`, y no es un detalle: JavaScript lee las barras como
 * **mes/día/año**, así que `"3/08/2026"` le da el 8 de marzo en vez del 3 de
 * agosto. Sin esto, una celda que quedó como texto no falla —que se vería— sino
 * que muestra un mes equivocado, que no se ve.
 */
function comoMomentoDesdeTexto(valor) {
  if (typeof valor !== 'string') return null;

  const partes = valor
    .trim()
    .match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);

  if (!partes) return null;

  const momento = new Date(
    Number(partes[3]),
    Number(partes[2]) - 1,
    Number(partes[1]),
    Number(partes[4] || 0),
    Number(partes[5] || 0),
    Number(partes[6] || 0),
  );

  return isNaN(momento.getTime()) ? null : momento.getTime();
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
 * Corrige el monto o el descuento de un gasto ya cargado.
 *
 * **La regla de permiso se valida acá y no en la app.** Esconder el lápiz en la
 * pantalla es comodidad: cualquiera de la familia podría armar el pedido a mano
 * y editar un gasto ajeno. Lo único que lo impide es esta comprobación, contra
 * la identidad que sale del token de sesión.
 *
 * Tampoco se toca un gasto de una lista cerrada: su balance ya quedó congelado
 * y se usó para saldar cuentas, así que moverlo sería cambiar un número que ya
 * se pagó.
 */
function ejecutarEditarGasto(datos, quien) {
  const idGasto = String(datos.idGasto || '').trim();

  // Se busca la fila por su ID en la planilla y no por la posición en la lista
  // ya leída: `leerGastos` descarta las filas vacías, así que una sola fila en
  // blanco en el medio correría los índices y se terminaría editando otro gasto.
  const hoja = obtenerHojaGastos();
  const filas = hoja.getDataRange().getValues();

  let fila = -1;
  for (let indice = 1; indice < filas.length; indice++) {
    if (String(filas[indice][0]).trim() === idGasto) {
      fila = indice + 1;
      break;
    }
  }

  if (fila === -1) {
    return responder({ estado: 'error', mensaje: 'No existe ese gasto.' });
  }

  const gasto = {
    idLista: String(filas[fila - 1][1]).trim(),
    monto: Number(filas[fila - 1][3]) || 0,
    codigoPersonaPago: String(filas[fila - 1][4]).trim(),
    descuento: Number(filas[fila - 1][6]) || 0,
  };

  if (!quien.admin && gasto.codigoPersonaPago !== quien.codigo) {
    return responder({
      estado: 'error',
      mensaje: 'Solo puede corregirlo quien lo pagó.',
    });
  }

  const lista = leerListas().filter(function (candidata) {
    return candidata.id === gasto.idLista;
  })[0];

  if (!lista || lista.estado !== ESTADO_ABIERTA) {
    return responder({
      estado: 'error',
      mensaje: 'La lista está cerrada: sus gastos ya no se tocan.',
    });
  }

  const monto = datos.monto === undefined ? gasto.monto : Number(datos.monto);
  const descuento = datos.descuento === undefined ? gasto.descuento : Number(datos.descuento);

  if (!(monto > 0)) {
    return responder({ estado: 'error', mensaje: 'El monto tiene que ser mayor a cero.' });
  }

  if (!(descuento >= 0)) {
    return responder({ estado: 'error', mensaje: 'El descuento no puede ser negativo.' });
  }

  if (descuento > monto) {
    return responder({
      estado: 'error',
      mensaje: 'El descuento no puede ser mayor que el gasto.',
    });
  }

  hoja.getRange(fila, 4).setValue(monto);
  hoja.getRange(fila, 7).setValue(descuento);

  return responder({ estado: 'ok', mensaje: 'Gasto actualizado.' });
}

/**
 * Los gastos de una lista, del más nuevo al más viejo.
 *
 * Viene con `puedeEditarlo` ya resuelto: es la planilla la que sabe quién pidió
 * y quién pagó, y así la app no tiene que repetir la regla —ni arriesgarse a
 * escribirla distinto.
 */
function ejecutarObtenerGastos(datos, quien) {
  const idLista = String(datos.idLista || '').trim();

  const gastos = leerGastos()
    .filter(function (gasto) {
      return gasto.idLista === idLista;
    })
    .map(function (gasto) {
      return {
        id: gasto.id,
        idConcepto: gasto.idConcepto,
        monto: gasto.monto,
        descuento: gasto.descuento,
        codigoPersonaPago: gasto.codigoPersonaPago,
        fecha: comoMomento(gasto.fecha),
        puedeEditarlo: quien.admin || gasto.codigoPersonaPago === quien.codigo,
      };
    })
    .sort(function (uno, otro) {
      // Las que no se pudieron leer van al final, no al principio.
      return (otro.fecha || 0) - (uno.fecha || 0);
    });

  return responder({
    estado: 'ok',
    mensaje: gastos.length + ' gasto(s).',
    datos: { gastos: gastos },
  });
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
    // Con código y no solo con texto: la app ofrece elegir otra lista cuando
    // pasa esto, y reconocerlo por el mensaje se rompería al reescribirlo.
    return responder({
      estado: 'error',
      codigo: 'LISTA_CERRADA',
      mensaje: 'Esa lista se cerró mientras cargabas el gasto.',
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
