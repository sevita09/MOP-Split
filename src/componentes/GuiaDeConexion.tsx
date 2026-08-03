import { useState } from 'react';
// El código del backend se sirve como texto desde el mismo archivo que se
// versiona: así el botón de copiar nunca queda desfasado del .gs real.
import codigoDelBackend from '../../apps_script/Codigo.gs?raw';
import './GuiaDeConexion.css';

interface Props {
  tokenSugerido: string;
  alGenerarToken: () => void;
}

export function GuiaDeConexion({ tokenSugerido, alGenerarToken }: Props) {
  const [copiado, setCopiado] = useState<'codigo' | 'token' | null>(null);

  async function copiar(texto: string, cual: 'codigo' | 'token') {
    await navigator.clipboard.writeText(texto);
    setCopiado(cual);
    setTimeout(() => setCopiado(null), 2000);
  }

  return (
    <ol className="guia">
      <li className="guia__paso">
        <h2>Abrí el editor de la planilla</h2>
        <p>
          En tu planilla de Google, entrá a <b>Extensiones → Apps Script</b>. Se abre una
          pestaña nueva con un editor de código.
        </p>
      </li>

      <li className="guia__paso">
        <h2>Pegá el código del backend</h2>
        <p>
          Borrá todo lo que haya en el editor y pegá esto en su lugar. Después guardá con
          el disquete (o <code>Ctrl+S</code>).
        </p>
        <button type="button" className="boton boton--secundario" onClick={() => copiar(codigoDelBackend, 'codigo')}>
          {copiado === 'codigo' ? '✓ Copiado' : 'Copiar código'}
        </button>
      </li>

      <li className="guia__paso">
        <h2>Guardá tu clave secreta</h2>
        <p>
          En el editor, andá al engranaje <b>Configuración del proyecto → Propiedades del
          script → Agregar propiedad</b>. Poné exactamente:
        </p>
        <dl className="guia__propiedad">
          <dt>Nombre</dt>
          <dd><code>TOKEN_SECRETO</code></dd>
          <dt>Valor</dt>
          <dd><code className="guia__token">{tokenSugerido}</code></dd>
        </dl>
        <div className="guia__botones">
          <button type="button" className="boton boton--secundario" onClick={() => copiar(tokenSugerido, 'token')}>
            {copiado === 'token' ? '✓ Copiado' : 'Copiar clave'}
          </button>
          <button type="button" className="boton boton--secundario" onClick={alGenerarToken}>
            Generar otra
          </button>
        </div>
        <p className="guia__nota">
          Es la misma clave que vas a pegar más abajo. La invento yo al azar; si preferís
          otra, escribila y usá esa en los dos lados.
        </p>
      </li>

      <li className="guia__paso">
        <h2>Publicá el backend</h2>
        <p>
          Arriba a la derecha: <b>Implementar → Nueva implementación</b>. Tocá el engranaje
          y elegí <b>Aplicación web</b>. Configurá:
        </p>
        <ul className="guia__lista">
          <li><b>Ejecutar como:</b> Yo</li>
          <li><b>Quién tiene acceso:</b> Cualquier usuario</li>
        </ul>
        <p>
          Tocá <b>Implementar</b>. Google te va a pedir autorización una vez: aceptá y, si
          aparece la pantalla de “Google no verificó esta aplicación”, entrá por
          <b> Configuración avanzada → Ir a (nombre del proyecto)</b>. Es tu propio script.
        </p>
        <p>
          Al terminar copiá la <b>URL de la aplicación web</b>, la que termina en{' '}
          <code>/exec</code>.
        </p>
      </li>

      <li className="guia__paso">
        <h2>Conectá la app</h2>
        <p>
          Pegá acá abajo esa URL y la clave secreta, tocá <b>Guardar</b> y después{' '}
          <b>Probar conexión</b>. Si todo salió bien, se escribe una fila en una hoja nueva
          llamada <code>Ping</code>.
        </p>
      </li>
    </ol>
  );
}
