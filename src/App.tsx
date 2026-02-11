import React from 'react';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import LoadingScreen from './components/LoadingScreen';
import LoginActivity from './pages/LoginActivity';
import DashboardActivity from './pages/DashboardActivity';

// Main App Content
const AppContent: React.FC = () => {
  const {
    isLoading,
    isAuthenticated,
    userData,
    error,
    login,
    register,
    logout,
    clearError,
    demoLogin
  } = useAuthContext();

  // Show loading screen while checking auth state
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show login if not authenticated
  if (!isAuthenticated || !userData) {
    return (
      <LoginActivity
        onLogin={login}
        onRegister={register}
        onDemoLogin={demoLogin}
        isLoading={isLoading}
        error={error}
        clearError={clearError}
      />
    );
  }

  // Show dashboard if authenticated
  return (
    <DashboardActivity
      userData={userData}
      onLogout={logout}
    />
  );
};

// App Component with Provider
export function App() {
  return (
    <AuthProvider>
      <div className="max-w-md mx-auto min-h-screen bg-[#0a1628] relative overflow-hidden">
        {/* Mobile Frame Effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-3xl"></div>
        </div>
        
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;
