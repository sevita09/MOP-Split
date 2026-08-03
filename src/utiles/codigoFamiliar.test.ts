import { describe, expect, test } from 'vitest';
import { generarCodigoFamiliar, leerCodigoFamiliar } from './codigoFamiliar';

const CREDENCIALES = {
  url: 'https://script.google.com/macros/s/AKfycbxEjemplo123/exec',
  token: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
};

describe('codigo familiar', () => {
  test('un codigo generado se vuelve a leer igual', () => {
    const codigo = generarCodigoFamiliar(CREDENCIALES);
    expect(leerCodigoFamiliar(codigo)).toEqual(CREDENCIALES);
  });

  test('un codigo con espacios alrededor se lee igual', () => {
    // Pegar desde WhatsApp suele arrastrar espacios o un salto de línea.
    const codigo = generarCodigoFamiliar(CREDENCIALES);
    expect(leerCodigoFamiliar(`  ${codigo}\n`)).toEqual(CREDENCIALES);
  });

  test('el codigo no lleva caracteres que se rompan en un enlace', () => {
    // base64 usa `+` y `/`: el `+` viaja como espacio en una URL y el código
    // llegaría cortado. Por eso se codifica en base64url.
    const codigo = generarCodigoFamiliar(CREDENCIALES);
    expect(codigo).not.toMatch(/[+/=]/);
  });

  test('un texto cualquiera no es un codigo valido', () => {
    expect(leerCodigoFamiliar('hola')).toBeNull();
    expect(leerCodigoFamiliar('')).toBeNull();
  });

  test('un codigo sin el prefijo se rechaza', () => {
    // Sin prefijo no hay forma de distinguirlo de cualquier otro texto pegado.
    const codigo = generarCodigoFamiliar(CREDENCIALES);
    expect(leerCodigoFamiliar(codigo.replace('SPLIT1-', ''))).toBeNull();
  });

  test('un codigo con el prefijo pero contenido roto se rechaza', () => {
    expect(leerCodigoFamiliar('SPLIT1-esto-no-es-base64-valido!!')).toBeNull();
  });

  test('una url con acentos sobrevive la ida y vuelta', () => {
    // El nombre del despliegue puede traer caracteres fuera de ASCII y btoa
    // solo acepta bytes: por eso se codifica con TextEncoder antes.
    const conAcentos = { url: 'https://ejemplo.com/ñandú/exec', token: 'clavé' };
    expect(leerCodigoFamiliar(generarCodigoFamiliar(conAcentos))).toEqual(conAcentos);
  });
});
