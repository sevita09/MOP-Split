import { useEffect } from 'react';
import { fijarQuienUsaLaApp } from './api/planilla';
import { Configuracion } from './paginas/Configuracion';
import { Ingreso } from './paginas/Ingreso';
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
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p>Hola {persona.nombre}. Las listas y los gastos vienen en v2 y v3.</p>
        <button type="button" className="boton boton--secundario" onClick={salir}>
          Salir
        </button>
      </div>
    </main>
  );
}
