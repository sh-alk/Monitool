/**
 * Main App Component
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import Sidebar from './components/layout/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ToolboxManagement from './pages/ToolboxManagement';
import TechnicianLogs from './pages/TechnicianLogs';
import About from './pages/About';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Layout Component with Sidebar
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden flex">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden bg-background-light">
        {children}
      </main>
    </div>
  );
}

// Placeholder components for other pages

function HealthCheck() {
  return <div style={{ padding: '10px', fontFamily: 'monospace' }}>OK</div>;
}

function SettingsPage() {
  return (
    <div className="p-10">
      <h2 className="text-3xl font-bold text-slate-900 mb-4">Settings</h2>
      <p className="text-slate-500">Settings page coming soon...</p>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/up" element={<HealthCheck />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/toolboxes"
            element={
              <ProtectedRoute>
                <Layout>
                  <ToolboxManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/technicians"
            element={
              <ProtectedRoute>
                <Layout>
                  <TechnicianLogs />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/about"
            element={
              <ProtectedRoute>
                <Layout>
                  <About />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
