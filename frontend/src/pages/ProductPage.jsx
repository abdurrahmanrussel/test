import React, { useState, useEffect, useRef } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import Button from '../components/Button'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import ReactMarkdown from 'react-markdown'

export default function ProductPage() {
  const { id } = useParams()
  const location = useLocation()
  const [product, setProduct] = useState(null)
  const [promoCode, setPromoCode] = useState(null)
  const [finalPrice, setFinalPrice] = useState(null)
  const [faqOpenIndex, setFaqOpenIndex] = useState(null)
  const [showFixedBuy, setShowFixedBuy] = useState(false)
  const [showPromoInput, setShowPromoInput] = useState(false)
  const [promoInputValue, setPromoInputValue] = useState('')
  const [promoError, setPromoError] = useState('')

  const topBuyRef = useRef(null)
  const footerRef = useRef(null)

  // Check for promo code from navigation state
  useEffect(() => {
    if (location.state?.promoCode && location.state?.finalPrice) {
      setPromoCode(location.state.promoCode)
      setFinalPrice(location.state.finalPrice)
    }
  }, [location])

  // Validate promo code
  const validatePromoCode = async () => {
    if (!promoInputValue || promoInputValue.trim() === '') {
      setPromoError('Please enter a promo code')
      return
    }

    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4242'
      const res = await fetch(`${backendUrl}/api/promo-codes/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          promoCode: promoInputValue.trim(), 
          productId: id 
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.valid) {
        setPromoError(data.message || 'Invalid promo code')
        setPromoCode(null)
        setFinalPrice(null)
      } else {
        setPromoError('')
        setPromoCode(data.promoCode.code)
        
        // Calculate final price
        const priceNum = parseFloat(product.price)
        let discount = 0
        if (data.promoCode.discountType === 'Percentage') {
          discount = priceNum * (parseFloat(data.promoCode.discountValue) / 100)
        } else {
          discount = parseFloat(data.promoCode.discountValue)
        }
        setFinalPrice((priceNum - discount).toFixed(2))
        setShowPromoInput(false)
        setPromoInputValue('')
      }
    } catch (err) {
      console.error('Promo code error:', err)
      setPromoError('Failed to validate promo code')
      setPromoCode(null)
      setFinalPrice(null)
    }
  }

  const removePromoCode = () => {
    setPromoCode(null)
    setFinalPrice(null)
    setPromoError('')
  }

  // ================= BUY NOW FUNCTION =================
  const buyNow = async (product) => {
    try {
      // Use relative path if on same domain, otherwise use API_URL
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4242'
      const apiUrl = backendUrl.includes(window.location.origin) ? '/api/create-checkout-session' : `${backendUrl}/api/create-checkout-session`
      const token = localStorage.getItem('token')
      
      console.log('Buy Now - API URL:', apiUrl)
      console.log('Buy Now - Current origin:', window.location.origin)
      console.log('Buy Now - Backend URL from env:', backendUrl)
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          productId: product.id,
          finalPrice: finalPrice || product.price
        }),
      })
      
      if (!res.ok) {
        if (res.status === 401) {
          alert('Please login to purchase')
          window.location.href = '/login'
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
  // ====================================================

  /* ================= COMMON FAQ ================= */
  const commonFaq = [
   /* { question: 'What payment methods are accepted?', answer: 'We accept credit cards, debit cards, and PayPal.' },
    { question: 'How long does delivery take?', answer: 'Delivery usually takes 3-7 business days.' },
    { question: 'Can I return the product?', answer: 'Yes, you can return within 15 days of purchase.' }, */
  ]

  /* ================= FETCH PRODUCT ================= */
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4242'
        const res = await fetch(`${backendUrl}/api/products`)
        const data = await res.json()

        // Handle both array and object with records property
        const records = Array.isArray(data) ? data : data.records

        // Find the specific product by ID
        const productData = records.find(r => r.id === id)

        if (!productData) {
          console.error('Product not found:', id)
          return
        }

        let dynamicFaq = []
        if (productData.fields.FAQ) {
          try {
            const parsed = JSON.parse(productData.fields.FAQ)
            if (Array.isArray(parsed)) {
              parsed.forEach(item => {
                if (Array.isArray(item) && item.length === 2) {
                  dynamicFaq.push({ question: item[0], answer: item[1] })
                }
              })
            }
          } catch (err) {
            console.warn('FAQ parsing failed, ignoring Airtable FAQ.', err)
          }
        }

        setProduct({
          id: productData.id,
          name: productData.fields['Name / Title'],
          type: productData.fields.Type,
          price: productData.fields.Price,
          description: productData.fields.Description,
          image: productData.fields['Thumbnail URL'],
          gallery: productData.fields['Gallery Images']
  ? typeof productData.fields['Gallery Images'] === 'string'
    ? productData.fields['Gallery Images'].split(',').map(url => url.trim())
    : Array.isArray(productData.fields['Gallery Images'])
    ? productData.fields['Gallery Images']
    : []
  : [],

          youtube: productData.fields['Youtube Link'] || null,
          faq: [...dynamicFaq, ...commonFaq],
        })
      } catch (err) {
        console.error('Product fetch error:', err)
      }
    }
    fetchProduct()
  }, [id])

  /* ================= SCROLL LISTENER FOR FIXED BUTTON ================= */
  useEffect(() => {
    const handleScroll = () => {
      if (!topBuyRef.current || !footerRef.current) return
      
      const topBuyRect = topBuyRef.current.getBoundingClientRect()
      const footerRect = footerRef.current.getBoundingClientRect()
      
      // Show fixed button when top button is scrolled out of view
      // Hide fixed button when footer is visible
      const topButtonOutOfView = topBuyRect.bottom < 0
      const footerIsVisible = footerRect.top < window.innerHeight
      
      setShowFixedBuy(topButtonOutOfView && !footerIsVisible)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!product)
    return (
      <p className="text-center mt-32 text-xl text-gray-400 animate-pulse">
        Loading product...
      </p>
    )

  return (
    <MainLayout footerRef={footerRef}>
      <div className={`max-w-7xl mx-auto py-16 px-6 space-y-8 ${showFixedBuy ? 'pb-36' : ''}`}>

        {/* ================= HEADER ================= */}
        <div className="md:flex md:items-center md:space-x-12 space-y-8 md:space-y-0">
          <div className="md:w-1/2 flex justify-center">
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="w-full max-w-md rounded-3xl shadow-2xl hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="md:w-1/2 space-y-6 text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
              {product.name}
            </h1>
            
            {/* ================= PRICE DISPLAY ================= */}
            <div className="space-y-3">
              {finalPrice ? (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border-2 border-green-200 shadow-lg">
                  <div className="flex items-baseline justify-center md:justify-start gap-3">
                    <span className="text-2xl text-gray-400 line-through font-medium">
                      ${product.price}
                    </span>
                    <span className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent">
                      ${finalPrice}
                    </span>
                  </div>
                  <div className="mt-2 text-center md:text-left">
                    <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Promo Applied: {promoCode}
                      <button
                        className="ml-2 text-red-500 hover:text-red-700 font-bold"
                        onClick={removePromoCode}
                      >
                        ✕
                      </button>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
                  <span className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                    ${product.price}
                  </span>
                </div>
              )}
            </div>

            {/* ================= PROMO CODE INPUT ================= */}
            {!promoCode && (
              <div className="space-y-2">
                <button
                  className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 text-sm font-medium transition-colors"
                  onClick={() => setShowPromoInput(!showPromoInput)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Have a coupon code?
                </button>

                {showPromoInput && (
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={promoInputValue}
                      onChange={(e) => {
                        setPromoInputValue(e.target.value)
                        setPromoError('')
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          validatePromoCode()
                        }
                      }}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    <button 
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                      onClick={validatePromoCode}
                    >
                      Apply
                    </button>
                  </div>
                )}

                {promoError && (
                  <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {promoError}
                  </div>
                )}
              </div>
            )}

            {/* ================= BUY NOW BUTTON ================= */}
            <div ref={topBuyRef}>
              <Button
                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-10 py-5 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                onClick={() => buyNow(product)}
              >
                <span className="flex items-center justify-center gap-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Buy Now
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* ================= DESCRIPTION ================= */}
        <ReactMarkdown
  components={{
    p: ({ node, ...props }) => (
      <p className="text-gray-700 text-lg md:text-xl leading-relaxed tracking-wide" {...props} />
    ),
    h1: ({ node, ...props }) => <h1 className="text-4xl font-bold my-4" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-3xl font-bold my-3" {...props} />,
    li: ({ node, ...props }) => <li className="ml-6 list-disc" {...props} />,
  }}
>
  {product.description}
</ReactMarkdown>


        {/* ================= YOUTUBE ================= */}
        {product.youtube && (
          <section className="bg-white rounded-3xl shadow-lg p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-2 border-purple-200">
              Video Demo
            </h2>
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-xl">
              <iframe
                className="w-full h-full"
                loading="lazy"
                src={
                  product.youtube.includes('watch?v=')
                    ? product.youtube.replace('watch?v=', 'embed/')
                    : product.youtube
                }
                title={product.name}
                allowFullScreen
              />
            </div>
          </section>
        )}

        {/* ================= GALLERY ================= */}
        {product.gallery.length > 0 && (
          <section className="bg-white rounded-3xl shadow-lg p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-2 border-pink-200">
              Gallery
            </h2>
            <Swiper
              modules={[Pagination, Autoplay]}
              slidesPerView={1}
              pagination={{ clickable: true }}
              autoplay={product.gallery.length > 1 ? { delay: 3000 } : false}
              loop={product.gallery.length > 1}
              className="rounded-2xl overflow-hidden shadow-lg"
            >
              {product.gallery.map((url, idx) => (
                <SwiperSlide key={idx}>
                  <img
                    src={url}
                    alt={`${product.name} ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-96 md:h-[28rem] object-cover rounded-2xl transform hover:scale-105 transition-transform duration-500"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </section>
        )}

        {/* ================= FAQ ================= */}
        {product.faq.length > 0 && (
          <section className="bg-white rounded-3xl shadow-lg p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 border-b pb-2 border-green-200">
              FAQ
            </h2>
            <ul className="space-y-2">
              {product.faq.map((item, idx) => (
                <li
                  key={idx}
                  className="border-b border-gray-200 py-2 cursor-pointer"
                  onClick={() =>
                    setFaqOpenIndex(faqOpenIndex === idx ? null : idx)
                  }
                >
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-lg md:text-xl text-gray-800 font-medium">
                      <span className="mr-3 flex flex-col justify-between h-4 w-4">
                        <span className="block h-[2px] w-full bg-gray-800"></span>
                        <span className="block h-[2px] w-full bg-gray-800"></span>
                        <span className="block h-[2px] w-full bg-gray-800"></span>
                      </span>
                      {item.question}
                    </span>
                    <span className="text-gray-500 text-xl md:text-2xl transform transition-transform duration-200">
                      {faqOpenIndex === idx ? '▲' : '▼'}
                    </span>
                  </div>
                  {faqOpenIndex === idx && (
                    <p className="mt-2 pl-8 text-gray-700 text-base md:text-lg">
                      {item.answer || 'No answer provided.'}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* ================= CONDITIONAL FIXED BOTTOM BUY BUTTON ================= */}
      {showFixedBuy && (
        <div className="fixed bottom-0 left-0 w-full bg-gradient-to-r from-white/98 to-gray-50/98 backdrop-blur-xl border-t-2 border-gray-200 py-4 px-6 flex justify-center z-50 shadow-2xl">
          <div className="w-full max-w-4xl flex items-center justify-between gap-6 bg-white/80 rounded-2xl p-3 shadow-lg">
            {/* Product Image */}
            <div className="flex items-center gap-4 flex-2">
              <img
                src={product.image}
                alt={product.name}
                className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover shadow-md"
              />
              
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-base md:text-lg truncate pr-2">
                  {product.name}
                </h3>
                <div className="flex items-baseline gap-2 mt-1">
                  {finalPrice && (
                    <span className="text-sm text-gray-400 line-through">${product.price}</span>
                  )}
                  <span className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-green-500 to-blue-600 bg-clip-text text-transparent">
                    ${finalPrice || product.price}
                  </span>
                </div>
              </div>
            </div>

            {/* Buy Now Button */}
            <Button
              className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 min-w-[140px]"
              onClick={() => buyNow(product)}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Buy Now
              </span>
            </Button>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
