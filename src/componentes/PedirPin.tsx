import { useState } from 'react';
import { iniciarSesion, LARGO_PIN } from '../api/personas';
import type { Persona } from '../api/personas';
import type { Credenciales } from '../api/planilla';
import { TecladoNumerico } from './TecladoNumerico';
import './PedirPin.css';

interface Props {
  persona: Persona;
  credenciales: Credenciales;
  alIngresar: (persona: Persona) => void;
  alVolver: () => void;
}

export function PedirPin({ persona, credenciales, alIngresar, alVolver }: Props) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [validando, setValidando] = useState(false);

  async function validar(completo: string) {
    setValidando(true);
    const resultado = await iniciarSesion(credenciales, persona.codigo, completo);
    setValidando(false);

    if (resultado.ok && resultado.datos) {
      alIngresar(resultado.datos);
      return;
    }

    // El PIN se borra solo al fallar: si quedara escrito habría que borrar seis
    // dígitos a mano antes de poder reintentar.
    setPin('');
    setError(resultado.mensaje);
  }

  function alTocarNumero(digito: string) {
    if (validando) return;

    const nuevo = (pin + digito).slice(0, LARGO_PIN);
    setPin(nuevo);
    setError('');

    if (nuevo.length === LARGO_PIN) void validar(nuevo);
  }

  return (
    <div className="pedir-pin">
      <button type="button" className="pedir-pin__volver" onClick={alVolver}>
        ‹ No soy yo
      </button>

      <header className="pedir-pin__encabezado">
        <h1>Hola, {persona.nombre}</h1>
        <p>Poné tu PIN de {LARGO_PIN} números.</p>
      </header>

      <TecladoNumerico
        alTocarNumero={alTocarNumero}
        alBorrar={() => {
          if (validando) return;
          setPin((previo) => previo.slice(0, -1));
          setError('');
        }}
      >
        <div className="pedir-pin__puntos">
          {Array.from({ length: LARGO_PIN }, (_, indice) => (
            <span
              key={indice}
              className={indice < pin.length ? 'punto punto--lleno' : 'punto'}
            />
          ))}
        </div>
      </TecladoNumerico>

      {validando && <p className="pedir-pin__estado">Verificando…</p>}
      {error !== '' && <p className="aviso aviso--error">✕ {error}</p>}
    </div>
  );
}
