/**
 * Único punto de la app que habla con Apps Script. Ningún componente ni hook
 * hace `fetch` por su cuenta.
 *
 * El backend es un Web App de Apps Script con un solo `doPost`: todas las
 * operaciones viajan en el cuerpo bajo la clave `accion`.
 */

export interface Credenciales {
  url: string;
  token: string;
}

export interface RespuestaPlanilla {
  estado: 'ok' | 'error';
  mensaje: string;
  /** `SIN_SESION` cuando el token ya no vale y hay que volver a poner el PIN. */
  codigo?: string;
  datos?: unknown;
}

let tokenDeSesion: string | null = null;

/**
 * Fija el token de la sesión, que viaja en cada pedido.
 *
 * Vive acá arriba y no como parámetro de `enviarEvento` porque es transversal a
 * todas las operaciones, igual que una cabecera de autenticación: si fuera
 * parámetro habría que arrastrarlo por cada función de cada módulo de `api/`.
 *
 * Antes se mandaba el código de la persona y la planilla le creía. Ahora se
 * manda el token que ella misma emitió, y la identidad la resuelve allá: el
 * celular ya no puede decir que es otro.
 */
export function fijarSesion(token: string | null) {
  tokenDeSesion = token;
}

/**
 * Manda un evento al Web App y devuelve su respuesta ya parseada.
 *
 * Ojo con el Content-Type: `application/json` dispara una preflight OPTIONS y
 * Apps Script no la contesta, así que el pedido falla por CORS antes de salir.
 * Con `text/plain` el navegador lo trata como "simple request", no hay
 * preflight, y el JSON llega igual en `e.postData.contents`.
 */
export async function enviarEvento(
  credenciales: Credenciales,
  accion: string,
  datos: Record<string, unknown> = {},
): Promise<RespuestaPlanilla> {
  let respuesta: Response;

  try {
    respuesta = await fetch(credenciales.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        accion,
        token: credenciales.token,
        sesion: tokenDeSesion,
        ...datos,
      }),
      redirect: 'follow',
    });
  } catch {
    return {
      estado: 'error',
      mensaje: 'No se pudo conectar. Revisá la URL y que haya internet.',
    };
  }

  if (!respuesta.ok) {
    return {
      estado: 'error',
      mensaje: `La planilla respondió con el código ${respuesta.status}.`,
    };
  }

  const cuerpo = await respuesta.text();

  try {
    return JSON.parse(cuerpo) as RespuestaPlanilla;
  } catch {
    // Apps Script devuelve HTML cuando el despliegue no da acceso a cualquiera
    // o cuando la URL apunta al editor en vez de al Web App publicado.
    return {
      estado: 'error',
      mensaje: 'La respuesta no es JSON. Revisá que la URL termine en /exec.',
    };
  }
}
