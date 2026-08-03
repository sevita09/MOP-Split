# Split Familiar

App para dividir los gastos compartidos de la familia. Se instala en el celular
y guarda todo en una planilla de Google.

- **Frontend:** PWA en Vite + React + TypeScript.
- **Backend:** un Web App de Google Apps Script sobre una planilla de Sheets.
- **Publicación:** GitHub Pages, en cada push a `main`.

---

## Instalar la app en el celular

La app vive en **https://sevita09.github.io/MOP-Split/** y se instala como
cualquier aplicación, pero sin pasar por la tienda.

**Android (Chrome)**

1. Abrir esa dirección en Chrome.
2. Menú **⋮** arriba a la derecha → **Instalar aplicación** (a veces figura como
   *Agregar a la pantalla principal*).
3. Confirmar. Queda el ícono en el escritorio y abre a pantalla completa.

**iPhone / iPad (Safari)**

1. Abrir esa dirección **en Safari**. Desde Chrome en iOS no se puede instalar:
   iOS solo deja hacerlo desde Safari.
2. Botón **Compartir** (el cuadradito con la flecha para arriba).
3. Bajar hasta **Agregar a inicio** → **Agregar**.

La primera vez hay que conectar la planilla; después queda guardada en ese
celular y no la vuelve a pedir. Cada persona instala la app en su propio
teléfono y todas apuntan a la misma planilla.

---

## Conectar la planilla

La app te guía paso a paso en su primera pantalla —incluye un botón para copiar
el código del backend y otro para generar la clave secreta—, así que alcanza con
seguirla. El resumen, para tenerlo a mano:

1. En la planilla de Google: **Extensiones → Apps Script**.
2. Pegar el contenido de [`apps_script/Codigo.gs`](apps_script/Codigo.gs) y guardar.
3. En **Configuración del proyecto → Propiedades del script**, agregar la
   propiedad `TOKEN_SECRETO` con una clave inventada. No va en el código, así el
   archivo se puede versionar sin filtrar el secreto.
4. **Implementar → Nueva implementación → Aplicación web**, ejecutando *como yo*
   y con acceso para *cualquier usuario*. Copiar la URL, que termina en `/exec`.
5. En la app, pegar esa URL y la clave, **Guardar** y **Probar conexión**: tiene
   que escribir una fila en la hoja `Ping`, que se crea sola.

> Cada vez que se cambia el `.gs` hay que crear una **nueva versión** de la
> implementación. Editar el código no alcanza: la URL `/exec` sigue sirviendo el
> anterior.

---

## Desarrollo

```bash
npm install
npm run dev
```

Levanta en http://localhost:5175 con puerto fijo (el 5173 lo usa MOP Inversiones).

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run typecheck` | Chequeo de tipos |
| `npm run build` | Compila a `dist/` |
| `npm run preview` | Sirve `dist/` para probar el build |
