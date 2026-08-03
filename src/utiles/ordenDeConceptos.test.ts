import { describe, expect, test } from 'vitest';
import { ordenarConceptos } from './ordenDeConceptos';

function concepto(nombre: string, usos: number, ultimoUsoEnLista: number | null = null) {
  return { nombre, usos, ultimoUsoEnLista };
}

function nombres(lista: { nombre: string }[]) {
  return lista.map((uno) => uno.nombre);
}

describe('orden de conceptos', () => {
  test('sin nada cargado manda la frecuencia general', () => {
    const orden = ordenarConceptos([
      concepto('Farmacia', 2),
      concepto('Supermercado', 30),
      concepto('Nafta', 9),
    ]);

    expect(nombres(orden)).toEqual(['Supermercado', 'Nafta', 'Farmacia']);
  });

  test('lo usado en esta lista pasa adelante del mas frecuente en general', () => {
    // Farmacia es el menos usado de todos, pero es lo único que se cargó acá.
    const orden = ordenarConceptos([
      concepto('Supermercado', 30),
      concepto('Farmacia', 2, 1000),
    ]);

    expect(nombres(orden)).toEqual(['Farmacia', 'Supermercado']);
  });

  test('entre los usados en la lista, primero el mas reciente', () => {
    const orden = ordenarConceptos([
      concepto('Nafta', 9, 1000),
      concepto('Farmacia', 2, 3000),
      concepto('Delivery', 5, 2000),
    ]);

    expect(nombres(orden)).toEqual(['Farmacia', 'Delivery', 'Nafta']);
  });

  test('cargar un gasto lo pone primero y baja al anterior', () => {
    // El ejemplo tal cual se pidió: A está último en el orden general y B
    // tercero. Se carga A, después B, y quedan B, A y recién ahí el resto.
    const soloGeneral = [concepto('A', 1), concepto('B', 20), concepto('C', 30)];
    expect(nombres(ordenarConceptos(soloGeneral))).toEqual(['C', 'B', 'A']);

    const trasCargarA = [concepto('A', 2, 1000), concepto('B', 20), concepto('C', 30)];
    expect(nombres(ordenarConceptos(trasCargarA))).toEqual(['A', 'C', 'B']);

    const trasCargarB = [concepto('A', 2, 1000), concepto('B', 21, 2000), concepto('C', 30)];
    expect(nombres(ordenarConceptos(trasCargarB))).toEqual(['B', 'A', 'C']);
  });

  test('con los mismos usos se ordena alfabeticamente', () => {
    // Un desempate fijo: si no, los botones bailarían de lugar entre recargas.
    const orden = ordenarConceptos([
      concepto('Nafta', 5),
      concepto('Delivery', 5),
      concepto('Almacén', 5),
    ]);

    expect(nombres(orden)).toEqual(['Almacén', 'Delivery', 'Nafta']);
  });

  test('no modifica la lista que recibe', () => {
    const original = [concepto('B', 1), concepto('A', 9)];
    ordenarConceptos(original);
    expect(nombres(original)).toEqual(['B', 'A']);
  });
});
