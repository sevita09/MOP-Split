import { useState } from 'react';
import type { Concepto } from '../api/conceptos';
import { crearGasto } from '../api/gastos';
import type { Credenciales } from '../api/planilla';
import {
  agregarComa,
  agregarDigito,
  borrarUltimo,
  esMontoValido,
  formatearParaMostrar,
  aNumero,
} from '../utiles/monto';
import { TecladoNumerico } from './TecladoNumerico';
import './CargarGasto.css';

interface Props {
  credenciales: Credenciales;
  concepto: Concepto;
  idLista: string;
  alCargar: () => void;
  alCerrar: () => void;
}

/**
 * Hoja para poner el monto del gasto.
 *
 * Sube desde abajo en vez de ser una pantalla aparte: cargar un gasto es la
 * acción más repetida de la app, y volver de una pantalla completa por cada
 * compra cansa. Además, dejar la grilla asomando atrás deja claro de dónde se
 * viene si uno se arrepiente.
 */
export function CargarGasto({
  credenciales,
  concepto,
  idLista,
  alCargar,
  alCerrar,
}: Props) {
  const [monto, setMonto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function confirmar() {
    setGuardando(true);
    setError('');

    const resultado = await crearGasto(credenciales, {
      idLista,
      idConcepto: concepto.id,
      monto: aNumero(monto),
    });

    setGuardando(false);

    if (resultado.ok) {
      alCargar();
      return;
    }

    setError(resultado.mensaje);
  }

  return (
    <div className="cargar-fondo" onClick={alCerrar}>
      <div
        className="cargar"
        role="dialog"
        aria-label={`Cargar ${concepto.nombre}`}
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="cargar__encabezado">
          <span className="cargar__emoji">{concepto.emoji}</span>
          <span className="cargar__nombre">{concepto.nombre}</span>
          <button
            type="button"
            className="cargar__cerrar"
            aria-label="Cerrar"
            onClick={alCerrar}
          >
            ✕
          </button>
        </header>

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
          {guardando ? 'Guardando…' : 'Cargar gasto'}
        </button>

        {error !== '' && <p className="aviso aviso--error">✕ {error}</p>}
      </div>
    </div>
  );
}
