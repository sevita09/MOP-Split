import { useCallback, useState } from 'react';

const CLAVE_ALMACENAMIENTO = 'split-familiar:token-sugerido';

/** 16 bytes al azar en hexadecimal: 32 caracteres, 128 bits de entropía. */
function generarToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function leerOGenerar(): string {
  const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO);
  if (guardado) return guardado;

  const nuevo = generarToken();
  localStorage.setItem(CLAVE_ALMACENAMIENTO, nuevo);
  return nuevo;
}

/**
 * Clave sugerida para el `TOKEN_SECRETO`, persistida en el celular.
 *
 * Persiste porque tiene que sobrevivir a una recarga: el paso 3 de la guía manda
 * al usuario a Apps Script por varios minutos y el navegador del celular suele
 * descartar la pestaña mientras tanto. Si al volver la sugerencia fuera otra, no
 * coincidiría con la que quedó cargada en Propiedades del script y "Probar
 * conexión" fallaría con "Token inválido" sin ninguna pista del motivo.
 */
export function usarTokenSugerido() {
  const [token, setToken] = useState(leerOGenerar);

  const regenerar = useCallback(() => {
    const nuevo = generarToken();
    localStorage.setItem(CLAVE_ALMACENAMIENTO, nuevo);
    setToken(nuevo);
  }, []);

  return { token, regenerar };
}
