/**
 * Qué tan seguro está lo que la app guarda en el celular.
 *
 * Por defecto el navegador trata los datos de un sitio como descartables: si el
 * teléfono anda corto de espacio, o si pasa un limpiador del sistema, los borra
 * sin avisar. Ahí se va la conexión a la planilla y hay que volver a pegar el
 * código familiar.
 *
 * `persist()` pide que no los toque. En una app instalada Chrome suele
 * concederlo sin preguntarle nada al usuario; en una pestaña común puede
 * negarlo. Por eso además se puede consultar si quedó concedido: decir "está
 * arreglado" sin poder verificarlo sería una suposición.
 */

export interface EstadoDelAlmacenamiento {
  /** `null` cuando el navegador no sabe responder. */
  protegido: boolean | null;
  usadoMb: number | null;
  /** Cómo se abrió la app: instalada de verdad o dentro del navegador. */
  instalada: boolean;
}

export async function pedirQueNoBorreLosDatos(): Promise<void> {
  if (!navigator.storage?.persist) return;

  try {
    await navigator.storage.persist();
  } catch {
    // Que el navegador lo niegue no cambia nada de cómo funciona la app.
  }
}

/**
 * Instalada o no.
 *
 * En Android, "Agregar a pantalla principal" puede dejar una app de verdad o un
 * simple acceso directo, y solo la primera abre a pantalla completa. Es la
 * diferencia que importa: la instalada tiene mucha mejor protección de datos.
 */
export function estaInstalada(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // Safari en iPhone no implementa `display-mode` y usa esto en su lugar.
    (navigator as { standalone?: boolean }).standalone === true
  );
}

export async function estadoDelAlmacenamiento(): Promise<EstadoDelAlmacenamiento> {
  const instalada = estaInstalada();

  if (!navigator.storage?.persisted) {
    return { protegido: null, usadoMb: null, instalada };
  }

  try {
    const protegido = await navigator.storage.persisted();
    const estimado = navigator.storage.estimate ? await navigator.storage.estimate() : null;
    const usado = estimado?.usage;

    return {
      protegido,
      usadoMb: typeof usado === 'number' ? Math.round((usado / 1048576) * 10) / 10 : null,
      instalada,
    };
  } catch {
    return { protegido: null, usadoMb: null, instalada };
  }
}
