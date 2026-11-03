import { useId, useRef, useState, type DragEvent } from 'react';
import { Check, ImagePlus, LoaderCircle, Trash2, UploadCloud } from 'lucide-react';
import type { Media } from '../../types';
import { uploadImage } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { dateInput } from '../../lib/format';
import type { FieldConfig, Values } from './form-types';
export function ImageField({
  value,
  onChange,
  label,
  help,
  disabled = false,
}: {
  value: Media | null;
  onChange: (value: Media | null) => void;
  label: string;
  help?: string;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null),
    id = useId(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [drag, setDrag] = useState(false);
  const { config } = useAuth();
  const maxMB = Math.round((config?.uploads.maxBytes || 5242880) / 1024 / 1024);
  const upload = async (file?: File) => {
    if (!file || disabled) return;
    setBusy(true);
    setError('');
    try {
      const media = await uploadImage(file);
      onChange({ ...media, alt: value?.alt || media.alt });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };
  const drop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    void upload(e.dataTransfer.files[0]);
  };
  return (
    <div className={`field image-field ${drag ? 'dragging' : ''}`}>
      <span className="field-label">{label}</span>
      <div
        className="image-upload-area"
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={drop}
      >
        {value ? (
          <div className="image-upload-preview">
            <img src={value.url} alt={value.alt || 'Selected image'} />
            <div>
              <strong>Looking good.</strong>
              <span>Your image is ready to use.</span>
              <button
                type="button"
                className="text-link"
                disabled={busy || disabled}
                onClick={() => input.current?.click()}
              >
                <UploadCloud size={15} />
                Replace image
              </button>
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label={`Remove ${label}`}
              disabled={busy || disabled}
              onClick={() => onChange(null)}
            >
              <Trash2 size={17} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="upload-drop-button"
            disabled={busy || disabled}
            onClick={() => input.current?.click()}
          >
            {busy ? (
              <LoaderCircle className="spin" size={28} />
            ) : (
              <ImagePlus size={29} strokeWidth={1.5} />
            )}
            <strong>
              {busy ? 'Uploading your image…' : 'Click to upload or drop an image here'}
            </strong>
            <span>JPEG, PNG, or WebP · up to {maxMB} MB</span>
          </button>
        )}
        <input
          ref={input}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          disabled={busy || disabled}
          onChange={(e) => void upload(e.target.files?.[0])}
        />
      </div>
      {busy && (
        <span className="upload-progress" role="status">
          Uploading securely. Please keep this window open.
        </span>
      )}
      {value && (
        <label className="alt-label" htmlFor={`${id}-alt`}>
          Image description (alt text)
          <input
            id={`${id}-alt`}
            value={value.alt}
            maxLength={250}
            placeholder="Describe the image for someone who cannot see it"
            disabled={disabled}
            onChange={(e) => onChange({ ...value, alt: e.target.value })}
          />
        </label>
      )}
      {help && <small>{help}</small>}
      {error && (
        <small className="field-error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
export function FormFields({
  fields,
  values,
  onChange,
  errors = {},
  disabled = false,
}: {
  fields: FieldConfig[];
  values: Values;
  onChange: (name: string, value: unknown) => void;
  errors?: Record<string, string[]>;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="form-grid">
      {fields.map((field) => {
        const name = `${id}-${field.name}`,
          value = values[field.name],
          error = errors[field.name]?.[0];
        if (field.type === 'image')
          return (
            <div className="full-span" key={field.name}>
              <ImageField
                value={(value as Media | null) || null}
                label={field.label}
                help={field.help}
                disabled={disabled}
                onChange={(v) => onChange(field.name, v)}
              />
              {error && <small className="field-error">{error}</small>}
            </div>
          );
        if (field.type === 'checkbox')
          return (
            <label className={`checkbox-field full-span ${field.name}`} key={field.name}>
              <input
                type="checkbox"
                checked={Boolean(value)}
                disabled={disabled}
                onChange={(e) => onChange(field.name, e.target.checked)}
              />
              <span>
                <strong>{field.label}</strong>
                {field.help && <small>{field.help}</small>}
              </span>
              <Check className="checkbox-decoration" size={16} />
            </label>
          );
        const shared = {
          id: name,
          name: field.name,
          required: field.required,
          disabled,
          'aria-invalid': !!error,
          'aria-describedby': error || field.help ? `${name}-help` : undefined,
        };
        return (
          <label
            className={`field ${field.full || field.type === 'textarea' ? 'full-span' : ''}`}
            htmlFor={name}
            key={field.name}
          >
            <span>
              {field.label}
              {field.required && <span className="required-dot"> *</span>}
            </span>
            {field.type === 'textarea' ? (
              <textarea
                {...shared}
                rows={field.rows || 4}
                maxLength={field.max}
                placeholder={field.placeholder}
                value={String(value ?? '')}
                onChange={(e) => onChange(field.name, e.target.value)}
              />
            ) : field.type === 'select' ? (
              <select
                {...shared}
                value={String(value ?? '')}
                onChange={(e) => onChange(field.name, e.target.value)}
              >
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {['draft', 'published'].includes(option)
                      ? option === 'draft'
                        ? 'Draft — staff only'
                        : 'Published — visible to everyone'
                      : option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                {...shared}
                type={field.type === 'datetime' ? 'datetime-local' : field.type}
                min={field.min}
                max={field.max}
                maxLength={field.type === 'text' ? field.max : undefined}
                placeholder={field.placeholder}
                value={
                  field.type === 'datetime' && value
                    ? dateInput(String(value))
                    : String(value ?? '')
                }
                onChange={(e) =>
                  onChange(
                    field.name,
                    field.type === 'number'
                      ? e.target.value === ''
                        ? ''
                        : Number(e.target.value)
                      : field.type === 'datetime' && e.target.value
                        ? new Date(e.target.value).toISOString()
                        : e.target.value,
                  )
                }
              />
            )}
            {(error || field.help) && (
              <small id={`${name}-help`} className={error ? 'field-error' : ''}>
                {error || field.help}
              </small>
            )}
          </label>
        );
      })}
    </div>
  );
}
export function serializeFields(fields: FieldConfig[], source: object): Values {
  const values = source as Values;
  const result: Values = {};
  for (const field of fields) {
    const value = values[field.name];
    result[field.name] =
      field.type === 'datetime'
        ? value
          ? new Date(String(value)).toISOString()
          : null
        : field.type === 'number'
          ? Number(value)
          : (value ?? (field.type === 'image' ? null : ''));
  }
  return result;
}
