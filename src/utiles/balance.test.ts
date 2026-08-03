import { describe, expect, test } from 'vitest';
import { calcularBalance } from './balance';

/** Cuatro participantes con dos de ellos agrupados en una sola unidad. */
const CON_UNIDAD = [
  { codigo: 'P01', unidad: 'U-P01-P02' },
  { codigo: 'P02', unidad: 'U-P01-P02' },
  { codigo: 'P03', unidad: 'P03' },
  { codigo: 'P04', unidad: 'P04' },
];

function gasto(monto: number, quien: string, descuento = 0) {
  return { monto, descuento, codigoPersonaPago: quien };
}

function netos(balance: ReturnType<typeof calcularBalance>) {
  return Object.fromEntries(balance.unidades.map((una) => [una.unidad, una.neto]));
}

describe('balance', () => {
  test('quien paga todo queda con el resto a favor', () => {
    // 400 entre cuatro: 100 cada uno. P03 puso los 400, así que le deben 300.
    const balance = calcularBalance(CON_UNIDAD, [gasto(400, 'P03')]);

    expect(balance.total).toBe(400);
    expect(balance.partePorCabeza).toBe(100);
    expect(netos(balance)).toEqual({ 'U-P01-P02': -200, P03: 300, P04: -100 });
  });

  test('una unidad de dos personas debe el doble', () => {
    // El corazón del modelo: se divide por cabeza, se debe por unidad. La
    // unidad son dos personas, así que carga con dos de las cuatro partes.
    const balance = calcularBalance(CON_UNIDAD, [gasto(400, 'P04')]);
    const papis = balance.unidades.find((una) => una.unidad === 'U-P01-P02');

    expect(papis?.debe).toBe(200);
    expect(papis?.aporte).toBe(0);
  });

  test('lo que paga cualquiera de la unidad cuenta para la unidad entera', () => {
    // Paga P01 pero el aporte es de la unidad: para el balance son uno solo.
    const balance = calcularBalance(CON_UNIDAD, [gasto(400, 'P01')]);
    const papis = balance.unidades.find((una) => una.unidad === 'U-P01-P02');

    expect(papis?.aporte).toBe(400);
    expect(papis?.neto).toBe(200);
  });

  test('el descuento achica el gasto y por lo tanto el total', () => {
    // Se compró por 500 y devolvieron 100: lo que salió del bolsillo es 400.
    const balance = calcularBalance(CON_UNIDAD, [gasto(500, 'P03', 100)]);

    expect(balance.total).toBe(400);
    expect(balance.partePorCabeza).toBe(100);
  });

  test('cien pesos entre tres da 33,33 a cada uno', () => {
    // Decisión tomada: cada parte se redondea a dos decimales y listo. La suma
    // de los netos queda a un centavo del cero y se acepta así.
    const balance = calcularBalance(
      [
        { codigo: 'P01', unidad: 'P01' },
        { codigo: 'P02', unidad: 'P02' },
        { codigo: 'P03', unidad: 'P03' },
      ],
      [gasto(100, 'P01')],
    );

    expect(balance.partePorCabeza).toBe(33.33);
    expect(netos(balance)).toEqual({ P01: 66.67, P02: -33.33, P03: -33.33 });
  });

  test('los centavos no se pierden al redondear', () => {
    // 20,10 entre dos da 10,05 justo. En punto flotante 10,05 × 100 da
    // 1004,9999… y sin cuidado el redondeo comería un centavo.
    const balance = calcularBalance(
      [
        { codigo: 'P01', unidad: 'P01' },
        { codigo: 'P02', unidad: 'P02' },
      ],
      [gasto(20.1, 'P01')],
    );

    expect(balance.partePorCabeza).toBe(10.05);
    expect(netos(balance)).toEqual({ P01: 10.05, P02: -10.05 });
  });

  test('varios gastos de varios se suman antes de dividir', () => {
    const balance = calcularBalance(CON_UNIDAD, [
      gasto(200, 'P01'),
      gasto(100, 'P03'),
      gasto(100, 'P04'),
    ]);

    expect(balance.total).toBe(400);
    expect(netos(balance)).toEqual({ 'U-P01-P02': 0, P03: 0, P04: 0 });
  });

  test('una lista sin gastos da todo en cero', () => {
    const balance = calcularBalance(CON_UNIDAD, []);

    expect(balance.total).toBe(0);
    expect(netos(balance)).toEqual({ 'U-P01-P02': 0, P03: 0, P04: 0 });
  });

  test('una lista sin participantes no divide por cero', () => {
    // No debería pasar, pero dividir por cero daría Infinity y la pantalla
    // mostraría "$Infinity" sin que nada falle.
    const balance = calcularBalance([], [gasto(100, 'P01')]);

    expect(balance.partePorCabeza).toBe(0);
    expect(balance.unidades).toEqual([]);
  });
});
