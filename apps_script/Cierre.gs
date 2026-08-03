/**
 * El balance congelado de las listas cerradas.
 *
 * Mientras una lista está abierta el balance se calcula en vivo con los gastos
 * de ese momento. Al cerrarla se saca una foto y se guarda acá, y desde ese
 * momento es lo único que se muestra.
 *
 * El motivo es concreto: ese número se usó para saldar cuentas de verdad. Si se
 * siguiera recalculando, corregir un gasto viejo movería solo un balance que ya
 * se pagó, y quedaría una diferencia que la app no sabría explicar. Para que una
 * corrección cuente hay que reabrir la lista a propósito: ahí se borra la foto y
 * se saca una nueva al volver a cerrarla.
 *
 * Se graban `Unidad` y su neto tal como estaban: si alguien edita
 * `Lista_Personas` después del cierre, la foto sigue diciendo lo que decía.
 */

const HOJA_BALANCE_CIERRE = 'Balance_Cierre';
const COLUMNAS_BALANCE_CIERRE = ['ID_Lista', 'Unidad', 'Codigos', 'Neto_Congelado'];

function obtenerHojaBalanceCierre() {
  const hoja = obtenerHoja(HOJA_BALANCE_CIERRE, COLUMNAS_BALANCE_CIERRE);
  hoja.getRange('D2:D').setNumberFormat('#,##0.00');
  return hoja;
}

function leerBalanceCierre(idLista) {
  const filas = obtenerHojaBalanceCierre().getDataRange().getValues();
  filas.shift();

  return filas
    .filter(function (fila) {
      return String(fila[0]).trim() === idLista;
    })
    .map(function (fila) {
      return {
        unidad: String(fila[1]).trim(),
        codigos: String(fila[2])
          .split(',')
          .map(function (codigo) {
            return codigo.trim();
          })
          .filter(function (codigo) {
            return codigo !== '';
          }),
        neto: Number(fila[3]) || 0,
      };
    });
}

/** Redondeo a dos decimales, igual que en la app. */
function redondearPesos(valor) {
  return Math.round(valor * 100 + Number.EPSILON) / 100;
}

/**
 * El neto de cada unidad de una lista, con los gastos de este momento.
 *
 * Repite el cálculo que la app hace para las listas abiertas. Se duplica a
 * propósito: la foto tiene que salir de la planilla y no de lo que le mande un
 * celular, que podría estar viendo datos viejos.
 */
function calcularNetosDeLista(idLista) {
  const participantes = leerListaPersonas().filter(function (participacion) {
    return participacion.idLista === idLista;
  });

  const gastos = leerGastos().filter(function (gasto) {
    return gasto.idLista === idLista;
  });

  const total = redondearPesos(
    gastos.reduce(function (suma, gasto) {
      return suma + gasto.monto - gasto.descuento;
    }, 0),
  );

  const partePorCabeza =
    participantes.length === 0 ? 0 : redondearPesos(total / participantes.length);

  const codigosPorUnidad = {};
  participantes.forEach(function (participacion) {
    codigosPorUnidad[participacion.unidad] = (
      codigosPorUnidad[participacion.unidad] || []
    ).concat(participacion.codigoPersona);
  });

  return Object.keys(codigosPorUnidad).map(function (unidad) {
    const codigos = codigosPorUnidad[unidad];

    const aporte = redondearPesos(
      gastos
        .filter(function (gasto) {
          return codigos.indexOf(gasto.codigoPersonaPago) !== -1;
        })
        .reduce(function (suma, gasto) {
          return suma + gasto.monto - gasto.descuento;
        }, 0),
    );

    const debe = redondearPesos(partePorCabeza * codigos.length);

    return { unidad: unidad, codigos: codigos, neto: redondearPesos(aporte - debe) };
  });
}

function guardarBalanceDeCierre(idLista) {
  const hoja = obtenerHojaBalanceCierre();

  calcularNetosDeLista(idLista).forEach(function (unidad) {
    hoja.appendRow([idLista, unidad.unidad, unidad.codigos.join(','), unidad.neto]);
  });
}

function borrarBalanceDeCierre(idLista) {
  const hoja = obtenerHojaBalanceCierre();
  const filas = hoja.getDataRange().getValues();

  // De abajo hacia arriba: borrar una fila corre las de abajo, y yendo al revés
  // se saltearían filas.
  for (let indice = filas.length - 1; indice >= 1; indice--) {
    if (String(filas[indice][0]).trim() === idLista) {
      hoja.deleteRow(indice + 1);
    }
  }
}
