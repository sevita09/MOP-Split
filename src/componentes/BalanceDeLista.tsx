import { useEffect, useState } from 'react';
import type { Gasto } from '../api/gastos';
import { obtenerBalanceCongelado } from '../api/listas';
import type { Lista } from '../api/listas';
import type { Credenciales } from '../api/planilla';
import type { Persona } from '../api/personas';
import { calcularBalance } from '../utiles/balance';
import { calcularTransferencias } from '../utiles/transferencias';
import { formatearNumero } from '../utiles/monto';
import './BalanceDeLista.css';

interface Props {
  credenciales: Credenciales;
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

export function BalanceDeLista({ credenciales, lista, gastos, personas }: Props) {
  const cerrada = lista.estado === 'Cerrada';
  const [congelado, setCongelado] = useState<
    { unidad: string; codigos: string[]; neto: number }[] | null
  >(null);

  useEffect(() => {
    if (!cerrada) return;

    let vigente = true;
    void obtenerBalanceCongelado(credenciales, lista.id).then((resultado) => {
      if (vigente && resultado.ok) setCongelado(resultado.datos ?? []);
    });

    // Si se cambia de lista mientras la respuesta viaja, la vieja llegaría
    // tarde y pisaría el balance de la lista nueva.
    return () => {
      vigente = false;
    };
  }, [credenciales, lista.id, cerrada]);

  const enVivo = calcularBalance(lista.participantes, gastos);

  // En una lista cerrada manda la foto: ese número ya se usó para saldar, así
  // que corregir un gasto viejo no lo tiene que mover.
  const unidades = cerrada ? (congelado ?? []) : enVivo.unidades;
  const transferencias = calcularTransferencias(unidades);
  const nombrePorCodigo = new Map(personas.map((una) => [una.codigo, una.nombre]));

  /** "Ana + Juan" para una unidad compartida, o el nombre solo. */
  function nombreDeLaUnidad(codigos: string[]) {
    return codigos
      .map((codigo) => nombrePorCodigo.get(codigo) ?? codigo)
      .join(' + ');
  }

  const codigosPorUnidad = new Map(unidades.map((una) => [una.unidad, una.codigos]));

  function nombrePorUnidad(unidad: string) {
    return nombreDeLaUnidad(codigosPorUnidad.get(unidad) ?? [unidad]);
  }

  return (
    <section className="balance">
      <div className="balance__fila balance__fila--total">
        <span>Gastos totales</span>
        <span className="balance__monto numero">{formatearNumero(enVivo.total)}</span>
      </div>

      {!cerrada &&
        enVivo.unidades.map((unidad) => (
          <div key={unidad.unidad} className="balance__fila">
            <span>{nombreDeLaUnidad(unidad.codigos)} puso</span>
            <span className="balance__monto numero">{formatearNumero(unidad.aporte)}</span>
          </div>
        ))}

      <div className="balance__rotulo">{cerrada ? 'Neto al cerrar' : 'Neto'}</div>

      {unidades.map((unidad) => (
        <div key={unidad.unidad} className="balance__fila">
          <span>{nombreDeLaUnidad(unidad.codigos)}</span>
          <span className={`${claseDelNeto(unidad.neto)} numero`}>
            {conSigno(unidad.neto)}
          </span>
        </div>
      ))}

      {transferencias.length > 0 && (
        <>
          <div className="balance__rotulo">Para saldar</div>
          {transferencias.map((movimiento) => (
            <div
              key={`${movimiento.desde}-${movimiento.hacia}`}
              className="balance__fila"
            >
              <span>
                {nombrePorUnidad(movimiento.desde)} le paga a{' '}
                {nombrePorUnidad(movimiento.hacia)}
              </span>
              <span className="balance__monto numero">
                {formatearNumero(movimiento.monto)}
              </span>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
