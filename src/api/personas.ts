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

/** Lo que hace falta guardar en el celular para seguir identificado. */
export interface Sesion {
  persona: Persona;
  token: string;
}

export async function iniciarSesion(
  credenciales: Credenciales,
  codigo: string,
  pin: string,
): Promise<Resultado<Sesion>> {
  const respuesta = await enviarEvento(credenciales, 'LOGIN', { codigo, pin });
  return interpretarSesion(respuesta.estado === 'ok', respuesta.mensaje, respuesta.datos);
}

export async function crearPrimeraPersona(
  credenciales: Credenciales,
  nombre: string,
  pin: string,
): Promise<Resultado<Sesion>> {
  const respuesta = await enviarEvento(credenciales, 'CREAR_PRIMERA_PERSONA', {
    nombre,
    pin,
  });
  return interpretarSesion(respuesta.estado === 'ok', respuesta.mensaje, respuesta.datos);
}

export async function cerrarSesion(credenciales: Credenciales): Promise<void> {
  // Si falla no se avisa: el celular se desloguea igual y la fila queda
  // huérfana en la planilla, que es molesto pero no rompe nada.
  await enviarEvento(credenciales, 'CERRAR_SESION');
}

function interpretarSesion(
  ok: boolean,
  mensaje: string,
  datos: unknown,
): Resultado<Sesion> {
  if (!ok) return { ok: false, mensaje, datos: null };

  const contenido = datos as { persona?: unknown; sesion?: unknown } | undefined;

  if (!esPersona(contenido?.persona) || typeof contenido?.sesion !== 'string') {
    return { ok: false, mensaje: 'La planilla respondió sin la sesión.', datos: null };
  }

  return { ok: true, mensaje, datos: { persona: contenido.persona, token: contenido.sesion } };
}
