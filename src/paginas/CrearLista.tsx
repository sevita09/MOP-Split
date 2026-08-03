import { useState } from 'react';
import { crearLista } from '../api/listas';
import type { Persona } from '../api/personas';
import type { Credenciales } from '../api/planilla';
import { NUMEROS_DE_MES, nombreDelMes } from '../utiles/meses';
import './CrearLista.css';

interface Props {
  credenciales: Credenciales;
  persona: Persona;
  alCrear: () => void;
  alVolver: () => void;
}

const HOY = new Date();

export function CrearLista({ credenciales, persona, alCrear, alVolver }: Props) {
  const [nombre, setNombre] = useState('');
  const [mes, setMes] = useState(HOY.getMonth() + 1);
  const [anio, setAnio] = useState(HOY.getFullYear());
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);

  const anios = [HOY.getFullYear() - 1, HOY.getFullYear(), HOY.getFullYear() + 1];

  async function alConfirmar() {
    setCreando(true);
    setError('');

    const resultado = await crearLista(credenciales, {
      nombre: nombre.trim(),
      mes,
      anio,
      // Quien crea la lista siempre participa: la vista filtra por
      // participación, así que si no estuviera no la vería ni él mismo.
      participantes: [persona.codigo],
      grupos: [],
    });

    setCreando(false);

    if (resultado.ok) {
      alCrear();
      return;
    }

    setError(resultado.mensaje);
  }

  return (
    <div className="crear-lista">
      <button type="button" className="crear-lista__volver" onClick={alVolver}>
        ‹ Volver
      </button>

      <header className="crear-lista__encabezado">
        <h1>Nueva lista</h1>
      </header>

      <label className="campo">
        <span className="campo__rotulo">Nombre</span>
        <input
          type="text"
          autoCapitalize="sentences"
          placeholder="Casa, Viaje, Súper…"
          value={nombre}
          onChange={(evento) => {
            setNombre(evento.target.value);
            setError('');
          }}
        />
      </label>

      <div className="crear-lista__periodo">
        <label className="campo">
          <span className="campo__rotulo">Mes</span>
          <select value={mes} onChange={(evento) => setMes(Number(evento.target.value))}>
            {NUMEROS_DE_MES.map((numero) => (
              <option key={numero} value={numero}>
                {nombreDelMes(numero)}
              </option>
            ))}
          </select>
        </label>

        <label className="campo">
          <span className="campo__rotulo">Año</span>
          <select value={anio} onChange={(evento) => setAnio(Number(evento.target.value))}>
            {anios.map((valor) => (
              <option key={valor} value={valor}>
                {valor}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        className="boton boton--verde boton--ancho"
        disabled={nombre.trim() === '' || creando}
        onClick={alConfirmar}
      >
        {creando ? 'Creando…' : 'Crear lista'}
      </button>

      {error !== '' && <p className="aviso aviso--error">✕ {error}</p>}
    </div>
  );
}
