import React from 'react'
import logo from '../assets/logo.png'
import Button from './Button'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = ({ showAllProducts }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout, hasRole } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleLogoClick = () => {
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate('/', { replace: false }) // go to home page
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
    }
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/90 border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">

        <div onClick={handleLogoClick} className="flex items-center gap-3 cursor-pointer">
          <img src={logo} alt="AA Trading Logo" className="h-10 w-10" />
          <span className="font-bold text-xl text-slate-900">AA Trading</span>
        </div>

        <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-700">
          <button
            onClick={() => {
              if (location.pathname !== '/') {
                navigate('/')
                setTimeout(() => showAllProducts?.(), 400)
              } else {
                showAllProducts?.()
              }
            }}
            className="hover:text-blue-600 transition"
          >
            Products
          </button>
          <a href="#reviews" className="hover:text-blue-600 transition">Reviews</a>
          <a href="#team" className="hover:text-blue-600 transition">Team</a>
          <a href="#contact" className="hover:text-blue-600 transition">Contact</a>
        </nav>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {hasRole('admin') ? (
                <Link
                  to="/admin"
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Admin
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Dashboard
                </Link>
              )}
              <Link
                to="/account/settings"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Settings
              </Link>
              <span className="text-sm text-slate-700 hidden sm:block">
                Hi, {user?.name}
              </span>
              <Button
                onClick={handleLogout}
                className="bg-transparent text-blue-600 shadow-none hover:bg-blue-50"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button className="bg-transparent text-blue-600 shadow-none hover:bg-blue-50">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-blue-600 text-white">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}

export default Navbar
