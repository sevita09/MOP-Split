import { useEffect } from 'react';
import { fijarSesion } from './api/planilla';
import { cerrarSesion } from './api/personas';
import { Configuracion } from './paginas/Configuracion';
import { Ingreso } from './paginas/Ingreso';
import { Inicio } from './paginas/Inicio';
import { usarCredenciales } from './hooks/usarCredenciales';
import { usarSesion } from './hooks/usarSesion';
import './App.css';

export function App() {
  const { credenciales, guardar, estanCompletas } = usarCredenciales();
  const { sesion, ingresar, salir } = usarSesion();

  // Se fija antes de que cualquier pantalla pida datos: si se hiciera después,
  // el primer pedido saldría sin token y la planilla lo rechazaría.
  useEffect(() => {
    fijarSesion(sesion?.token ?? null);
  }, [sesion]);

  async function alSalir() {
    await cerrarSesion(credenciales);
    salir();
  }

  if (!estanCompletas) {
    return (
      <main className="app">
        <Configuracion credenciales={credenciales} alConectar={guardar} />
      </main>
    );
  }

  if (!sesion) {
    return (
      <main className="app">
        <Ingreso credenciales={credenciales} alIngresar={ingresar} />
      </main>
    );
  }

  return (
    <main className="app">
      <Inicio
        credenciales={credenciales}
        persona={sesion.persona}
        alSalir={() => void alSalir()}
      />
    </main>
  );
}
