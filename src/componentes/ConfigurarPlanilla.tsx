import { useState } from 'react';
import { enviarEvento } from '../api/planilla';
import type { Credenciales } from '../api/planilla';
import { usarTokenSugerido } from '../hooks/usarTokenSugerido';
import { generarCodigoFamiliar } from '../utiles/codigoFamiliar';
import { GuiaDeConexion } from './GuiaDeConexion';
import './ConfigurarPlanilla.css';

type EstadoPrueba =
  | { fase: 'inactivo' }
  | { fase: 'probando' }
  | { fase: 'listo'; ok: boolean; mensaje: string };

interface Props {
  credenciales: Credenciales;
  alGuardar: (credenciales: Credenciales) => void;
  alVolver: () => void;
}

export function ConfigurarPlanilla({ credenciales, alGuardar, alVolver }: Props) {
  const { token: tokenSugerido, regenerar: regenerarToken } = usarTokenSugerido();
  const [formulario, setFormulario] = useState<Credenciales>(credenciales);
  const [prueba, setPrueba] = useState<EstadoPrueba>({ fase: 'inactivo' });
  const [copiado, setCopiado] = useState(false);

  const completo = formulario.url.trim() !== '' && formulario.token.trim() !== '';
  const conectado = prueba.fase === 'listo' && prueba.ok;

  function actualizar(campo: keyof Credenciales, valor: string) {
    setFormulario((previo) => ({ ...previo, [campo]: valor }));
    setPrueba({ fase: 'inactivo' });
  }

  function limpias(): Credenciales {
    return { url: formulario.url.trim(), token: formulario.token.trim() };
  }

  async function alProbar() {
    setPrueba({ fase: 'probando' });
    const respuesta = await enviarEvento(limpias(), 'PING');
    const ok = respuesta.estado === 'ok';

    setPrueba({ fase: 'listo', ok, mensaje: respuesta.mensaje });

    // Guardar recién cuando la conexión respondió bien evita dejar el celular
    // "configurado" con datos que no funcionan.
    if (ok) alGuardar(limpias());
  }

  async function copiarCodigo() {
    await navigator.clipboard.writeText(generarCodigoFamiliar(limpias()));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="configurar">
      <header className="configurar__encabezado">
        <button type="button" className="configurar__volver" onClick={alVolver}>
          ‹ Volver
        </button>
        <h1>Conectar con tu planilla</h1>
        <p>
          Se hace una sola vez, en la casa. Son seis pasos y no hace falta saber
          programar: solo copiar y pegar.
        </p>
      </header>

      <GuiaDeConexion tokenSugerido={tokenSugerido} alGenerarToken={regenerarToken} />

      <div className="configurar__formulario">
        <label className="campo">
          <span className="campo__rotulo">URL de la aplicación web</span>
          <input
            type="url"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="https://script.google.com/macros/s/…/exec"
            value={formulario.url}
            onChange={(evento) => actualizar('url', evento.target.value)}
          />
        </label>

        <label className="campo">
          <span className="campo__rotulo">Clave secreta</span>
          <input
            type="password"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="La misma del paso 4"
            value={formulario.token}
            onChange={(evento) => actualizar('token', evento.target.value)}
          />
        </label>

        <button
          type="button"
          className="boton boton--primario boton--ancho"
          disabled={!completo || prueba.fase === 'probando'}
          onClick={alProbar}
        >
          {prueba.fase === 'probando' ? 'Probando…' : 'Probar conexión'}
        </button>

        {prueba.fase === 'listo' && (
          <p className={prueba.ok ? 'aviso aviso--ok' : 'aviso aviso--error'}>
            {prueba.ok ? '✓ ' : '✕ '}
            {prueba.mensaje}
          </p>
        )}
      </div>

      {conectado && (
        <div className="configurar__compartir">
          <h2>Pasale el código a los demás</h2>
          <p>
            Con este texto, cada uno conecta su celular sin ver ni la URL ni la clave.
            Mandáselo por mensaje.
          </p>
          <button type="button" className="boton boton--primario boton--ancho" onClick={copiarCodigo}>
            {copiado ? '✓ Copiado' : 'Copiar código familiar'}
          </button>
        </div>
      )}
    </div>
  );
}
