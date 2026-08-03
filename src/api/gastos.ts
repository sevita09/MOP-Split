/**
 * Carga de gastos.
 *
 * Quién pagó no viaja en el pedido: lo resuelve la planilla desde la sesión.
 * Mandarlo desde acá dejaría que cualquiera cargue un gasto a nombre de otro.
 */

import { enviarEvento } from './planilla';
import type { Credenciales } from './planilla';
import type { Resultado } from './personas';

export interface GastoNuevo {
  idLista: string;
  idConcepto: string;
  monto: number;
}

export async function crearGasto(
  credenciales: Credenciales,
  gasto: GastoNuevo,
): Promise<Resultado<null>> {
  const respuesta = await enviarEvento(credenciales, 'CREAR_GASTO', { ...gasto });

  return { ok: respuesta.estado === 'ok', mensaje: respuesta.mensaje, datos: null };
}
