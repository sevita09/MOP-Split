import { useState } from 'react';
import type { Concepto } from '../api/conceptos';
import type { Persona } from '../api/personas';
import type { Credenciales } from '../api/planilla';
import { usarListas } from '../hooks/usarListas';
import { usarConceptos } from '../hooks/usarConceptos';
import { usarSincronizacion } from '../hooks/usarSincronizacion';
import { usarPersonas } from '../hooks/usarPersonas';
import { MenuLateral } from '../componentes/MenuLateral';
import { GrillaDeConceptos } from '../componentes/GrillaDeConceptos';
import { CargarGasto } from '../componentes/CargarGasto';
import { PuntoDeSincronizacion } from '../componentes/PuntoDeSincronizacion';
import { Aviso } from '../componentes/Aviso';
import { nombreDelPeriodo } from '../utiles/meses';
import { CrearLista } from './CrearLista';
import { Historial } from './Historial';
import './Inicio.css';

interface Props {
  credenciales: Credenciales;
  persona: Persona;
  alSalir: () => void;
}

export function Inicio({ credenciales, persona, alSalir }: Props) {
  const sincronizacion = usarSincronizacion();
  const {
    listas,
    cargando: cargandoListas,
    error: errorListas,
    recargar: recargarListas,
  } = usarListas(credenciales);

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  const [idElegida, setIdElegida] = useState<string | null>(null);
  // `'nuevo'` es el botón Otro: hay que cargar un gasto de algo que todavía
  // no está en el catálogo.
  const [cargaAbierta, setCargaAbierta] = useState<Concepto | 'nuevo' | null>(null);
  // Se cuenta en vez de usar un booleano: cargar dos gastos seguidos tiene que
  // volver a mostrar el aviso, y el texto es el mismo las dos veces.
  const [gastosCargados, setGastosCargados] = useState(0);
  const [viendoGastos, setViendoGastos] = useState(false);

  const todas = [...listas.abiertas, ...listas.cerradas];
  // Sin elección explícita se muestra la primera abierta. El `?? null` importa
  // cuando la lista elegida desaparece —se cerró desde otro celular— para no
  // quedar mostrando el encabezado de algo que ya no está.
  const activa = todas.find((lista) => lista.id === idElegida) ?? listas.abiertas[0] ?? null;

  // Va después de `activa` porque el orden de los conceptos depende de qué se
  // cargó en esa lista: al cambiar de lista, la grilla se reordena sola.
  const {
    conceptos,
    cargando: cargandoConceptos,
    error: errorConceptos,
    recargar: recargarConceptos,
  } = usarConceptos(credenciales, activa?.id ?? '');
  const { personas } = usarPersonas(credenciales);

  if (viendoGastos && activa) {
    return (
      <Historial
        credenciales={credenciales}
        lista={activa}
        conceptos={conceptos}
        personas={personas}
        alVolver={() => setViendoGastos(false)}
      />
    );
  }

  if (creando) {
    return (
      <CrearLista
        credenciales={credenciales}
        persona={persona}
        alCrear={() => {
          setCreando(false);
          void recargarListas();
        }}
        alVolver={() => setCreando(false)}
      />
    );
  }

  return (
    <div className="inicio">
      <MenuLateral
        abierto={menuAbierto}
        abiertas={listas.abiertas}
        cerradas={listas.cerradas}
        idActiva={activa?.id ?? null}
        alElegir={(id) => {
          setIdElegida(id);
          setMenuAbierto(false);
        }}
        alCerrar={() => setMenuAbierto(false)}
        alCrearLista={() => {
          setMenuAbierto(false);
          setCreando(true);
        }}
        alSalir={alSalir}
      />

      <header className="inicio__barra">
        <button
          type="button"
          className="inicio__menu"
          aria-label="Abrir el menú de listas"
          onClick={() => setMenuAbierto(true)}
        >
          ☰
        </button>
        <div className="inicio__titulo">
          <h1>Hola, {persona.nombre}</h1>
          {activa && (
            <p className="inicio__subtitulo">
              {activa.nombre} · {nombreDelPeriodo(activa.mes, activa.anio)}
              {activa.estado === 'Cerrada' && ' · cerrada'}
            </p>
          )}
        </div>
        {persona.admin && <span className="inicio__etiqueta">Admin</span>}
        <PuntoDeSincronizacion estado={sincronizacion} />
        {activa && (
          <button
            type="button"
            className="inicio__menu"
            aria-label="Ver el balance y los gastos"
            onClick={() => setViendoGastos(true)}
          >
            📋
          </button>
        )}
      </header>

      {!cargandoListas && errorListas === '' && listas.abiertas.length === 0 && (
        <div className="inicio__vacio">
          <span className="inicio__vacio-emoji">📭</span>
          <p>
            {listas.cerradas.length === 0
              ? 'Todavía no tenés ninguna lista.'
              : 'No tenés listas abiertas. Las cerradas están en el menú.'}
          </p>
          <button
            type="button"
            className="boton boton--verde"
            onClick={() => setCreando(true)}
          >
            ＋ Crear lista nueva
          </button>
        </div>
      )}

      <div
        className="inicio__cuerpo"
        hidden={!cargandoListas && errorListas === '' && listas.abiertas.length === 0}
      >
        {errorListas !== '' && <p className="aviso aviso--error">✕ {errorListas}</p>}

        {activa?.estado === 'Cerrada' ? (
          <p className="aviso aviso--neutro">
            Esta lista está cerrada: se puede mirar, pero no cargarle gastos.
          </p>
        ) : (
          <section>
            <h2 className="inicio__rotulo">Cargar gasto</h2>
            {cargandoConceptos && <p className="inicio__nota">Cargando…</p>}
            {errorConceptos !== '' && (
              <p className="aviso aviso--error">✕ {errorConceptos}</p>
            )}
            {!cargandoConceptos && errorConceptos === '' && (
              <GrillaDeConceptos
                conceptos={conceptos}
                mostrarPendientes={persona.admin}
                alElegir={setCargaAbierta}
                alPedirNuevo={() => setCargaAbierta('nuevo')}
              />
            )}
          </section>
        )}
      </div>

      {cargaAbierta && activa && (
        <CargarGasto
          credenciales={credenciales}
          concepto={cargaAbierta === 'nuevo' ? null : cargaAbierta}
          idLista={activa.id}
          alCargar={() => {
            setCargaAbierta(null);
            setGastosCargados((previos) => previos + 1);
            // Un concepto nuevo tiene que aparecer en la grilla enseguida, y el
            // orden cambia porque este acaba de ser el último usado.
            void recargarConceptos();
          }}
          alCerrar={() => setCargaAbierta(null)}
        />
      )}

      <Aviso texto="Gasto cargado" version={gastosCargados} />
    </div>
  );
}
