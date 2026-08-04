import { useCallback, useEffect, useState } from 'react';
import { obtenerGastos } from '../api/gastos';
import type { Gasto } from '../api/gastos';
import type { Credenciales } from '../api/planilla';
import { recordado, recordar } from '../utiles/cacheLocal';

/** Los gastos de una lista. Ver la nota de dependencias en `usarListas`. */
export function usarGastos({ url, token }: Credenciales, idLista: string) {
  // Solo se guardan los de una lista, la que se estaba mirando: guardar todas
  // haría crecer el caché sin que nadie mire las viejas.
  const guardados = recordado<{ idLista: string; gastos: Gasto[] }>('gastos');
  const sirve = guardados !== null && guardados.idLista === idLista && idLista !== '';

  const [gastos, setGastos] = useState<Gasto[]>(sirve ? guardados.gastos : []);
  const [primeraCarga, setPrimeraCarga] = useState(!sirve);
  const [error, setError] = useState('');

  const recargar = useCallback(async () => {
    if (idLista === '') {
      setGastos([]);
      setPrimeraCarga(false);
      return;
    }

    const resultado = await obtenerGastos({ url, token }, idLista);

    if (resultado.ok) {
      setGastos(resultado.datos ?? []);
      recordar('gastos', { idLista, gastos: resultado.datos ?? [] });
      setError('');
    } else {
      setError(resultado.mensaje);
    }

    setPrimeraCarga(false);
  }, [url, token, idLista]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { gastos, primeraCarga, error, recargar };
}
