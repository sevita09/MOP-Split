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
  const [grupos, setGrupos] = useState<string[][]>([]);
  const [aFusionar, setAFusionar] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);

  const anios = [HOY.getFullYear() - 1, HOY.getFullYear(), HOY.getFullYear() + 1];

  const agrupados = grupos.flat();
  const nombrePorCodigo = new Map(personas.map((una) => [una.codigo, una.nombre]));

  function alternar(codigo: string) {
    if (codigo === persona.codigo) return;

    setElegidos((previos) =>
      previos.includes(codigo)
        ? previos.filter((elegido) => elegido !== codigo)
        : [...previos, codigo],
    );
    // Sacar a alguien de la lista tiene que sacarlo también de su unidad, o se
    // mandaría un grupo con gente que no participa y la planilla lo rechaza.
    setGrupos((previos) =>
      previos
        .map((grupo) => grupo.filter((integrante) => integrante !== codigo))
        .filter((grupo) => grupo.length > 1),
    );
    setAFusionar((previos) => previos.filter((integrante) => integrante !== codigo));
    setError('');
  }

  function alternarFusion(codigo: string) {
    setAFusionar((previos) =>
      previos.includes(codigo)
        ? previos.filter((integrante) => integrante !== codigo)
        : [...previos, codigo],
    );
  }

  function fusionar() {
    if (aFusionar.length < 2) return;
    setGrupos((previos) => [...previos, aFusionar]);
    setAFusionar([]);
  }

  function deshacerGrupo(indice: number) {
    setGrupos((previos) => previos.filter((_, posicion) => posicion !== indice));
  }

  function nombreDe(codigo: string) {
    return nombrePorCodigo.get(codigo) ?? codigo;
  }

  async function alConfirmar() {
    setCreando(true);
    setError('');

    const resultado = await crearLista(credenciales, {
      nombre: nombre.trim(),
      mes,
      anio,
      participantes: elegidos,
      grupos,
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

      <div className="campo">
        <span className="campo__rotulo">Unidades de balance (opcional)</span>
        <span className="campo__ayuda">
          Si dos comparten la plata, fusionalos: la división sigue siendo por cabeza,
          pero deben y les deben como una sola unidad.
        </span>

        {grupos.map((grupo, indice) => (
          <div key={grupo.join('-')} className="unidad">
            <span>{grupo.map(nombreDe).join(' + ')}</span>
            <button
              type="button"
              className="unidad__deshacer"
              onClick={() => deshacerGrupo(indice)}
              aria-label="Deshacer la unidad"
            >
              ✕
            </button>
          </div>
        ))}

        <div className="crear-lista__chips">
          {elegidos
            .filter((codigo) => !agrupados.includes(codigo))
            .map((codigo) => (
              <button
                key={codigo}
                type="button"
                className={aFusionar.includes(codigo) ? 'chip chip--elegido' : 'chip'}
                aria-pressed={aFusionar.includes(codigo)}
                onClick={() => alternarFusion(codigo)}
              >
                {nombreDe(codigo)}
              </button>
            ))}
        </div>

        <button
          type="button"
          className="boton boton--secundario crear-lista__fusionar"
          disabled={aFusionar.length < 2}
          onClick={fusionar}
        >
          Fusionar seleccionados
        </button>
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
