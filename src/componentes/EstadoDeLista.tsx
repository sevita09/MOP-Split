import { useState } from 'react';
import { cambiarEstadoDeLista } from '../api/listas';
import type { Lista } from '../api/listas';
import type { Credenciales } from '../api/planilla';
import './EstadoDeLista.css';

interface Props {
  credenciales: Credenciales;
  lista: Lista;
  esAdmin: boolean;
  alCambiar: () => void;
}

/**
 * El cartel de abierta o cerrada, con el botón para cambiarlo.
 *
 * Vive en su propio componente porque lo usan la pantalla principal y la del
 * balance. Si cada una lo escribiera por su lado, la regla de quién puede
 * cerrar terminaría dicha de dos maneras y alguna de las dos quedaría vieja.
 *
 * Esconder el botón es comodidad: lo que de verdad impide cerrar una lista
 * ajena es la comprobación que hace la planilla.
 */
export function EstadoDeLista({ credenciales, lista, esAdmin, alCambiar }: Props) {
  const [cambiando, setCambiando] = useState(false);
  const [error, setError] = useState('');

  const cerrada = lista.estado === 'Cerrada';
  const puedeCambiar = esAdmin || lista.esDueño;

  async function alternar() {
    setCambiando(true);
    setError('');

    const resultado = await cambiarEstadoDeLista(credenciales, lista.id, !cerrada);

    setCambiando(false);

    if (resultado.ok) {
      alCambiar();
      return;
    }

    setError(resultado.mensaje);
  }

  return (
    <>
      <div className={cerrada ? 'estado-lista estado-lista--cerrada' : 'estado-lista'}>
        <span>
          {cerrada
            ? 'Lista cerrada. El balance quedó congelado.'
            : 'Lista abierta.'}
        </span>
        {puedeCambiar && (
          <button
            type="button"
            className="boton boton--secundario boton--chico"
            disabled={cambiando}
            onClick={() => void alternar()}
          >
            {cambiando ? '…' : cerrada ? 'Reabrir' : 'Cerrar lista'}
          </button>
        )}
      </div>

      {error !== '' && <p className="aviso aviso--error">✕ {error}</p>}
    </>
  );
}
