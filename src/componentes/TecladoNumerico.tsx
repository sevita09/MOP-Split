import './TecladoNumerico.css';

interface Props {
  /** Qué se muestra arriba de las teclas: el PIN en puntitos, un monto, lo que sea. */
  children: React.ReactNode;
  alTocarNumero: (digito: string) => void;
  alBorrar: () => void;
  /** Tecla extra en el hueco de abajo a la izquierda (la coma de los montos). */
  teclaExtra?: { texto: string; alTocar: () => void };
}

const DIGITOS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Teclado propio en vez del nativo del celular.
 *
 * El del sistema aparece y desaparece, tapa media pantalla y sus teclas son
 * chicas. Con uno propio las teclas son grandes y la pantalla no se mueve —
 * que es lo que hace falta acá, donde los usuarios son grandes.
 */
export function TecladoNumerico({ children, alTocarNumero, alBorrar, teclaExtra }: Props) {
  return (
    <div className="teclado">
      <div className="teclado__pantalla">{children}</div>

      <div className="teclado__teclas">
        {DIGITOS.map((digito) => (
          <button
            key={digito}
            type="button"
            className="teclado__tecla"
            onClick={() => alTocarNumero(digito)}
          >
            {digito}
          </button>
        ))}

        {teclaExtra ? (
          <button type="button" className="teclado__tecla teclado__tecla--suave" onClick={teclaExtra.alTocar}>
            {teclaExtra.texto}
          </button>
        ) : (
          <span />
        )}

        <button type="button" className="teclado__tecla" onClick={() => alTocarNumero('0')}>
          0
        </button>

        <button
          type="button"
          className="teclado__tecla teclado__tecla--suave"
          onClick={alBorrar}
          aria-label="Borrar"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
