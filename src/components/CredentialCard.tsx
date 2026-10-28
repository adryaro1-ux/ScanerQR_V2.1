import React, {useEffect, useMemo, useState} from 'react';
import {Check, Download, Maximize2, QrCode, X} from 'lucide-react';
import {QrSecurityMode, UserCredential} from '../types/credential';
import {
  DYNAMIC_WINDOW_SECONDS,
  exportCredentialCardPng,
  renderQrSvg,
} from '../utils/qrPayload';

interface CredentialCardProps {
  credential: UserCredential;
  payload: string;
  signature: string;
  secondsRemaining: number;
  isFullscreenOpen: boolean;
  onFullscreenChange: (open: boolean) => void;
}

/**
 * Pantalla principal "Credencial Virtual":
 * Muestra únicamente la tarjeta de identificación digital con la información del usuario
 * y el código QR grande y centrado, sin opciones complejas visibles a simple vista.
 */
export const CredentialCard: React.FC<CredentialCardProps> = ({
  credential,
  payload,
  signature,
  secondsRemaining,
  isFullscreenOpen,
  onFullscreenChange,
}) => {
  const [svgMarkup, setSvgMarkup] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [downloadDone, setDownloadDone] = useState<boolean>(false);

  // Generar el SVG del código QR localmente
  useEffect(() => {
    let active = true;
    renderQrSvg(payload)
      .then((svg) => {
        if (active) setSvgMarkup(svg);
      })
      .catch(() => {
        if (active) setSvgMarkup('');
      });
    return () => {
      active = false;
    };
  }, [payload]);

  // Data URI vectorial nítido
  const qrDataUri = useMemo(() => {
    if (!svgMarkup) return '';
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
  }, [svgMarkup]);

  const handleDownloadPng = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const pngUrl = await exportCredentialCardPng(credential, payload, signature);
      const link = document.createElement('a');
      const safeName = credential.documentId.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.href = pngUrl;
      link.download = `Credencial_${safeName || 'Personal'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadDone(true);
      window.setTimeout(() => setDownloadDone(false), 2200);
    } finally {
      setIsExporting(false);
    }
  };

  const isDynamic = credential.securityMode === QrSecurityMode.DYNAMIC_WINDOW;
  const progressRatio = isDynamic
    ? Math.max(0, Math.min(1, secondsRemaining / DYNAMIC_WINDOW_SECONDS))
    : 1;

  return (
    <>
      <section aria-label="Credencial de identificación digital" className="w-full">
        {/* Tarjeta de Identificación Digital Única */}
        <article className="mx-auto w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
          {/* Cabecera sobria de la entidad o título */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-700 tracking-wide uppercase truncate">
              {credential.organization || 'Credencial de Identificación'}
            </span>
            <span className="text-[11px] text-slate-500 font-mono tabular-nums whitespace-nowrap shrink-0">
              {isDynamic ? `Renueva ${secondsRemaining}s` : 'ID Verificado'}
            </span>
          </div>

          {/* Código QR grande y centrado para lectura óptica inmediata */}
          <div className="py-6 sm:py-7 flex flex-col items-center">
            <button
              type="button"
              onClick={() => onFullscreenChange(true)}
              aria-label="Ampliar código QR para escaneo óptico"
              className="group relative flex flex-col items-center justify-center rounded-2xl p-2 sm:p-3 bg-white transition-transform duration-150 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 cursor-pointer"
            >
              {qrDataUri ? (
                <img
                  src={qrDataUri}
                  alt={`Código QR de identificación de ${credential.fullName}`}
                  referrerPolicy="no-referrer"
                  className="h-64 w-64 sm:h-72 sm:w-72 object-contain select-none"
                />
              ) : (
                <div className="flex h-64 w-64 sm:h-72 sm:w-72 flex-col items-center justify-center gap-2 bg-slate-50 text-slate-400 rounded-xl">
                  <QrCode className="h-10 w-10" aria-hidden="true" />
                  <span className="text-xs font-medium">Generando código...</span>
                </div>
              )}
            </button>

            {/* Barra de progreso sutil si el usuario activó modo dinámico */}
            {isDynamic && (
              <svg
                viewBox="0 0 200 4"
                aria-hidden="true"
                className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-slate-100"
              >
                <rect
                  x="0"
                  y="0"
                  width={Math.round(progressRatio * 200)}
                  height="4"
                  rx="2"
                  className="fill-blue-700 transition-all duration-300"
                />
              </svg>
            )}

            <p className="mt-2 text-xs text-slate-500 text-center">
              Toca el código QR para modo de escaneo a pantalla completa
            </p>
          </div>

          {/* Datos del titular */}
          <div className="border-t border-slate-200/80 pt-5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 text-balance">
              {credential.fullName}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{credential.role}</span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span>{credential.department}</span>
            </div>

            {/* Fila de identificación y firma SHA-256 */}
            <dl className="mt-5 grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <dt className="text-xs text-slate-500">Cédula / ID</dt>
                <dd className="mt-0.5 font-mono text-sm sm:text-base font-bold text-slate-900 tabular-nums truncate">
                  {credential.documentId}
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-xs text-slate-500">Verificación local</dt>
                <dd
                  title="Firma criptográfica SHA-256"
                  className="mt-0.5 font-mono text-sm sm:text-base font-semibold text-slate-700 tabular-nums"
                >
                  {signature.slice(0, 8)}
                </dd>
              </div>
            </dl>
          </div>
        </article>

        {/* Acciones limpias de uso (solo lectura y descarga, sin botones de configuración visibles aquí) */}
        <div className="no-print mx-auto mt-4 grid w-full max-w-md grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onFullscreenChange(true)}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Maximize2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Modo escaneo</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isExporting}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            {downloadDone ? (
              <>
                <Check className="h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
                <span>Descargada</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
                <span>Guardar imagen</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Modal de Escaneo Óptimo a pantalla completa */}
      {isFullscreenOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Modo escaneo de alto contraste"
          className="fixed inset-0 z-50 flex flex-col justify-between bg-white p-6 text-slate-900"
        >
          <div className="mx-auto flex w-full max-w-md items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">{credential.fullName}</p>
              <p className="font-mono text-xs text-slate-500 tabular-nums">
                ID: {credential.documentId}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onFullscreenChange(false)}
              aria-label="Cerrar modo escaneo"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="my-auto flex flex-col items-center justify-center py-4">
            {qrDataUri && (
              <img
                src={qrDataUri}
                alt={`Código QR ampliado de ${credential.fullName}`}
                referrerPolicy="no-referrer"
                className="h-80 w-80 sm:h-96 sm:w-96 object-contain"
              />
            )}
            <p className="mt-4 text-sm font-medium text-slate-600 text-center">
              Acerca el lector óptico al código QR
            </p>
            <p className="mt-1 font-mono text-xs text-slate-400 tabular-nums">
              {isDynamic
                ? `Ventana activa · ${secondsRemaining}s · ${signature.slice(0, 8)}`
                : `Verificación · ${signature}`}
            </p>
          </div>

          <div className="mx-auto w-full max-w-md">
            <button
              type="button"
              onClick={() => onFullscreenChange(false)}
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Volver a la credencial
            </button>
          </div>
        </div>
      )}
    </>
  );
};
