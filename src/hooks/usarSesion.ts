import { useCallback, useState } from 'react';
import { fijarSesion } from '../api/planilla';
import type { Persona, Sesion } from '../api/personas';

const CLAVE_ALMACENAMIENTO = 'split-familiar:sesion';

/**
 * Quién está usando la app en este celular, y con qué token.
 *
 * Persiste porque el PIN se pide una sola vez por aparato: pedirlo en cada
 * apertura sería insoportable para cargar un gasto de treinta segundos, y no
 * agregaría seguridad real — quien tiene el celular desbloqueado ya tiene todo.
 *
 * Guarda el token pero **nunca el PIN**. El token no vence: se revoca borrando
 * su fila en la hoja `Sesiones`.
 */
function leerDelAlmacenamiento(): Sesion | null {
  const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO);
  if (!guardado) return null;

  try {
    const parseado = JSON.parse(guardado) as {
      persona?: Partial<Persona>;
      token?: unknown;
    };

    const { persona, token } = parseado;

    if (
      typeof persona?.codigo !== 'string' ||
      typeof persona?.nombre !== 'string' ||
      typeof token !== 'string'
    ) {
      return null;
    }

    return {
      persona: {
        codigo: persona.codigo,
        nombre: persona.nombre,
        admin: persona.admin === true,
      },
      token,
    };
  } catch {
    return null;
  }
}

/**
 * El token se avisa a la capa de red **acá y no en un efecto**.
 *
 * React corre los efectos de los hijos antes que los del padre. Si esto viviera
 * en un `useEffect` de `App`, las pantallas hijas ya habrían pedido sus datos
 * con el token todavía en `null`: la planilla contestaría `SIN_SESION`, la app
 * cerraría la sesión sola y el ingreso quedaría dando vueltas para siempre.
 *
 * Fijarlo al leer y al cambiar garantiza que ya esté puesto antes de que
 * cualquier pantalla llegue a pedir nada.
 */
export function usarSesion() {
  const [sesion, setSesion] = useState<Sesion | null>(() => {
    const guardada = leerDelAlmacenamiento();
    fijarSesion(guardada?.token ?? null);
    return guardada;
  });

  const ingresar = useCallback((nueva: Sesion) => {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(nueva));
    fijarSesion(nueva.token);
    setSesion(nueva);
  }, []);

  const salir = useCallback(() => {
    localStorage.removeItem(CLAVE_ALMACENAMIENTO);
    fijarSesion(null);
    setSesion(null);
  }, []);

  return { sesion, ingresar, salir };
}
