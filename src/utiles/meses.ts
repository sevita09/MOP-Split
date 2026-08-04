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

/**
 * "3 Agosto 2026".
 *
 * A mano y no con `Intl`: el formato largo en castellano da "3 de agosto de
 * 2026", con los "de" y el mes en minúscula. Acá se quiere el mes suelto y con
 * mayúscula, igual que en el resto de la app.
 */
export function fechaConMesEnLetras(momento: number): string {
  const fecha = new Date(momento);
  return `${fecha.getDate()} ${nombreDelMes(fecha.getMonth() + 1)} ${fecha.getFullYear()}`;
}
