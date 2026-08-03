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
        idActiva={null}
        alElegir={() => setMenuAbierto(false)}
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
          {persona.admin && <span className="inicio__etiqueta">Admin</span>}
        </div>
      </header>

      <div className="inicio__cuerpo">
        <section className="inicio__bloque">
          <h2>Listas</h2>
          {cargandoListas && <p className="inicio__nota">Cargando…</p>}
          {errorListas !== '' && <p className="aviso aviso--error">✕ {errorListas}</p>}
          {!cargandoListas && errorListas === '' && (
            <ul className="inicio__lista">
              {[...listas.abiertas, ...listas.cerradas].map((lista) => (
                <li key={lista.id}>
                  {lista.nombre} · {nombreDelPeriodo(lista.mes, lista.anio)} ·{' '}
                  {lista.estado}
                </li>
              ))}
            </ul>
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
