/**
 * Formatos disponibles para codificar la información dentro del Código QR.
 * Todos los formatos se generan 100% en el navegador sin llamadas externas.
 */
export enum QrEncodingFormat {
  /** Carga estructurada JSON con huella de integridad SHA-256 local */
  JSON_SIGNED = 'JSON_SIGNED',
  /** Texto legible directo para lectores ópticos universales */
  PLAIN_TEXT = 'PLAIN_TEXT',
  /** Estándar vCard 3.0 compatible con la cámara nativa de teléfonos móviles */
  VCARD = 'VCARD',
}

/**
 * Modos de comportamiento del Código QR.
 */
export enum QrSecurityMode {
  /** Código QR permanente e invariable mientras no cambien los datos */
  PERMANENT = 'PERMANENT',
  /** Código QR dinámico local que renueva su ventana temporal cada 30 segundos */
  DYNAMIC_WINDOW = 'DYNAMIC_WINDOW',
}

/**
 * Estructura de datos personales almacenada localmente en LocalStorage.
 */
export interface UserCredential {
  /** Nombre y apellidos del titular */
  fullName: string;
  /** Cédula de identidad, DNI, pasaporte o código de empleado */
  documentId: string;
  /** Cargo o puesto actual */
  role: string;
  /** Departamento, área o unidad organizativa */
  department: string;
  /** Nombre opcional de la empresa o institución */
  organization: string;
  /** PIN de seguridad de 4 dígitos para desbloquear la edición */
  securityPin: string;
  /** Formato preferido de codificación del QR */
  encodingFormat: QrEncodingFormat;
  /** Modo estático permanente o ventana dinámica local */
  securityMode: QrSecurityMode;
  /** Semilla aleatoria generada localmente en el dispositivo para firma de integridad */
  deviceSalt: string;
  /** Fecha ISO de creación inicial */
  createdAt: string;
  /** Fecha ISO de última actualización */
  updatedAt: string;
}

/**
 * Campos editables desde el formulario de configuración.
 */
export interface CredentialFormValues {
  fullName: string;
  documentId: string;
  role: string;
  department: string;
  organization: string;
  securityPin: string;
  encodingFormat: QrEncodingFormat;
  securityMode: QrSecurityMode;
}
