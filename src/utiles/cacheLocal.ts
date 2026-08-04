/**
 * Lo último que trajo la planilla, guardado en el celular.
 *
 * No sirve para ir más rápido: el viaje a Apps Script cuesta unos 3,8 segundos
 * y eso no se puede bajar. Sirve para **no esperarlo**: al abrir la app, la
 * pantalla se arma al instante con lo que se supo la última vez y se actualiza
 * por atrás.
 *
 * Se guarda por persona. Si alguien presta el celular y entra otro, no ve nada
 * del anterior; y al salir o cambiar de planilla se borra todo.
 *
 * Solo se guarda lo que llega de la planilla, nunca algo derivado: el balance,
 * por ejemplo, se recalcula a partir de los gastos. Guardarlo sería el mismo
 * número escrito dos veces, con la chance de que se contradigan.
 */

const PREFIJO = 'split-familiar:cache:';

/** Se ata a la persona para que el caché no cruce usuarios en un mismo aparato. */
let duenoDelCache = '';

export function fijarDuenoDelCache(codigoPersona: string) {
  duenoDelCache = codigoPersona;
}

function claveCompleta(clave: string) {
  return `${PREFIJO}${duenoDelCache}:${clave}`;
}

export function recordar(clave: string, valor: unknown) {
  if (duenoDelCache === '') return;

  try {
    localStorage.setItem(claveCompleta(clave), JSON.stringify(valor));
  } catch {
    // Sin espacio o con el almacenamiento bloqueado, la app funciona igual:
    // solo pierde el arranque instantáneo.
  }
}

export function recordado<T>(clave: string): T | null {
  if (duenoDelCache === '') return null;

  try {
    const guardado = localStorage.getItem(claveCompleta(clave));
    return guardado === null ? null : (JSON.parse(guardado) as T);
  } catch {
    return null;
  }
}

/** Borra todo el caché de todas las personas. Se llama al salir. */
export function olvidarTodo() {
  try {
    // Se juntan primero y se borran después: borrar mientras se recorre corre
    // los índices y quedarían claves sin visitar.
    const claves: string[] = [];
    for (let indice = 0; indice < localStorage.length; indice++) {
      const clave = localStorage.key(indice);
      if (clave !== null && clave.startsWith(PREFIJO)) claves.push(clave);
    }

    claves.forEach((clave) => localStorage.removeItem(clave));
  } catch {
    // Nada que hacer: si no se puede borrar, tampoco se pudo guardar.
  }
}
