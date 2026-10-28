import React, {useState} from 'react';
import {Download, Share, WifiOff, X} from 'lucide-react';
import {useOnlineStatus, usePWAInstall} from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  onFallbackAction?: () => void;
  fallbackLabel?: string;
}

/**
 * Botón de instalación integrada para agregar la credencial a la pantalla de inicio.
 * Si ya está instalada o el navegador no emite prompt aún, puede mostrar una acción contextual.
 */
export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onFallbackAction,
  fallbackLabel,
}) => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (!isInstalled && isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Instalar app</span>
      </button>
    );
  }

  if (!isInstalled && isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Share className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Instalar en iOS</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          >
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-start justify-between gap-4">
                <h3 id="ios-install-title" className="text-lg font-bold text-slate-900">
                  Agregar a pantalla de inicio
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Cerrar instrucciones"
                  className="flex min-h-[44px] min-w-[44px] -mr-2 -mt-2 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-slate-600 list-decimal list-inside">
                <li>
                  Toca el botón <strong className="font-semibold text-slate-900">Compartir</strong> en la barra de Safari.
                </li>
                <li>
                  Selecciona <strong className="font-semibold text-slate-900">Agregar a inicio</strong> para abrir tu credencial sin conexión como aplicación nativa.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  if (onFallbackAction && fallbackLabel) {
    return (
      <button
        type="button"
        onClick={onFallbackAction}
        className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 whitespace-nowrap shrink-0 cursor-pointer"
      >
        {fallbackLabel}
      </button>
    );
  }

  return null;
};

/**
 * Aviso discreto cuando el teléfono no tiene cobertura o datos móviles,
 * confirmando que el Código QR opera de forma 100% autónoma y local.
 */
export const OfflineNotice: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="no-print border-b border-slate-200 bg-slate-100 px-4 py-2 text-xs text-slate-700"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2">
        <WifiOff className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden="true" />
        <span>Modo sin conexión activo · Tu credencial funciona localmente sin internet.</span>
      </div>
    </div>
  );
};
