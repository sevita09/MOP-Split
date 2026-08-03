/**
 * Quién le pasa plata a quién para saldar una lista.
 *
 * Del balance sale cuánto tiene a favor o en contra cada unidad, pero no cómo
 * arreglarlo: con eso solo, cada uno le pagaría a cada uno y saldrían cuentas
 * de más. Acá se arma la lista corta de transferencias.
 *
 * El método es simple a propósito: se toma al que más debe y al que más le
 * deben, se pasa el menor de los dos importes —con lo cual al menos uno de los
 * dos queda saldado— y se repite. Encontrar el mínimo absoluto de
 * transferencias es un problema NP-difícil, pero con las pocas unidades de una
 * familia esto da el óptimo, y se entiende leyéndolo.
 */

const CENTAVOS = 100;

/** Menos de un centavo es ruido de redondeo, no una deuda. */
const MINIMO = 0.005;

function redondear(valor: number): number {
  return Math.round(valor * CENTAVOS + Number.EPSILON) / CENTAVOS;
}

interface UnidadConNeto {
  unidad: string;
  neto: number;
}

export interface Transferencia {
  /** La unidad que paga. */
  desde: string;
  /** La unidad que cobra. */
  hacia: string;
  monto: number;
}

export function calcularTransferencias(unidades: UnidadConNeto[]): Transferencia[] {
  const deudores = unidades
    .filter((una) => una.neto < -MINIMO)
    .map((una) => ({ unidad: una.unidad, resto: -una.neto }))
    .sort((uno, otro) => otro.resto - uno.resto);

  const acreedores = unidades
    .filter((una) => una.neto > MINIMO)
    .map((una) => ({ unidad: una.unidad, resto: una.neto }))
    .sort((uno, otro) => otro.resto - uno.resto);

  const transferencias: Transferencia[] = [];
  let deudor = 0;
  let acreedor = 0;

  while (deudor < deudores.length && acreedor < acreedores.length) {
    const monto = redondear(Math.min(deudores[deudor].resto, acreedores[acreedor].resto));

    if (monto > MINIMO) {
      transferencias.push({
        desde: deudores[deudor].unidad,
        hacia: acreedores[acreedor].unidad,
        monto,
      });
    }

    deudores[deudor].resto = redondear(deudores[deudor].resto - monto);
    acreedores[acreedor].resto = redondear(acreedores[acreedor].resto - monto);

    // Se avanza el que quedó saldado. Cuando los dos cierran juntos avanzan los
    // dos, y sin esto se generaría una transferencia de cero.
    if (deudores[deudor].resto <= MINIMO) deudor++;
    if (acreedores[acreedor].resto <= MINIMO) acreedor++;
  }

  return transferencias;
}
