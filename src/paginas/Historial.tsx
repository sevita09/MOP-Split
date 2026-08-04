import { useState } from 'react';
import type { Concepto } from '../api/conceptos';
import type { Gasto } from '../api/gastos';
import type { Lista } from '../api/listas';
import type { Persona } from '../api/personas';
import type { Credenciales } from '../api/planilla';
import { usarGastos } from '../hooks/usarGastos';
import { BalanceDeLista } from '../componentes/BalanceDeLista';
import { EstadoDeLista } from '../componentes/EstadoDeLista';
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

/**
 * Una fecha que no se pudo leer se dice, no se inventa.
 *
 * Antes esto mostraba "31 dic" —el 1/1/1970 UTC visto desde acá— y parecía un
 * dato de verdad. Es peor que un hueco: manda a buscar el error donde no está.
 */
function fechaCorta(momento: number | null) {
  return momento === null || momento === 0 ? 'sin fecha' : FECHA_CORTA.format(new Date(momento));
}

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
  const cerrada = lista.estado === 'Cerrada';

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

        <EstadoDeLista
          credenciales={credenciales}
          lista={lista}
          esAdmin={esAdmin}
          alCambiar={alCambiarEstado}
        />

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
                  {fechaCorta(gasto.fecha)} · pagó {quien}
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
