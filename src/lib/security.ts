/**
 * @file security.ts
 * @description Módulo de Criptografía, Hashing de Contraseñas y Seguridad de Usuarios
 * Establecimiento Pozo del Carril · La Aguada - FCE UNRC
 */

import { Usuario } from '../types/schema';

const SALT_PREFIX = 'UNRC_POZO_DEL_CARRIL_2026_SEC_';

/**
 * Calcula el hash SHA-256 de una contraseña utilizando la API criptográfica nativa (Web Crypto API)
 */
export async function hashPassword(password: string): Promise<string> {
  const salted = `${SALT_PREFIX}${password}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(salted);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `sha256:${hashHex}`;
}

/**
 * Valida una contraseña ingresada contra el valor almacenado.
 * Admite tanto contraseñas migradas con hash SHA-256 como contraseñas históricas iniciales.
 */
export async function verifyPassword(inputPassword: string, storedHash?: string): Promise<boolean> {
  if (!storedHash) return false;
  
  // Si está almacenada con el prefijo sha256:
  if (storedHash.startsWith('sha256:')) {
    const computed = await hashPassword(inputPassword);
    return computed === storedHash;
  }

  // Compatibilidad con contraseñas de arranque de constants.ts (texto directo o legacy)
  return inputPassword === storedHash;
}

/**
 * Genera una contraseña inicial segura y legible para nuevos usuarios o restablecimientos
 */
export function generateRandomPassword(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const num = Math.floor(100 + Math.random() * 900);
  const randomChar = chars.charAt(Math.floor(Math.random() * chars.length));
  return `Aguada${randomChar}${year}#${num}`;
}

/**
 * Sanitiza el objeto de usuario para evitar que el hash o información sensible viaje a componentes visuales
 */
export function sanitizeUserForDisplay(user: Usuario): Usuario {
  return {
    ...user,
    contrasena_hash: undefined
  };
}

/**
 * Valida la política de contraseñas de alta seguridad administrativa:
 * Exige un mínimo estricto de 12 caracteres, admitiendo frases de paso y caracteres especiales.
 */
export function validatePasswordPolicy(password: string): { valid: boolean; message?: string } {
  if (!password) {
    return { valid: false, message: 'La contraseña no puede estar vacía.' };
  }
  if (password.length < 12) {
    return {
      valid: false,
      message: `La contraseña debe contener al menos 12 caracteres (ingresó ${password.length}). Se recomienda el uso de frases de contraseña seguras.`
    };
  }
  return { valid: true };
}

/**
 * Descripción oficial de la política de contraseñas para ayuda en formularios
 */
export const PASSWORD_POLICY_DESCRIPTION = 'Mínimo de 12 caracteres requerido. Se admiten frases de contraseña, letras, números y símbolos.';
