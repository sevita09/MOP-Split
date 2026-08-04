import { useEffect } from 'react';
import { fijarAlCaerLaSesion } from './api/planilla';
import { cerrarSesion } from './api/personas';
import { Configuracion } from './paginas/Configuracion';
import { Ingreso } from './paginas/Ingreso';
import { Inicio } from './paginas/Inicio';
import { usarCredenciales } from './hooks/usarCredenciales';
import { usarSesion } from './hooks/usarSesion';
import './App.css';

export function App() {
  const { credenciales, guardar, borrar, estanCompletas } = usarCredenciales();
  const { sesion, ingresar, salir } = usarSesion();

  useEffect(() => {
    fijarAlCaerLaSesion(salir);
    return () => fijarAlCaerLaSesion(null);
  }, [salir]);

  /**
   * Desloguea el celular en el acto y avisa a la planilla sin esperarla.
   *
   * Aguardar la respuesta son casi cuatro segundos mirando una pantalla que ya
   * podría estar cerrada. Y no hay nada que decidir con el resultado: si el
   * aviso falla, lo peor que pasa es que quede una fila de más en `Sesiones`,
   * que se borra a mano.
   */
  function alSalir() {
    void cerrarSesion(credenciales);
    salir();
  }

  /**
   * Vuelve a la pantalla de conexión.
   *
   * Hace falta cuando la planilla guardada ya no sirve: se borró, cambió de
   * dirección o quedó con un backend viejo. Sin esto la app queda tapiada, y la
   * única salida sería borrar los datos del navegador.
   */
  function alDesconectar() {
    salir();
    borrar();
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
        <Ingreso
          credenciales={credenciales}
          alIngresar={ingresar}
          alDesconectar={alDesconectar}
        />
      </main>
    );
  }

  return (
    <main className="app">
      <Inicio
        credenciales={credenciales}
        persona={sesion.persona}
        alSalir={alSalir}
        alDesconectar={alDesconectar}
      />
    </main>
  );
}
