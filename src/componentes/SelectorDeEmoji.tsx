import './SelectorDeEmoji.css';

interface Props {
  elegido: string;
  alElegir: (emoji: string) => void;
}

/**
 * Una lista corta y fija en vez del teclado de emojis del sistema.
 *
 * El del sistema tiene miles y hay que buscar; acá hacen falta doce que cubran
 * los gastos de una casa y se elijan de un toque. Si falta alguno, se cambia el
 * emoji a mano en la planilla, que es cosa de una vez.
 */
export const EMOJIS = [
  '🧾',
  '🛍️',
  '🍕',
  '🚗',
  '💊',
  '🏥',
  '🎁',
  '📚',
  '🐾',
  '✂️',
  '🎬',
  '💳',
];

export function SelectorDeEmoji({ elegido, alElegir }: Props) {
  return (
    <div className="emojis" role="radiogroup" aria-label="Icono del gasto">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          role="radio"
          aria-checked={emoji === elegido}
          className={emoji === elegido ? 'emojis__uno emojis__uno--elegido' : 'emojis__uno'}
          onClick={() => alElegir(emoji)}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
