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
