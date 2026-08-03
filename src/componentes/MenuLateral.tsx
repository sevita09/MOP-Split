import type { Lista } from '../api/listas';
import { nombreDelPeriodo } from '../utiles/meses';
import './MenuLateral.css';

interface Props {
  abierto: boolean;
  abiertas: Lista[];
  idActiva: string | null;
  alElegir: (id: string) => void;
  alCerrar: () => void;
  alCrearLista: () => void;
  alSalir: () => void;
}

/**
 * Cajón lateral con las listas.
 *
 * Las listas viven acá y no en la pantalla principal a propósito: la principal
 * tiene que ser para cargar un gasto rápido, no para elegir entre listas. Pasar
 * de una a otra es algo que se hace de vez en cuando.
 */
export function MenuLateral({
  abierto,
  abiertas,
  idActiva,
  alElegir,
  alCerrar,
  alCrearLista,
  alSalir,
}: Props) {
  return (
    <>
      <div
        className={abierto ? 'menu-fondo menu-fondo--visible' : 'menu-fondo'}
        onClick={alCerrar}
        aria-hidden="true"
      />

      <nav className={abierto ? 'menu menu--abierto' : 'menu'} aria-label="Listas">
        <div className="menu__encabezado">Split Familiar</div>

        <div className="menu__cuerpo">
          <div className="menu__rotulo">Abiertas</div>

          {abiertas.length === 0 && <p className="menu__vacio">Ninguna todavía.</p>}

          {abiertas.map((lista) => (
            <button
              key={lista.id}
              type="button"
              className={
                lista.id === idActiva ? 'menu__item menu__item--activo' : 'menu__item'
              }
              onClick={() => alElegir(lista.id)}
            >
              <span>{lista.nombre}</span>
              <span className="menu__periodo">
                {nombreDelPeriodo(lista.mes, lista.anio)}
              </span>
            </button>
          ))}
        </div>

        <div className="menu__pie">
          <button type="button" className="menu__enlace" onClick={alCrearLista}>
            ＋ Nueva lista
          </button>
          <button type="button" className="menu__enlace menu__enlace--apagado" onClick={alSalir}>
            Salir
          </button>
        </div>
      </nav>
    </>
  );
}
