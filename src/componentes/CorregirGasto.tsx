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

export type Correccion = 'monto' | 'descuento';

interface Props {
  credenciales: Credenciales;
  gasto: Gasto;
  nombreDelGasto: string;
  emoji: string;
  que: Correccion;
  alGuardar: () => void;
  alCerrar: () => void;
}

/**
 * Corrige el monto de un gasto, o le agrega un descuento.
 *
 * Reusa el mismo teclado que la carga: es la misma tarea —escribir plata— y
 * cambiarle la forma según el caso obligaría a aprender dos cosas parecidas.
 */
export function CorregirGasto({
  credenciales,
  gasto,
  nombreDelGasto,
  emoji,
  que,
  alGuardar,
  alCerrar,
}: Props) {
  const esDescuento = que === 'descuento';

  const [monto, setMonto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const valor = aNumero(monto);
  const excedido = esDescuento && valor > gasto.monto;

  async function confirmar() {
    setGuardando(true);
    setError('');

    const resultado = await editarGasto(
      credenciales,
      gasto.id,
      esDescuento ? { descuento: valor } : { monto: valor },
    );

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
        aria-label={esDescuento ? 'Agregar un descuento' : 'Corregir el monto'}
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="cargar__encabezado">
          <span className="cargar__emoji">{esDescuento ? '🏷️' : emoji}</span>
          <span className="cargar__nombre">
            {esDescuento ? `Descuento · ${nombreDelGasto}` : nombreDelGasto}
          </span>
          <button
            type="button"
            className="cargar__cerrar"
            aria-label="Cerrar"
            onClick={alCerrar}
          >
            ✕
          </button>
        </header>

        <p className="cargar__referencia">
          {esDescuento
            ? `El gasto es de ${formatearNumero(gasto.monto)}. Poné cuánto te devolvieron.`
            : `Ahora dice ${formatearNumero(gasto.monto)}.`}
        </p>

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
          disabled={!esMontoValido(monto) || excedido || guardando}
          onClick={() => void confirmar()}
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>

        {excedido && (
          <p className="aviso aviso--error">
            ✕ El descuento no puede ser mayor que el gasto.
          </p>
        )}
        {error !== '' && <p className="aviso aviso--error">✕ {error}</p>}
      </div>
    </div>
  );
}
