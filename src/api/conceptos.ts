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
  /** Veces que se usó, contando todas las listas. */
  usos: number;
  /** Cuándo se usó por última vez en la lista abierta, o `null` si nunca. */
  ultimoUsoEnLista: number | null;
}

function esConcepto(valor: unknown): valor is Concepto {
  if (typeof valor !== 'object' || valor === null) return false;
  const posible = valor as Record<string, unknown>;
  return typeof posible.id === 'string' && typeof posible.nombre === 'string';
}

/**
 * Crea un concepto que no estaba en el catálogo.
 *
 * No se manda emoji: la planilla le pone uno neutro y el administrador le
 * cambia el que corresponde cuando completa la categoría. Elegirlo acá le
 * agregaría un paso a lo que tiene que ser rápido.
 */
export async function crearConcepto(
  credenciales: Credenciales,
  nombre: string,
): Promise<Resultado<Concepto>> {
  const respuesta = await enviarEvento(credenciales, 'CREAR_CONCEPTO', { nombre });

  if (respuesta.estado !== 'ok') {
    return { ok: false, mensaje: respuesta.mensaje, datos: null };
  }

  const contenido = respuesta.datos as { concepto?: unknown } | undefined;

  if (!esConcepto(contenido?.concepto)) {
    return { ok: false, mensaje: 'La planilla respondió sin el concepto.', datos: null };
  }

  return {
    ok: true,
    mensaje: respuesta.mensaje,
    datos: { ...contenido.concepto, usos: 0, ultimoUsoEnLista: null },
  };
}

export async function obtenerConceptos(
  credenciales: Credenciales,
  idLista: string,
): Promise<Resultado<Concepto[]>> {
  const respuesta = await enviarEvento(credenciales, 'OBTENER_CONCEPTOS', { idLista });

  if (respuesta.estado !== 'ok') {
    return { ok: false, mensaje: respuesta.mensaje, datos: null };
  }

  const contenido = respuesta.datos as { conceptos?: unknown } | undefined;
  const lista = Array.isArray(contenido?.conceptos) ? contenido.conceptos : [];

  return { ok: true, mensaje: respuesta.mensaje, datos: lista.filter(esConcepto) };
}
