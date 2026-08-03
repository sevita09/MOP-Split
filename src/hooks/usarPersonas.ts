import { useCallback, useEffect, useState } from 'react';
import { obtenerPersonas } from '../api/personas';
import type { Persona } from '../api/personas';
import type { Credenciales } from '../api/planilla';

/**
 * Trae de la planilla la gente que puede usar la app.
 *
 * Depende de `url` y `token` sueltos y no del objeto `credenciales`: si
 * dependiera del objeto, cada render armaría uno nuevo y el efecto se
 * dispararía para siempre, pidiendo la lista sin parar.
 */
export function usarPersonas({ url, token }: Credenciales) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const recargar = useCallback(async () => {
    setCargando(true);

    const resultado = await obtenerPersonas({ url, token });

    if (resultado.ok) {
      setPersonas(resultado.datos ?? []);
      setError('');
    } else {
      setError(resultado.mensaje);
    }

    setCargando(false);
  }, [url, token]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { personas, cargando, error, recargar };
}
