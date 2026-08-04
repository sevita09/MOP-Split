import { useState } from 'react';
import type { Concepto } from '../api/conceptos';
import type { Gasto } from '../api/gastos';
import type { Lista } from '../api/listas';
import type { Persona } from '../api/personas';
import type { Credenciales } from '../api/planilla';
import { usarGastos } from '../hooks/usarGastos';
import { BalanceDeLista } from '../componentes/BalanceDeLista';
import { EstadoDeLista } from '../componentes/EstadoDeLista';
import { ListaDeGastos } from '../componentes/ListaDeGastos';
import { CorregirGasto } from '../componentes/CorregirGasto';
import type { Correccion } from '../componentes/CorregirGasto';
import { nombreDelPeriodo } from '../utiles/meses';
import './Historial.css';

interface Props {
  credenciales: Credenciales;
  lista: Lista;
  esAdmin: boolean;
  alCambiarEstado: () => void;
  conceptos: Concepto[];
  personas: Persona[];
  alVolver: () => void;
}

export function Historial({
  credenciales,
  lista,
  conceptos,
  personas,
  esAdmin,
  alCambiarEstado,
  alVolver,
}: Props) {
  const { gastos, primeraCarga: cargando, error, recargar } = usarGastos(credenciales, lista.id);
  const [corrigiendo, setCorrigiendo] = useState<{ gasto: Gasto; que: Correccion } | null>(
    null,
  );
  const cerrada = lista.estado === 'Cerrada';

  return (
    <div className="historial">
      <header className="historial__barra">
        <button type="button" className="historial__volver" onClick={alVolver}>
          ‹
        </button>
        <div>
          <h1>Balance</h1>
          <p className="historial__subtitulo">
            {lista.nombre} · {nombreDelPeriodo(lista.mes, lista.anio)}
            {cerrada && ' · cerrada'}
          </p>
        </div>
      </header>

      <div className="historial__cuerpo">
        {cargando && <p className="historial__nota">Cargando…</p>}
        {error !== '' && <p className="aviso aviso--error">✕ {error}</p>}

        <EstadoDeLista
          credenciales={credenciales}
          lista={lista}
          esAdmin={esAdmin}
          alCambiar={alCambiarEstado}
        />

        {!cargando && error === '' && (
          <BalanceDeLista
            credenciales={credenciales}
            lista={lista}
            gastos={gastos}
            personas={personas}
          />
        )}

        {!cargando && error === '' && (
          <ListaDeGastos
            gastos={gastos}
            conceptos={conceptos}
            personas={personas}
            alCorregir={
              cerrada ? null : (gasto, que) => setCorrigiendo({ gasto, que })
            }
          />
        )}
      </div>

      {corrigiendo && (
        <CorregirGasto
          credenciales={credenciales}
          gasto={corrigiendo.gasto}
          nombreDelGasto={
            conceptos.find((uno) => uno.id === corrigiendo.gasto.idConcepto)?.nombre ??
            'Gasto'
          }
          emoji={
            conceptos.find((uno) => uno.id === corrigiendo.gasto.idConcepto)?.emoji ?? '🧾'
          }
          que={corrigiendo.que}
          alGuardar={() => {
            setCorrigiendo(null);
            void recargar();
          }}
          alCerrar={() => setCorrigiendo(null)}
        />
      )}
    </div>
  );
}
