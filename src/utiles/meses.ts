/** Nombres de los meses, para mostrar "Agosto 2026" en vez de "8/2026". */

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const NUMEROS_DE_MES = MESES.map((_, indice) => indice + 1);

/** El mes va de 1 a 12. Fuera de rango devuelve vacío en vez de romper la vista. */
export function nombreDelMes(mes: number): string {
  return MESES[mes - 1] ?? '';
}

export function nombreDelPeriodo(mes: number, anio: number): string {
  const nombre = nombreDelMes(mes);
  return nombre === '' ? String(anio) : `${nombre} ${anio}`;
}
