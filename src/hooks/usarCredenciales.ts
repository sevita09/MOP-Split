import { useCallback, useState } from 'react';
import type { Credenciales } from '../api/planilla';
import { leerCodigoDelEnlace } from '../utiles/codigoFamiliar';

const CLAVE_ALMACENAMIENTO = 'split-familiar:credenciales';

const VACIAS: Credenciales = { url: '', token: '' };

/**
 * Las credenciales con las que arranca la app.
 *
 * Un enlace con código gana solo cuando no había nada guardado: si el celular
 * ya estaba conectado, abrir un enlace ajeno no tiene que cambiarle la planilla
 * por sorpresa. Para eso está "Conectar otra planilla".
 */
function credencialesDeArranque(): Credenciales {
  const guardadas = leerDelAlmacenamiento();
  const delEnlace = leerCodigoDelEnlace();

  if (guardadas.url !== '' || delEnlace === null) return guardadas;

  localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(delEnlace));
  return delEnlace;
}

function leerDelAlmacenamiento(): Credenciales {
  const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO);
  if (!guardado) return VACIAS;

  try {
    const parseado = JSON.parse(guardado) as Partial<Credenciales>;
    return { url: parseado.url ?? '', token: parseado.token ?? '' };
  } catch {
    // Si alguien tocó el localStorage a mano, arrancamos de cero en vez de
    // dejar la app colgada en una pantalla en blanco.
    return VACIAS;
  }
}

/** Credenciales del Web App, persistidas en el celular. */
export function usarCredenciales() {
  const [credenciales, setCredenciales] = useState<Credenciales>(credencialesDeArranque);

  const guardar = useCallback((nuevas: Credenciales) => {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(nuevas));
    setCredenciales(nuevas);
  }, []);

  const borrar = useCallback(() => {
    localStorage.removeItem(CLAVE_ALMACENAMIENTO);
    setCredenciales(VACIAS);
  }, []);

  const estanCompletas = credenciales.url !== '' && credenciales.token !== '';

  return { credenciales, guardar, borrar, estanCompletas };
}
