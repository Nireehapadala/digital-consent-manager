// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import StudentDashboard from './components/StudentDashboard';
import ParentDashboard from './components/ParentDashboard';
import FacultyDashboard from './components/FacultyDashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            user ? (
              user.role === 'student' ? <Navigate to="/student" /> :
              user.role === 'parent' ? <Navigate to="/parent" /> :
              <Navigate to="/faculty" />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
        
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
          } 
        />
        
        <Route 
          path="/register" 
          element={
            user ? <Navigate to="/" /> : <Register />
          } 
        />
        
        <Route 
          path="/student" 
          element={
            user && user.role === 'student' ? 
            <StudentDashboard user={user} onLogout={handleLogout} /> : 
            <Navigate to="/login" />
          } 
        />
        
        <Route 
          path="/parent" 
          element={
            user && user.role === 'parent' ? 
            <ParentDashboard user={user} onLogout={handleLogout} /> : 
            <Navigate to="/login" />
          } 
        />
        
        <Route 
          path="/faculty" 
          element={
            user && user.role === 'faculty' ? 
            <FacultyDashboard user={user} onLogout={handleLogout} /> : 
            <Navigate to="/login" />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;