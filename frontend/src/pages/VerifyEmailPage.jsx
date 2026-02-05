import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('')
  const [canLogin, setCanLogin] = useState(false)

  const token = searchParams.get('token')
  const email = searchParams.get('email')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token || !email) {
        setStatus('error')
        setMessage('Invalid verification link. Please request a new verification email.')
        return
      }

      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4242'
        const response = await fetch(`${backendUrl}/api/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, email }),
        })

        const data = await response.json()

        if (!response.ok) {
          setStatus('error')
          setMessage(data.error || 'Email verification failed')
          return
        }

        setStatus('success')
        setMessage('Your email has been verified successfully! You can now log in to your account.')
        setCanLogin(true)
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } catch (error) {
        console.error('Email verification error:', error)
        setStatus('error')
        setMessage('Network error. Please try again or contact support.')
      }
    }

    verifyEmail()
  }, [token, email, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        <div className="mt-8 space-y-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">✓ Email Verified!</h3>
              <p className="text-green-700 mb-4">{message}</p>
              {canLogin && (
                <div className="mt-6">
                  <Link
                    to="/login"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                  >
                    Proceed to Login →
                  </Link>
                </div>
              )}
              <p className="text-sm text-green-600 mt-4">You will be redirected to the login page in 3 seconds...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-10 w-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Verification Failed</h3>
              <p className="text-red-700 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Go to Login
                </Link>
                <button
                  onClick={() => navigate('/register')}
                  className="block w-full text-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Create Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailPage