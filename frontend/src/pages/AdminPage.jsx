import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import MainLayout from '../layouts/MainLayout'
import ProtectedRoute from '../components/ProtectedRoute'

export default function AdminPage() {
  const { hasRole, user, token } = useAuth()
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4242'

  // Fetch orders and stats
  useEffect(() => {
    const fetchData = async () => {
      // Check if user is admin before fetching
      if (!hasRole('admin')) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Fetch orders
        const ordersRes = await fetch(`${backendUrl}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const ordersData = await ordersRes.json()
        
        if (!ordersRes.ok) {
          throw new Error(ordersData.error || 'Failed to fetch orders')
        }
        
        setOrders(ordersData.orders || [])
        
        // Fetch stats
        const statsRes = await fetch(`${backendUrl}/api/orders/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const statsData = await statsRes.json()
        
        if (!statsRes.ok) {
          throw new Error(statsData.error || 'Failed to fetch stats')
        }
        
        setStats(statsData.stats)
        setError('')
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token, hasRole])

  // Filter orders by status
  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus)

  // Update order status
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${backendUrl}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update status')
      }
      
      // Refresh orders
      const ordersRes = await fetch(`${backendUrl}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const ordersData = await ordersRes.json()
      setOrders(ordersData.orders || [])
      
      // Close modal
      setSelectedOrder(null)
    } catch (err) {
      console.error('Error updating status:', err)
      alert(err.message)
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Status badge colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'refunded':
        return 'bg-red-100 text-red-800'
      case 'failed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Check if user is admin - render access denied
  if (!hasRole('admin') && !loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="max-w-7xl mx-auto py-16 px-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <h1 className="text-3xl font-bold text-red-800 mb-4">Access Denied</h1>
              <p className="text-red-600">You don't have permission to access this page.</p>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="max-w-7xl mx-auto py-16 px-6">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
              <p className="mt-4 text-xl text-gray-600">Loading admin dashboard...</p>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div className="max-w-7xl mx-auto py-16 px-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <h1 className="text-3xl font-bold text-red-800 mb-4">Error</h1>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="max-w-7xl mx-auto py-12 px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage orders and track sales</p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="text-sm font-medium text-gray-600 mb-2">Total Orders</div>
                <div className="text-3xl font-bold text-gray-900">{stats.totalOrders}</div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="text-sm font-medium text-gray-600 mb-2">Total Revenue</div>
                <div className="text-3xl font-bold text-green-600">
                  ${stats.totalRevenue?.toFixed(2) || '0.00'}
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
                <div className="text-sm font-medium text-gray-600 mb-2">Completed</div>
                <div className="text-3xl font-bold text-emerald-600">{stats.completedOrders}</div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                <div className="text-sm font-medium text-gray-600 mb-2">Pending</div>
                <div className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</div>
              </div>
            </div>
          )}

          {/* Filter */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2">
                {['all', 'completed', 'pending', 'refunded', 'failed'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filterStatus === status
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
              
              <div className="text-sm text-gray-600">
                Showing {filteredOrders.length} of {orders.length} orders
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            #{order.orderId || order.id?.slice(0, 8)}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.customerName || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {order.customerEmail || 'N/A'}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {order.productName || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {order.productId?.slice(0, 8) || 'N/A'}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ${order.amount?.toFixed(2) || '0.00'}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                            {order.status?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {formatDate(order.purchaseDate)}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Details Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Order ID</div>
                        <div className="font-semibold text-gray-900">
                          #{selectedOrder.orderId || selectedOrder.id?.slice(0, 8)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Status</div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}>
                          {selectedOrder.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="text-sm text-gray-600 mb-2">Customer</div>
                      <div className="font-semibold text-gray-900">
                        {selectedOrder.customerName || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedOrder.customerEmail || 'N/A'}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="text-sm text-gray-600 mb-2">Product</div>
                      <div className="font-semibold text-gray-900">
                        {selectedOrder.productName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">
                        ID: {selectedOrder.productId || 'N/A'}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="text-sm text-gray-600 mb-2">Amount</div>
                      <div className="text-2xl font-bold text-green-600">
                        ${selectedOrder.amount?.toFixed(2) || '0.00'}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="text-sm text-gray-600 mb-2">Purchase Date</div>
                      <div className="text-gray-900">
                        {formatDate(selectedOrder.purchaseDate)}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="text-sm text-gray-600 mb-2">Stripe Payment ID</div>
                      <div className="text-sm text-gray-900 font-mono break-all">
                        {selectedOrder.stripePaymentId || 'N/A'}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="text-sm text-gray-600 mb-3">Update Status</div>
                      <div className="flex gap-2">
                        {['pending', 'completed', 'refunded', 'failed'].map(status => (
                          <button
                            key={status}
                            onClick={() => handleStatusUpdate(selectedOrder.id, status)}
                            disabled={selectedOrder.status === status}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              selectedOrder.status === status
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}