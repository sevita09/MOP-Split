import { describe, expect, test } from 'vitest';
import {
  aNumero,
  agregarComa,
  agregarDigito,
  borrarUltimo,
  esMontoValido,
  formatearParaMostrar,
} from './monto';

/** Teclea una secuencia entera, como si alguien tocara los botones en orden. */
function teclear(secuencia: string): string {
  return [...secuencia].reduce(
    (actual, tecla) => (tecla === ',' ? agregarComa(actual) : agregarDigito(actual, tecla)),
    '',
  );
}

describe('monto', () => {
  test('se escribe digito por digito', () => {
    expect(teclear('1500')).toBe('1500');
  });

  test('los miles se separan con punto al mostrarlos', () => {
    expect(formatearParaMostrar(teclear('1500'))).toBe('$1.500');
    expect(formatearParaMostrar(teclear('1234567'))).toBe('$1.234.567');
  });

  test('los centavos van despues de la coma', () => {
    expect(formatearParaMostrar(teclear('1234,50'))).toBe('$1.234,50');
  });

  test('no entran mas de dos centavos', () => {
    // El tercer dígito después de la coma se ignora en vez de correr los otros.
    expect(teclear('10,999')).toBe('10,99');
  });

  test('la coma se puede poner una sola vez', () => {
    expect(teclear('10,5,5')).toBe('10,55');
  });

  test('una coma al principio arranca en cero', () => {
    // Sin esto quedaría ",50", que no es un número que se pueda leer.
    expect(teclear(',50')).toBe('0,50');
  });

  test('un cero solo se reemplaza por el digito siguiente', () => {
    // Tocar 0 y después 5 tiene que dar 5, no 05.
    expect(teclear('05')).toBe('5');
  });

  test('el cero se conserva si despues viene la coma', () => {
    expect(teclear('0,99')).toBe('0,99');
  });

  test('el monto mas alto que se puede escribir es 999.999.999,99', () => {
    expect(formatearParaMostrar(teclear('999999999,99'))).toBe('$999.999.999,99');
    expect(aNumero(teclear('999999999,99'))).toBe(999999999.99);
  });

  test('no entra un decimo digito entero', () => {
    expect(teclear('1234567890')).toBe('123456789');
  });

  test('borrar saca el ultimo caracter tecleado', () => {
    expect(borrarUltimo('1500')).toBe('150');
    expect(borrarUltimo('10,')).toBe('10');
    expect(borrarUltimo('')).toBe('');
  });

  test('se convierte a numero con la coma como decimal', () => {
    expect(aNumero('1234,56')).toBe(1234.56);
    expect(aNumero('1500')).toBe(1500);
  });

  test('un monto a medio escribir vale su parte entera', () => {
    // Pasa al confirmar justo después de tocar la coma.
    expect(aNumero('10,')).toBe(10);
  });

  test('vacio y cero no son montos validos', () => {
    // El botón de confirmar sigue apagado hasta que haya un número real.
    expect(esMontoValido('')).toBe(false);
    expect(esMontoValido('0')).toBe(false);
    expect(esMontoValido('0,00')).toBe(false);
    expect(esMontoValido('0,01')).toBe(true);
  });

  test('la pantalla vacia muestra cero', () => {
    expect(formatearParaMostrar('')).toBe('$0');
  });
});
