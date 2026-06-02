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

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <div className="App">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ErrorBoundary>
                        <Routes>
                          <Route path="/dashboard" element={<DashboardPage />} />
                          <Route path="/inventory" element={<InventoryPage />} />
                          <Route path="/demand" element={<DemandPlanningPage />} />
                          <Route path="/orders" element={<OrdersPage />} />
                          <Route path="/suppliers" element={<SupplierPage />} />
                          <Route path="/insights" element={<InsightsPage />} />
                          <Route path="/upload-data" element={<DataUploadPage />} />
                          <Route path="/settings" element={<SettingsPage />} />
                          <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                      </ErrorBoundary>
                    </AppLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
