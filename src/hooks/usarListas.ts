import { useCallback, useEffect, useState } from 'react';
import { obtenerListas } from '../api/listas';
import type { Listas } from '../api/listas';
import type { Credenciales } from '../api/planilla';
import { recordado, recordar } from '../utiles/cacheLocal';

const VACIAS: Listas = { abiertas: [], cerradas: [] };

/**
 * Las listas donde participa quien está usando la app.
 *
 * Depende de `url` y `token` sueltos, no del objeto `credenciales`: con el
 * objeto, cada render armaría uno nuevo y el efecto pediría las listas sin
 * parar.
 */
export function usarListas({ url, token }: Credenciales) {
  // Arranca con lo último que se supo: la pantalla aparece armada al instante
  // y la respuesta de la planilla la reemplaza cuando llega.
  const guardadas = recordado<Listas>('listas');
  const [listas, setListas] = useState<Listas>(guardadas ?? VACIAS);
  const [primeraCarga, setPrimeraCarga] = useState(guardadas === null);
  const [error, setError] = useState('');

  const recargar = useCallback(async () => {
    const resultado = await obtenerListas({ url, token });

    if (resultado.ok) {
      setListas(resultado.datos ?? VACIAS);
      recordar('listas', resultado.datos ?? VACIAS);
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
