import { useState } from 'react';
import { enviarEvento } from '../api/planilla';
import type { Credenciales } from '../api/planilla';
import { usarCredenciales } from '../hooks/usarCredenciales';
import './Configuracion.css';

type EstadoPrueba =
  | { fase: 'inactivo' }
  | { fase: 'probando' }
  | { fase: 'listo'; ok: boolean; mensaje: string };

export function Configuracion() {
  const { credenciales, guardar, estanCompletas } = usarCredenciales();
  const [formulario, setFormulario] = useState<Credenciales>(credenciales);
  const [guardado, setGuardado] = useState(false);
  const [prueba, setPrueba] = useState<EstadoPrueba>({ fase: 'inactivo' });

  const completo = formulario.url.trim() !== '' && formulario.token.trim() !== '';

  function actualizar(campo: keyof Credenciales, valor: string) {
    setFormulario((previo) => ({ ...previo, [campo]: valor }));
    setGuardado(false);
    setPrueba({ fase: 'inactivo' });
  }

  function alGuardar() {
    guardar({ url: formulario.url.trim(), token: formulario.token.trim() });
    setGuardado(true);
  }

  async function alProbar() {
    setPrueba({ fase: 'probando' });

    const respuesta = await enviarEvento(
      { url: formulario.url.trim(), token: formulario.token.trim() },
      'PING',
    );

    setPrueba({
      fase: 'listo',
      ok: respuesta.estado === 'ok',
      mensaje: respuesta.mensaje,
    });
  }

  return (
    <div className="configuracion">
      <header className="configuracion__encabezado">
        <h1>Conectar con tu planilla</h1>
        <p>Se hace una sola vez por planilla.</p>
      </header>

      <div className="configuracion__formulario">
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
            placeholder="La que cargaste en Propiedades del script"
            value={formulario.token}
            onChange={(evento) => actualizar('token', evento.target.value)}
          />
        </label>

        <div className="configuracion__acciones">
          <button
            type="button"
            className="boton boton--primario"
            disabled={!completo}
            onClick={alGuardar}
          >
            Guardar
          </button>
          <button
            type="button"
            className="boton boton--secundario"
            disabled={!completo || prueba.fase === 'probando'}
            onClick={alProbar}
          >
            {prueba.fase === 'probando' ? 'Probando…' : 'Probar conexión'}
          </button>
        </div>

        {guardado && <p className="aviso aviso--ok">Guardado en este celular.</p>}

        {prueba.fase === 'listo' && (
          <p className={prueba.ok ? 'aviso aviso--ok' : 'aviso aviso--error'}>
            {prueba.ok ? '✓ ' : '✕ '}
            {prueba.mensaje}
          </p>
        )}

        {!estanCompletas && !guardado && (
          <p className="aviso aviso--neutro">
            Todavía no hay ninguna planilla conectada en este dispositivo.
          </p>
        )}
      </div>
    </div>
  );
}
