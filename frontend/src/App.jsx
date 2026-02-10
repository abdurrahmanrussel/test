import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Button from './components/Button'
import HeroCarousel from './components/HeroCarousel'
import FloatingChatbot from './components/FloatingChatbot';
import { useAuth } from './context/AuthContext'

import 'swiper/css'
import 'swiper/css/pagination'

function App() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [indicators, setIndicators] = useState([])
  const [strategies, setStrategies] = useState([])

  const [indicatorsToShow, setIndicatorsToShow] = useState(3)
  const [strategiesToShow, setStrategiesToShow] = useState(3)
  const [showCouponInput, setShowCouponInput] = useState(null)
  const [couponCodes, setCouponCodes] = useState({})
  const [appliedPromos, setAppliedPromos] = useState({})
  const [promoErrors, setPromoErrors] = useState({})

  const indicatorsRef = useRef(null)
  const strategiesRef = useRef(null)

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Fetch Airtable products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(
          `https://api.airtable.com/v0/${import.meta.env.VITE_AIRTABLE_BASE_ID}/${encodeURIComponent(
            import.meta.env.VITE_AIRTABLE_TABLE_NAME
          )}`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_AIRTABLE_PAT}`,
            },
          }
        )

        const data = await res.json()

        const formatted = data.records.map((r) => ({
          id: r.id,
          name: r.fields['Name / Title'],
          type: r.fields.Type,
          price: r.fields.Price,
          description: r.fields.Description,
          image: r.fields['Thumbnail URL'],
          gallery: r.fields['Gallery Images'] || [],
          youtube: r.fields['Youtube Link'],
          faq: r.fields.FAQ,
          isActive: r.fields.IsActive,
        }))

        // Show only active products on main page (IsActive is now a boolean)
        const activeProducts = formatted.filter((p) => p.isActive === true || p.isActive === 'true')
        setIndicators(activeProducts.filter((p) => p.type === 'Indicator'))
        setStrategies(activeProducts.filter((p) => p.type === 'Strategy'))
      } catch (err) {
        console.error('Airtable fetch error:', err)
      }
    }

    fetchProducts()
  }, [])

  // Lazy prefetch images
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            indicators.slice(indicatorsToShow).forEach((p) => new Image().src = p.image)
            strategies.slice(strategiesToShow).forEach((p) => new Image().src = p.image)
            observer.disconnect()
          }
        })
      },
      { rootMargin: '300px' }
    )

    const trigger = document.getElementById('lazy-prefetch-trigger')
    if (trigger) observer.observe(trigger)
  }, [indicators, strategies, indicatorsToShow, strategiesToShow])

  // Buy Now -> Backend -> Stripe
  const buyNow = async (product) => {
    if (!isAuthenticated) {
      alert('Please login to purchase')
      navigate('/login')
      return
    }

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4242'
      const token = localStorage.getItem('token')
      
      const appliedPromo = appliedPromos[product.id]
      const discountAmount = appliedPromo ? calculateDiscount(product.price, appliedPromo) : 0
      const finalPrice = parseFloat(product.price) - discountAmount

      const res = await fetch(`${backendUrl}/api/create-checkout-session`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          productId: product.id,
          promoCodeId: appliedPromo?.id || null,
          finalPrice
        }),
      })
      
      if (!res.ok) {
        if (res.status === 401) {
          alert('Please login to purchase')
          navigate('/login')
          return
        }
        throw new Error('Failed to create checkout session')
      }

      const data = await res.json()
      console.log('Checkout Response:', data)
      window.location.href = data.url
    } catch (err) {
      console.error('Checkout error:', err)
      alert('Failed to create checkout. Please try again.')
    }
  }

  // Calculate discount amount
  const calculateDiscount = (price, promo) => {
    if (!promo) return 0
    const priceNum = parseFloat(price)
    if (promo.discountType === 'Percentage') {
      return priceNum * (parseFloat(promo.discountValue) / 100)
    } else {
      return parseFloat(promo.discountValue)
    }
  }

  // Validate and apply promo code
  const applyPromoCode = async (productId, code) => {
    if (!code || code.trim() === '') {
      setPromoErrors(prev => ({ ...prev, [productId]: 'Please enter a promo code' }))
      return
    }

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4242'
      const res = await fetch(`${backendUrl}/api/promo-codes/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          promoCode: code.trim(), 
          productId 
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.valid) {
        setPromoErrors(prev => ({ ...prev, [productId]: data.message || 'Invalid promo code' }))
        setAppliedPromos(prev => ({ ...prev, [productId]: null }))
        setCouponCodes(prev => ({ ...prev, [productId]: '' }))
      } else {
        setPromoErrors(prev => ({ ...prev, [productId]: '' }))
        setAppliedPromos(prev => ({ ...prev, [productId]: data.promoCode }))
        setCouponCodes(prev => ({ ...prev, [productId]: code.trim().toUpperCase() }))
        setShowCouponInput(null) // Close input after successful apply
      }
    } catch (err) {
      console.error('Promo code error:', err)
      setPromoErrors(prev => ({ ...prev, [productId]: 'Failed to validate promo code' }))
      setAppliedPromos(prev => ({ ...prev, [productId]: null }))
    }
  }



  // Render Products
  const renderProducts = (productsArray, count, setCount) => (
    <>
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12 px-8">
        {productsArray.slice(0, count).map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition"
          >
            <img
              src={p.image}
              alt={p.name}
              loading="lazy"
              className="h-64 w-full object-cover"
            />
            <div className="p-6 space-y-3">
              <h3 className="text-lg font-bold">{p.name}</h3>
              
              {appliedPromos[p.id] ? (
                <div className="flex items-baseline gap-2">
                  <p className="text-slate-400 text-lg line-through">${p.price}</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${(parseFloat(p.price) - calculateDiscount(p.price, appliedPromos[p.id])).toFixed(2)}
                  </p>
                </div>
              ) : (
                <p className="text-slate-500">${p.price}</p>
              )}
              
              {promoErrors[p.id] && (
                <p className="text-red-500 text-xs mt-1">{promoErrors[p.id]}</p>
              )}
              
              {appliedPromos[p.id] && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-green-600 text-sm font-medium">
                    ✓ {appliedPromos[p.id].code} applied
                  </span>
                  <button
                    className="text-red-500 text-xs hover:underline"
                    onClick={() => {
                      setAppliedPromos(prev => ({ ...prev, [p.id]: null }))
                      setCouponCodes(prev => ({ ...prev, [p.id]: '' }))
                      setPromoErrors(prev => ({ ...prev, [p.id]: '' }))
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
              
              {!appliedPromos[p.id] && (
                <button
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium mt-1"
                  onClick={() => setShowCouponInput(showCouponInput === p.id ? null : p.id)}
                >
                  Coupon / Promo code
                </button>
              )}
              
              {showCouponInput === p.id && !appliedPromos[p.id] && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Enter a coupon code"
                    value={couponCodes[p.id] || ''}
                    onChange={(e) => {
                      setCouponCodes({ ...couponCodes, [p.id]: e.target.value })
                      setPromoErrors(prev => ({ ...prev, [p.id]: '' }))
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        applyPromoCode(p.id, couponCodes[p.id])
                      }
                    }}
                  />
                  <button 
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg"
                    onClick={() => applyPromoCode(p.id, couponCodes[p.id])}
                  >
                    Add
                  </button>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <Button 
                  onClick={() => {
                    const appliedPromo = appliedPromos[p.id]
                    if (appliedPromo) {
                      navigate(`/product/${p.id}`, { 
                        state: { 
                          promoCode: appliedPromo.code,
                          finalPrice: (parseFloat(p.price) - calculateDiscount(p.price, appliedPromo)).toFixed(2)
                        }
                      })
                    } else {
                      navigate(`/product/${p.id}`)
                    }
                  }}
                >
                  View Details
                </Button>
                <Button
                  className="bg-green-600 text-white"
                  onClick={() => buyNow(p)}
                >
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {count < productsArray.length && (
        <div className="text-center mt-8">
          <Button onClick={() => setCount(productsArray.length)}>
            See More
          </Button>
        </div>
      )}
    </>
  )

  // Show all on navbar click
  const showAllProducts = () => {
    setIndicatorsToShow(indicators.length)
    setStrategiesToShow(strategies.length)
    if (indicatorsRef.current) {
      indicatorsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <MainLayout showAllProducts={showAllProducts}>
      {/*<section className="py-24 px-8 max-w-7xl mx-auto">
        <HeroCarousel loading="eager" />
      </section>*/}

      <section ref={indicatorsRef} className="py-32 bg-slate-50" id="products">
        <h2 className="text-5xl text-center mb-20">Indicators</h2>
        {renderProducts(indicators, indicatorsToShow, setIndicatorsToShow)}
      </section>

      <section ref={strategiesRef} className="py-32">
        <h2 className="text-5xl text-center mb-20">Strategies</h2>
        {renderProducts(strategies, strategiesToShow, setStrategiesToShow)}
      </section>

      <div id="lazy-prefetch-trigger" />
      {/*  <FloatingChatbot /> */}
    </MainLayout>
    
  )
}

export default App
