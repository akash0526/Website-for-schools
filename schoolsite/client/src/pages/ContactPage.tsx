import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Heart,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { api, ApiError } from '../lib/api';
import { PageHeading } from '../components/ui';
export function ContactPage() {
  const { settings: s } = useSchool(),
    [params] = useSearchParams();
  usePageTitle('Get in touch');
  const [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string[]>>({});
  if (!s) return null;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setBusy(true);
    setError('');
    setFields({});
    try {
      await api.post('/inquiries', data);
      setSent(true);
      form.reset();
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof ApiError) setFields(e.details?.fieldErrors || {});
    } finally {
      setBusy(false);
    }
  };
  const fieldError = (name: string) =>
    fields[name]?.length ? <small className="field-error">{fields[name][0]}</small> : null;
  return (
    <>
      <PageHeading
        eyebrow="GOOD THINGS START WITH A HELLO"
        title="Let’s find their place."
        description="A question, a school visit, or the start of something wonderful. We’re here to listen."
      />
      <section className="section">
        <div className="container contact-grid">
          <div className="contact-info">
            <span className="eyebrow">
              <span />
              COME SAY HELLO
            </span>
            <h2>
              Our door
              <br />
              is always open.
            </h2>
            <p>{s.admissionsText}</p>
            <div className="contact-details">
              <a href={`tel:${s.phone.replace(/[^+\d]/g, '')}`}>
                <span>
                  <Phone size={21} />
                </span>
                <div>
                  <small>Give us a call</small>
                  <strong>{s.phone}</strong>
                </div>
                <ArrowUpRight size={18} />
              </a>
              <a href={`mailto:${s.email}`}>
                <span>
                  <Mail size={21} />
                </span>
                <div>
                  <small>Write to us</small>
                  <strong>{s.email}</strong>
                </div>
                <ArrowUpRight size={18} />
              </a>
              <div>
                <span>
                  <MapPin size={21} />
                </span>
                <div>
                  <small>Find our school</small>
                  <strong>{s.address}</strong>
                </div>
              </div>
              <div>
                <span>
                  <Clock3 size={21} />
                </span>
                <div>
                  <small>Our office hours</small>
                  <strong>{s.officeHours}</strong>
                </div>
              </div>
            </div>
            <div className="contact-note">
              <Heart size={23} strokeWidth={1.5} />
              <p>
                Choosing a school is a big decision.
                <br />
                <strong>We’re happy to take it one little step at a time.</strong>
              </p>
            </div>
          </div>
          <div className="enquiry-card" id="enquire">
            {sent ? (
              <div className="enquiry-success" role="status">
                <span>
                  <CheckCircle2 size={40} strokeWidth={1.4} />
                </span>
                <h2>A lovely first step.</h2>
                <p>
                  Thank you for introducing yourself. Your enquiry has been saved for our school’s
                  admissions team. They’ll be in touch using the email address you provided.
                </p>
                <button className="btn btn-outline" onClick={() => setSent(false)}>
                  Send another enquiry
                </button>
              </div>
            ) : (
              <>
                <span className="eyebrow">TELL US A LITTLE ABOUT YOUR FAMILY</span>
                <h2>Start a conversation.</h2>
                <p>We’ll help you with the next steps. Fields marked * are required.</p>
                <form onSubmit={submit} className="enquiry-form">
                  <div className="form-grid">
                    <label className="field">
                      Your name *
                      <input
                        name="name"
                        autoComplete="name"
                        placeholder="Parent or guardian’s name"
                        required
                        maxLength={100}
                      />
                      {fieldError('name')}
                    </label>
                    <label className="field">
                      Email address *
                      <input
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        required
                        maxLength={254}
                      />
                      {fieldError('email')}
                    </label>
                    <label className="field">
                      Phone number
                      <input
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="Optional"
                        maxLength={40}
                      />
                      {fieldError('phone')}
                    </label>
                    <label className="field">
                      Year group of interest
                      <select name="studentGrade" defaultValue={params.get('program') || ''}>
                        <option value="">Let’s talk about it</option>
                        {[
                          'Early years',
                          'Primary school',
                          'Secondary school',
                          'Grade 1',
                          'Grade 2',
                          'Grade 3',
                          'Grade 4',
                          'Grade 5',
                          'Grade 6',
                          'Grade 7',
                          'Grade 8',
                          'Grade 9',
                          'Grade 10',
                          'Grade 11',
                          'Grade 12',
                        ].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="field">
                    What’s on your mind? *
                    <textarea
                      name="message"
                      rows={5}
                      required
                      maxLength={3000}
                      placeholder="Tell us a little about your child, ask a question, or let us know when you’d like to visit…"
                    />
                    {fieldError('message')}
                  </label>
                  <div className="honeypot" aria-hidden="true">
                    <label>
                      Leave this empty
                      <input name="website" tabIndex={-1} autoComplete="off" />
                    </label>
                  </div>
                  {error && (
                    <div className="form-error" role="alert">
                      {error}
                    </div>
                  )}
                  <button
                    className="btn btn-primary btn-lg full-width"
                    disabled={busy}
                    type="submit"
                  >
                    {busy ? (
                      <>
                        <LoaderCircle className="spin" size={18} />
                        Sending your hello…
                      </>
                    ) : (
                      <>
                        Send my enquiry
                        <ArrowUpRight size={18} />
                      </>
                    )}
                  </button>
                  <p className="form-privacy">
                    Your details go directly to the school team and are used only to respond to your
                    enquiry. Sending an enquiry does not reserve a place.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
