import { useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
export function usePageTitle(title: string) {
  const { settings } = useSchool();
  useEffect(() => {
    document.title = `${title} · ${settings?.name || 'Our School'}`;
  }, [title, settings?.name]);
}
