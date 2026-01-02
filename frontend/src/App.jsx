import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { MapPage } from './pages/MapPage';
import { PublishProperty } from './pages/PublishProperty';
import { PropertyDetails } from './pages/PropertyDetails';
import { Profile } from './pages/Profile';
import { Favorites } from './pages/Favorites';
import { Notifications } from './pages/Notifications';
import { Chat } from './pages/Chat';
import { Chatbot } from './pages/Chatbot';
import { Cities } from './pages/Cities';
import { Recommendations } from './pages/Recommendations';
import { MyProperties } from './pages/MyProperties';

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <div className="min-h-screen bg-bg dark:bg-bg-dark transition-colors duration-300">
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/publish" element={<PublishProperty />} />
                <Route path="/properties/:id" element={<PropertyDetails />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/chat/:otherUserId" element={<Chat />} />
                <Route path="/chatbot" element={<Chatbot />} />
                <Route path="/cities" element={<Cities />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/my-properties" element={<MyProperties />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
