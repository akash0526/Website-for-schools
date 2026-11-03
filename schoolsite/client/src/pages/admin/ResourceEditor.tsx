import { useId, useState, type FormEvent } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import { ApiError } from '../../lib/api';
import { Modal } from '../../components/ui';
import { FormFields, serializeFields } from './FormFields';
import type { FieldConfig, Values } from './form-types';
export function ResourceEditor({
  title,
  fields,
  initial,
  onClose,
  onSave,
  description,
}: {
  title: string;
  fields: FieldConfig[];
  initial: object;
  onClose: () => void;
  onSave: (values: Values) => Promise<void>;
  description?: string;
}) {
  const [values, setValues] = useState<Values>({ ...initial }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({}),
    id = useId();
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setFieldErrors({});
    try {
      await onSave(serializeFields(fields, values));
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof ApiError) setFieldErrors(e.details?.fieldErrors || {});
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={title}
      drawer
      onClose={() => {
        if (!busy) onClose();
      }}
      footer={
        <>
          <span className="save-note">Save when you’re ready.</span>
          <button className="btn btn-outline" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" type="submit" form={id} disabled={busy}>
            {busy ? <LoaderCircle size={17} className="spin" /> : <Save size={17} />}
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }
    >
      <form id={id} onSubmit={submit} className="resource-form">
        {description && <p className="form-intro">{description}</p>}
        <FormFields
          fields={fields}
          values={values}
          errors={fieldErrors}
          disabled={busy}
          onChange={(name, value) => setValues((v) => ({ ...v, [name]: value }))}
        />
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}
