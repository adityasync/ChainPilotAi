import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FAQPage from './pages/FAQPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import DemandPlanningPage from './pages/DemandPlanningPage';
import SupplierPage from './pages/SupplierPage';
import InsightsPage from './pages/InsightsPage';
import SettingsPage from './pages/SettingsPage';
import DataUploadPage from './pages/DataUploadPage';
import OrdersPage from './pages/OrdersPage';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';

const ProtectedAppShell = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </AppLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <div className="App">
            <Routes>
              {/* Public routes — explicit paths only */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />

              {/* Protected routes — each one wrapped individually so unknown
                  paths fall through to the public 404 below instead of being
                  intercepted by a catch-all ProtectedRoute */}
              <Route
                path="/dashboard"
                element={<ProtectedAppShell><DashboardPage /></ProtectedAppShell>}
              />
              <Route
                path="/inventory"
                element={<ProtectedAppShell><InventoryPage /></ProtectedAppShell>}
              />
              <Route
                path="/demand"
                element={<ProtectedAppShell><DemandPlanningPage /></ProtectedAppShell>}
              />
              <Route
                path="/orders"
                element={<ProtectedAppShell><OrdersPage /></ProtectedAppShell>}
              />
              <Route
                path="/suppliers"
                element={<ProtectedAppShell><SupplierPage /></ProtectedAppShell>}
              />
              <Route
                path="/insights"
                element={<ProtectedAppShell><InsightsPage /></ProtectedAppShell>}
              />
              <Route
                path="/upload-data"
                element={<ProtectedAppShell><DataUploadPage /></ProtectedAppShell>}
              />
              <Route
                path="/settings"
                element={<ProtectedAppShell><SettingsPage /></ProtectedAppShell>}
              />

              {/* Public catch-all — only reached when no specific route matched */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
