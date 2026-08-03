import type { Gasto } from '../api/gastos';
import type { Lista } from '../api/listas';
import type { Persona } from '../api/personas';
import { calcularBalance } from '../utiles/balance';
import { formatearNumero } from '../utiles/monto';
import './BalanceDeLista.css';

interface Props {
  lista: Lista;
  gastos: Gasto[];
  personas: Persona[];
}

/** El signo va escrito además del color: verde y rojo se confunden en daltonismo. */
function conSigno(valor: number) {
  if (valor === 0) return formatearNumero(0);
  return `${valor > 0 ? '+' : '−'}${formatearNumero(Math.abs(valor))}`;
}

function claseDelNeto(valor: number) {
  if (valor > 0) return 'balance__monto balance__monto--positivo';
  if (valor < 0) return 'balance__monto balance__monto--negativo';
  return 'balance__monto';
}

export function BalanceDeLista({ lista, gastos, personas }: Props) {
  const balance = calcularBalance(lista.participantes, gastos);
  const nombrePorCodigo = new Map(personas.map((una) => [una.codigo, una.nombre]));

  /** "Ana + Juan" para una unidad compartida, o el nombre solo. */
  function nombreDeLaUnidad(codigos: string[]) {
    return codigos
      .map((codigo) => nombrePorCodigo.get(codigo) ?? codigo)
      .join(' + ');
  }

  return (
    <section className="balance">
      <div className="balance__fila balance__fila--total">
        <span>Gastos totales</span>
        <span className="balance__monto numero">{formatearNumero(balance.total)}</span>
      </div>

      {balance.unidades.map((unidad) => (
        <div key={unidad.unidad} className="balance__fila">
          <span>{nombreDeLaUnidad(unidad.codigos)} puso</span>
          <span className="balance__monto numero">{formatearNumero(unidad.aporte)}</span>
        </div>
      ))}

      <div className="balance__rotulo">Neto</div>

      {balance.unidades.map((unidad) => (
        <div key={unidad.unidad} className="balance__fila">
          <span>{nombreDeLaUnidad(unidad.codigos)}</span>
          <span className={`${claseDelNeto(unidad.neto)} numero`}>
            {conSigno(unidad.neto)}
          </span>
        </div>
      ))}
    </section>
  );
}
