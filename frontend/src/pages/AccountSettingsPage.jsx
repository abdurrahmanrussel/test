import React, { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AccountSettingsPage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Email change state
  const [showEmailChange, setShowEmailChange] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)

  // Account deletion state
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  const handleChangeEmail = async (e) => {
    e.preventDefault()
    setEmailError('')
    setEmailSuccess('')
    setEmailLoading(true)

    try {
      const token = localStorage.getItem('token')
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4242'
      
      const response = await fetch(`${backendUrl}/api/auth/change-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          newEmail,
          password: emailPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setEmailError(data.error || 'Failed to change email')
        return
      }

      setEmailSuccess(data.message || 'Email changed successfully!')
      setShowEmailChange(false)
      setNewEmail('')
      setEmailPassword('')
      
      // Logout after email change (requires re-verification)
      setTimeout(() => {
        logout()
        navigate('/login')
      }, 2000)
    } catch (error) {
      console.error('Change email error:', error)
      setEmailError('Network error. Please try again.')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleDeleteAccount = async (e) => {
    e.preventDefault()
    setDeleteError('')
    setDeleteLoading(true)

    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm')
      setDeleteLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4242'
      
      const response = await fetch(`${backendUrl}/api/auth/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: deletePassword,
          confirmDelete: deleteConfirm,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setDeleteError(data.error || 'Failed to delete account')
        return
      }

      // Logout and redirect to home
      logout()
      navigate('/')
    } catch (error) {
      console.error('Delete account error:', error)
      setDeleteError('Network error. Please try again.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Account Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Account Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.name || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.email || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{user?.role || 'User'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-green-600 font-medium">Active</dd>
            </div>
          </dl>
        </div>

        {/* Change Email */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Change Email Address</h2>
            {!showEmailChange && (
              <button
                onClick={() => setShowEmailChange(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Change Email
              </button>
            )}
          </div>

          {emailSuccess && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              {emailSuccess}
            </div>
          )}

          {showEmailChange && (
            <form onSubmit={handleChangeEmail} className="space-y-4">
              {emailError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {emailError}
                </div>
              )}

              <div>
                <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700">
                  New Email Address
                </label>
                <input
                  id="newEmail"
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="new.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="emailPassword" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  id="emailPassword"
                  type="password"
                  required
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {emailLoading ? 'Changing...' : 'Change Email'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailChange(false)
                    setNewEmail('')
                    setEmailPassword('')
                    setEmailError('')
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>

              <p className="text-sm text-gray-500">
                ⚠️ You will be logged out after changing your email and will need to verify your new email address.
              </p>
            </form>
          )}
        </div>

        {/* Delete Account */}
        <div className="bg-white shadow rounded-lg p-6 border-2 border-red-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-red-900">Delete Account</h2>
              <p className="text-sm text-red-600">
                This action is permanent and cannot be undone.
              </p>
            </div>
            {!showDeleteAccount && (
              <button
                onClick={() => setShowDeleteAccount(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                Delete Account
              </button>
            )}
          </div>

          {showDeleteAccount && (
            <form onSubmit={handleDeleteAccount} className="space-y-4 mt-4 pt-4 border-t border-red-200">
              {deleteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {deleteError}
                </div>
              )}

              <div className="bg-red-50 border border-red-200 p-4 rounded-md">
                <h3 className="font-semibold text-red-900 mb-2">⚠️ Warning</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• All your data will be permanently deleted</li>
                  <li>• This action cannot be undone</li>
                  <li>• You will lose access to all your accounts</li>
                  <li>• Any pending orders will be cancelled</li>
                </ul>
              </div>

              <div>
                <label htmlFor="deletePassword" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="deletePassword"
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>

              <div>
                <label htmlFor="deleteConfirm" className="block text-sm font-medium text-gray-700">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm
                </label>
                <input
                  id="deleteConfirm"
                  type="text"
                  required
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  placeholder="DELETE"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={deleteLoading || deleteConfirm !== 'DELETE'}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading ? 'Deleting...' : 'Permanently Delete Account'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteAccount(false)
                    setDeletePassword('')
                    setDeleteConfirm('')
                    setDeleteError('')
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AccountSettingsPage