import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  enviarEvento,
  fijarAlCaerLaSesion,
  fijarSesion,
} from './planilla';

const CREDENCIALES = { url: 'https://script.google.com/macros/s/x/exec', token: 'clave' };

function planillaQueResponde(cuerpo: unknown) {
  const espia = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(cuerpo),
  });
  vi.stubGlobal('fetch', espia);
  return espia;
}

function cuerpoEnviado(espia: ReturnType<typeof vi.fn>) {
  return JSON.parse(espia.mock.calls[0][1].body);
}

afterEach(() => {
  vi.unstubAllGlobals();
  fijarSesion(null);
  fijarAlCaerLaSesion(null);
});

describe('enviarEvento', () => {
  test('manda el token de sesion que se fijo', async () => {
    // El bug que arregló esta versión: el pedido salía sin token porque se
    // fijaba en un efecto que corría tarde, y la planilla lo rechazaba.
    const espia = planillaQueResponde({ estado: 'ok', mensaje: 'listo' });
    fijarSesion('token-de-prueba');

    await enviarEvento(CREDENCIALES, 'OBTENER_LISTAS');

    expect(cuerpoEnviado(espia).sesion).toBe('token-de-prueba');
  });

  test('sin sesion el token viaja en nulo, no ausente', async () => {
    const espia = planillaQueResponde({ estado: 'ok', mensaje: 'listo' });

    await enviarEvento(CREDENCIALES, 'PING');

    expect(cuerpoEnviado(espia).sesion).toBeNull();
  });

  test('el pedido va como texto plano', async () => {
    // Con `application/json` el navegador dispara una preflight OPTIONS que
    // Apps Script no contesta, y el pedido muere por CORS antes de salir.
    const espia = planillaQueResponde({ estado: 'ok', mensaje: 'listo' });

    await enviarEvento(CREDENCIALES, 'PING');

    expect(espia.mock.calls[0][1].headers['Content-Type']).toBe(
      'text/plain;charset=utf-8',
    );
  });

  test('avisa una sola vez cuando la planilla rechaza la sesion', async () => {
    planillaQueResponde({ estado: 'error', codigo: 'SIN_SESION', mensaje: 'vencida' });
    const aviso = vi.fn();
    fijarAlCaerLaSesion(aviso);

    await enviarEvento(CREDENCIALES, 'OBTENER_LISTAS');

    expect(aviso).toHaveBeenCalledTimes(1);
  });

  test('traduce la accion desconocida a algo que se entienda', async () => {
    // La planilla no puede saber que el problema es su propia versión vieja.
    planillaQueResponde({ estado: 'error', mensaje: 'Acción desconocida: LOGIN' });

    const respuesta = await enviarEvento(CREDENCIALES, 'LOGIN');

    expect(respuesta.mensaje).toContain('versión vieja');
  });

  test('una respuesta que no es JSON no rompe la app', async () => {
    // Apps Script devuelve HTML cuando el despliegue no da acceso a cualquiera.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '<html>' }),
    );

    const respuesta = await enviarEvento(CREDENCIALES, 'PING');

    expect(respuesta.estado).toBe('error');
    expect(respuesta.mensaje).toContain('/exec');
  });
});
