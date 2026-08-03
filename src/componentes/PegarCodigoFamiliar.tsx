import { useState } from 'react';
import { enviarEvento } from '../api/planilla';
import type { Credenciales } from '../api/planilla';
import { leerCodigoFamiliar } from '../utiles/codigoFamiliar';
import './PegarCodigoFamiliar.css';

interface Props {
  alConectar: (credenciales: Credenciales) => void;
  alPedirConfiguracion: () => void;
}

export function PegarCodigoFamiliar({ alConectar, alPedirConfiguracion }: Props) {
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
  const [probando, setProbando] = useState(false);

  async function alAceptar() {
    const credenciales = leerCodigoFamiliar(texto);

    if (!credenciales) {
      setError('Ese código no es válido. Fijate de haberlo copiado entero.');
      return;
    }

    // Se prueba la conexión antes de guardar: si el código quedó viejo, es mejor
    // enterarse acá que después, con la app ya "configurada" y sin funcionar.
    setProbando(true);
    const respuesta = await enviarEvento(credenciales, 'PING');
    setProbando(false);

    if (respuesta.estado !== 'ok') {
      setError(respuesta.mensaje);
      return;
    }

    alConectar(credenciales);
  }

  return (
    <div className="pegar-codigo">
      <header className="pegar-codigo__encabezado">
        <h1>Split Familiar</h1>
        <p>Pegá el código que te pasaron y listo.</p>
      </header>

      <label className="campo">
        <span className="campo__rotulo">Código familiar</span>
        <textarea
          rows={3}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="SPLIT1-…"
          value={texto}
          onChange={(evento) => {
            setTexto(evento.target.value);
            setError('');
          }}
        />
      </label>

      <button
        type="button"
        className="boton boton--primario boton--ancho"
        disabled={texto.trim() === '' || probando}
        onClick={alAceptar}
      >
        {probando ? 'Conectando…' : 'Conectar'}
      </button>

      {error !== '' && <p className="aviso aviso--error">✕ {error}</p>}

      <button type="button" className="pegar-codigo__enlace" onClick={alPedirConfiguracion}>
        No tengo código: quiero conectar la planilla
      </button>
    </div>
  );
}
