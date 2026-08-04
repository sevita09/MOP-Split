import { useCallback, useEffect, useState } from 'react';
import { obtenerConceptos } from '../api/conceptos';
import type { Concepto } from '../api/conceptos';
import type { Credenciales } from '../api/planilla';

/**
 * El catálogo de conceptos, con sus datos de uso en la lista que se está
 * mirando. Ver la nota de dependencias en `usarListas`.
 *

 * `primeraCarga` es verdadero **solo mientras no haya nada que mostrar**.
 *
 * Las recargas siguientes actualizan en silencio y dejan los datos viejos a la
 * vista. Si taparan la pantalla, guardar un gasto haría desaparecer los botones
 * hasta que Apps Script conteste, que son un par de segundos de pantalla vacía
 * por algo que ya se guardó bien.
  */
export function usarConceptos({ url, token }: Credenciales, idLista: string) {
  const [conceptos, setConceptos] = useState<Concepto[]>([]);
  const [primeraCarga, setPrimeraCarga] = useState(true);
  const [error, setError] = useState('');

  const recargar = useCallback(async () => {
    const resultado = await obtenerConceptos({ url, token }, idLista);

    if (resultado.ok) {
      setConceptos(resultado.datos ?? []);
      setError('');
    } else {
      setError(resultado.mensaje);
    }

    setPrimeraCarga(false);
  }, [url, token, idLista]);

  /**
   * Adelanta el efecto de haber usado un concepto, sin esperar a la planilla.
   *
   * El orden de la grilla depende de qué se cargó recién, así que sin esto el
   * botón recién tocado se queda en su lugar viejo hasta que vuelve la
   * respuesta. La recarga que sale en paralelo confirma lo mismo: el gasto ya
   * está guardado cuando esto corre, así que no hay nada que revertir.
   */
  const marcarUsado = useCallback((idConcepto: string) => {
    setConceptos((previos) =>
      previos.map((concepto) =>
        concepto.id === idConcepto
          ? { ...concepto, usos: concepto.usos + 1, ultimoUsoEnLista: Date.now() }
          : concepto,
      ),
    );
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { conceptos, primeraCarga, error, recargar, marcarUsado };
}
