import { useCallback, useEffect, useState } from 'react';
import { obtenerListas } from '../api/listas';
import type { Listas } from '../api/listas';
import type { Credenciales } from '../api/planilla';

const VACIAS: Listas = { abiertas: [], cerradas: [] };

/**
 * Las listas donde participa quien está usando la app.
 *
 * Depende de `url` y `token` sueltos, no del objeto `credenciales`: con el
 * objeto, cada render armaría uno nuevo y el efecto pediría las listas sin
 * parar.
 */
export function usarListas({ url, token }: Credenciales) {
  const [listas, setListas] = useState<Listas>(VACIAS);
  const [primeraCarga, setPrimeraCarga] = useState(true);
  const [error, setError] = useState('');

  const recargar = useCallback(async () => {
    const resultado = await obtenerListas({ url, token });

    if (resultado.ok) {
      setListas(resultado.datos ?? VACIAS);
      setError('');
    } else {
      setError(resultado.mensaje);
    }

    setPrimeraCarga(false);
  }, [url, token]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { listas, primeraCarga, error, recargar };
}
