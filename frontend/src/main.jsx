// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import ProductPage from './pages/ProductPage'
import SuccessPage from './pages/SuccessPage'
import CancelPage from './pages/CancelPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import AccountSettingsPage from './pages/AccountSettingsPage'
import './styles/global.css'


ReactDOM.createRoot(document.getElementById('root')).render(
<React.StrictMode>
<BrowserRouter>
<AuthProvider>
<Routes>
<Route path="/" element={<App />} />
<Route path="/product/:id" element={<ProductPage />} />
<Route path="/success" element={<SuccessPage />} />
<Route path="/cancel" element={<CancelPage />} />
<Route path="/login" element={<LoginPage />} />
<Route path="/register" element={<RegisterPage />} />
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />
<Route path="/verify-email" element={<VerifyEmailPage />} />
<Route path="/account/settings" element={<AccountSettingsPage />} />

</Routes>
</AuthProvider>
</BrowserRouter>
</React.StrictMode>
)