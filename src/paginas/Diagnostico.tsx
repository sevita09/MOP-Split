import { useState } from 'react';
import { enviarEvento, medicionesRecientes, olvidarMediciones } from '../api/planilla';
import type { Credenciales, Medicion } from '../api/planilla';
import './Diagnostico.css';

interface Props {
  credenciales: Credenciales;
  idLista: string;
  alVolver: () => void;
}

/** Los tres pedidos que dispara la app al abrirse. */
const PEDIDOS_DEL_ARRANQUE = ['OBTENER_LISTAS', 'OBTENER_CONCEPTOS', 'OBTENER_PERSONAS'];

interface Comparacion {
  juntos: number;
  deAUno: number;
}

/**
 * Cuánto tarda hablar con la planilla, medido en el aparato donde molesta.
 *
 * Existe porque la consola del navegador no se puede abrir en el celular, que
 * es justo donde se nota la demora. Sin esto, optimizar sería adivinar.
 */
export function Diagnostico({ credenciales, idLista, alVolver }: Props) {
  const [mediciones, setMediciones] = useState<Medicion[]>(medicionesRecientes);
  const [comparacion, setComparacion] = useState<Comparacion | null>(null);
  const [midiendo, setMidiendo] = useState(false);

  async function medirArranque() {
    setMidiendo(true);
    setComparacion(null);

    const pedir = (accion: string) => enviarEvento(credenciales, accion, { idLista });

    // Todos a la vez, como los lanza la app hoy.
    const antesDeJuntos = performance.now();
    await Promise.all(PEDIDOS_DEL_ARRANQUE.map(pedir));
    const juntos = Math.round(performance.now() - antesDeJuntos);

    // Y ahora uno después del otro. Si los dos números se parecen, Apps Script
    // los está atendiendo de a uno igual, y juntar los pedidos en uno solo va a
    // servir. Si "juntos" es mucho menor, el paralelo ya funciona y el tiempo
    // se va en otro lado.
    const antesDeAUno = performance.now();
    for (const accion of PEDIDOS_DEL_ARRANQUE) await pedir(accion);
    const deAUno = Math.round(performance.now() - antesDeAUno);

    setComparacion({ juntos, deAUno });
    setMediciones(medicionesRecientes());
    setMidiendo(false);
  }

  const promedioPorAccion = new Map<string, { total: number; veces: number }>();
  mediciones.forEach((una) => {
    const acumulado = promedioPorAccion.get(una.accion) ?? { total: 0, veces: 0 };
    promedioPorAccion.set(una.accion, {
      total: acumulado.total + una.milisegundos,
      veces: acumulado.veces + 1,
    });
  });

  return (
    <div className="diagnostico">
      <header className="diagnostico__barra">
        <button type="button" className="historial__volver" onClick={alVolver}>
          ‹
        </button>
        <h1>Diagnóstico</h1>
      </header>

      <div className="diagnostico__cuerpo">
        <section>
          <h2 className="diagnostico__rotulo">Prueba del arranque</h2>
          <p className="diagnostico__nota">
            Corre los {PEDIDOS_DEL_ARRANQUE.length} pedidos del arranque dos veces: todos
            juntos y después de a uno. Si los tiempos se parecen, la planilla los atiende
            de a uno igual y conviene juntarlos en un solo pedido.
          </p>
          <button
            type="button"
            className="boton boton--primario boton--ancho"
            disabled={midiendo}
            onClick={() => void medirArranque()}
          >
            {midiendo ? 'Midiendo…' : 'Medir el arranque'}
          </button>

          {comparacion && (
            <div className="diagnostico__tabla">
              <div className="diagnostico__fila">
                <span>Los tres juntos</span>
                <span className="numero">{comparacion.juntos} ms</span>
              </div>
              <div className="diagnostico__fila">
                <span>Los tres de a uno</span>
                <span className="numero">{comparacion.deAUno} ms</span>
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="diagnostico__rotulo">Promedio por evento</h2>
          {promedioPorAccion.size === 0 && (
            <p className="diagnostico__nota">Todavía no hay pedidos registrados.</p>
          )}
          <div className="diagnostico__tabla">
            {[...promedioPorAccion.entries()].map(([accion, { total, veces }]) => (
              <div key={accion} className="diagnostico__fila">
                <span>
                  {accion} <span className="diagnostico__veces">×{veces}</span>
                </span>
                <span className="numero">{Math.round(total / veces)} ms</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="diagnostico__rotulo">Últimos pedidos</h2>
          <div className="diagnostico__tabla">
            {mediciones.map((una, indice) => (
              <div key={`${una.cuando}-${indice}`} className="diagnostico__fila">
                <span>
                  {una.ok ? '' : '✕ '}
                  {una.accion}
                </span>
                <span className="numero">{una.milisegundos} ms</span>
              </div>
            ))}
          </div>
        </section>

        <div className="diagnostico__acciones">
          <button
            type="button"
            className="boton boton--secundario"
            onClick={() => setMediciones(medicionesRecientes())}
          >
            Actualizar
          </button>
          <button
            type="button"
            className="boton boton--secundario"
            onClick={() => {
              olvidarMediciones();
              setMediciones([]);
            }}
          >
            Borrar
          </button>
        </div>
      </div>
    </div>
  );
}
