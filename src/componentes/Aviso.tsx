import { useEffect, useState } from 'react';
import './Aviso.css';

interface Props {
  /** Cambiar el texto vuelve a mostrar el aviso, aunque diga lo mismo. */
  texto: string;
  /** Cuenta cuántas veces se pidió mostrarlo, para poder repetir el mismo texto. */
  version: number;
}

const DURACION_MS = 2600;

/**
 * Tira que confirma que algo se guardó y se va sola.
 *
 * Sin botón de cerrar: no hay nada que decidir, y un aviso que hay que despedir
 * a mano interrumpe justo cuando alguien está cargando varios gastos seguidos.
 */
export function Aviso({ texto, version }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (version === 0) return;

    setVisible(true);
    const reloj = setTimeout(() => setVisible(false), DURACION_MS);

    // Si llega otro aviso antes de que se vaya el anterior, se cancela el reloj
    // viejo: si no, el primero apagaría al segundo antes de tiempo.
    return () => clearTimeout(reloj);
  }, [version]);

  return (
    <div className={visible ? 'aviso-flotante aviso-flotante--visible' : 'aviso-flotante'} role="status">
      <span className="aviso-flotante__tilde">✓</span>
      {texto}
    </div>
  );
}
