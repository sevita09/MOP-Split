/**
 * Web App de Split Familiar: único punto de entrada del backend.
 *
 * Todo llega por POST con una clave `accion` que decide qué se ejecuta. A
 * medida que crezcan las operaciones, cada área se va a su propio archivo
 * (Listas.gs, Gastos.gs…) y este queda solo con el ruteo y la validación.
 *
 * `doPost` y `ContentService` son de la API de Apps Script: van en inglés.
 *
 * El permiso que pide el script está acotado en `appsscript.json` al scope
 * `spreadsheets.currentonly`: solo la planilla donde está pegado. Por defecto
 * Apps Script pide acceso a *todas* las hojas de cálculo de la cuenta, que es
 * muchísimo más de lo que este código necesita — acá nunca se abre otra
 * planilla, siempre se trabaja sobre `getActiveSpreadsheet()`. El JSON no
 * admite comentarios, así que la explicación vive acá.
 */

/**
 * El token no vive en el código: se carga en Apps Script, en Configuración del
 * proyecto → Propiedades del script, con la clave TOKEN_SECRETO. Así este
 * archivo se puede versionar sin filtrar el secreto.
 */
function obtenerTokenSecreto() {
  const token = PropertiesService.getScriptProperties().getProperty('TOKEN_SECRETO');
  if (!token) {
    throw new Error(
      'Falta TOKEN_SECRETO en Configuración del proyecto → Propiedades del script.',
    );
  }
  return token;
}

function doPost(e) {
  try {
    const datos = JSON.parse(e.postData.contents);

    if (datos.token !== obtenerTokenSecreto()) {
      return responder({ estado: 'error', mensaje: 'Token inválido.' });
    }

    // La identidad sale del token, no del código que el celular dice tener.
    // Las acciones de abajo que no la exigen son las que corren antes de que
    // exista sesión: probar la conexión, listar nombres para elegir, ingresar.
    const persona = personaDeLaSesion(datos);

    switch (datos.accion) {
      case 'PING':
        return ejecutarPing(persona);
      case 'OBTENER_PERSONAS':
        return ejecutarObtenerPersonas();
      case 'LOGIN':
        return ejecutarLogin(datos);
      case 'CREAR_PRIMERA_PERSONA':
        return ejecutarCrearPrimeraPersona(datos);
      case 'CERRAR_SESION':
        return ejecutarCerrarSesion(datos);
      case 'OBTENER_CONCEPTOS':
        return exigirSesion(persona, ejecutarObtenerConceptos);
      case 'OBTENER_LISTAS':
        return exigirSesion(persona, ejecutarObtenerListas);
      case 'CREAR_LISTA':
        return exigirSesion(persona, function (quien) {
          return ejecutarCrearLista(datos, quien);
        });
      case 'CREAR_GASTO':
        return exigirSesion(persona, function (quien) {
          return ejecutarCrearGasto(datos, quien);
        });
      default:
        return responder({
          estado: 'error',
          mensaje: 'Acción desconocida: ' + datos.accion,
        });
    }
  } catch (error) {
    return responder({ estado: 'error', mensaje: String(error) });
  }
}

function responder(cuerpo) {
  return ContentService.createTextOutput(JSON.stringify(cuerpo)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/**
 * El PING escribe en su propia hoja `Ping` y no en una de datos: es ruido de
 * diagnóstico y se puede vaciar entera cuando molesta, sin tocar nada real.
 */
function ejecutarPing(quien) {
  const hoja = obtenerHoja('Ping', ['Fecha', 'Usuario', 'Detalle']);
  // El PING corre también durante la configuración, antes de que exista
  // sesión: por eso es el único evento que acepta no saber quién lo pidió.
  hoja.appendRow([new Date(), quien ? quien.nombre : 'sin identificar', 'Prueba de conexión']);
  return responder({
    estado: 'ok',
    mensaje: 'Conexión OK. Se escribió una fila en la hoja Ping.',
  });
}

/**
 * Devuelve la hoja por nombre y la crea con sus encabezados si todavía no
 * existe. No usamos getActiveSheet(): depende de qué pestaña quedó abierta la
 * última vez y termina escribiendo en cualquier lado.
 */
function obtenerHoja(nombre, encabezados) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(nombre);

  if (!hoja) {
    hoja = libro.insertSheet(nombre);
    hoja.appendRow(encabezados);
    hoja.getRange(1, 1, 1, encabezados.length).setHorizontalAlignment('center');
    hoja.setFrozenRows(1);
  }

  return hoja;
}
