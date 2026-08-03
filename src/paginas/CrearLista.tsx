import { useState } from 'react';
import { crearLista } from '../api/listas';
import type { Persona } from '../api/personas';
import type { Credenciales } from '../api/planilla';
import { usarPersonas } from '../hooks/usarPersonas';
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
  const { personas } = usarPersonas(credenciales);
  const [nombre, setNombre] = useState('');
  const [mes, setMes] = useState(HOY.getMonth() + 1);
  const [anio, setAnio] = useState(HOY.getFullYear());
  // Quien crea la lista participa siempre y no se puede sacar: la vista filtra
  // por participación, así que si no estuviera no vería su propia lista.
  const [elegidos, setElegidos] = useState<string[]>([persona.codigo]);
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);

  const anios = [HOY.getFullYear() - 1, HOY.getFullYear(), HOY.getFullYear() + 1];

  function alternar(codigo: string) {
    if (codigo === persona.codigo) return;

    setElegidos((previos) =>
      previos.includes(codigo)
        ? previos.filter((elegido) => elegido !== codigo)
        : [...previos, codigo],
    );
    setError('');
  }

  async function alConfirmar() {
    setCreando(true);
    setError('');

    const resultado = await crearLista(credenciales, {
      nombre: nombre.trim(),
      mes,
      anio,
      participantes: elegidos,
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

      <div className="campo">
        <span className="campo__rotulo">Participantes</span>
        <div className="crear-lista__chips">
          {personas.map((candidata) => {
            const elegido = elegidos.includes(candidata.codigo);
            const soyYo = candidata.codigo === persona.codigo;

            return (
              <button
                key={candidata.codigo}
                type="button"
                className={elegido ? 'chip chip--elegido' : 'chip'}
                aria-pressed={elegido}
                disabled={soyYo}
                onClick={() => alternar(candidata.codigo)}
              >
                {candidata.nombre}
                {soyYo && ' (vos)'}
              </button>
            );
          })}
        </div>
        <span className="campo__ayuda">
          Cada gasto se divide en partes iguales entre estas personas.
        </span>
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
