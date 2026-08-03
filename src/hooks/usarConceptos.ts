import { useCallback, useEffect, useState } from 'react';
import { obtenerConceptos } from '../api/conceptos';
import type { Concepto } from '../api/conceptos';
import type { Credenciales } from '../api/planilla';

/** El catálogo de conceptos. Ver la nota de dependencias en `usarListas`. */
export function usarConceptos({ url, token }: Credenciales) {
  const [conceptos, setConceptos] = useState<Concepto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const recargar = useCallback(async () => {
    setCargando(true);

    const resultado = await obtenerConceptos({ url, token });

    if (resultado.ok) {
      setConceptos(resultado.datos ?? []);
      setError('');
    } else {
      setError(resultado.mensaje);
    }

    setCargando(false);
  }, [url, token]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { conceptos, cargando, error, recargar };
}
