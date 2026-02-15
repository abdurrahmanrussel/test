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

  const topBuyRef = useRef(null)

  // Check for promo code from navigation state
  useEffect(() => {
    if (location.state?.promoCode && location.state?.finalPrice) {
      setPromoCode(location.state.promoCode)
      setFinalPrice(location.state.finalPrice)
    }
  }, [location])

  // ================= BUY NOW FUNCTION =================
  const buyNow = async (product) => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4242'
      const token = localStorage.getItem('token')
      
      const res = await fetch(`${backendUrl}/api/create-checkout-session`, {
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
      if (!topBuyRef.current) return
      const rect = topBuyRef.current.getBoundingClientRect()
      setShowFixedBuy(rect.bottom < 0)
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
    <MainLayout>
      <div className="max-w-7xl mx-auto py-16 px-6 space-y-8 pb-36">

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
            {finalPrice ? (
              <div className="flex items-baseline gap-3">
                <p className="text-2xl text-gray-400 line-through">${product.price}</p>
                <p className="text-4xl md:text-5xl font-bold text-gradient bg-clip-text text-transparent from-green-400 to-blue-500">
                  ${finalPrice}
                </p>
              </div>
            ) : (
              <p className="text-4xl md:text-5xl font-bold text-gradient bg-clip-text text-transparent from-green-400 to-blue-500">
                ${product.price}
              </p>
            )}
            
            {promoCode && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-green-600 font-medium">✓ Promo code applied: {promoCode}</span>
              </div>
            )}

            {/* ================= TOP BUY NOW BUTTON ================= */}
            <div ref={topBuyRef}>
              <Button
                className="bg-gradient-to-r from-blue-500 to-green-400 text-white px-10 py-4 text-xl rounded-xl shadow-lg hover:scale-105 transform transition duration-300"
                onClick={() => buyNow(product)}
              >
                Buy Now
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
        <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 py-4 px-6 flex justify-center z-50 shadow-lg">
          <Button
            className="w-full max-w-xl md:w-auto bg-gradient-to-r from-blue-500 to-green-400 text-white px-10 py-4 text-xl rounded-xl shadow-lg hover:scale-105 transform transition duration-300"
            onClick={() => buyNow(product)}
          >
            Buy Now
          </Button>
        </div>
      )}
    </MainLayout>
  )
}
