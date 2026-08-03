import { useState } from 'react';
import type { Credenciales } from '../api/planilla';
import { PegarCodigoFamiliar } from '../componentes/PegarCodigoFamiliar';
import { ConfigurarPlanilla } from '../componentes/ConfigurarPlanilla';

interface Props {
  credenciales: Credenciales;
  alConectar: (credenciales: Credenciales) => void;
}

/**
 * Dos caminos para conectar el celular con la planilla.
 *
 * El de pegar el código familiar es el que va a usar casi todo el mundo, así
 * que es el que se ve primero. El de configurar la planilla lo hace una sola
 * persona, una sola vez, y queda detrás de un enlace para no asustar al resto.
 */
export function Configuracion({ credenciales, alConectar }: Props) {
  const [configurando, setConfigurando] = useState(false);

  if (configurando) {
    return (
      <ConfigurarPlanilla
        credenciales={credenciales}
        alGuardar={alConectar}
        alVolver={() => setConfigurando(false)}
      />
    );
  }

  return (
    <PegarCodigoFamiliar
      alConectar={alConectar}
      alPedirConfiguracion={() => setConfigurando(true)}
    />
  );
}
