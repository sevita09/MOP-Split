import type { Concepto } from '../api/conceptos';
import type { Gasto } from '../api/gastos';
import type { Lista } from '../api/listas';
import type { Persona } from '../api/personas';
import type { Credenciales } from '../api/planilla';
import { usarGastos } from '../hooks/usarGastos';
import { formatearNumero } from '../utiles/monto';
import { nombreDelPeriodo } from '../utiles/meses';
import './Historial.css';

interface Props {
  credenciales: Credenciales;
  lista: Lista;
  conceptos: Concepto[];
  personas: Persona[];
  alVolver: () => void;
}

const FECHA_CORTA = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' });

export function Historial({ credenciales, lista, conceptos, personas, alVolver }: Props) {
  const { gastos, cargando, error } = usarGastos(credenciales, lista.id);

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
          <h1>Gastos</h1>
          <p className="historial__subtitulo">
            {lista.nombre} · {nombreDelPeriodo(lista.mes, lista.anio)}
          </p>
        </div>
      </header>

      <div className="historial__cuerpo">
        {cargando && <p className="historial__nota">Cargando…</p>}
        {error !== '' && <p className="aviso aviso--error">✕ {error}</p>}

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
              <span className="gasto__monto numero">{formatearNumero(gasto.monto)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
