import { beforeEach, describe, expect, test } from 'vitest';
import { fijarDuenoDelCache, olvidarTodo, recordado, recordar } from './cacheLocal';

/** localStorage de mentira: los tests no tocan el navegador de verdad. */
function almacenamientoFalso() {
  const datos = new Map<string, string>();
  return {
    getItem: (clave: string) => datos.get(clave) ?? null,
    setItem: (clave: string, valor: string) => datos.set(clave, valor),
    removeItem: (clave: string) => datos.delete(clave),
    get length() {
      return datos.size;
    },
    key: (indice: number) => [...datos.keys()][indice] ?? null,
    clear: () => datos.clear(),
  };
}

beforeEach(() => {
  globalThis.localStorage = almacenamientoFalso() as unknown as Storage;
  fijarDuenoDelCache('P01');
});

describe('cache local', () => {
  test('lo guardado se recupera igual', () => {
    recordar('listas', { abiertas: [{ id: 'L001' }], cerradas: [] });

    expect(recordado('listas')).toEqual({ abiertas: [{ id: 'L001' }], cerradas: [] });
  });

  test('lo que nunca se guardo devuelve nulo', () => {
    expect(recordado('gastos')).toBeNull();
  });

  test('cada persona ve solo lo suyo', () => {
    // Si alguien presta el celular, el que entra no puede ver los datos del
    // anterior aunque todavía no se hayan borrado.
    recordar('listas', 'las de P01');

    fijarDuenoDelCache('P02');
    expect(recordado('listas')).toBeNull();

    fijarDuenoDelCache('P01');
    expect(recordado('listas')).toBe('las de P01');
  });

  test('sin persona fijada no se guarda nada', () => {
    // Pasa entre que la app arranca y resuelve quién está usándola.
    fijarDuenoDelCache('');
    recordar('listas', 'algo');

    expect(recordado('listas')).toBeNull();
  });

  test('olvidar borra el de todas las personas', () => {
    recordar('listas', 'las de P01');
    fijarDuenoDelCache('P02');
    recordar('listas', 'las de P02');

    olvidarTodo();

    expect(recordado('listas')).toBeNull();
    fijarDuenoDelCache('P01');
    expect(recordado('listas')).toBeNull();
  });

  test('un guardado roto no rompe la app', () => {
    // Editar el almacenamiento a mano, o una versión vieja con otro formato.
    localStorage.setItem('split-familiar:cache:P01:listas', '{esto no es json');

    expect(recordado('listas')).toBeNull();
  });
});
