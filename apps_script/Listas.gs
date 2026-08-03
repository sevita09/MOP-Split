/**
 * Listas de gastos y quién participa en cada una.
 *
 * `Lista_Personas` es una tabla puente y resuelve dos cosas a la vez: quién
 * participa de la lista, y cómo se agrupan a la hora de deber. La columna
 * `Unidad` es el propio código de la persona cuando va sola, o un código
 * compartido cuando dos o más comparten la plata.
 *
 * Esa distinción es el corazón del cálculo: **la división es por cabeza pero el
 * balance es por unidad**. En una lista de 4 personas donde dos de ellas son
 * una unidad, cada gasto se divide en 4 partes, pero esa unidad debe 2 de esas 4.
 * Por eso el agrupamiento vive por lista y no en la hoja `Personas`: los mismos
 * dos pueden ir juntos en una lista y separados en otra.
 */

const HOJA_LISTAS = 'Listas';
const COLUMNAS_LISTAS = ['ID_Lista', 'Nombre', 'Mes', 'Año', 'Estado', 'Dueño'];

const HOJA_LISTA_PERSONAS = 'Lista_Personas';
const COLUMNAS_LISTA_PERSONAS = ['ID_Lista', 'Codigo_Persona', 'Unidad'];

const ESTADO_ABIERTA = 'Abierta';
const ESTADO_CERRADA = 'Cerrada';

function leerListas() {
  const filas = obtenerHoja(HOJA_LISTAS, COLUMNAS_LISTAS).getDataRange().getValues();
  filas.shift();

  return filas
    .filter(function (fila) {
      return String(fila[0]).trim() !== '';
    })
    .map(function (fila) {
      return {
        id: String(fila[0]).trim(),
        nombre: String(fila[1]).trim(),
        mes: Number(fila[2]),
        anio: Number(fila[3]),
        estado: String(fila[4]).trim(),
        dueño: String(fila[5]).trim(),
      };
    });
}

function leerListaPersonas() {
  const filas = obtenerHoja(HOJA_LISTA_PERSONAS, COLUMNAS_LISTA_PERSONAS)
    .getDataRange()
    .getValues();
  filas.shift();

  return filas
    .filter(function (fila) {
      return String(fila[0]).trim() !== '';
    })
    .map(function (fila) {
      return {
        idLista: String(fila[0]).trim(),
        codigoPersona: String(fila[1]).trim(),
        unidad: String(fila[2]).trim(),
      };
    });
}

/** Identificadores correlativos L001, L002… Se busca el primero libre. */
function generarIdLista(existentes) {
  const usados = existentes.map(function (lista) {
    return lista.id;
  });

  let numero = 1;
  while (usados.indexOf('L' + String(numero).padStart(3, '0')) !== -1) {
    numero++;
  }

  return 'L' + String(numero).padStart(3, '0');
}

/**
 * Reparte a cada participante su unidad de balance.
 *
 * Quien va solo tiene por unidad su propio código. Quien está agrupado comparte
 * una unidad con los suyos, armada concatenando los códigos (`U-P01-P02`): así,
 * mirando la planilla a ojo, se ve quiénes cuentan como uno sin tener que
 * cruzar con ninguna otra hoja.
 */
function repartirUnidades(participantes, grupos) {
  const unidadPorPersona = {};

  participantes.forEach(function (codigo) {
    unidadPorPersona[codigo] = codigo;
  });

  grupos.forEach(function (grupo) {
    const ordenado = grupo.slice().sort();
    const unidad = 'U-' + ordenado.join('-');
    ordenado.forEach(function (codigo) {
      unidadPorPersona[codigo] = unidad;
    });
  });

  return unidadPorPersona;
}

/**
 * Crea una lista con sus participantes y sus unidades de balance.
 *
 * Las unidades las arma la planilla a partir de los grupos que manda la app, y
 * no se aceptan tal cual vienen: si el cliente pudiera elegir el texto de la
 * unidad, un error de tipeo dejaría a dos personas que deberían contar como una
 * contando por separado, y el balance saldría mal sin que nada falle.
 */
