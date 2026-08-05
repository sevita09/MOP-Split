/**
 * El código familiar: un solo texto que empaqueta la URL del Web App y el
 * token.
 *
 * Existe para que nadie más que quien configura la planilla tenga que ver una
 * URL de Apps Script ni un token. Esa persona lo genera una vez y lo pasa por
 * mensaje; el resto pega un texto y listo.
 *
 * Va en base64url y no en base64 a secas: el `+` de base64 se convierte en
 * espacio si el código viaja por un enlace, y ahí deja de funcionar sin que se
 * entienda por qué.
 *
 * No es cifrado y no pretende serlo: cualquiera que tenga el código tiene el
 * token. Es un envoltorio para no equivocarse copiando, no una caja fuerte.
 */

import type { Credenciales } from '../api/planilla';

const PREFIJO = 'SPLIT1-';

function aBase64Url(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let binario = '';
  bytes.forEach((byte) => {
    binario += String.fromCharCode(byte);
  });
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function desdeBase64Url(codificado: string): string {
  const base64 = codificado.replace(/-/g, '+').replace(/_/g, '/');
  const binario = atob(base64);
  const bytes = Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function generarCodigoFamiliar(credenciales: Credenciales): string {
  return PREFIJO + aBase64Url(JSON.stringify([credenciales.url, credenciales.token]));
}

/** Devuelve las credenciales, o `null` si el texto no es un código válido. */
export function leerCodigoFamiliar(codigo: string): Credenciales | null {
  const limpio = codigo.trim();
  if (!limpio.startsWith(PREFIJO)) return null;

  try {
    const partes = JSON.parse(desdeBase64Url(limpio.slice(PREFIJO.length)));
    if (!Array.isArray(partes) || partes.length !== 2) return null;

    const [url, token] = partes;
    if (typeof url !== 'string' || typeof token !== 'string') return null;
    if (url === '' || token === '') return null;

    return { url, token };
  } catch {
    return null;
  }
}

/**
 * Un enlace que conecta el celular con solo tocarlo.
 *
 * El código va después del `#` y no como parámetro: **el navegador no manda el
 * fragmento al servidor**, así que GitHub Pages nunca lo ve ni queda en ningún
 * registro. La exposición es la misma que la del código suelto, que ya viaja
 * por mensaje igual.
 */
export function generarEnlaceFamiliar(credenciales: Credenciales): string {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`;
  return `${base}#${generarCodigoFamiliar(credenciales)}`;
}

/**
 * Lee el código del enlace con el que se abrió la app, si vino con uno.
 *
 * Además limpia el `#`: si quedara puesto, el código estaría a la vista en la
 * barra de direcciones y en el historial cada vez que se abre la app.
 */
export function leerCodigoDelEnlace(): Credenciales | null {
  const credenciales = leerCodigoFamiliar(window.location.hash.slice(1));
  if (credenciales === null) return null;

  window.history.replaceState(null, '', window.location.pathname);
  return credenciales;
}
