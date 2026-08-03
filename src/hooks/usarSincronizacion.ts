import { useEffect, useState } from 'react';
import { fijarAvisoDeSincronizacion } from '../api/planilla';
import type { EstadoDeSincronizacion } from '../api/planilla';

/**
 * Cómo viene el diálogo con la planilla, para poder mostrarlo.
 *
 * Se engancha una sola vez y desde la pantalla que dibuja el indicador: si dos
 * componentes se engancharan, el último pisaría al primero y uno de los dos
 * dejaría de enterarse.
 */
export function usarSincronizacion() {
  const [estado, setEstado] = useState<EstadoDeSincronizacion>('quieto');

  useEffect(() => {
    fijarAvisoDeSincronizacion(setEstado);
    return () => fijarAvisoDeSincronizacion(null);
  }, []);

  return estado;
}
