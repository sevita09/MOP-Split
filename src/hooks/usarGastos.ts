import { useCallback, useEffect, useState } from 'react';
import { obtenerGastos } from '../api/gastos';
import type { Gasto } from '../api/gastos';
import type { Credenciales } from '../api/planilla';

/** Los gastos de una lista. Ver la nota de dependencias en `usarListas`. */
export function usarGastos({ url, token }: Credenciales, idLista: string) {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const recargar = useCallback(async () => {
    if (idLista === '') {
      setGastos([]);
      setCargando(false);
      return;
    }

    setCargando(true);

    const resultado = await obtenerGastos({ url, token }, idLista);

    if (resultado.ok) {
      setGastos(resultado.datos ?? []);
      setError('');
    } else {
      setError(resultado.mensaje);
    }

    setCargando(false);
  }, [url, token, idLista]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { gastos, cargando, error, recargar };
}
