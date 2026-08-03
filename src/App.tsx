import { useEffect } from 'react';
import { fijarQuienUsaLaApp } from './api/planilla';
import { Configuracion } from './paginas/Configuracion';
import { Ingreso } from './paginas/Ingreso';
import { Inicio } from './paginas/Inicio';
import { usarCredenciales } from './hooks/usarCredenciales';
import { usarSesion } from './hooks/usarSesion';
import './App.css';

export function App() {
  const { credenciales, guardar, estanCompletas } = usarCredenciales();
  const { persona, ingresar, salir } = usarSesion();

  useEffect(() => {
    fijarQuienUsaLaApp(persona?.codigo ?? null);
  }, [persona]);

  if (!estanCompletas) {
    return (
      <main className="app">
        <Configuracion credenciales={credenciales} alConectar={guardar} />
      </main>
    );
  }

  if (!persona) {
    return (
      <main className="app">
        <Ingreso credenciales={credenciales} alIngresar={ingresar} />
      </main>
    );
  }

  return (
    <main className="app">
      <Inicio credenciales={credenciales} persona={persona} alSalir={salir} />
    </main>
  );
}
