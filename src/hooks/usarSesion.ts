import { useCallback, useState } from 'react';
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

export function usarSesion() {
  const [sesion, setSesion] = useState<Sesion | null>(leerDelAlmacenamiento);

  const ingresar = useCallback((nueva: Sesion) => {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(nueva));
    setSesion(nueva);
  }, []);

  const salir = useCallback(() => {
    localStorage.removeItem(CLAVE_ALMACENAMIENTO);
    setSesion(null);
  }, []);

  return { sesion, ingresar, salir };
}
