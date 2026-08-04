import { useState } from 'react';
import type { Concepto } from '../api/conceptos';
import type { Gasto } from '../api/gastos';
import type { Lista } from '../api/listas';
import type { Persona } from '../api/personas';
import type { Credenciales } from '../api/planilla';
import { cambiarEstadoDeLista } from '../api/listas';
import { usarGastos } from '../hooks/usarGastos';
import { BalanceDeLista } from '../componentes/BalanceDeLista';
import { CorregirGasto } from '../componentes/CorregirGasto';
import type { Correccion } from '../componentes/CorregirGasto';
import { formatearNumero } from '../utiles/monto';
import { nombreDelPeriodo } from '../utiles/meses';
import './Historial.css';

interface Props {
  credenciales: Credenciales;
  lista: Lista;
  esAdmin: boolean;
  alCambiarEstado: () => void;
  conceptos: Concepto[];
  personas: Persona[];
  alVolver: () => void;
}

const FECHA_CORTA = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' });

export function Historial({
  credenciales,
  lista,
  conceptos,
  personas,
  esAdmin,
  alCambiarEstado,
  alVolver,
}: Props) {
  const { gastos, primeraCarga: cargando, error, recargar } = usarGastos(credenciales, lista.id);
  const [corrigiendo, setCorrigiendo] = useState<{ gasto: Gasto; que: Correccion } | null>(
    null,
  );
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [errorDeEstado, setErrorDeEstado] = useState('');

  const cerrada = lista.estado === 'Cerrada';
  // Esconder el botón es comodidad: la regla de verdad la aplica la planilla.
  const puedeCambiarEstado = esAdmin || lista.esDueño;

  async function alternarEstado() {
    setCambiandoEstado(true);
    setErrorDeEstado('');

    const resultado = await cambiarEstadoDeLista(credenciales, lista.id, !cerrada);

    setCambiandoEstado(false);

    if (resultado.ok) {
      alCambiarEstado();
      return;
    }

    setErrorDeEstado(resultado.mensaje);
  }

  const porConcepto = new Map(conceptos.map((uno) => [uno.id, uno]));
  const nombrePorPersona = new Map(personas.map((una) => [una.codigo, una.nombre]));

  function describir(gasto: Gasto) {
    const concepto = porConcepto.get(gasto.idConcepto);
    return {
      // Un gasto puede apuntar a un concepto borrado a mano de la planilla: sin
      // este respaldo la fila saldría en blanco y no se entendería qué es.
      emoji: concepto?.emoji ?? '🧾',
      nombre: concepto?.nombre ?? 'Concepto borrado',
      quien: nombrePorPersona.get(gasto.codigoPersonaPago) ?? gasto.codigoPersonaPago,
    };
  }

  return (
    <div className="historial">
      <header className="historial__barra">
        <button type="button" className="historial__volver" onClick={alVolver}>
          ‹
        </button>
        <div>
          <h1>Balance</h1>
          <p className="historial__subtitulo">
            {lista.nombre} · {nombreDelPeriodo(lista.mes, lista.anio)}
            {cerrada && ' · cerrada'}
          </p>
        </div>
      </header>

      <div className="historial__cuerpo">
        {cargando && <p className="historial__nota">Cargando…</p>}
        {error !== '' && <p className="aviso aviso--error">✕ {error}</p>}

        {puedeCambiarEstado && (
          <div className="historial__estado">
            <span>{cerrada ? 'El balance quedó congelado.' : 'Lista abierta.'}</span>
            <button
              type="button"
              className="boton boton--secundario boton--chico"
              disabled={cambiandoEstado}
              onClick={() => void alternarEstado()}
            >
              {cambiandoEstado ? '…' : cerrada ? 'Reabrir lista' : 'Cerrar lista'}
            </button>
          </div>
        )}

        {errorDeEstado !== '' && <p className="aviso aviso--error">✕ {errorDeEstado}</p>}

        {!cargando && error === '' && (
          <BalanceDeLista
            credenciales={credenciales}
            lista={lista}
            gastos={gastos}
            personas={personas}
          />
        )}

        {!cargando && error === '' && gastos.length > 0 && (
          <h2 className="historial__rotulo">Gastos</h2>
        )}

        {!cargando && error === '' && gastos.length === 0 && (
          <p className="historial__nota">Todavía no hay gastos en esta lista.</p>
        )}

        {gastos.map((gasto) => {
          const { emoji, nombre, quien } = describir(gasto);

          return (
            <div key={gasto.id} className="gasto">
              <div className="gasto__que">
                <span className="gasto__nombre">
                  {emoji} {nombre}
                </span>
                <span className="gasto__meta">
                  {FECHA_CORTA.format(new Date(gasto.fecha))} · pagó {quien}
                </span>
              </div>
              <div className="gasto__derecha">
                <div className="gasto__importes">
                  {gasto.descuento > 0 && (
                    <span className="gasto__original numero">
                      {formatearNumero(gasto.monto)}
                    </span>
                  )}
                  <span className="gasto__monto numero">
                    {gasto.descuento > 0 && <span className="gasto__etiqueta">🏷️</span>}
                    {formatearNumero(gasto.monto - gasto.descuento)}
                  </span>
                </div>

                {gasto.puedeEditarlo && lista.estado === 'Abierta' && (
                  <>
                    <button
                      type="button"
                      className="gasto__accion"
                      title="Corregir el monto"
                      aria-label={`Corregir el monto de ${nombre}`}
                      onClick={() => setCorrigiendo({ gasto, que: 'monto' })}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="gasto__accion"
                      title="Agregar un descuento"
                      aria-label={`Agregar un descuento a ${nombre}`}
                      onClick={() => setCorrigiendo({ gasto, que: 'descuento' })}
                    >
                      🏷️
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {corrigiendo && (
        <CorregirGasto
          credenciales={credenciales}
          gasto={corrigiendo.gasto}
          nombreDelGasto={describir(corrigiendo.gasto).nombre}
          emoji={describir(corrigiendo.gasto).emoji}
          que={corrigiendo.que}
          alGuardar={() => {
            setCorrigiendo(null);
            void recargar();
          }}
          alCerrar={() => setCorrigiendo(null)}
        />
      )}
    </div>
  );
}
