/**
 * Operaciones sobre la hoja Personas. Todo pasa por `enviarEvento`, que es el
 * único lugar donde se hace `fetch`.
 *
 * El PIN nunca vuelve de la planilla: viaja hacia allá para validarse y lo que
 * regresa es la persona sin él.
 */

import { enviarEvento } from './planilla';
import type { Credenciales } from './planilla';

/** Tiene que coincidir con `LARGO_PIN` de `apps_script/Personas.gs`. */
export const LARGO_PIN = 6;

export interface Persona {
  codigo: string;
  nombre: string;
  admin: boolean;
}

export interface Resultado<T> {
  ok: boolean;
  mensaje: string;
  datos: T | null;
}

function esPersona(valor: unknown): valor is Persona {
  if (typeof valor !== 'object' || valor === null) return false;
  const posible = valor as Record<string, unknown>;
  return typeof posible.codigo === 'string' && typeof posible.nombre === 'string';
}

export async function obtenerPersonas(
  credenciales: Credenciales,
): Promise<Resultado<Persona[]>> {
  const respuesta = await enviarEvento(credenciales, 'OBTENER_PERSONAS');

  if (respuesta.estado !== 'ok') {
    return { ok: false, mensaje: respuesta.mensaje, datos: null };
  }

  const contenido = respuesta.datos as { personas?: unknown } | undefined;
  const lista = Array.isArray(contenido?.personas) ? contenido.personas : [];

  return { ok: true, mensaje: respuesta.mensaje, datos: lista.filter(esPersona) };
}

export async function iniciarSesion(
  credenciales: Credenciales,
  codigo: string,
  pin: string,
): Promise<Resultado<Persona>> {
  const respuesta = await enviarEvento(credenciales, 'LOGIN', { codigo, pin });
  return interpretarPersona(respuesta.estado === 'ok', respuesta.mensaje, respuesta.datos);
}

export async function crearPrimeraPersona(
  credenciales: Credenciales,
  nombre: string,
  pin: string,
): Promise<Resultado<Persona>> {
  const respuesta = await enviarEvento(credenciales, 'CREAR_PRIMERA_PERSONA', {
    nombre,
    pin,
  });
  return interpretarPersona(respuesta.estado === 'ok', respuesta.mensaje, respuesta.datos);
}

function interpretarPersona(
  ok: boolean,
  mensaje: string,
  datos: unknown,
): Resultado<Persona> {
  if (!ok) return { ok: false, mensaje, datos: null };

  const contenido = datos as { persona?: unknown } | undefined;
  if (!esPersona(contenido?.persona)) {
    return { ok: false, mensaje: 'La planilla respondió sin la persona.', datos: null };
  }

  return { ok: true, mensaje, datos: contenido.persona };
}
