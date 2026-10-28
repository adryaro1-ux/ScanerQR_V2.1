import React, {useEffect, useRef, useState} from 'react';
import {KeyRound, Lock, ShieldCheck, Timer, X} from 'lucide-react';

interface ProtectedUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: () => void;
  correctPin: string;
}

const HOLD_DURATION_MS = 3000;

/**
 * Modal de verificación de seguridad para acceder a la edición de la credencial única.
 * Permite desbloquear mediante:
 * 1. Mantener presionado el botón durante 3 segundos continuos.
 * 2. O introducir el código PIN de 4 dígitos.
 */
export const ProtectedUnlockModal: React.FC<ProtectedUnlockModalProps> = ({
  isOpen,
  onClose,
  onUnlockSuccess,
  correctPin,
}) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);

  const holdStartRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPinInput('');
      setPinError(false);
      setHoldProgress(0);
      setIsHolding(false);
    }
  }, [isOpen]);

  const startHold = () => {
    setIsHolding(true);
    holdStartRef.current = performance.now();

    const loop = (now: number) => {
      if (!holdStartRef.current) return;
      const elapsed = now - holdStartRef.current;
      const pct = Math.min(100, Math.round((elapsed / HOLD_DURATION_MS) * 100));
      setHoldProgress(pct);

      if (elapsed >= HOLD_DURATION_MS) {
        setIsHolding(false);
        holdStartRef.current = null;
        onUnlockSuccess();
      } else {
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  const endHold = () => {
    setIsHolding(false);
    holdStartRef.current = null;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setHoldProgress(0);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === correctPin || pinInput === '1234') {
      onUnlockSuccess();
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlock-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="unlock-title" className="text-base font-bold text-slate-900">
                Acceso protegido
              </h3>
              <p className="text-xs text-slate-500">Credencial única bloqueada</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de desbloqueo"
            className="flex min-h-[44px] min-w-[44px] -mr-2 -mt-2 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3.5 text-xs leading-relaxed text-slate-600">
          Para evitar modificaciones accidentales, completa cualquiera de estos dos pasos:
        </p>

        {/* MÉTODO 1: Mantener presionado 3 segundos */}
        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-800">
            <Timer className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
            <span>Opción 1: Mantén presionado 3 segundos</span>
          </div>

          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onMouseDown={startHold}
              onMouseUp={endHold}
              onMouseLeave={endHold}
              onTouchStart={startHold}
              onTouchEnd={endHold}
              onTouchCancel={endHold}
              className="relative flex min-h-[52px] w-full max-w-xs items-center justify-center overflow-hidden rounded-xl bg-slate-900 text-xs font-semibold text-white select-none shadow-xs active:scale-[0.99] transition-transform cursor-pointer"
            >
              {/* Barra de progreso SVG interna */}
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <rect
                  x="0"
                  y="0"
                  width={holdProgress}
                  height="100"
                  className="fill-blue-700 transition-all duration-75"
                />
              </svg>

              <span className="relative z-10 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <span>
                  {isHolding
                    ? `Mantén presionado... ${Math.round((holdProgress / 100) * 3)}s`
                    : 'Mantén presionado para desbloquear'}
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* Separador */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-3 text-[11px] font-medium text-slate-400">
            o usa tu PIN
          </span>
        </div>

        {/* MÉTODO 2: Código PIN de 4 dígitos */}
        <form onSubmit={handlePinSubmit} className="space-y-3">
          <div>
            <label htmlFor="security-pin-input" className="block text-xs font-semibold text-slate-700">
              PIN de seguridad <span className="font-normal text-slate-500">(por defecto 1234)</span>
            </label>
            <div className="mt-1 flex items-center gap-2">
              <div className="relative flex-1">
                <KeyRound
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="security-pin-input"
                  type="password"
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="****"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value.replace(/[^0-9]/g, ''));
                    setPinError(false);
                  }}
                  className="block min-h-[44px] w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 font-mono text-center text-base tracking-widest text-slate-900 placeholder:text-slate-300 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
                />
              </div>
              <button
                type="submit"
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-blue-700 px-4 text-xs font-semibold text-white hover:bg-blue-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Ingresar
              </button>
            </div>
            {pinError && (
              <p role="alert" className="mt-1 text-xs font-medium text-red-600">
                PIN incorrecto. Intenta con 1234 o mantén presionado el botón.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
