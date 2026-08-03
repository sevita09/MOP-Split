import type { Concepto } from '../api/conceptos';
import './GrillaDeConceptos.css';

interface Props {
  conceptos: Concepto[];
  /** El punto de "falta categorizar" solo tiene sentido para quien lo completa. */
  mostrarPendientes: boolean;
  alElegir: (concepto: Concepto) => void;
}

/**
 * Los botones para cargar un gasto.
 *
 * Son grandes, con emoji además del nombre, y de un solo color apagado. Quienes
 * los usan son grandes: conviene un blanco de toque holgado, y el emoji ayuda a
 * encontrar el concepto sin leer. Colorear cada botón distinto no agregaría
 * información —el color en esta app significa deber o que te deban— y le
 * sacaría fuerza a esa señal.
 */
export function GrillaDeConceptos({ conceptos, mostrarPendientes, alElegir }: Props) {
  return (
    <div className="grilla">
      {conceptos.map((concepto) => (
        <button
          key={concepto.id}
          type="button"
          className="concepto"
          onClick={() => alElegir(concepto)}
        >
          {mostrarPendientes && concepto.sinCategorizar && (
            <span className="concepto__pendiente" title="Falta categorizar en la planilla" />
          )}
          <span className="concepto__emoji">{concepto.emoji}</span>
          <span className="concepto__nombre">{concepto.nombre}</span>
        </button>
      ))}
    </div>
  );
}
