import { useState } from 'react';
import type { Persona } from '../api/personas';
import type { Credenciales } from '../api/planilla';
import { usarListas } from '../hooks/usarListas';
import { usarConceptos } from '../hooks/usarConceptos';
import { nombreDelPeriodo } from '../utiles/meses';
import { CrearLista } from './CrearLista';
import './Inicio.css';

interface Props {
  credenciales: Credenciales;
  persona: Persona;
  alSalir: () => void;
}

/**
 * Pantalla provisoria: muestra en crudo lo que devuelve la planilla.
 *
 * Sirve para ver que las hojas nuevas se leen bien antes de construir la
 * interfaz de verdad encima. La reemplazan el menú lateral (v2.2.0) y la grilla
 * de conceptos (v3.0.0).
 */
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
      <header className="inicio__encabezado">
        <h1>Hola, {persona.nombre}</h1>
        {persona.admin && <span className="inicio__etiqueta">Admin</span>}
      </header>

      <section className="inicio__bloque">
        <h2>Listas</h2>
        {cargandoListas && <p className="inicio__nota">Cargando…</p>}
        {errorListas !== '' && <p className="aviso aviso--error">✕ {errorListas}</p>}
        {!cargandoListas && errorListas === '' && (
          <>
            <p className="inicio__nota">
              {listas.abiertas.length} abierta(s) · {listas.cerradas.length} cerrada(s)
            </p>
            {listas.abiertas.length === 0 && listas.cerradas.length === 0 && (
              <p className="inicio__nota">Todavía no participás de ninguna lista.</p>
            )}
            <ul className="inicio__lista">
              {[...listas.abiertas, ...listas.cerradas].map((lista) => (
                <li key={lista.id}>
                  {lista.nombre} · {nombreDelPeriodo(lista.mes, lista.anio)} ·{' '}
                  {lista.estado} · {lista.participantes.length} participante(s)
                  {lista.esDueño && ' · sos el dueño'}
                </li>
              ))}
            </ul>
          </>
        )}
        <button
          type="button"
          className="boton boton--verde boton--ancho"
          onClick={() => setCreando(true)}
        >
          ＋ Crear lista nueva
        </button>
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
                  <span className="inicio__pendiente" title="Falta categorizar en la planilla" />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <button type="button" className="boton boton--secundario" onClick={alSalir}>
        Salir
      </button>
    </div>
  );
}
