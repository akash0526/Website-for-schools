import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SchoolProvider } from './context/SchoolContext';
import { ToastProvider } from './context/ToastContext';
import { PublicLayout } from './components/PublicLayout';
import { HomePage } from './pages/HomePage';
import { SchoolPage } from './pages/SchoolPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { GalleryPage } from './pages/GalleryPage';
import { AlbumPage } from './pages/AlbumPage';
import { NewsPage, NoticePage } from './pages/NewsPage';
import { ContactPage } from './pages/ContactPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { LoginPage, ResetPasswordPage } from './pages/admin/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { ResourceManager } from './pages/admin/ResourceManager';
import { announcementResource, eventResource, programResource } from './pages/admin/resources';
import { AlbumAdminPage, GalleryAdminPage } from './pages/admin/GalleryAdminPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { InquiriesPage } from './pages/admin/InquiriesPage';
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const timer = setTimeout(
        () =>
          document
            .getElementById(hash.slice(1))
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        180,
      );
      return () => clearTimeout(timer);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <SchoolProvider>
            <ScrollManager />
            <Routes>
              <Route element={<PublicLayout />}>
                <Route index element={<HomePage />} />
                <Route path="our-school" element={<SchoolPage />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="events/:slug" element={<EventDetailPage />} />
                <Route path="gallery" element={<GalleryPage />} />
                <Route path="gallery/:id" element={<AlbumPage />} />
                <Route path="news" element={<NewsPage />} />
                <Route path="news/:id" element={<NoticePage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
              <Route path="admin/login" element={<LoginPage />} />
              <Route path="admin/reset-password" element={<ResetPasswordPage />} />
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route
                  path="events"
                  element={<ResourceManager config={eventResource} key="events" />}
                />
                <Route
                  path="announcements"
                  element={<ResourceManager config={announcementResource} key="announcements" />}
                />
                <Route
                  path="programs"
                  element={<ResourceManager config={programResource} key="programs" />}
                />
                <Route path="gallery" element={<GalleryAdminPage />} />
                <Route path="gallery/:id" element={<AlbumAdminPage />} />
              </Route>
              <Route path="admin" element={<AdminLayout ownerOnly />}>
                <Route path="settings" element={<SettingsPage />} />
                <Route path="inquiries" element={<InquiriesPage />} />
              </Route>
            </Routes>
          </SchoolProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
