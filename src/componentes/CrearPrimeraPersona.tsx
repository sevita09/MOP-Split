import { useState } from 'react';
import { crearPrimeraPersona, LARGO_PIN } from '../api/personas';
import type { Sesion } from '../api/personas';
import type { Credenciales } from '../api/planilla';
import { TecladoNumerico } from './TecladoNumerico';
import './PedirPin.css';

interface Props {
  credenciales: Credenciales;
  alCrear: (sesion: Sesion) => void;
}

/**
 * Alta de la primera persona, que queda como administradora.
 *
 * Solo aparece con la hoja Personas vacía. Es la única forma de arrancar: sin
 * nadie cargado no hay PIN contra el cual validar, así que no puede pedir
 * autenticación. Al resto de la familia la agrega el admin a mano en la
 * planilla.
 */
export function CrearPrimeraPersona({ credenciales, alCrear }: Props) {
  const [nombre, setNombre] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);

  const listo = nombre.trim() !== '' && pin.length === LARGO_PIN;

  async function alConfirmar() {
    setCreando(true);
    const resultado = await crearPrimeraPersona(credenciales, nombre.trim(), pin);
    setCreando(false);

    if (resultado.ok && resultado.datos) {
      alCrear(resultado.datos);
      return;
    }

    setPin('');
    setError(resultado.mensaje);
  }

  return (
    <div className="pedir-pin">
      <header className="pedir-pin__encabezado">
        <h1>Sos el primero</h1>
        <p>
          La planilla está vacía. Cargate a vos y quedás como administrador; al resto los
          agregás después.
        </p>
      </header>

      <label className="campo">
        <span className="campo__rotulo">Tu nombre</span>
        <input
          type="text"
          autoCapitalize="words"
          placeholder="Tu nombre"
          value={nombre}
          onChange={(evento) => {
            setNombre(evento.target.value);
            setError('');
          }}
        />
      </label>

      <TecladoNumerico
        alTocarNumero={(digito) => {
          if (creando) return;
          setPin((previo) => (previo + digito).slice(0, LARGO_PIN));
          setError('');
        }}
        alBorrar={() => {
          if (creando) return;
          setPin((previo) => previo.slice(0, -1));
          setError('');
        }}
      >
        <div className="pedir-pin__puntos">
          {Array.from({ length: LARGO_PIN }, (_, indice) => (
            <span key={indice} className={indice < pin.length ? 'punto punto--lleno' : 'punto'} />
          ))}
        </div>
      </TecladoNumerico>

      <p className="campo__ayuda">
        Elegí un PIN de {LARGO_PIN} números que puedas recordar. Se guarda en tu planilla.
      </p>

      <button
        type="button"
        className="boton boton--primario boton--ancho"
        disabled={!listo || creando}
        onClick={alConfirmar}
      >
        {creando ? 'Creando…' : 'Crear mi usuario'}
      </button>

      {error !== '' && <p className="aviso aviso--error">✕ {error}</p>}
    </div>
  );
}
