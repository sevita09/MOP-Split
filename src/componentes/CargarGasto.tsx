import { useState } from 'react';
import type { Concepto } from '../api/conceptos';
import { crearGasto } from '../api/gastos';
import type { Lista } from '../api/listas';
import type { Credenciales } from '../api/planilla';
import { nombreDelPeriodo } from '../utiles/meses';
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
  /** Para poder ofrecer otra si la elegida se cerró desde otro celular. */
  listasAbiertas: Lista[];
  alCargar: (idConcepto: string) => void;
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
  listasAbiertas,
  alCargar,
  alCerrar,
}: Props) {
  const esNuevo = concepto === null;

  const [monto, setMonto] = useState('');
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');


  // Cuando la lista se cerró mientras cargabas, se ofrecen las abiertas en vez
  // de perder lo escrito. El monto queda intacto.
  const [aDondeVa, setADondeVa] = useState<string>(idLista);
  const [hayQueElegirLista, setHayQueElegirLista] = useState(false);

  const listo = esMontoValido(monto) && (!esNuevo || nombre.trim() !== '');

  async function confirmar() {
    setGuardando(true);
    setError('');

    const resultado = await crearGasto(credenciales, {
      idLista: aDondeVa,
      monto: aNumero(monto),
      ...(esNuevo ? { conceptoNuevo: nombre.trim() } : { idConcepto: concepto.id }),
    });

    setGuardando(false);

    if (resultado.ok && resultado.datos !== null) {
      alCargar(resultado.datos);
      return;
    }

    if (resultado.codigo === 'LISTA_CERRADA') {
      setHayQueElegirLista(true);
      setError(resultado.mensaje);
      return;
    }

    // El monto queda escrito a propósito: reintentar tiene que ser un toque,
    // no volver a teclear todo.
    setError(`${resultado.mensaje} El gasto no se guardó, probá de nuevo.`);
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

        {hayQueElegirLista && (
          <div className="cargar__otra-lista">
            <span className="campo__rotulo">¿En cuál lo cargamos?</span>
            {listasAbiertas.length === 0 ? (
              <p className="cargar__referencia">
                No te queda ninguna lista abierta. Creá una y volvé a cargarlo.
              </p>
            ) : (
              listasAbiertas.map((otra) => (
                <button
                  key={otra.id}
                  type="button"
                  className={
                    otra.id === aDondeVa
                      ? 'boton boton--primario boton--ancho'
                      : 'boton boton--secundario boton--ancho'
                  }
                  onClick={() => {
                    setADondeVa(otra.id);
                    setHayQueElegirLista(false);
                    setError('');
                  }}
                >
                  {otra.nombre} · {nombreDelPeriodo(otra.mes, otra.anio)}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
