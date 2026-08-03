/**
 * En qué orden se muestran los botones para cargar un gasto.
 *
 * La idea es que lo que estás cargando ahora quede a mano. Los gastos de una
 * lista se repiten entre sí —la del súper tiene súper, verdulería y carnicería—
 * mucho más de lo que se parecen al promedio de todas las listas juntas.
 *
 * Por eso van primero **los que ya se usaron en esta lista**, del más reciente
 * al más viejo, y detrás **todo el resto ordenado por cuántas veces se usó**.
 * Cargar un gasto lo empuja al frente, y el anterior baja un lugar.
 */

interface Ordenable {
  nombre: string;
  usos: number;
  ultimoUsoEnLista: number | null;
}

export function ordenarConceptos<T extends Ordenable>(conceptos: T[]): T[] {
  return [...conceptos].sort((uno, otro) => {
    const usadoUno = uno.ultimoUsoEnLista !== null;
    const usadoOtro = otro.ultimoUsoEnLista !== null;

    if (usadoUno && usadoOtro) {
      return (otro.ultimoUsoEnLista ?? 0) - (uno.ultimoUsoEnLista ?? 0);
    }

    if (usadoUno !== usadoOtro) return usadoUno ? -1 : 1;

    if (uno.usos !== otro.usos) return otro.usos - uno.usos;

    // Sin esto, dos conceptos con los mismos usos bailarían de lugar entre
    // recargas y costaría encontrarlos por memoria visual.
    return uno.nombre.localeCompare(otro.nombre, 'es');
  });
}
