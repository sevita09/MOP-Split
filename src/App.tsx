import { Configuracion } from './paginas/Configuracion';
import { usarCredenciales } from './hooks/usarCredenciales';
import './App.css';

export function App() {
  const { credenciales, guardar, estanCompletas } = usarCredenciales();

  return (
    <main className="app">
      {estanCompletas ? (
        <p style={{ padding: 24 }}>Conectado. El ingreso por persona viene en un rato.</p>
      ) : (
        <Configuracion credenciales={credenciales} alConectar={guardar} />
      )}
    </main>
  );
}
