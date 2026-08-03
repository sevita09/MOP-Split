/**
 * Quién puso de más y quién de menos en una lista.
 *
 * La regla de fondo, que es lo único raro de todo esto:
 * **la división es por cabeza, pero el balance es por unidad.**
 *
 * En una lista de cuatro personas donde dos comparten la plata, cada gasto se
 * parte en cuatro, pero esas dos deben dos de esas cuatro partes y saldan
 * juntas. Por eso `partePorCabeza` divide por personas y `debe` multiplica por
 * cuántas personas tiene la unidad.
 *
 * Del gasto se toma `monto − descuento`: si algo se reembolsó, lo que
 * realmente salió del bolsillo es menos.
 */

const CENTAVOS = 100;

/**
 * Redondeo a dos decimales.
 *
 * El `EPSILON` no es decoración: en punto flotante `1.005 * 100` da
 * `100.49999999999999` y redondearía para abajo, dejando un centavo de menos.
 */
function redondear(valor: number): number {
  return Math.round(valor * CENTAVOS + Number.EPSILON) / CENTAVOS;
}

export interface ParticipanteDeLista {
  codigo: string;
  unidad: string;
}

export interface GastoParaBalance {
  monto: number;
  descuento: number;
  codigoPersonaPago: string;
}

export interface NetoDeUnidad {
  unidad: string;
  /** Los códigos de las personas que la componen. */
  codigos: string[];
  aporte: number;
  debe: number;
  /** Positivo: le deben. Negativo: debe. */
  neto: number;
}

export interface Balance {
  total: number;
  partePorCabeza: number;
  unidades: NetoDeUnidad[];
}

export function calcularBalance(
  participantes: ParticipanteDeLista[],
  gastos: GastoParaBalance[],
): Balance {
  const total = redondear(
    gastos.reduce((suma, gasto) => suma + gasto.monto - gasto.descuento, 0),
  );

  const partePorCabeza =
    participantes.length === 0 ? 0 : redondear(total / participantes.length);

  const porUnidad = new Map<string, string[]>();
  participantes.forEach(({ codigo, unidad }) => {
    porUnidad.set(unidad, [...(porUnidad.get(unidad) ?? []), codigo]);
  });

  const unidades = [...porUnidad.entries()].map(([unidad, codigos]) => {
    const aporte = redondear(
      gastos
        .filter((gasto) => codigos.includes(gasto.codigoPersonaPago))
        .reduce((suma, gasto) => suma + gasto.monto - gasto.descuento, 0),
    );

    const debe = redondear(partePorCabeza * codigos.length);

    return { unidad, codigos, aporte, debe, neto: redondear(aporte - debe) };
  });

  return { total, partePorCabeza, unidades };
}