function ejecutarCrearLista(datos, quien) {
  const nombre = String(datos.nombre || '').trim();
  const mes = Number(datos.mes);
  const anio = Number(datos.anio);
  const dueño = quien.codigo;

  const participantes = (Array.isArray(datos.participantes) ? datos.participantes : [])
    .map(function (codigo) {
      return String(codigo).trim();
    })
    .filter(function (codigo) {
      return codigo !== '';
    });

  const grupos = (Array.isArray(datos.grupos) ? datos.grupos : []).map(function (grupo) {
    return (Array.isArray(grupo) ? grupo : []).map(function (codigo) {
      return String(codigo).trim();
    });
  });

  if (nombre === '') {
    return responder({ estado: 'error', mensaje: 'Falta el nombre de la lista.' });
  }
  if (!(mes >= 1 && mes <= 12)) {
    return responder({ estado: 'error', mensaje: 'El mes tiene que ir de 1 a 12.' });
  }
  if (!(anio >= 2000 && anio <= 2100)) {
    return responder({ estado: 'error', mensaje: 'El año no parece válido.' });
  }
  if (participantes.length === 0) {
    return responder({ estado: 'error', mensaje: 'Elegí al menos un participante.' });
  }
  if (participantes.indexOf(dueño) === -1) {
    // Si el dueño no participa, la lista no le aparecería a él mismo: la vista
    // filtra por participación, no por propiedad.
    return responder({
      estado: 'error',
      mensaje: 'Quien crea la lista tiene que participar de ella.',
    });
  }

  const codigosConocidos = leerPersonas().map(function (persona) {
    return persona.codigo;
  });
  const desconocido = participantes.filter(function (codigo) {
    return codigosConocidos.indexOf(codigo) === -1;
  })[0];

  if (desconocido) {
    return responder({
      estado: 'error',
      mensaje: 'No existe la persona ' + desconocido + '.',
    });
  }

  const fueraDeLaLista = grupos.some(function (grupo) {
    return grupo.some(function (codigo) {
      return participantes.indexOf(codigo) === -1;
    });
  });

  if (fueraDeLaLista) {
    return responder({
      estado: 'error',
      mensaje: 'Hay alguien agrupado que no participa de la lista.',
    });
  }

  const id = generarIdLista(leerListas());
  obtenerHoja(HOJA_LISTAS, COLUMNAS_LISTAS).appendRow([
    id,
    nombre,
    mes,
    anio,
    ESTADO_ABIERTA,
    dueño,
  ]);

  const unidadPorPersona = repartirUnidades(participantes, grupos);
  const hojaParticipantes = obtenerHoja(HOJA_LISTA_PERSONAS, COLUMNAS_LISTA_PERSONAS);
  participantes.forEach(function (codigo) {
    hojaParticipantes.appendRow([id, codigo, unidadPorPersona[codigo]]);
  });

  return responder({
    estado: 'ok',
    mensaje: 'Lista "' + nombre + '" creada.',
    datos: { id: id },
  });
}

/**
 * Cierra o reabre una lista.
 *
 * Solo el dueño o el administrador. La comprobación vive acá y no en la app:
 * esconder el botón es comodidad, lo que impide cerrar una lista ajena es esto.
 *
 * Al cerrar se congela el balance; al reabrir se borra esa foto y vuelve a
 * calcularse en vivo hasta el próximo cierre.
 */
function ejecutarCambiarEstadoDeLista(datos, quien) {
  const idLista = String(datos.idLista || '').trim();
  const cerrar = datos.cerrar === true;

  const hoja = obtenerHoja(HOJA_LISTAS, COLUMNAS_LISTAS);
  const filas = hoja.getDataRange().getValues();

  // Se busca por ID y no por posición: `leerListas` descarta las filas vacías,
  // así que un renglón en blanco correría los índices y se tocaría otra lista.
  let fila = -1;
  for (let indice = 1; indice < filas.length; indice++) {
    if (String(filas[indice][0]).trim() === idLista) {
      fila = indice + 1;
      break;
    }
  }

  if (fila === -1) {
    return responder({ estado: 'error', mensaje: 'No existe esa lista.' });
  }

  const dueño = String(filas[fila - 1][5]).trim();
  const estadoActual = String(filas[fila - 1][4]).trim();

  if (!quien.admin && dueño !== quien.codigo) {
    return responder({
      estado: 'error',
      mensaje: 'Solo quien creó la lista puede cerrarla o reabrirla.',
    });
  }

  const estadoNuevo = cerrar ? ESTADO_CERRADA : ESTADO_ABIERTA;

  if (estadoActual === estadoNuevo) {
    return responder({ estado: 'ok', mensaje: 'La lista ya estaba así.' });
  }

  // Primero se borra siempre la foto anterior: si una lista se cierra dos veces
  // seguidas por un reintento, no tienen que quedar dos fotos superpuestas.
  borrarBalanceDeCierre(idLista);
  if (cerrar) guardarBalanceDeCierre(idLista);

  hoja.getRange(fila, 5).setValue(estadoNuevo);

  return responder({
    estado: 'ok',
    mensaje: cerrar ? 'Lista cerrada.' : 'Lista reabierta.',
  });
}

/**
 * Las listas donde participa una persona, separadas por estado.
 *
 * Se devuelven los participantes de cada lista junto con la lista misma: la app
 * los necesita para mostrar quién está, y traerlos acá evita un segundo pedido
 * por cada lista.
 */
function ejecutarObtenerListas(quien) {
  const codigo = quien.codigo;
  const participaciones = leerListaPersonas();

  const mias = participaciones
    .filter(function (participacion) {
      return participacion.codigoPersona === codigo;
    })
    .map(function (participacion) {
      return participacion.idLista;
    });

  const listas = leerListas()
    .filter(function (lista) {
      return mias.indexOf(lista.id) !== -1;
    })
    .map(function (lista) {
      return {
        id: lista.id,
        nombre: lista.nombre,
        mes: lista.mes,
        anio: lista.anio,
        estado: lista.estado,
        esDueño: lista.dueño === codigo,
        participantes: participaciones
          .filter(function (participacion) {
            return participacion.idLista === lista.id;
          })
          .map(function (participacion) {
            return { codigo: participacion.codigoPersona, unidad: participacion.unidad };
          }),
      };
    });

  return responder({
    estado: 'ok',
    mensaje: listas.length + ' lista(s).',
    datos: {
      abiertas: listas.filter(function (lista) {
        return lista.estado === ESTADO_ABIERTA;
      }),
      cerradas: listas.filter(function (lista) {
        return lista.estado === ESTADO_CERRADA;
      }),
    },
  });
}
