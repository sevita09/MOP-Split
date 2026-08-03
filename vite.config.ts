import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages sirve el sitio desde /MOP-Split/, no desde la raíz del dominio.
// Sin este base, todos los assets y el service worker apuntan a rutas que no existen.
const RUTA_BASE = '/MOP-Split/';

export default defineConfig({
  base: RUTA_BASE,
  plugins: [react()],
  server: {
    // 5173 lo ocupa el front de MOP Inversiones. Puerto fijo y strictPort para
    // que nunca salte solo: si saltara, uno sigue mirando la pestaña vieja.
    port: 5175,
    strictPort: true,
  },
});
