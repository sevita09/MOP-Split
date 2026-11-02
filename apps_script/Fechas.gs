/** Cómo se lee una fecha de la planilla, venga en el formato que venga. */

/**
 * Pasa a milisegundos lo que haya en la celda de fecha.
 *
 * No alcanza con mirar si es un `Date`: según cómo quedó formateada la columna,
 * la misma fecha puede volver como objeto, como texto o como el número de serie
 * de Sheets —días desde el 30/12/1899—. Antes acá había un `: 0` de red de
 * seguridad, y era peor que el problema: `0` es el 1/1/1970 UTC, que en
 * Argentina se muestra como "31 dic" y parece una fecha de verdad.
 */
function comoMomento(valor) {
  if (valor instanceof Date) return valor.getTime();

  if (typeof valor === 'number' && valor > 0) {
    const DIAS_HASTA_1970 = 25569;
    const MS_POR_DIA = 86400000;
    return Math.round((valor - DIAS_HASTA_1970) * MS_POR_DIA);
  }

  const deTexto = comoMomentoDesdeTexto(valor);
  if (deTexto !== null) return deTexto;

  const interpretada = new Date(valor);
  // `null` avisa "no se pudo": la app lo muestra como sin fecha en vez de
  // inventar una.
  return isNaN(interpretada.getTime()) ? null : interpretada.getTime();
}

/**
 * Interpreta un texto con fecha escrita como acá: día, mes, año.
 *
 * Va antes que `new Date`, y no es un detalle: JavaScript lee las barras como
 * **mes/día/año**, así que `"3/08/2026"` le da el 8 de marzo en vez del 3 de
 * agosto. Sin esto, una celda que quedó como texto no falla —que se vería— sino
 * que muestra un mes equivocado, que no se ve.
 */
function comoMomentoDesdeTexto(valor) {
  if (typeof valor !== 'string') return null;

  const partes = valor
    .trim()
    .match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);

  if (!partes) return null;

  const momento = new Date(
    Number(partes[3]),
    Number(partes[2]) - 1,
    Number(partes[1]),
    Number(partes[4] || 0),
    Number(partes[5] || 0),
    Number(partes[6] || 0),
  );

  return isNaN(momento.getTime()) ? null : momento.getTime();
}
