import type { Concepto } from '../api/conceptos';
import type { Gasto } from '../api/gastos';
import type { Persona } from '../api/personas';
import { fechaConMesEnLetras } from '../utiles/meses';
import { formatearNumero } from '../utiles/monto';
import type { Correccion } from './CorregirGasto';
import './ListaDeGastos.css';

interface Props {
  gastos: Gasto[];
  conceptos: Concepto[];
  personas: Persona[];
  /** `null` en una lista cerrada: sus gastos ya no se tocan. */
  alCorregir: ((gasto: Gasto, que: Correccion) => void) | null;
}

/**
 * Una fecha que no se pudo leer se dice, no se inventa.
 *
 * Antes esto mostraba "31 dic" —el 1/1/1970 UTC visto desde acá— y parecía un
 * dato de verdad. Es peor que un hueco: manda a buscar el error donde no está.
 */
function fechaDelGasto(momento: number | null) {
  return momento === null || momento === 0 ? 'sin fecha' : fechaConMesEnLetras(momento);
}

export function ListaDeGastos({ gastos, conceptos, personas, alCorregir }: Props) {
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

  if (gastos.length === 0) {
    return <p className="gastos__vacio">Todavía no hay gastos en esta lista.</p>;
  }

  return (
    <>
      <h2 className="gastos__rotulo">Gastos</h2>

      {gastos.map((gasto) => {
        const { emoji, nombre, quien } = describir(gasto);

        return (
          <div key={gasto.id} className="gasto">
            <div className="gasto__que">
              <span className="gasto__nombre">
                {emoji} {nombre}
              </span>
              <span className="gasto__meta">
                {fechaDelGasto(gasto.fecha)} · pagó {quien}
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

              {alCorregir && gasto.puedeEditarlo && (
                <>
                  <button
                    type="button"
                    className="gasto__accion"
                    title="Corregir el monto"
                    aria-label={`Corregir el monto de ${nombre}`}
                    onClick={() => alCorregir(gasto, 'monto')}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="gasto__accion"
                    title="Agregar un descuento"
                    aria-label={`Agregar un descuento a ${nombre}`}
                    onClick={() => alCorregir(gasto, 'descuento')}
                  >
                    🏷️
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
