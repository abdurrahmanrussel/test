import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import ProtectedRoute from '../../components/ProtectedRoute'

export default function AdminPromoCodes() {
  const { token } = useAuth()
  const [promoCodes, setPromoCodes] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPromoCode, setEditingPromoCode] = useState(null)
  const [productSelectionMode, setProductSelectionMode] = useState('manual')
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const [formData, setFormData] = useState({
    promoCode: '',
    discountType: 'Percentage',
    discountValue: '',
    expiryDate: '',
    maxUses: '',
    timesUsed: '0',
    isActive: true,
    applicableProducts: '',
    minimumPurchase: '',
  })
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4242'

  useEffect(() => {
    fetchPromoCodes()
    fetchProducts()
  }, [token])

  const fetchProducts = async () => {
    try {
      console.log('[fetchProducts] Starting fetch to:', `${backendUrl}/api/admin/products`)
      const res = await fetch(`${backendUrl}/api/admin/products`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      console.log('[fetchProducts] Response status:', res.status)
      const data = await res.json()
      console.log('[fetchProducts] Response data:', data)
      console.log('[fetchProducts] Full data structure:', JSON.stringify(data, null, 2))
      const productsList = data.products || []
      console.log('[fetchProducts] Products loaded:', productsList.length)
      productsList.forEach((p, index) => {
        console.log(`[fetchProducts] Product ${index}:`, JSON.stringify(p, null, 2))
      })
      setProducts(productsList)
    } catch (err) {
      console.error('[fetchProducts] Error fetching products:', err)
    }
  }

  const fetchPromoCodes = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${backendUrl}/api/admin/promo-codes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      // Show all promo codes (active and inactive)
      setPromoCodes(data.promoCodes || [])
      setError('')
    } catch (err) {
      console.error('Error fetching promo codes:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingPromoCode 
        ? `${backendUrl}/api/admin/promo-codes/${editingPromoCode.id}`
        : `${backendUrl}/api/admin/promo-codes`

      const method = editingPromoCode ? 'PATCH' : 'POST'

      // Handle product selection based on mode
      let applicableProductIds = []
      
      console.log('[handleSubmit] Product selection mode:', productSelectionMode)
      console.log('[handleSubmit] Available products:', products.length)
      console.log('[handleSubmit] Selected product IDs:', selectedProductIds)
      
      if (productSelectionMode === 'all') {
        // Get all product IDs
        applicableProductIds = products.map(p => p.id)
        console.log('[handleSubmit] All products IDs:', applicableProductIds)
      } else if (productSelectionMode === 'indicators') {
        // Get all indicator product IDs
        const indicators = products.filter(p => p.type === 'Indicator')
        console.log('[handleSubmit] Filtered indicators:', indicators)
        applicableProductIds = indicators.map(p => p.id)
        console.log('[handleSubmit] Indicator IDs:', applicableProductIds)
      } else if (productSelectionMode === 'strategies') {
        // Get all strategy product IDs
        const strategies = products.filter(p => p.type === 'Strategy')
        console.log('[handleSubmit] Filtered strategies:', strategies)
        applicableProductIds = strategies.map(p => p.id)
        console.log('[handleSubmit] Strategy IDs:', applicableProductIds)
      } else {
        // Manual selection - use selected IDs
        applicableProductIds = selectedProductIds
        console.log('[handleSubmit] Manual selection IDs:', applicableProductIds)
      }
      
      console.log('[handleSubmit] Final applicableProductIds:', applicableProductIds)

      const submitData = {
        ...formData,
        applicableProducts: applicableProductIds,
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save promo code')
      }

      await fetchPromoCodes()
      setShowModal(false)
      resetForm()
    } catch (err) {
      console.error('Error saving promo code:', err)
      alert(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) return

    try {
      const res = await fetch(`${backendUrl}/api/admin/promo-codes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        throw new Error('Failed to delete promo code')
      }

      await fetchPromoCodes()
    } catch (err) {
      console.error('Error deleting promo code:', err)
      alert(err.message)
    }
  }

  const openEditModal = (promoCode) => {
    setEditingPromoCode(promoCode)
    
    // Parse applicable products from comma-separated string to array
    const applicableProductsRaw = promoCode.fields['Applicable Products'] || ''
    const applicableProducts = typeof applicableProductsRaw === 'string' && applicableProductsRaw.trim()
      ? applicableProductsRaw.split(',').map(p => p.trim()).filter(p => p)
      : []
    
    const allProductIds = products.map(p => p.id)
    const indicatorIds = products.filter(p => p.type === 'Indicator').map(p => p.id)
    const strategyIds = products.filter(p => p.type === 'Strategy').map(p => p.id)
    
    let selectionMode = 'manual'
    let selectedIds = []
    
    if (!applicableProducts || applicableProducts.length === 0) {
      selectionMode = 'manual'
      selectedIds = []
    } else if (JSON.stringify(applicableProducts.sort()) === JSON.stringify(allProductIds.sort())) {
      selectionMode = 'all'
    } else if (JSON.stringify(applicableProducts.sort()) === JSON.stringify(indicatorIds.sort())) {
      selectionMode = 'indicators'
    } else if (JSON.stringify(applicableProducts.sort()) === JSON.stringify(strategyIds.sort())) {
      selectionMode = 'strategies'
    } else {
      selectionMode = 'manual'
      selectedIds = applicableProducts
    }
    
    setProductSelectionMode(selectionMode)
    setSelectedProductIds(selectedIds)
    
    setFormData({
      promoCode: promoCode.fields['Promo Code'],
      discountType: promoCode.fields['Discount Type'],
      discountValue: promoCode.fields['Discount Value'],
      expiryDate: promoCode.fields['Expiry Date'] || '',
      maxUses: promoCode.fields['Max Uses'] || '',
      timesUsed: promoCode.fields['Times Used'] || '0',
      isActive: promoCode.fields.IsActive === true || promoCode.fields.IsActive === 'true',
      applicableProducts: '',
      minimumPurchase: promoCode.fields['Minimum Purchase'] || '',
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingPromoCode(null)
    setProductSelectionMode('manual')
    setSelectedProductIds([])
    setFormData({
      promoCode: '',
      discountType: 'Percentage',
      discountValue: '',
      expiryDate: '',
      maxUses: '',
      timesUsed: '0',
      isActive: true,
      applicableProducts: '',
      minimumPurchase: '',
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No expiry'
    return new Date(dateString).toLocaleDateString()
  }

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Promo Codes</h1>
            <p className="text-gray-600">Manage your promotional codes</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:scale-105 transition-all duration-300"
          >
            + Add Promo Code
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
            {error}
          </div>
        )}

        {/* Promo Codes Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Promo Code</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Discount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Expiry Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {promoCodes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No promo codes found. Click "Add Promo Code" to create one.
                    </td>
                  </tr>
                ) : (
                  promoCodes.map((promoCode) => {
                    const fields = promoCode.fields
                    const expired = isExpired(fields['Expiry Date'])
                    const active = fields.IsActive === true && !expired
                    
                    return (
                      <tr key={promoCode.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-bold text-gray-900 text-lg">{fields['Promo Code']}</div>
                            {(() => {
                              const applicableProducts = fields['Applicable Products'] || ''
                              const productCount = typeof applicableProducts === 'string' && applicableProducts.trim()
                                ? applicableProducts.split(',').filter(p => p.trim()).length
                                : 0
                              return productCount > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {productCount} product(s) selected
                                </div>
                              )
                            })()}
                            {fields['Minimum Purchase'] && (
                              <div className="text-xs text-gray-500 mt-1">
                                Min: ${parseFloat(fields['Minimum Purchase']).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-lg font-semibold text-gray-900">
                            {fields['Discount Type'] === 'Percentage' 
                              ? `${parseFloat(fields['Discount Value']).toFixed(2)}%` 
                              : `$${parseFloat(fields['Discount Value']).toFixed(2)}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {fields['Discount Type']}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(fields['Expiry Date'])}
                          {expired && (
                            <span className="ml-2 text-red-600 font-medium">(Expired)</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">
                              {fields['Times Used'] || 0}
                            </span>
                            {fields['Max Uses'] && (
                              <span className="text-gray-500">
                                / {fields['Max Uses']}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            active 
                              ? 'bg-green-100 text-green-800' 
                              : expired 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {expired ? 'Expired' : (fields.IsActive ? 'Active' : 'Inactive')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(promoCode)}
                            className="text-purple-600 hover:text-purple-800 font-medium text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(promoCode.id)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingPromoCode ? 'Edit Promo Code' : 'New Promo Code'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Promo Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.promoCode}
                      onChange={(e) => setFormData({ ...formData, promoCode: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., SUMMER2024"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type *</label>
                      <select
                        required
                        value={formData.discountType}
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="Percentage">Percentage</option>
                        <option value="Fixed Amount">Fixed Amount</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Discount Value *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={formData.discountType === 'Percentage' ? 'e.g., 20' : 'e.g., 10.00'}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                      <input
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Uses (optional)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.maxUses}
                        onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Leave empty for unlimited"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Purchase (USD, optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.minimumPurchase}
                      onChange={(e) => setFormData({ ...formData, minimumPurchase: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., 50.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Applicable Products</label>
                    <select
                      value={productSelectionMode}
                      onChange={(e) => {
                        setProductSelectionMode(e.target.value)
                        if (e.target.value !== 'manual') {
                          setSelectedProductIds([])
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
                    >
                      <option value="all">All Products</option>
                      <option value="indicators">All Indicators</option>
                      <option value="strategies">All Strategies</option>
                      <option value="manual">Select Manually</option>
                    </select>
                    
                    {productSelectionMode === 'manual' && (
                      <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                        {!products || products.length === 0 ? (
                          <p className="text-gray-500 text-sm">No products available</p>
                        ) : (
                          products.map((product) => {
                            if (!product) return null
                            return (
                              <label key={product.id} className="flex items-center space-x-3 cursor-pointer hover:bg-white p-2 rounded">
                                <input
                                  type="checkbox"
                                  checked={selectedProductIds.includes(product.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedProductIds([...selectedProductIds, product.id])
                                    } else {
                                      setSelectedProductIds(selectedProductIds.filter(id => id !== product.id))
                                    }
                                  }}
                                  className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">{product.name || 'Unknown Product'}</div>
                                  <div className="text-xs text-gray-500">
                                    {product.type || 'Unknown'} - ${product.price ? parseFloat(product.price).toFixed(2) : '0.00'}
                                  </div>
                                </div>
                              </label>
                            )
                          })
                        )}
                      </div>
                    )}
                    
                    {productSelectionMode === 'manual' && (
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                    
                    {productSelectionMode !== 'manual' && (
                      <p className="text-xs text-gray-500 mt-1">
                        {productSelectionMode === 'all' && `This promo code will apply to all ${products.length} products`}
                        {productSelectionMode === 'indicators' && `This promo code will apply to ${products.filter(p => p.type === 'Indicator').length} indicators`}
                        {productSelectionMode === 'strategies' && `This promo code will apply to ${products.filter(p => p.type === 'Strategy').length} strategies`}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Times Used</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.timesUsed}
                      onChange={(e) => setFormData({ ...formData, timesUsed: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Active
                    </label>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false)
                        resetForm()
                      }}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
                    >
                      {editingPromoCode ? 'Update' : 'Create'} Promo Code
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}