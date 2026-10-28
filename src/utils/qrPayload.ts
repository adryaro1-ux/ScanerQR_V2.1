import QRCode from 'qrcode';
import {QrEncodingFormat, QrSecurityMode, UserCredential} from '../types/credential';

/** Duración en segundos de cada ventana cuando el modo dinámico está activo */
export const DYNAMIC_WINDOW_SECONDS = 30;

/**
 * Calcula una huella criptográfica SHA-256 corta (12 caracteres hex) de forma 100% local
 * usando Web Crypto API, con respaldo determinista FNV-1a si Web Crypto no está disponible.
 */
export async function computeIntegrityDigest(input: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    try {
      const encoder = new TextEncoder();
      const buffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(input));
      const hex = Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return hex.slice(0, 12).toUpperCase();
    } catch {
      // Continúa al respaldo determinista offline
    }
  }

  // Respaldo determinista local sin dependencias externas (FNV-1a 64-bit simulado en 2 bloques)
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= code + (i & 0xff);
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return (part1 + part2).slice(0, 12).toUpperCase();
}

/**
 * Construye la cadena exacta que será codificada en el Código QR según el formato elegido.
 */
export async function buildQrPayload(
  credential: UserCredential,
  windowSlot?: number
): Promise<{payload: string; signature: string}> {
  const isDynamic = credential.securityMode === QrSecurityMode.DYNAMIC_WINDOW;
  const activeSlot =
    isDynamic && typeof windowSlot === 'number'
      ? windowSlot
      : Math.floor(Date.now() / (DYNAMIC_WINDOW_SECONDS * 1000));

  const canonicalBase = [
    credential.fullName,
    credential.documentId,
    credential.role,
    credential.department,
    credential.organization,
    credential.deviceSalt,
    isDynamic ? String(activeSlot) : 'STATIC',
  ].join('|');

  const signature = await computeIntegrityDigest(canonicalBase);

  if (credential.encodingFormat === QrEncodingFormat.PLAIN_TEXT) {
    const lines = [
      `NOMBRE: ${credential.fullName}`,
      `ID: ${credential.documentId}`,
      `CARGO: ${credential.role}`,
      `DEPARTAMENTO: ${credential.department}`,
    ];
    if (credential.organization) {
      lines.push(`ENTIDAD: ${credential.organization}`);
    }
    if (isDynamic) {
      lines.push(`VENTANA: ${activeSlot}`);
    }
    lines.push(`VERIFICACION: ${signature}`);
    return {payload: lines.join('\n'), signature};
  }

  if (credential.encodingFormat === QrEncodingFormat.VCARD) {
    const orgValue = credential.organization
      ? `${credential.organization};${credential.department}`
      : credential.department;
    const vcardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${credential.fullName}`,
      `N:${credential.fullName};;;;`,
      `ORG:${orgValue}`,
      `TITLE:${credential.role}`,
      `NOTE:ID ${credential.documentId} | Depto: ${credential.department} | Hash: ${signature}`,
      'END:VCARD',
    ];
    return {payload: vcardLines.join('\n'), signature};
  }

  // Por defecto: JSON estructurado compacto ideal para sistemas de control de acceso
  const jsonPayload: Record<string, string | number> = {
    v: 1,
    nombre: credential.fullName,
    id: credential.documentId,
    cargo: credential.role,
    depto: credential.department,
  };

  if (credential.organization) {
    jsonPayload.entidad = credential.organization;
  }
  if (isDynamic) {
    jsonPayload.ts = activeSlot * DYNAMIC_WINDOW_SECONDS;
  }
  jsonPayload.sig = signature;

  return {
    payload: JSON.stringify(jsonPayload),
    signature,
  };
}

/**
 * Genera un SVG vectorial nítido del Código QR de forma local en el navegador.
 */
export async function renderQrSvg(payload: string): Promise<string> {
  return QRCode.toString(payload, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 2,
    color: {
      dark: '#0F172A',
      light: '#FFFFFF',
    },
  });
}

/**
 * Genera una imagen PNG de alta resolución (tarjeta completa lista para guardar en galería o imprimir)
 * renderizando localmente sobre un elemento HTML5 Canvas sin conexión a internet.
 */
export async function exportCredentialCardPng(
  credential: UserCredential,
  payload: string,
  signature: string
): Promise<string> {
  const width = 960;
  const height = 1320;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return QRCode.toDataURL(payload, {width: 800, margin: 3});
  }

  // Fondo neutro limpio
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, width, height);

  // Superficie de la tarjeta
  const cardX = 56;
  const cardY = 56;
  const cardW = width - 112;
  const cardH = height - 112;
  const radius = 40;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#E2E8F0';
  ctx.stroke();
  ctx.restore();

  // Encabezado institucional sobrio
  ctx.fillStyle = '#64748B';
  ctx.font = '600 22px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(
    (credential.organization || 'Credencial de Identificación Personal').slice(0, 44),
    cardX + 56,
    cardY + 74
  );

  // Línea divisoria superior
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + 56, cardY + 106);
  ctx.lineTo(cardX + cardW - 56, cardY + 106);
  ctx.stroke();

  // Dibujar el Código QR en un canvas auxiliar de alta definición
  const qrSize = 540;
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, payload, {
    width: qrSize,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0F172A',
      light: '#FFFFFF',
    },
  });

  const qrX = Math.round((width - qrSize) / 2);
  const qrY = cardY + 150;
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

  // Separador inferior
  const dividerY = qrY + qrSize + 52;
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + 56, dividerY);
  ctx.lineTo(cardX + cardW - 56, dividerY);
  ctx.stroke();

  // Datos del titular
  ctx.fillStyle = '#0F172A';
  ctx.font = '700 42px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(credential.fullName.slice(0, 32), cardX + 56, dividerY + 76);

  ctx.fillStyle = '#475569';
  ctx.font = '500 28px "Plus Jakarta Sans", system-ui, sans-serif';
  const roleDept = `${credential.role} · ${credential.department}`;
  ctx.fillText(roleDept.slice(0, 46), cardX + 56, dividerY + 126);

  // Bloque inferior de identificación y firma
  const metaY = dividerY + 216;
  ctx.fillStyle = '#64748B';
  ctx.font = '500 20px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('Cédula / ID', cardX + 56, metaY);
  ctx.fillText('Código de verificación', cardX + cardW / 2 + 20, metaY);

  ctx.fillStyle = '#0F172A';
  ctx.font = '600 30px "JetBrains Mono", monospace';
  ctx.fillText(credential.documentId.slice(0, 22), cardX + 56, metaY + 44);
  ctx.fillText(signature, cardX + cardW / 2 + 20, metaY + 44);

  return canvas.toDataURL('image/png');
}
