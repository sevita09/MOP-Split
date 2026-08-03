import { Configuracion } from './paginas/Configuracion';
import { Ingreso } from './paginas/Ingreso';
import { usarCredenciales } from './hooks/usarCredenciales';
import './App.css';

export function App() {
  const { credenciales, guardar, estanCompletas } = usarCredenciales();

  return (
    <main className="app">
      {estanCompletas ? (
        <Ingreso credenciales={credenciales} />
      ) : (
        <Configuracion credenciales={credenciales} alConectar={guardar} />
      )}
    </main>
  );
}
