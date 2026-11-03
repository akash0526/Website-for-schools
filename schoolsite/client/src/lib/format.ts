export const formatDate = (value: string, options: Intl.DateTimeFormatOptions = {}) =>
  new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
export const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });
export const dateInput = (value: string) => {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export const initials = (name: string) =>
  name
    .split(' ')
    .map((v) => v[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
export const number = (n: number) => n.toLocaleString('en-US');
export function downloadCalendar(event: {
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string | null;
  slug: string;
}) {
  const stamp = (s: string) =>
    new Date(s)
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  const escape = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SchoolSite//School Events//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.slug}@schoolsite.local`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(event.startsAt)}`,
    `DTEND:${stamp(event.endsAt || new Date(new Date(event.startsAt).getTime() + 3600000).toISOString())}`,
    `SUMMARY:${escape(event.title)}`,
    `DESCRIPTION:${escape(event.description.slice(0, 1000))}`,
    `LOCATION:${escape(event.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const url = URL.createObjectURL(
    new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.slug}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
