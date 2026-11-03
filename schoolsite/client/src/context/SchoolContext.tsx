import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useApi } from '../hooks/useApi';
import type { Settings } from '../types';
const SchoolContext = createContext<{
  settings: Settings | null;
  loading: boolean;
  error: string;
  refresh: () => void;
}>({ settings: null, loading: true, error: '', refresh: () => undefined });
export function SchoolProvider({ children }: { children: ReactNode }) {
  const result = useApi<Settings>('/settings');
  useEffect(() => {
    if (result.data) document.title = `${result.data.name} · Learn. Grow. Belong.`;
  }, [result.data]);
  return (
    <SchoolContext.Provider
      value={{
        settings: result.data,
        loading: result.loading,
        error: result.error,
        refresh: result.refresh,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
}
export const useSchool = () => useContext(SchoolContext);
