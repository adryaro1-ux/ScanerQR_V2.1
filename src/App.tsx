import React, {useEffect, useMemo, useState} from 'react';
import {Lock, Shield} from 'lucide-react';
import {CredentialCard} from './components/CredentialCard';
import {CredentialForm} from './components/CredentialForm';
import {OfflineNotice, PWAInstallButton} from './components/PWAInstallButton';
import {ProtectedUnlockModal} from './components/ProtectedUnlockModal';
import {
  CredentialFormValues,
  QrEncodingFormat,
  QrSecurityMode,
  UserCredential,
} from './types/credential';
import {
  buildQrPayload,
  DYNAMIC_WINDOW_SECONDS,
  renderQrSvg,
} from './utils/qrPayload';
import {
  clearStoredCredential,
  loadStoredCredential,
  saveStoredCredential,
} from './utils/storage';

/**
 * Aplicación principal CredencialQR (Modo Credencial Única con Bloqueo Permanente).
 * - Primer acceso: Formulario de registro único.
 * - Guardado: Los datos se guardan en localStorage y el formulario se bloquea permanentemente.
 * - Siguientes visitas: Muestra directamente la tarjeta de identificación digital con el código QR.
 * - Edición: Protegida con un paso extra (mantener presionado 3s o código PIN).
 */
