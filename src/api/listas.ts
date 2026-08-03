/**
 * Listas de gastos de la persona que está usando la app.
 *
 * Cada participante trae su `unidad`: es el propio código cuando va solo, o uno
 * compartido cuando dos personas cuentan como una sola a la hora de deber.
 */

import { enviarEvento } from './planilla';
import type { Credenciales } from './planilla';
import type { Resultado } from './personas';

export interface Participante {
  codigo: string;
  unidad: string;
}

export interface Lista {
  id: string;
  nombre: string;
  mes: number;
  anio: number;
  estado: string;
  esDueño: boolean;
  participantes: Participante[];
}

export interface Listas {
  abiertas: Lista[];
  cerradas: Lista[];
}

function esLista(valor: unknown): valor is Lista {
  if (typeof valor !== 'object' || valor === null) return false;
  const posible = valor as Record<string, unknown>;
  return typeof posible.id === 'string' && typeof posible.nombre === 'string';
}

function comoListas(valor: unknown): Lista[] {
  return Array.isArray(valor) ? valor.filter(esLista) : [];
}

export interface ListaNueva {
  nombre: string;
  mes: number;
  anio: number;
  participantes: string[];
  /** Cada grupo son los códigos que cuentan como una sola unidad de balance. */
  grupos: string[][];
}

export async function crearLista(
  credenciales: Credenciales,
  lista: ListaNueva,
): Promise<Resultado<null>> {
  const respuesta = await enviarEvento(credenciales, 'CREAR_LISTA', { ...lista });

  return {
    ok: respuesta.estado === 'ok',
    mensaje: respuesta.mensaje,
    datos: null,
  };
}

export interface UnidadCongelada {
  unidad: string;
  codigos: string[];
  neto: number;
}

function esUnidadCongelada(valor: unknown): valor is UnidadCongelada {
  if (typeof valor !== 'object' || valor === null) return false;
  const posible = valor as Record<string, unknown>;
  return typeof posible.unidad === 'string' && typeof posible.neto === 'number';
}

/** Los netos tal como quedaron al cerrar. No se recalculan nunca. */
export async function obtenerBalanceCongelado(
  credenciales: Credenciales,
  idLista: string,
): Promise<Resultado<UnidadCongelada[]>> {
  const respuesta = await enviarEvento(credenciales, 'OBTENER_BALANCE_CONGELADO', {
    idLista,
  });

  if (respuesta.estado !== 'ok') {
    return { ok: false, mensaje: respuesta.mensaje, datos: null };
  }

  const contenido = respuesta.datos as { unidades?: unknown } | undefined;
  const lista = Array.isArray(contenido?.unidades) ? contenido.unidades : [];

  return { ok: true, mensaje: respuesta.mensaje, datos: lista.filter(esUnidadCongelada) };
}

/** Cerrar congela el balance; reabrir borra esa foto. Lo decide la planilla. */
export async function cambiarEstadoDeLista(
  credenciales: Credenciales,
  idLista: string,
  cerrar: boolean,
): Promise<Resultado<null>> {
  const respuesta = await enviarEvento(credenciales, 'CAMBIAR_ESTADO_DE_LISTA', {
    idLista,
    cerrar,
  });

  return { ok: respuesta.estado === 'ok', mensaje: respuesta.mensaje, datos: null };
}

export async function obtenerListas(
  credenciales: Credenciales,
): Promise<Resultado<Listas>> {
  const respuesta = await enviarEvento(credenciales, 'OBTENER_LISTAS');

  if (respuesta.estado !== 'ok') {
    return { ok: false, mensaje: respuesta.mensaje, datos: null };
  }

  const contenido = respuesta.datos as
    | { abiertas?: unknown; cerradas?: unknown }
    | undefined;

  return {
    ok: true,
    mensaje: respuesta.mensaje,
    datos: {
      abiertas: comoListas(contenido?.abiertas),
      cerradas: comoListas(contenido?.cerradas),
    },
  };
}
