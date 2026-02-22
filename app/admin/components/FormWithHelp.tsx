'use client';

/**
 * FORM COMPONENTS AMB AJUDA INTEGRADA
 * ===================================
 * Components de formulari que integren el sistema d'ajuda automàticament.
 * Quan el mode ajuda està actiu, mostren tooltips contextuals.
 * 
 * Ús:
 * import { FormInput, FormSelect, FormTextarea } from './FormWithHelp';
 * 
 * <FormInput
 *   label="Nom"
 *   helpId="lead-name"
 *   name="name"
 *   value={name}
 *   onChange={setName}
 * />
 */

import { forwardRef, useState, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { useHelp, HELP_GLOSSARY, type HelpItem } from './HelpSystem';

// ═══════════════════════════════════════════════════════════════════════════
// HELP INDICATOR - Icona d'ajuda al costat del label
// ═══════════════════════════════════════════════════════════════════════════

function HelpIndicator({ item, onHover }: { item: HelpItem; onHover: (item: HelpItem | null) => void }) {
  const { enabled } = useHelp();
  
  if (!enabled) return null;

  return (
    <span
      className="ml-1.5 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full text-[10px] font-bold transition-all"
      onMouseEnter={() => onHover(item)}
      onMouseLeave={() => onHover(null)}
    >
      ?
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TOOLTIP POPUP
// ═══════════════════════════════════════════════════════════════════════════

function HelpPopup({ item }: { item: HelpItem }) {
  return (
    <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border p-3 shadow-2xl">
      <p className="text-sm font-semibold">{item.term}</p>
      <p className="mt-1 text-xs">{item.description}</p>
      {item.example && (
        <p className="mt-2 rounded px-2 py-1 text-[11px]">
          💡 {item.example}
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FORM INPUT
// ═══════════════════════════════════════════════════════════════════════════

type FormInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  label: string;
  helpId?: string;
  error?: string;
  hint?: string;
  onChange?: (value: string) => void;
};

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, helpId, error, hint, onChange, className = '', ...props }, ref) => {
    const [hoveredHelp, setHoveredHelp] = useState<HelpItem | null>(null);
    const { enabled } = useHelp();
    const helpItem = helpId ? HELP_GLOSSARY.find((h) => h.id === helpId) : null;

    return (
      <div className="relative">
        <label className="mb-1.5 flex items-center text-xs font-medium">
          {label}
          {props.required && <span className="ml-1">*</span>}
          {helpItem && <HelpIndicator item={helpItem} onHover={setHoveredHelp} />}
        </label>
        
        <input
          ref={ref}
          className={`
            w-full rounded-xl border bg-slate-800/80 px-3 py-2.5 text-sm text-slate-100
            placeholder:text-slate-500 transition-all
            ${error
              ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-600/50 focus:border-amber-500/50 focus:ring-amber-500/20'
            }
            ${enabled && helpItem ? 'ring-2 ring-amber-500/10' : ''}
            focus:outline-none focus:ring-2
            ${className}
          `}
          onChange={(e) => onChange?.(e.target.value)}
          {...props}
        />

        {hint && !error && (
          <p className="mt-1 text-[11px]">{hint}</p>
        )}
        
        {error && (
          <p className="mt-1 text-[11px]">{error}</p>
        )}

        {hoveredHelp && <HelpPopup item={hoveredHelp} />}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

// ═══════════════════════════════════════════════════════════════════════════
// FORM SELECT
// ═══════════════════════════════════════════════════════════════════════════

type FormSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> & {
  label: string;
  helpId?: string;
  error?: string;
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
};

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, helpId, error, options, onChange, className = '', ...props }, ref) => {
    const [hoveredHelp, setHoveredHelp] = useState<HelpItem | null>(null);
    const { enabled } = useHelp();
    const helpItem = helpId ? HELP_GLOSSARY.find((h) => h.id === helpId) : null;

    return (
      <div className="relative">
        <label className="mb-1.5 flex items-center text-xs font-medium">
          {label}
          {props.required && <span className="ml-1">*</span>}
          {helpItem && <HelpIndicator item={helpItem} onHover={setHoveredHelp} />}
        </label>
        
        <select
          ref={ref}
          className={`
            w-full rounded-xl border bg-slate-800/80 px-3 py-2.5 text-sm text-slate-100
            transition-all appearance-none cursor-pointer
            ${error
              ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-600/50 focus:border-amber-500/50 focus:ring-amber-500/20'
            }
            ${enabled && helpItem ? 'ring-2 ring-amber-500/10' : ''}
            focus:outline-none focus:ring-2
            ${className}
          `}
          onChange={(e) => onChange?.(e.target.value)}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {error && (
          <p className="mt-1 text-[11px]">{error}</p>
        )}

        {hoveredHelp && <HelpPopup item={hoveredHelp} />}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';

// ═══════════════════════════════════════════════════════════════════════════
// FORM TEXTAREA
// ═══════════════════════════════════════════════════════════════════════════

type FormTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> & {
  label: string;
  helpId?: string;
  error?: string;
  hint?: string;
  onChange?: (value: string) => void;
};

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, helpId, error, hint, onChange, className = '', ...props }, ref) => {
    const [hoveredHelp, setHoveredHelp] = useState<HelpItem | null>(null);
    const { enabled } = useHelp();
    const helpItem = helpId ? HELP_GLOSSARY.find((h) => h.id === helpId) : null;

    return (
      <div className="relative">
        <label className="mb-1.5 flex items-center text-xs font-medium">
          {label}
          {props.required && <span className="ml-1">*</span>}
          {helpItem && <HelpIndicator item={helpItem} onHover={setHoveredHelp} />}
        </label>
        
        <textarea
          ref={ref}
          className={`
            w-full rounded-xl border bg-slate-800/80 px-3 py-2.5 text-sm text-slate-100
            placeholder:text-slate-500 transition-all resize-none
            ${error
              ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-600/50 focus:border-amber-500/50 focus:ring-amber-500/20'
            }
            ${enabled && helpItem ? 'ring-2 ring-amber-500/10' : ''}
            focus:outline-none focus:ring-2
            ${className}
          `}
          onChange={(e) => onChange?.(e.target.value)}
          {...props}
        />

        {hint && !error && (
          <p className="mt-1 text-[11px]">{hint}</p>
        )}
        
        {error && (
          <p className="mt-1 text-[11px]">{error}</p>
        )}

        {hoveredHelp && <HelpPopup item={hoveredHelp} />}
      </div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';

// ═══════════════════════════════════════════════════════════════════════════
// FORM SECTION - Agrupa camps relacionats
// ═══════════════════════════════════════════════════════════════════════════

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export function FormSection({ title, description, children, collapsible = false, defaultOpen = true }: FormSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border p-4">
      <div
        className={`flex items-center justify-between ${collapsible ? 'cursor-pointer' : ''}`}
        onClick={() => collapsible && setIsOpen(!isOpen)}
      >
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="mt-0.5 text-xs">{description}</p>}
        </div>
        {collapsible && (
          <button type="button" className="">
            {isOpen ? '▲' : '▼'}
          </button>
        )}
      </div>

      {isOpen && (
        <div className="mt-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FORM ACTIONS - Botons d'acció del formulari
// ═══════════════════════════════════════════════════════════════════════════

type FormActionsProps = {
  onCancel?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  saving?: boolean;
  deleting?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  deleteLabel?: string;
  showDelete?: boolean;
};

export function FormActions({
  onCancel,
  onSave,
  onDelete,
  saving = false,
  deleting = false,
  saveLabel = 'Desar',
  cancelLabel = 'Cancel·lar',
  deleteLabel = 'Eliminar',
  showDelete = false,
}: FormActionsProps) {
  return (
    <div className="flex items-center justify-between border-t pt-4">
      <div>
        {showDelete && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="rounded-xl border px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
          >
            {deleting ? 'Eliminant...' : deleteLabel}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border px-4 py-2 text-sm font-medium transition-all"
          >
            {cancelLabel}
          </button>
        )}

        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-xl px-6 py-2 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? 'Desant...' : saveLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INLINE EDIT FIELD - Camp editable inline
// ═══════════════════════════════════════════════════════════════════════════

type InlineEditProps = {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'phone' | 'url';
};

export function InlineEdit({ value, onSave, label, placeholder, type = 'text' }: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch {
      setEditValue(value);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          className="flex-1 rounded-lg border px-2 py-1 text-sm outline-none"
          placeholder={placeholder}
        />
        {saving && <span className="text-xs">Desant...</span>}
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2">
      {label && <span className="text-xs">{label}:</span>}
      <span className="text-sm">{value || <em className="">{placeholder || 'No definit'}</em>}</span>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="invisible rounded p-1 group-hover:visible"
      >
        ✏️
      </button>
    </div>
  );
}
