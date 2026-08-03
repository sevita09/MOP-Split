import { useState } from 'react';
import type { Lista } from '../api/listas';
import { nombreDelPeriodo } from '../utiles/meses';
import './MenuLateral.css';

interface Props {
  abierto: boolean;
  abiertas: Lista[];
  cerradas: Lista[];
  idActiva: string | null;
  alElegir: (id: string) => void;
  alCerrar: () => void;
  alCrearLista: () => void;
  alSalir: () => void;
  alDesconectar: () => void;
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
  cerradas,
  idActiva,
  alElegir,
  alCerrar,
  alCrearLista,
  alSalir,
  alDesconectar,
}: Props) {
  // Las cerradas arrancan plegadas: son historial, se consultan de vez en
  // cuando, y desplegadas empujarían las abiertas fuera de la pantalla.
  const [verCerradas, setVerCerradas] = useState(false);

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

          {cerradas.length > 0 && (
            <>
              <button
                type="button"
                className="menu__plegable"
                aria-expanded={verCerradas}
                onClick={() => setVerCerradas((previo) => !previo)}
              >
                <span>Cerradas ({cerradas.length})</span>
                <span className={verCerradas ? 'menu__flecha menu__flecha--abierta' : 'menu__flecha'}>
                  ›
                </span>
              </button>

              {verCerradas &&
                cerradas.map((lista) => (
                  <button
                    key={lista.id}
                    type="button"
                    className={
                      lista.id === idActiva
                        ? 'menu__item menu__item--tenue menu__item--activo'
                        : 'menu__item menu__item--tenue'
                    }
                    onClick={() => alElegir(lista.id)}
                  >
                    <span>{lista.nombre}</span>
                    <span className="menu__periodo">
                      {nombreDelPeriodo(lista.mes, lista.anio)}
                    </span>
                  </button>
                ))}
            </>
          )}
        </div>

        <div className="menu__pie">
          <button type="button" className="menu__enlace" onClick={alCrearLista}>
            ＋ Nueva lista
          </button>
          <button type="button" className="menu__enlace menu__enlace--apagado" onClick={alSalir}>
            Salir
          </button>
          <button
            type="button"
            className="menu__enlace menu__enlace--apagado"
            onClick={alDesconectar}
          >
            Conectar otra planilla
          </button>
        </div>
      </nav>
    </>
  );
}
