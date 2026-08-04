/**
 * Carga y corrección de gastos.
 *
 * Quién pagó no viaja en el pedido: lo resuelve la planilla desde la sesión.
 * Mandarlo desde acá dejaría que cualquiera cargue un gasto a nombre de otro.
 */

import { enviarEvento } from './planilla';
import type { Credenciales } from './planilla';
import type { Resultado } from './personas';

export interface Gasto {
  id: string;
  idConcepto: string;
  monto: number;
  descuento: number;
  codigoPersonaPago: string;
  /** `null` si la celda de la planilla no se pudo interpretar como fecha. */
  fecha: number | null;
  /** Lo decide la planilla: quien pagó, o el administrador. */
  puedeEditarlo: boolean;
}

export interface GastoNuevo {
  idLista: string;
  idConcepto: string;
  monto: number;
}

function esGasto(valor: unknown): valor is Gasto {
  if (typeof valor !== 'object' || valor === null) return false;
  const posible = valor as Record<string, unknown>;
  return typeof posible.id === 'string' && typeof posible.monto === 'number';
}

export async function obtenerGastos(
  credenciales: Credenciales,
  idLista: string,
): Promise<Resultado<Gasto[]>> {
  const respuesta = await enviarEvento(credenciales, 'OBTENER_GASTOS', { idLista });

  if (respuesta.estado !== 'ok') {
    return { ok: false, mensaje: respuesta.mensaje, datos: null };
  }

  const contenido = respuesta.datos as { gastos?: unknown } | undefined;
  const lista = Array.isArray(contenido?.gastos) ? contenido.gastos : [];

  return { ok: true, mensaje: respuesta.mensaje, datos: lista.filter(esGasto) };
}

/** Se manda solo lo que cambia: lo que no viaja, la planilla lo deja como está. */
export async function editarGasto(
  credenciales: Credenciales,
  idGasto: string,
  cambio: { monto?: number; descuento?: number },
): Promise<Resultado<null>> {
  const respuesta = await enviarEvento(credenciales, 'EDITAR_GASTO', {
    idGasto,
    ...cambio,
  });

  return { ok: respuesta.estado === 'ok', mensaje: respuesta.mensaje, datos: null };
}

export async function crearGasto(
  credenciales: Credenciales,
  gasto: GastoNuevo,
): Promise<Resultado<null>> {
  const respuesta = await enviarEvento(credenciales, 'CREAR_GASTO', { ...gasto });

  return {
    ok: respuesta.estado === 'ok',
    mensaje: respuesta.mensaje,
    codigo: respuesta.codigo,
    datos: null,
  };
}
