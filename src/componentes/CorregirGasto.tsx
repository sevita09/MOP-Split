import { useState } from 'react';
import { editarGasto } from '../api/gastos';
import type { Gasto } from '../api/gastos';
import type { Credenciales } from '../api/planilla';
import {
  agregarComa,
  agregarDigito,
  borrarUltimo,
  esMontoValido,
  formatearNumero,
  formatearParaMostrar,
  aNumero,
} from '../utiles/monto';
import { TecladoNumerico } from './TecladoNumerico';
import './CargarGasto.css';

interface Props {
  credenciales: Credenciales;
  gasto: Gasto;
  nombreDelGasto: string;
  emoji: string;
  alGuardar: () => void;
  alCerrar: () => void;
}

/**
 * Corrige el monto de un gasto ya cargado.
 *
 * Reusa el mismo teclado que la carga: es la misma tarea —escribir plata— y
 * cambiarle la forma según el caso obligaría a aprender dos cosas parecidas.
 */
export function CorregirGasto({
  credenciales,
  gasto,
  nombreDelGasto,
  emoji,
  alGuardar,
  alCerrar,
}: Props) {
  const [monto, setMonto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function confirmar() {
    setGuardando(true);
    setError('');

    const resultado = await editarGasto(credenciales, gasto.id, { monto: aNumero(monto) });

    setGuardando(false);

    if (resultado.ok) {
      alGuardar();
      return;
    }

    setError(resultado.mensaje);
  }

  return (
    <div className="cargar-fondo" onClick={alCerrar}>
      <div
        className="cargar"
        role="dialog"
        aria-label="Corregir el monto"
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="cargar__encabezado">
          <span className="cargar__emoji">{emoji}</span>
          <span className="cargar__nombre">{nombreDelGasto}</span>
          <button
            type="button"
            className="cargar__cerrar"
            aria-label="Cerrar"
            onClick={alCerrar}
          >
            ✕
          </button>
        </header>

        <p className="cargar__referencia">Ahora dice {formatearNumero(gasto.monto)}.</p>

        <TecladoNumerico
          alTocarNumero={(digito) => !guardando && setMonto(agregarDigito(monto, digito))}
          alBorrar={() => !guardando && setMonto(borrarUltimo(monto))}
          teclaExtra={{ texto: ',', alTocar: () => !guardando && setMonto(agregarComa(monto)) }}
        >
          <span className="cargar__monto numero">{formatearParaMostrar(monto)}</span>
        </TecladoNumerico>

        <button
          type="button"
          className="boton boton--primario boton--ancho"
          disabled={!esMontoValido(monto) || guardando}
          onClick={() => void confirmar()}
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>

        {error !== '' && <p className="aviso aviso--error">✕ {error}</p>}
      </div>
    </div>
  );
}
