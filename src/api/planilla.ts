/**
 * Único punto de la app que habla con Apps Script. Ningún componente ni hook
 * hace `fetch` por su cuenta.
 *
 * El backend es un Web App de Apps Script con un solo `doPost`: todas las
 * operaciones viajan en el cuerpo bajo la clave `accion`.
 */

export interface Credenciales {
  url: string;
  token: string;
}
