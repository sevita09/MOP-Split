import { useCallback, useState } from 'react';
import type { Persona } from '../api/personas';

const CLAVE_ALMACENAMIENTO = 'split-familiar:sesion';

/**
 * Quién está usando la app en este celular.
 *
 * Persiste porque el PIN se pide una sola vez por aparato: pedirlo en cada
 * apertura sería insoportable para cargar un gasto de treinta segundos, y no
 * agregaría seguridad real — quien tiene el celular desbloqueado ya tiene todo.
 *
 * No guarda el PIN, solo quién es.
 */
function leerDelAlmacenamiento(): Persona | null {
  const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO);
  if (!guardado) return null;

  try {
    const parseado = JSON.parse(guardado) as Partial<Persona>;
    if (typeof parseado.codigo !== 'string' || typeof parseado.nombre !== 'string') {
      return null;
    }
    return {
      codigo: parseado.codigo,
      nombre: parseado.nombre,
      admin: parseado.admin === true,
    };
  } catch {
    return null;
  }
}

export function usarSesion() {
  const [persona, setPersona] = useState<Persona | null>(leerDelAlmacenamiento);

  const ingresar = useCallback((nueva: Persona) => {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(nueva));
    setPersona(nueva);
  }, []);

  const salir = useCallback(() => {
    localStorage.removeItem(CLAVE_ALMACENAMIENTO);
    setPersona(null);
  }, []);

  return { persona, ingresar, salir };
}
