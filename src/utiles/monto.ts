/**
 * El monto mientras se escribe en el teclado.
 *
 * Se guarda como texto y no como número: `1,50` y `1,5` valen lo mismo pero se
 * ven distinto, y mientras alguien está tecleando importa mostrarle exactamente
 * lo que tocó. Recién al guardar se convierte a número.
 *
 * Se usa la escritura de acá: **coma para los centavos y punto cada tres
 * dígitos**.
 */

/** Dos decimales, como cualquier precio. */
const DECIMALES = 2;

/**
 * Tope de dígitos enteros. El monto más alto que se acepta es
 * `999.999.999,99`: nueve enteros más los dos centavos.
 */
const MAXIMO_ENTEROS = 9;

const COMA = ',';

export function agregarDigito(actual: string, digito: string): string {
  const [enteros, decimales] = actual.split(COMA);

  if (decimales !== undefined) {
    return decimales.length >= DECIMALES ? actual : actual + digito;
  }

  // Un cero solo se reemplaza: escribir "0" y después "5" tiene que dar "5",
  // no "05".
  if (enteros === '0') return digito;
  if (enteros.length >= MAXIMO_ENTEROS) return actual;

  return actual + digito;
}

export function agregarComa(actual: string): string {
  if (actual.includes(COMA)) return actual;
  return actual === '' ? '0' + COMA : actual + COMA;
}

export function borrarUltimo(actual: string): string {
  return actual.slice(0, -1);
}

/** Lo que se muestra en la pantalla del teclado, ya con los puntos de miles. */
export function formatearParaMostrar(actual: string): string {
  if (actual === '') return '$0';

  const [enteros, decimales] = actual.split(COMA);
  const conPuntos = (enteros === '' ? '0' : enteros).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    '.',
  );

  return decimales === undefined ? `$${conPuntos}` : `$${conPuntos},${decimales}`;
}

/**
 * Un número ya guardado, listo para mostrar. Siempre con los dos centavos: en
 * una columna de importes, `$1.200` y `$1.200,50` desalineados se leen mal.
 */
export function formatearNumero(valor: number): string {
  return `$${valor.toLocaleString('es-AR', {
    minimumFractionDigits: DECIMALES,
    maximumFractionDigits: DECIMALES,
  })}`;
}

/** El número que se manda a la planilla. Un monto incompleto vale cero. */
export function aNumero(actual: string): number {
  const numero = Number(actual.replace(COMA, '.'));
  return Number.isFinite(numero) ? numero : 0;
}

export function esMontoValido(actual: string): boolean {
  return aNumero(actual) > 0;
}
