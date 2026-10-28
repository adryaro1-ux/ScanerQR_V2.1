import React, {useRef, useState} from 'react';
import {Check, Copy, FileDown, FileUp} from 'lucide-react';
import {
  QrEncodingFormat,
  QrSecurityMode,
  UserCredential,
} from '../types/credential';
import {parseCredentialBackup} from '../utils/storage';

interface PayloadInspectorProps {
  credential: UserCredential;
  payload: string;
  signature: string;
  onQuickFormatChange: (format: QrEncodingFormat) => void;
  onQuickModeChange: (mode: QrSecurityMode) => void;
  onImportCredential: (imported: UserCredential) => void;
}

/**
 * Panel transparente de inspección local: permite revisar exactamente qué datos
 * contiene el Código QR, cambiar rápidamente el formato de lectura y exportar/importar
 * una copia de respaldo JSON local sin depender de la nube.
 */
export const PayloadInspector: React.FC<PayloadInspectorProps> = ({
  credential,
  payload,
  signature,
  onQuickFormatChange,
  onQuickModeChange,
  onImportCredential,
}) => {
  const [copied, setCopied] = useState(false);
  const [importStatus, setImportStatus] = useState<{type: 'ok' | 'err'; text: string} | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignorar si el navegador restringe portapapeles
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(credential, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeId = credential.documentId.replace(/[^a-zA-Z0-9_-]/g, '_');
    link.href = url;
    link.download = `Respaldo_Credencial_${safeId || 'Local'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      const parsed = parseCredentialBackup(content);
      if (parsed) {
        onImportCredential(parsed);
        setImportStatus({
          type: 'ok',
          text: 'Credencial restaurada correctamente desde el archivo local.',
        });
      } else {
        setImportStatus({
          type: 'err',
          text: 'El archivo seleccionado no contiene una credencial válida.',
        });
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const formattedUpdatedDate = new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(credential.updatedAt));

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          Información codificada y ajustes rápidos
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Todo el procesamiento ocurre en la memoria de tu teléfono sin conexión a servidores externos.
        </p>
      </div>

      {/* Selector rápido de formato compatible con el lector del lugar */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-700">Formato activo del lector</span>
          <span className="text-xs text-slate-500">Cambio instantáneo</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onQuickFormatChange(QrEncodingFormat.JSON_SIGNED)}
            className={`min-h-[42px] rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              credential.encodingFormat === QrEncodingFormat.JSON_SIGNED
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            JSON Seguro
          </button>
          <button
            type="button"
            onClick={() => onQuickFormatChange(QrEncodingFormat.PLAIN_TEXT)}
            className={`min-h-[42px] rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              credential.encodingFormat === QrEncodingFormat.PLAIN_TEXT
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Texto Directo
          </button>
          <button
            type="button"
            onClick={() => onQuickFormatChange(QrEncodingFormat.VCARD)}
            className={`min-h-[42px] rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              credential.encodingFormat === QrEncodingFormat.VCARD
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Contacto vCard
          </button>
        </div>
      </div>

      {/* Selector rápido de modo permanente o dinámico */}
      <div>
        <span className="text-xs font-semibold text-slate-700">Modo de seguridad</span>
        <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onQuickModeChange(QrSecurityMode.PERMANENT)}
            className={`min-h-[42px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              credential.securityMode === QrSecurityMode.PERMANENT
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            QR Permanente
          </button>
          <button
            type="button"
            onClick={() => onQuickModeChange(QrSecurityMode.DYNAMIC_WINDOW)}
            className={`min-h-[42px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              credential.securityMode === QrSecurityMode.DYNAMIC_WINDOW
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            QR Dinámico (30s)
          </button>
        </div>
      </div>

      {/* Inspección transparente del contenido crudo del QR */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-700">
            Carga exacta codificada en el QR
          </span>
          <button
            type="button"
            onClick={handleCopyPayload}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copiar texto</span>
              </>
            )}
          </button>
        </div>

        <pre className="mt-2 max-h-44 overflow-x-auto rounded-2xl bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap break-all">
          {payload}
        </pre>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span>Huella SHA-256: <strong className="font-mono font-semibold text-slate-700 tabular-nums">{signature}</strong></span>
          <span aria-hidden="true">·</span>
          <span>Actualizado: {formattedUpdatedDate}</span>
        </div>
      </div>

      {/* Respaldo e importación local de archivo JSON */}
      <div className="pt-4 border-t border-slate-100">
        <span className="block text-xs font-semibold text-slate-700">
          Portabilidad local entre dispositivos
        </span>
        <p className="mt-0.5 text-xs text-slate-500">
          Guarda una copia de respaldo en tu teléfono o restaura tus datos desde un archivo JSON local.
        </p>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileDown className="h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
            <span>Exportar respaldo JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileUp className="h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
            <span>Importar respaldo JSON</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {importStatus && (
          <p
            role="status"
            className={`mt-2.5 text-xs font-medium ${
              importStatus.type === 'ok' ? 'text-blue-700' : 'text-red-700'
            }`}
          >
            {importStatus.text}
          </p>
        )}
      </div>
    </div>
  );
};
