// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import ProductPage from './pages/ProductPage'
import SuccessPage from './pages/SuccessPage';
import CancelPage from './pages/CancelPage';
import './styles/global.css'


ReactDOM.createRoot(document.getElementById('root')).render(
<React.StrictMode>
<BrowserRouter>
<Routes>
<Route path="/" element={<App />} />
<Route path="/product/:id" element={<ProductPage />} />
<Route path="/success" element={<SuccessPage />} />
<Route path="/cancel" element={<CancelPage />} />

</Routes>
</BrowserRouter>
</React.StrictMode>
)