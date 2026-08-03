import { describe, expect, test } from 'vitest';
import { calcularTransferencias } from './transferencias';

function neto(unidad: string, valor: number) {
  return { unidad, neto: valor };
}

describe('transferencias para saldar', () => {
  test('uno le debe a otro y alcanza una transferencia', () => {
    const movimientos = calcularTransferencias([neto('A', -100), neto('B', 100)]);

    expect(movimientos).toEqual([{ desde: 'A', hacia: 'B', monto: 100 }]);
  });

  test('nadie transfiere si esta todo en cero', () => {
    expect(calcularTransferencias([neto('A', 0), neto('B', 0)])).toEqual([]);
  });

  test('dos deudores le pagan al mismo acreedor', () => {
    const movimientos = calcularTransferencias([
      neto('A', -30),
      neto('B', -70),
      neto('C', 100),
    ]);

    expect(movimientos).toEqual([
      { desde: 'B', hacia: 'C', monto: 70 },
      { desde: 'A', hacia: 'C', monto: 30 },
    ]);
  });

  test('la deuda encadenada se salda con una sola transferencia', () => {
    // Es el caso que justifica todo esto: A "le debe" a B y B "le debe" a C,
    // pero B está en cero. Pagando A directo a C se ahorra un movimiento.
    const movimientos = calcularTransferencias([
      neto('A', -100),
      neto('B', 0),
      neto('C', 100),
    ]);

    expect(movimientos).toEqual([{ desde: 'A', hacia: 'C', monto: 100 }]);
  });

  test('un deudor grande se reparte entre varios acreedores', () => {
    const movimientos = calcularTransferencias([
      neto('A', -100),
      neto('B', 60),
      neto('C', 40),
    ]);

    expect(movimientos).toEqual([
      { desde: 'A', hacia: 'B', monto: 60 },
      { desde: 'A', hacia: 'C', monto: 40 },
    ]);
  });

  test('no se genera una transferencia de cero cuando los dos cierran juntos', () => {
    // Con importes iguales, deudor y acreedor quedan saldados en el mismo paso:
    // si solo avanzara uno, el siguiente movimiento sería de cero pesos.
    const movimientos = calcularTransferencias([
      neto('A', -50),
      neto('B', 50),
      neto('C', -50),
      neto('D', 50),
    ]);

    expect(movimientos).toHaveLength(2);
    expect(movimientos.every((uno) => uno.monto === 50)).toBe(true);
  });

  test('un centavo suelto de redondeo no genera un movimiento', () => {
    // Con 100 entre 3 los netos no cierran exacto. Pedirle a alguien que
    // transfiera un centavo sería ridículo.
    const movimientos = calcularTransferencias([
      neto('A', 66.67),
      neto('B', -33.33),
      neto('C', -33.33),
    ]);

    expect(movimientos).toEqual([
      { desde: 'B', hacia: 'A', monto: 33.33 },
      { desde: 'C', hacia: 'A', monto: 33.33 },
    ]);
  });

  test('el que mas debe le paga al que mas le deben', () => {
    // Emparejar los extremos es lo que mantiene corta la lista.
    const movimientos = calcularTransferencias([
      neto('A', -10),
      neto('B', -90),
      neto('C', 25),
      neto('D', 75),
    ]);

    expect(movimientos[0]).toEqual({ desde: 'B', hacia: 'D', monto: 75 });
    expect(movimientos).toHaveLength(3);
  });
});
