/**
 * Catálogo de conceptos de gasto.
 *
 * `sinCategorizar` es lo único que llega sobre la categoría: los valores en sí
 * los maneja el administrador en la planilla y la app no los muestra nunca.
 */

import { enviarEvento } from './planilla';
import type { Credenciales } from './planilla';
import type { Resultado } from './personas';

export interface Concepto {
  id: string;
  nombre: string;
  emoji: string;
  fijo: boolean;
  sinCategorizar: boolean;
}

function esConcepto(valor: unknown): valor is Concepto {
  if (typeof valor !== 'object' || valor === null) return false;
  const posible = valor as Record<string, unknown>;
  return typeof posible.id === 'string' && typeof posible.nombre === 'string';
}

export async function obtenerConceptos(
  credenciales: Credenciales,
): Promise<Resultado<Concepto[]>> {
  const respuesta = await enviarEvento(credenciales, 'OBTENER_CONCEPTOS');

  if (respuesta.estado !== 'ok') {
    return { ok: false, mensaje: respuesta.mensaje, datos: null };
  }

  const contenido = respuesta.datos as { conceptos?: unknown } | undefined;
  const lista = Array.isArray(contenido?.conceptos) ? contenido.conceptos : [];

  return { ok: true, mensaje: respuesta.mensaje, datos: lista.filter(esConcepto) };
}
