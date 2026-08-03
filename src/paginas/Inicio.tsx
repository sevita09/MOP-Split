import { useState } from 'react';
import type { Persona } from '../api/personas';
import type { Credenciales } from '../api/planilla';
import { usarListas } from '../hooks/usarListas';
import { usarConceptos } from '../hooks/usarConceptos';
import { MenuLateral } from '../componentes/MenuLateral';
import { nombreDelPeriodo } from '../utiles/meses';
import { CrearLista } from './CrearLista';
import './Inicio.css';

interface Props {
  credenciales: Credenciales;
  persona: Persona;
  alSalir: () => void;
}

export function Inicio({ credenciales, persona, alSalir }: Props) {
  const {
    listas,
    cargando: cargandoListas,
    error: errorListas,
    recargar: recargarListas,
  } = usarListas(credenciales);
  const {
    conceptos,
    cargando: cargandoConceptos,
    error: errorConceptos,
  } = usarConceptos(credenciales);

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [creando, setCreando] = useState(false);
  const [idElegida, setIdElegida] = useState<string | null>(null);

  const todas = [...listas.abiertas, ...listas.cerradas];
  // Sin elección explícita se muestra la primera abierta. El `?? null` importa
  // cuando la lista elegida desaparece —se cerró desde otro celular— para no
  // quedar mostrando el encabezado de algo que ya no está.
  const activa = todas.find((lista) => lista.id === idElegida) ?? listas.abiertas[0] ?? null;

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
      </header>

      <div className="inicio__cuerpo">
        <section className="inicio__bloque">
          <h2>Lista activa</h2>
          {cargandoListas && <p className="inicio__nota">Cargando…</p>}
          {errorListas !== '' && <p className="aviso aviso--error">✕ {errorListas}</p>}
          {!cargandoListas && errorListas === '' && activa && (
            <p className="inicio__nota">
              {activa.participantes.length} participante(s)
              {activa.esDueño && ' · sos el dueño'}
            </p>
          )}
        </section>

        <section className="inicio__bloque">
          <h2>Conceptos</h2>
          {cargandoConceptos && <p className="inicio__nota">Cargando…</p>}
          {errorConceptos !== '' && <p className="aviso aviso--error">✕ {errorConceptos}</p>}
          {!cargandoConceptos && errorConceptos === '' && (
            <ul className="inicio__lista">
              {conceptos.map((concepto) => (
                <li key={concepto.id}>
                  {concepto.emoji} {concepto.nombre}
                  {persona.admin && concepto.sinCategorizar && (
                    <span
                      className="inicio__pendiente"
                      title="Falta categorizar en la planilla"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
