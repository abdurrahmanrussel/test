import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import ProtectedRoute from '../../components/ProtectedRoute'

export default function PurchasedProducts() {
  const { user, token } = useAuth()
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4242'

  useEffect(() => {
    fetchPurchases()
  }, [token])

  const fetchPurchases = async () => {
    try {
      setLoading(true)
      console.log('[Purchases] Fetching orders from:', `${backendUrl}/api/orders/my-orders`)
      console.log('[Purchases] Token exists:', !!token)
      console.log('[Purchases] User:', user)
      
      const res = await fetch(`${backendUrl}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      console.log('[Purchases] Response status:', res.status)
      
      const data = await res.json()
      console.log('[Purchases] Response data:', data)
      
      if (data.orders) {
        console.log(`[Purchases] Found ${data.orders.length} orders`)
        setPurchases(data.orders)
      } else if (data.error) {
        setError(data.error)
      }
      setError('')
    } catch (err) {
      console.error('Error fetching purchases:', err)
      setError(err.message || 'Failed to fetch purchases')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-500"></div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchased Products</h1>
          <p className="text-gray-600">View all your purchased products</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
            {error}
          </div>
        )}

        {purchases.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Purchases Yet</h3>
            <p className="text-gray-600 mb-6">You haven't purchased any products yet.</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    {purchase.thumbnailUrl && (
                      <img
                        src={purchase.thumbnailUrl}
                        alt={purchase.productName}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{purchase.productName}</h3>
                      <p className="text-sm text-gray-600">
                        {purchase.productType ? `Type: ${purchase.productType}` : ''}
                      </p>
                      <p className="text-sm text-gray-500">
                        Purchased on {new Date(purchase.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        ${parseFloat(purchase.amount).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">Order ID: {purchase.id.slice(0, 8)}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      purchase.status === 'completed' || purchase.status === 'succeeded'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {purchase.status === 'completed' || purchase.status === 'succeeded' ? '✅ Completed' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}