export function App() {
  // Detección directa del perfil guardado en LocalStorage
  const [credential, setCredential] = useState<UserCredential | null>(() =>
    loadStoredCredential()
  );

  const [isFullscreenScan, setIsFullscreenScan] = useState<boolean>(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState<boolean>(false);
  const [isEditingUnlocked, setIsEditingUnlocked] = useState<boolean>(false);

  // Reloj local para ventana temporal de 30s si el modo dinámico está activo
  const [nowSeconds, setNowSeconds] = useState<number>(() => Math.floor(Date.now() / 1000));

  // Carga y firma QR local
  const [qrPayload, setQrPayload] = useState<string>('');
  const [qrSignature, setQrSignature] = useState<string>('');

  // Estado de vista previa en tiempo real durante el registro inicial único
  const [draftValues, setDraftValues] = useState<CredentialFormValues>({
    fullName: '',
    documentId: '',
    role: '',
    department: '',
    organization: '',
    securityPin: '0000',
    encodingFormat: QrEncodingFormat.JSON_SIGNED,
    securityMode: QrSecurityMode.PERMANENT,
  });
  const [draftQrUri, setDraftQrUri] = useState<string>('');

  // Temporizador de 1s si el modo dinámico está activo
  useEffect(() => {
    if (credential?.securityMode !== QrSecurityMode.DYNAMIC_WINDOW) {
      return;
    }
    const timer = window.setInterval(() => {
      setNowSeconds(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [credential?.securityMode]);

  const currentWindowSlot = Math.floor(nowSeconds / DYNAMIC_WINDOW_SECONDS);
  const secondsRemaining =
    DYNAMIC_WINDOW_SECONDS - (nowSeconds % DYNAMIC_WINDOW_SECONDS);

  // Generación local del payload del QR para la credencial activa
  useEffect(() => {
    if (!credential) {
      setQrPayload('');
      setQrSignature('');
      return;
    }

    let active = true;
    buildQrPayload(credential, currentWindowSlot).then(({payload, signature}) => {
      if (active) {
        setQrPayload(payload);
        setQrSignature(signature);
      }
    });

    return () => {
      active = false;
    };
  }, [credential, currentWindowSlot]);

  // Vista previa en vivo del QR durante el registro inicial
  useEffect(() => {
    if (credential) return;
    const hasContent =
      draftValues.fullName.trim() ||
      draftValues.documentId.trim() ||
      draftValues.role.trim() ||
      draftValues.department.trim();

    if (!hasContent) {
      setDraftQrUri('');
      return;
    }

    let active = true;
    const previewCred: UserCredential = {
      fullName: draftValues.fullName.trim() || 'Nombre del Titular',
      documentId: draftValues.documentId.trim() || '0000-0000',
      role: draftValues.role.trim() || 'Cargo',
      department: draftValues.department.trim() || 'Departamento',
      organization: draftValues.organization.trim(),
      securityPin: draftValues.securityPin || '1234',
      encodingFormat: draftValues.encodingFormat,
      securityMode: draftValues.securityMode,
      deviceSalt: 'preview00000000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    buildQrPayload(previewCred)
      .then(({payload}) => renderQrSvg(payload))
      .then((svg) => {
        if (active) {
          setDraftQrUri(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
        }
      })
      .catch(() => {
        if (active) setDraftQrUri('');
      });

    return () => {
      active = false;
    };
  }, [credential, draftValues]);

  // Guardar datos: Al presionar guardar, se persiste en LocalStorage y se bloquea permanentemente
  const handleSaveCredential = (values: CredentialFormValues) => {
    const saved = saveStoredCredential(values, credential);
    setCredential(saved);
    setIsEditingUnlocked(false);
    setIsUnlockModalOpen(false);
  };

  // Desbloqueo exitoso tras pasar la verificación de PIN o mantener presionado
  const handleUnlockSuccess = () => {
    setIsUnlockModalOpen(false);
    setIsEditingUnlocked(true);
  };

  // Restablecimiento total de la app (solo disponible dentro de la edición desbloqueada)
  const handleDeleteAll = () => {
    clearStoredCredential();
    setCredential(null);
    setIsEditingUnlocked(false);
    setIsUnlockModalOpen(false);
    setDraftValues({
      fullName: '',
      documentId: '',
      role: '',
      department: '',
      organization: '',
      securityPin: '1234',
      encodingFormat: QrEncodingFormat.JSON_SIGNED,
      securityMode: QrSecurityMode.PERMANENT,
    });
  };

  const previewSummary = useMemo(
    () => ({
      name: draftValues.fullName.trim() || 'Tu nombre completo',
      id: draftValues.documentId.trim() || '0000-0000-00',
      role: draftValues.role.trim() || 'Cargo',
      dept: draftValues.department.trim() || 'Departamento',
      org: draftValues.organization.trim() || 'Credencial de Identificación',
    }),
    [draftValues]
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <OfflineNotice />

      {/* Barra superior minimalista y sobria */}
      <header className="no-print border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              CredencialQR
            </span>
            {credential && (
              <span
                title="Credencial protegida contra modificaciones"
                className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500"
              >
                <Lock className="h-3 w-3 text-slate-400" aria-hidden="true" />
                <span>Bloqueada</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/lector.html"
              title="Abrir Módulo Lector de Asistencia para tablet o segundo dispositivo"
              className="inline-flex min-h-[40px] items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer"
            >
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span>Lector Entrada</span>
            </a>

            <PWAInstallButton
              onFallbackAction={credential ? () => setIsFullscreenScan(true) : undefined}
              fallbackLabel={credential ? 'Modo escaneo' : undefined}
            />
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-center">
        {!credential ? (
          /* ============================================================
             CASO 1: REGISTRO INICIAL ÚNICO
             El usuario ingresa sus datos una sola vez. Al guardar,
             el formulario desaparece permanentemente.
             ============================================================ */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-auto">
            <div className="lg:col-span-7">
              <CredentialForm
                initialCredential={null}
                onSave={handleSaveCredential}
                onLiveDraftChange={setDraftValues}
              />
            </div>

            {/* Vista previa en tiempo real en pantallas grandes */}
            <aside
              aria-label="Vista previa de la credencial"
              className="hidden lg:block lg:col-span-5"
            >
              <div className="rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xs">
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide truncate">
                    {previewSummary.org}
                  </span>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                    Vista previa
                  </span>
                </div>

                <div className="py-7 flex flex-col items-center justify-center">
                  {draftQrUri ? (
                    <img
                      src={draftQrUri}
                      alt="Vista previa del código QR"
                      referrerPolicy="no-referrer"
                      className="h-56 w-56 object-contain"
                    />
                  ) : (
                    <div className="flex h-56 w-56 flex-col items-center justify-center gap-3 rounded-2xl bg-slate-50 px-6 text-center text-slate-400">
                      <Shield className="h-10 w-10 text-slate-300" aria-hidden="true" />
                      <p className="text-xs leading-relaxed text-slate-500">
                        Completa tus datos para generar tu código QR permanente.
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200/80 pt-5">
                  <p className="text-xl font-bold tracking-tight text-slate-900 truncate">
                    {previewSummary.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 truncate">
                    {previewSummary.role} · {previewSummary.dept}
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Cédula / ID</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {previewSummary.id}
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-4 px-2 text-xs leading-relaxed text-slate-500 text-center">
                Al guardar, tus datos quedarán protegidos localmente en este dispositivo.
              </p>
            </aside>
          </div>
        ) : (
          /* ============================================================
             CASO 2: PANTALLA DE CREDENCIAL ÚNICA (DISEÑO LIMPIO)
             Muestra únicamente la tarjeta de identificación digital con el
             código QR grande y centrado. Sin opciones complejas visibles.
             ============================================================ */
          <div className="w-full flex flex-col items-center justify-center my-auto">
            <CredentialCard
              credential={credential}
              payload={qrPayload}
              signature={qrSignature}
              secondsRemaining={secondsRemaining}
              isFullscreenOpen={isFullscreenScan}
              onFullscreenChange={setIsFullscreenScan}
            />

            {/* Botón discreto y protegido para editar perfil si fuera estrictamente necesario */}
            <div className="no-print mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setIsUnlockModalOpen(true)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span>Configuración protegida</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Pie de página discreto */}
      <footer className="no-print border-t border-slate-200/60 bg-white py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 sm:px-6 text-[11px] text-slate-500">
          <span>Credencial digital 100% offline</span>
          <div className="flex items-center gap-3">
            <a href="/lector.html" className="font-semibold text-emerald-700 hover:text-emerald-800 underline">
              Módulo Lector de Asistencia (Tablet / Entrada)
            </a>
            <span>·</span>
            <span>Almacenamiento local seguro</span>
          </div>
        </div>
      </footer>

      {/* ============================================================
         PASO EXTRA DE SEGURIDAD: MODAL DE DESBLOQUEO
         (Mantener presionado 3 segundos o código PIN de 4 dígitos)
         ============================================================ */}
      <ProtectedUnlockModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        onUnlockSuccess={handleUnlockSuccess}
        correctPin={credential?.securityPin || '1234'}
      />

      {/* ============================================================
         MODAL DE EDICIÓN (SOLO ACCESIBLE TRAS DESBLOQUEO EXITOSO)
         ============================================================ */}
      {isEditingUnlocked && credential && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Editor de credencial"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs p-4 sm:p-6 flex items-center justify-center"
        >
          <div className="w-full max-w-xl my-8">
            <CredentialForm
              initialCredential={credential}
              onSave={handleSaveCredential}
              onCancel={() => setIsEditingUnlocked(false)}
              onDeleteAll={handleDeleteAll}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
