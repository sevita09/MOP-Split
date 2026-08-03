import { describe, expect, test } from 'vitest';
import { nombreDelMes, nombreDelPeriodo, NUMEROS_DE_MES } from './meses';

describe('meses', () => {
  test('el mes uno es enero y el doce es diciembre', () => {
    // Los meses vienen de la planilla numerados de 1 a 12, no desde cero.
    expect(nombreDelMes(1)).toBe('Enero');
    expect(nombreDelMes(12)).toBe('Diciembre');
  });

  test('un mes fuera de rango no rompe la vista', () => {
    // Si alguien escribe un 13 a mano en la planilla, se muestra solo el año.
    expect(nombreDelMes(0)).toBe('');
    expect(nombreDelMes(13)).toBe('');
    expect(nombreDelPeriodo(13, 2026)).toBe('2026');
  });

  test('el periodo se arma con el nombre y el año', () => {
    expect(nombreDelPeriodo(8, 2026)).toBe('Agosto 2026');
  });

  test('hay doce meses numerados de uno a doce', () => {
    expect(NUMEROS_DE_MES).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});
