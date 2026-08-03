import type { EstadoDeSincronizacion } from '../api/planilla';
import './PuntoDeSincronizacion.css';

interface Props {
  estado: EstadoDeSincronizacion;
}

const LEYENDAS: Record<EstadoDeSincronizacion, string> = {
  quieto: 'Sin novedades',
  hablando: 'Sincronizando…',
  ok: 'Todo guardado en la planilla',
  falla: 'El último pedido no llegó a la planilla',
};

/**
 * Un punto que dice si lo que ves está guardado.
 *
 * El estado también viaja en el `title` y en un texto para lectores de
 * pantalla: verde y rojo son casi el mismo color en el daltonismo más común,
 * así que el color no puede ser lo único que distinga "guardado" de "falló".
 */
export function PuntoDeSincronizacion({ estado }: Props) {
  return (
    <span className={`punto-sync punto-sync--${estado}`} title={LEYENDAS[estado]}>
      <span className="punto-sync__texto">{LEYENDAS[estado]}</span>
    </span>
  );
}
