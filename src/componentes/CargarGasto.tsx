import { useState } from 'react';
import type { Concepto } from '../api/conceptos';
import { crearConcepto } from '../api/conceptos';
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
  /** `null` cuando se está cargando un concepto que todavía no existe. */
  concepto: Concepto | null;
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
  const esNuevo = concepto === null;

  const [monto, setMonto] = useState('');
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // Si el concepto se creó pero el gasto falló, se recuerda su id: al
  // reintentar hay que cargar el gasto, no crear el concepto de nuevo.
  const [idYaCreado, setIdYaCreado] = useState<string | null>(null);

  const listo = esMontoValido(monto) && (!esNuevo || nombre.trim() !== '');

  async function confirmar() {
    setGuardando(true);
    setError('');

    let idConcepto = concepto?.id ?? idYaCreado;

    if (idConcepto === null || idConcepto === undefined) {
      const creado = await crearConcepto(credenciales, nombre.trim());

      if (!creado.ok || !creado.datos) {
        setGuardando(false);
        setError(creado.mensaje);
        return;
      }

      idConcepto = creado.datos.id;
      setIdYaCreado(idConcepto);
    }

    const resultado = await crearGasto(credenciales, {
      idLista,
      idConcepto,
      monto: aNumero(monto),
    });

    setGuardando(false);

    if (resultado.ok) {
      alCargar();
      return;
    }

    // El monto queda escrito a propósito: reintentar tiene que ser un toque,
    // no volver a teclear todo.
    setError(
      esNuevo && idYaCreado === null
        ? `${resultado.mensaje} El gasto no se guardó — el concepto ya quedó creado, así que tocá otra vez "Cargar gasto".`
        : `${resultado.mensaje} El gasto no se guardó, probá de nuevo.`,
    );
  }

  return (
    <div className="cargar-fondo" onClick={alCerrar}>
      <div
        className="cargar"
        role="dialog"
        aria-label={esNuevo ? 'Cargar un gasto nuevo' : `Cargar ${concepto.nombre}`}
        onClick={(evento) => evento.stopPropagation()}
      >
        <header className="cargar__encabezado">
          <span className="cargar__emoji">{esNuevo ? '🧾' : concepto.emoji}</span>
          <span className="cargar__nombre">
            {esNuevo ? 'Gasto nuevo' : concepto.nombre}
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

        {esNuevo && (
          <div className="cargar__nuevo">
            <label className="campo">
              <span className="campo__rotulo">¿De qué es?</span>
              <input
                type="text"
                autoCapitalize="sentences"
                placeholder="Verdulería, peluquería…"
                value={nombre}
                disabled={idYaCreado !== null}
                onChange={(evento) => {
                  setNombre(evento.target.value);
                  setError('');
                }}
              />
            </label>
            <span className="campo__ayuda">
              Le va a quedar el ícono 🧾 hasta que el administrador le ponga el que
              corresponde, en la planilla.
            </span>
          </div>
        )}

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
          disabled={!listo || guardando}
          onClick={() => void confirmar()}
        >
          {guardando ? 'Guardando…' : 'Cargar gasto'}
        </button>

        {error !== '' && <p className="aviso aviso--error">✕ {error}</p>}
      </div>
    </div>
  );
}
