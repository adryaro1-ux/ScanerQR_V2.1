import React, {useState} from 'react';
import {Check, KeyRound, Lock, RotateCcw, Trash2, X} from 'lucide-react';
import {
  CredentialFormValues,
  QrEncodingFormat,
  QrSecurityMode,
  UserCredential,
} from '../types/credential';

interface CredentialFormProps {
  initialCredential: UserCredential | null;
  onSave: (values: CredentialFormValues) => void;
  onCancel?: () => void;
  onDeleteAll?: () => void;
  onLiveDraftChange?: (values: CredentialFormValues) => void;
}

const SAMPLE_VALUES: CredentialFormValues = {
  fullName: 'Valeria Mendoza Ríos',
  documentId: '1024-8893-41',
  role: 'Ingeniera de Operaciones',
  department: 'Infraestructura y Planta',
  organization: 'Grupo Industrial Andino',
  securityPin: '1234',
  encodingFormat: QrEncodingFormat.JSON_SIGNED,
  securityMode: QrSecurityMode.PERMANENT,
};

/**
 * Formulario de registro único y edición protegida de los datos personales del titular.
 * En el primer uso, bloquea el formulario al guardar para mostrar permanentemente la credencial.
 */
export const CredentialForm: React.FC<CredentialFormProps> = ({
  initialCredential,
  onSave,
  onCancel,
  onDeleteAll,
  onLiveDraftChange,
}) => {
  const [values, setValues] = useState<CredentialFormValues>({
    fullName: initialCredential?.fullName ?? '',
    documentId: initialCredential?.documentId ?? '',
    role: initialCredential?.role ?? '',
    department: initialCredential?.department ?? '',
    organization: initialCredential?.organization ?? '',
    securityPin: initialCredential?.securityPin ?? '1234',
    encodingFormat: initialCredential?.encodingFormat ?? QrEncodingFormat.JSON_SIGNED,
    securityMode: initialCredential?.securityMode ?? QrSecurityMode.PERMANENT,
  });

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  const updateField = <K extends keyof CredentialFormValues>(
    field: K,
    nextVal: CredentialFormValues[K]
  ) => {
    const updated = {...values, [field]: nextVal};
    setValues(updated);
    if (errorMessage) setErrorMessage('');
    onLiveDraftChange?.(updated);
  };

  const handleLoadSample = () => {
    setValues(SAMPLE_VALUES);
    setErrorMessage('');
    onLiveDraftChange?.(SAMPLE_VALUES);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.fullName.trim()) {
      setErrorMessage('Ingresa tu nombre completo.');
      return;
    }
    if (!values.documentId.trim()) {
      setErrorMessage('Ingresa tu número de Cédula o ID de identificación.');
      return;
    }
    if (!values.role.trim()) {
      setErrorMessage('Indica tu cargo o puesto actual.');
      return;
    }
    if (!values.department.trim()) {
      setErrorMessage('Indica tu departamento o área.');
      return;
    }

    onSave(values);
  };

  const isEditing = Boolean(initialCredential);

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 text-balance">
              {isEditing ? 'Editar datos de credencial' : 'Registro de Credencial Única'}
            </h2>
            <Lock className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {isEditing
              ? 'Actualiza los campos necesarios y presiona guardar para bloquear nuevamente la credencial.'
              : 'Ingresa tus datos una sola vez. Al guardar, quedarán almacenados en tu dispositivo y el formulario se ocultará permanentemente.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cargar ejemplo</span>
            </button>
          )}

          {isEditing && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cerrar edición"
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4 sm:space-y-5">
        {/* Nombre completo */}
        <div>
          <label htmlFor="field-fullname" className="block text-sm font-semibold text-slate-800">
            Nombre completo <span className="text-blue-700">*</span>
          </label>
          <input
            id="field-fullname"
            type="text"
            autoComplete="name"
            required
            placeholder="Ej. Carlos Andrés Ramírez"
            value={values.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            className="mt-1.5 block min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
          />
        </div>

        {/* Cédula / ID */}
        <div>
          <label htmlFor="field-docid" className="block text-sm font-semibold text-slate-800">
            Cédula / ID <span className="text-blue-700">*</span>
          </label>
          <input
            id="field-docid"
            type="text"
            required
            placeholder="Ej. 1098-765-432"
            value={values.documentId}
            onChange={(e) => updateField('documentId', e.target.value)}
            className="mt-1.5 block min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-mono text-base text-slate-900 tabular-nums placeholder:font-sans placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
          />
        </div>

        {/* Cargo y Departamento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="field-role" className="block text-sm font-semibold text-slate-800">
              Cargo <span className="text-blue-700">*</span>
            </label>
            <input
              id="field-role"
              type="text"
              autoComplete="organization-title"
              required
              placeholder="Ej. Coordinador de Calidad"
              value={values.role}
              onChange={(e) => updateField('role', e.target.value)}
              className="mt-1.5 block min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
            />
          </div>

          <div>
            <label htmlFor="field-department" className="block text-sm font-semibold text-slate-800">
              Departamento <span className="text-blue-700">*</span>
            </label>
            <input
              id="field-department"
              type="text"
              required
              placeholder="Ej. Logística y Despacho"
              value={values.department}
              onChange={(e) => updateField('department', e.target.value)}
              className="mt-1.5 block min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
            />
          </div>
        </div>

        {/* Entidad / Empresa opcional */}
        <div>
          <label htmlFor="field-org" className="block text-sm font-semibold text-slate-800">
            Organización o Empresa{' '}
            <span className="font-normal text-slate-500">(opcional)</span>
          </label>
          <input
            id="field-org"
            type="text"
            autoComplete="organization"
            placeholder="Ej. Corporación Tecnológica del Sur"
            value={values.organization}
            onChange={(e) => updateField('organization', e.target.value)}
            className="mt-1.5 block min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
          />
        </div>

        {/* PIN de seguridad para protección de desbloqueo */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="field-pin" className="block text-sm font-semibold text-slate-800">
              PIN de seguridad <span className="font-normal text-slate-500">(4 a 6 dígitos)</span>
            </label>
            <span className="text-xs text-slate-500 font-mono">Por defecto: 1234</span>
          </div>
          <div className="relative mt-1.5">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              id="field-pin"
              type="password"
              maxLength={6}
              inputMode="numeric"
              placeholder="1234"
              value={values.securityPin}
              onChange={(e) => updateField('securityPin', e.target.value.replace(/[^0-9]/g, ''))}
              className="block min-h-[48px] w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 font-mono text-base tracking-widest text-slate-900 placeholder:font-mono placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/20"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Usarás este PIN (o mantener presionado 3s) si en el futuro necesitas editar tus datos.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {errorMessage}
          </div>
        )}

        {/* Botón principal de guardado y bloqueo permanente */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
          <button
            type="submit"
            className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{isEditing ? 'Guardar cambios y bloquear' : 'Generar y Guardar Credencial'}</span>
          </button>

          {isEditing && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Zona de borrado/reinicio protegida (visible únicamente cuando se ha desbloqueado la edición) */}
      {isEditing && onDeleteAll && (
        <div className="mt-7 pt-5 border-t border-slate-100">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold text-red-700 hover:text-red-800 transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Restablecer y borrar credencial de este dispositivo</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50/70 p-4">
              <p className="text-xs font-medium text-red-900">
                ¿Seguro que deseas eliminar la credencial? Volverás a ver el formulario inicial de registro.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Conservar
                </button>
                <button
                  type="button"
                  onClick={onDeleteAll}
                  className="min-h-[40px] rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Confirmar borrado
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
