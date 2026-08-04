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

/** Qué está pasando con la planilla, para poder mostrarlo. */
export type EstadoDeSincronizacion = 'quieto' | 'hablando' | 'ok' | 'falla';

let avisarSincronizacion: ((estado: EstadoDeSincronizacion) => void) | null = null;
let pedidosEnVuelo = 0;

/**
 * Fija a quién avisarle cómo viene el diálogo con la planilla.
 *
 * Se cuenta acá adentro y no en cada pantalla porque este es el único lugar por
 * donde pasan todos los pedidos: así ninguno puede quedar afuera del indicador
 * por olvido. Se lleva la cuenta de los que están en vuelo, no un booleano: con
 * dos pedidos superpuestos, el primero en terminar apagaría el aviso mientras
 * el otro sigue.
 */
export function fijarAvisoDeSincronizacion(
  avisar: ((estado: EstadoDeSincronizacion) => void) | null,
) {
  avisarSincronizacion = avisar;
}

/** Cuánto tardó un pedido, para poder medir en el celular y no de oído. */
export interface Medicion {
  accion: string;
  milisegundos: number;
  cuando: number;
  ok: boolean;
}

/** Alcanza para ver un patrón sin que la lista crezca sin control. */
const MEDICIONES_QUE_SE_GUARDAN = 40;

const mediciones: Medicion[] = [];

export function medicionesRecientes(): Medicion[] {
  return [...mediciones];
}

export function olvidarMediciones() {
  mediciones.length = 0;
}

let avisarSesionCaida: (() => void) | null = null;

/**
 * Qué hacer cuando la planilla rechaza el token.
 *
 * Se avisa desde acá y no desde cada pantalla porque puede pasar en cualquier
 * pedido, y en todos la respuesta es la misma: volver al ingreso. Si cada
 * pantalla lo resolviera por su cuenta, la que se olvidara dejaría al usuario
 * mirando un error que no sabe cómo arreglar.
 */
export function fijarAlCaerLaSesion(avisar: (() => void) | null) {
  avisarSesionCaida = avisar;
}

/**
 * Cambia los errores que la planilla no puede explicar bien.
 *
 * "Acción desconocida" solo aparece cuando el `.gs` publicado es más viejo que
 * la app y no conoce ese evento. La planilla no tiene forma de saber eso —desde
 * su lado el pedido es sencillamente inválido—, así que la traducción va acá.
 */
function traducir(respuesta: RespuestaPlanilla): RespuestaPlanilla {
  if (!respuesta.mensaje?.startsWith('Acción desconocida')) return respuesta;

  return {
    ...respuesta,
    mensaje:
      'La planilla tiene una versión vieja del código. Actualizá los archivos ' +
      'en Apps Script y creá una versión nueva de la implementación.',
  };
}

/**
 * Manda un evento al Web App y devuelve su respuesta ya parseada.
 *
 * Además de hablar con la planilla, avisa cómo viene: es el único punto por el
 * que pasan todos los pedidos, así que ninguno puede quedar sin reflejarse en
 * el indicador de sincronización.
 */
export async function enviarEvento(
  credenciales: Credenciales,
  accion: string,
  datos: Record<string, unknown> = {},
): Promise<RespuestaPlanilla> {
  pedidosEnVuelo++;
  avisarSincronizacion?.('hablando');

  // `performance.now` y no `Date.now`: no lo afecta que el reloj del sistema se
  // ajuste en el medio, que es justo cuando la medición saldría absurda.
  const arranque = performance.now();
  const respuesta = await hablarConLaPlanilla(credenciales, accion, datos);

  mediciones.unshift({
    accion,
    milisegundos: Math.round(performance.now() - arranque),
    cuando: Date.now(),
    ok: respuesta.estado === 'ok',
  });
  mediciones.length = Math.min(mediciones.length, MEDICIONES_QUE_SE_GUARDAN);

  pedidosEnVuelo--;

  // Solo se cambia el estado cuando no queda ninguno en vuelo: si no, el
  // primero en volver apagaría el aviso mientras otro sigue trabajando.
  if (pedidosEnVuelo === 0) {
    avisarSincronizacion?.(respuesta.estado === 'ok' ? 'ok' : 'falla');
  }

  if (respuesta.codigo === 'SIN_SESION') avisarSesionCaida?.();

  return respuesta;
}

/**
 * Ojo con el Content-Type: `application/json` dispara una preflight OPTIONS y
 * Apps Script no la contesta, así que el pedido falla por CORS antes de salir.
 * Con `text/plain` el navegador lo trata como "simple request", no hay
 * preflight, y el JSON llega igual en `e.postData.contents`.
 */
async function hablarConLaPlanilla(
  credenciales: Credenciales,
  accion: string,
  datos: Record<string, unknown>,
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
    return traducir(JSON.parse(cuerpo) as RespuestaPlanilla);
  } catch {
    // Apps Script devuelve HTML cuando el despliegue no da acceso a cualquiera
    // o cuando la URL apunta al editor en vez de al Web App publicado.
    return {
      estado: 'error',
      mensaje: 'La respuesta no es JSON. Revisá que la URL termine en /exec.',
    };
  }
}
