import { useState } from 'react';
import type { Persona } from './api/personas';
import { Configuracion } from './paginas/Configuracion';
import { Ingreso } from './paginas/Ingreso';
import { usarCredenciales } from './hooks/usarCredenciales';
import './App.css';

export function App() {
  const { credenciales, guardar, estanCompletas } = usarCredenciales();
  const [sesion, setSesion] = useState<Persona | null>(null);

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
        <Ingreso credenciales={credenciales} alIngresar={setSesion} />
      </main>
    );
  }

  return (
    <main className="app">
      <p style={{ padding: 24 }}>Hola {sesion.nombre}. Las listas vienen en v2.</p>
    </main>
  );
}
