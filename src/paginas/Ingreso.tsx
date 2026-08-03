import { useState } from 'react';
import type { Persona } from '../api/personas';
import type { Credenciales } from '../api/planilla';
import { usarPersonas } from '../hooks/usarPersonas';
import { PedirPin } from '../componentes/PedirPin';
import './Ingreso.css';

interface Props {
  credenciales: Credenciales;
  alIngresar: (persona: Persona) => void;
}

/** Iniciales para el círculo: "Mamá" → M, "Juan Pablo" → JP. */
function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter((parte) => parte !== '')
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('');
}

export function Ingreso({ credenciales, alIngresar }: Props) {
  const { personas, cargando, error, recargar } = usarPersonas(credenciales);
  const [elegida, setElegida] = useState<Persona | null>(null);

  if (elegida) {
    return (
      <PedirPin
        persona={elegida}
        credenciales={credenciales}
        alIngresar={alIngresar}
        alVolver={() => setElegida(null)}
      />
    );
  }

  if (cargando) {
    return (
      <div className="ingreso">
        <p className="ingreso__estado">Buscando quién sos…</p>
      </div>
    );
  }

  if (error !== '') {
    return (
      <div className="ingreso">
        <p className="aviso aviso--error">✕ {error}</p>
        <button type="button" className="boton boton--secundario" onClick={() => void recargar()}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="ingreso">
      <header className="ingreso__encabezado">
        <h1>¿Quién sos?</h1>
        <p>Tocá tu nombre.</p>
      </header>

      <div className="ingreso__personas">
        {personas.map((persona) => (
          <button
            key={persona.codigo}
            type="button"
            className="persona"
            onClick={() => setElegida(persona)}
          >
            <span className="persona__inicial">{iniciales(persona.nombre)}</span>
            <span className="persona__nombre">{persona.nombre}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
