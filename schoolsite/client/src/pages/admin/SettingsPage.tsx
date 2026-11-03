import { useEffect, useState, type FormEvent } from 'react';
import { Check, Globe, Heart, LoaderCircle, Save, School, Share2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useApi } from '../../hooks/useApi';
import { useSchool } from '../../context/SchoolContext';
import { useToast } from '../../context/ToastContext';
import type { Settings } from '../../types';
import { ErrorState, Spinner } from '../../components/ui';
import { FormFields, serializeFields } from './FormFields';
import { imageField, type FieldConfig, type Values } from './form-types';
const groups: {
  id: string;
  title: string;
  icon: typeof School;
  description: string;
  fields: FieldConfig[];
}[] = [
  {
    id: 'identity',
    title: 'School identity',
    icon: School,
    description: 'The name, face, and little numbers that make your school, your school.',
    fields: [
      {
        name: 'name',
        label: 'Full school name',
        type: 'text',
        required: true,
        full: true,
        max: 120,
      },
      {
        name: 'shortName',
        label: 'Short name / wordmark',
        type: 'text',
        required: true,
        max: 35,
        help: 'Shown in the website navigation.',
      },
      { name: 'tagline', label: 'Your school tagline', type: 'text', required: true, max: 160 },
      imageField(
        'logo',
        'School logo (optional)',
        'A clear, square logo works best. Without one, we use a simple leaf wordmark.',
      ),
      {
        name: 'establishedYear',
        label: 'Established in',
        type: 'number',
        required: true,
        min: 1800,
        max: new Date().getFullYear(),
      },
      {
        name: 'studentCount',
        label: 'Number of students',
        type: 'number',
        required: true,
        min: 0,
        max: 100000,
      },
      {
        name: 'teacherCount',
        label: 'Number of educators',
        type: 'number',
        required: true,
        min: 0,
        max: 10000,
      },
    ],
  },
  {
    id: 'homepage',
    title: 'Homepage & story',
    icon: Heart,
    description: 'Give families a warm welcome, in your own words.',
    fields: [
      {
        name: 'heroTitle',
        label: 'A big, warm welcome',
        type: 'textarea',
        required: true,
        rows: 3,
        max: 180,
        full: true,
        help: 'Use a new line for each line of the homepage heading. The second line gets a gentle color accent.',
      },
      {
        name: 'heroSubtitle',
        label: 'A little introduction',
        type: 'textarea',
        required: true,
        rows: 3,
        max: 600,
        full: true,
      },
      imageField(
        'heroImage',
        'Homepage photograph',
        'Choose a landscape photograph that feels like your school. Recommended: at least 1200 × 1000 pixels.',
      ),
      {
        name: 'aboutTitle',
        label: 'Your story heading',
        type: 'textarea',
        required: true,
        rows: 2,
        max: 160,
        full: true,
      },
      {
        name: 'aboutText',
        label: 'Tell your school’s story',
        type: 'textarea',
        required: true,
        rows: 7,
        max: 5000,
        full: true,
        help: 'Use a blank line between paragraphs. The first paragraph also appears on your homepage.',
      },
      {
        name: 'mission',
        label: 'Your school’s mission',
        type: 'textarea',
        required: true,
        rows: 3,
        max: 1500,
        full: true,
      },
      imageField('aboutImage', 'A photograph for your story'),
    ],
  },
  {
    id: 'contact',
    title: 'Contact & admissions',
    icon: Globe,
    description: 'Help your next family find their way to you.',
    fields: [
      { name: 'email', label: 'Public email address', type: 'text', required: true, max: 254 },
      { name: 'phone', label: 'School phone number', type: 'text', required: true, max: 50 },
      {
        name: 'address',
        label: 'School address',
        type: 'textarea',
        required: true,
        rows: 2,
        max: 350,
        full: true,
      },
      {
        name: 'officeHours',
        label: 'Office hours',
        type: 'text',
        required: true,
        max: 160,
        full: true,
      },
      {
        name: 'admissionsOpen',
        label: 'Admissions are open',
        type: 'checkbox',
        help: 'Show the admissions announcement across the public website.',
      },
      {
        name: 'admissionsText',
        label: 'A welcome for prospective families',
        type: 'textarea',
        required: true,
        rows: 5,
        max: 1500,
        full: true,
      },
    ],
  },
  {
    id: 'social',
    title: 'Social connections',
    icon: Share2,
    description: 'Connect your community. Leave a field empty to hide that social icon.',
    fields: [
      {
        name: 'facebookUrl',
        label: 'Facebook page',
        type: 'text',
        full: true,
        placeholder: 'https://facebook.com/yourschool',
      },
      {
        name: 'instagramUrl',
        label: 'Instagram profile',
        type: 'text',
        full: true,
        placeholder: 'https://instagram.com/yourschool',
      },
      {
        name: 'youtubeUrl',
        label: 'YouTube channel',
        type: 'text',
        full: true,
        placeholder: 'https://youtube.com/@yourschool',
      },
    ],
  },
];
export function SettingsPage() {
  const { data, loading, error, refresh: retry } = useApi<Settings>('/admin/settings'),
    { refresh } = useSchool(),
    notify = useToast();
  const [tab, setTab] = useState('identity'),
    [values, setValues] = useState<Values>({}),
    [busy, setBusy] = useState(false),
    [saveError, setSaveError] = useState(''),
    [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({}),
    [dirty, setDirty] = useState(false);
  const fields = groups.flatMap((group) => group.fields);
  useEffect(() => {
    if (data) {
      setValues(serializeFields(fields, data));
      setDirty(false);
    }
  }, [data]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  const group = groups.find((g) => g.id === tab)!;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setSaveError('');
    setFieldErrors({});
    try {
      const saved = await api.patch<Settings>('/admin/settings', serializeFields(fields, values));
      setValues(serializeFields(fields, saved));
      setDirty(false);
      refresh();
      notify('Your website details are saved and up to date.');
    } catch (e) {
      setSaveError((e as Error).message);
      if (e instanceof ApiError) {
        const errors = e.details?.fieldErrors || {};
        setFieldErrors(errors);
        const first = groups.find((g) => g.fields.some((f) => errors[f.name]?.length));
        if (first) setTab(first.id);
      }
    } finally {
      setBusy(false);
    }
  };
  if (loading && !data) return <Spinner />;
  if (!data) return <ErrorState message={error} retry={retry} />;
  return (
    <div className="admin-page settings-page">
      <div className="admin-page-heading">
        <div>
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h1>Website settings</h1>
          <p>Your school’s personality, in all the right places.</p>
        </div>
        <span className={`settings-save-state ${dirty ? 'unsaved' : ''}`}>
          {dirty ? (
            <>
              <PencilDot />
              Unsaved changes
            </>
          ) : (
            <>
              <Check size={15} />
              Everything is up to date
            </>
          )}
        </span>
      </div>
      <div className="settings-layout">
        <nav className="settings-tabs" aria-label="Settings sections">
          {groups.map((g) => (
            <button
              key={g.id}
              className={tab === g.id ? 'selected' : ''}
              onClick={() => setTab(g.id)}
            >
              <g.icon size={18} />
              {g.title}
            </button>
          ))}
        </nav>
        <form className="admin-panel settings-form" onSubmit={submit}>
          <div className="settings-form-heading">
            <span className="metric-icon">
              <group.icon size={23} strokeWidth={1.5} />
            </span>
            <div>
              <h2>{group.title}</h2>
              <p>{group.description}</p>
            </div>
          </div>
          <FormFields
            fields={group.fields}
            values={values}
            errors={fieldErrors}
            disabled={busy}
            onChange={(name, value) => {
              setValues((v) => ({ ...v, [name]: value }));
              setDirty(true);
            }}
          />
          {saveError && (
            <div className="form-error" role="alert">
              {saveError}
            </div>
          )}
          <div className="settings-form-footer">
            <span>Changes appear on the public website after saving.</span>
            <button className="btn btn-primary" disabled={busy || !dirty} type="submit">
              {busy ? <LoaderCircle size={17} className="spin" /> : <Save size={17} />}
              {busy ? 'Saving…' : 'Save website changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function PencilDot() {
  return <span className="live-dot" />;
}
