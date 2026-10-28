import {
  CredentialFormValues,
  QrEncodingFormat,
  QrSecurityMode,
  UserCredential,
} from '../types/credential';

/** Clave única de almacenamiento local en el navegador del dispositivo */
const STORAGE_KEY = 'credencial_qr_local_v1';

/**
 * Genera una semilla hexadecimal aleatoria usando la API criptográfica local del navegador.
 */
export function generateLocalSalt(): string {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(8);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return Math.random().toString(16).slice(2, 18).padEnd(16, '0');
}

/**
 * Valida que un objeto recuperado de LocalStorage o de un archivo JSON
 * cumpla con la estructura mínima requerida.
 */
function isValidCredential(data: unknown): data is UserCredential {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Record<string, unknown>;
  return (
    typeof candidate.fullName === 'string' &&
    candidate.fullName.trim().length > 0 &&
    typeof candidate.documentId === 'string' &&
    candidate.documentId.trim().length > 0 &&
    typeof candidate.role === 'string' &&
    candidate.role.trim().length > 0 &&
    typeof candidate.department === 'string' &&
    candidate.department.trim().length > 0
  );
}

/**
 * Normaliza campos opcionales o añadidos en actualizaciones para garantizar compatibilidad.
 */
function normalizeCredential(raw: Partial<UserCredential> & CredentialFormValues): UserCredential {
  const now = new Date().toISOString();
  const validFormats = Object.values(QrEncodingFormat);
  const validModes = Object.values(QrSecurityMode);

  return {
    fullName: raw.fullName.trim(),
    documentId: raw.documentId.trim(),
    role: raw.role.trim(),
    department: raw.department.trim(),
    organization: typeof raw.organization === 'string' ? raw.organization.trim() : '',
    securityPin:
      typeof raw.securityPin === 'string' && raw.securityPin.trim().length >= 4
        ? raw.securityPin.trim()
        : '1234',
    encodingFormat: validFormats.includes(raw.encodingFormat)
      ? raw.encodingFormat
      : QrEncodingFormat.JSON_SIGNED,
    securityMode: validModes.includes(raw.securityMode)
      ? raw.securityMode
      : QrSecurityMode.PERMANENT,
    deviceSalt:
      typeof raw.deviceSalt === 'string' && raw.deviceSalt.length >= 8
        ? raw.deviceSalt
        : generateLocalSalt(),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
  };
}

/**
 * Carga la credencial guardada en LocalStorage.
 * Retorna `null` si aún no se han registrado datos o si el almacenamiento está vacío.
 */
export function loadStoredCredential(): UserCredential | null {
  try {
    const serialized = window.localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;
    const parsed: unknown = JSON.parse(serialized);
    if (!isValidCredential(parsed)) return null;
    return normalizeCredential(parsed);
  } catch {
    return null;
  }
}

/**
 * Guarda o actualiza los datos personales del usuario en LocalStorage.
 * Conserva la fecha de creación original y la semilla del dispositivo si ya existía.
 */
export function saveStoredCredential(
  values: CredentialFormValues,
  existing?: UserCredential | null
): UserCredential {
  const now = new Date().toISOString();
  const nextCredential: UserCredential = normalizeCredential({
    ...values,
    deviceSalt: existing?.deviceSalt ?? generateLocalSalt(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCredential));
  } catch {
    // Si el navegador restringe escritura por modo privado estricto, mantenemos estado en memoria
  }

  return nextCredential;
}

/**
 * Elimina por completo los datos almacenados localmente en el dispositivo.
 */
export function clearStoredCredential(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignorar errores de acceso al almacenamiento
  }
}

/**
 * Parsea y valida un archivo de respaldo JSON importado localmente por el usuario.
 */
export function parseCredentialBackup(jsonContent: string): UserCredential | null {
  try {
    const parsed: unknown = JSON.parse(jsonContent);
    if (!isValidCredential(parsed)) return null;
    return normalizeCredential(parsed);
  } catch {
    return null;
  }
}
