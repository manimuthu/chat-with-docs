import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DocumentUploadPage from './pages/DocumentUploadPage';
import ProtectedRoute from './components/ProtectedRoute';
import IngestionPage from './pages/IngestionPage';
import DocumentListPage from './pages/DocumentListPage';
import QnaPage  from './pages/QnaPage';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

      <Route
        path="/qna"
        element={
          <ProtectedRoute>
            <QnaPage />
          </ProtectedRoute>
        }
      />
        <Route
          path="/documents/list"
          element={
            <ProtectedRoute>
              <DocumentListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ingestion"
          element={
            <ProtectedRoute>
              <IngestionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <DocumentUploadPage />
            </ProtectedRoute>
          }
        />
        
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
         <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
