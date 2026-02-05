import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Button from './components/Button'
import HeroCarousel from './components/HeroCarousel'
import FloatingChatbot from './components/FloatingChatbot';

import 'swiper/css'
import 'swiper/css/pagination'

function App() {
  const navigate = useNavigate()
  const [indicators, setIndicators] = useState([])
  const [strategies, setStrategies] = useState([])

  const [indicatorsToShow, setIndicatorsToShow] = useState(3)
  const [strategiesToShow, setStrategiesToShow] = useState(3)

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
        }))

        setIndicators(formatted.filter((p) => p.type === 'Indicator'))
        setStrategies(formatted.filter((p) => p.type === 'Strategy'))
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
  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4242'
    const res = await fetch(`${backendUrl}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id }),
    })

    const data = await res.json()
    console.log('Checkout Response:', data)
    window.location.href = data.url
  } catch (err) {
    console.error('Checkout error:', err)
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
              <p className="text-slate-500">${p.price}</p>

              <div className="flex gap-3 mt-4">
                <Button onClick={() => navigate(`/product/${p.id}`)}>
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

      {/*<section ref={indicatorsRef} className="py-32 bg-slate-50" id="products">
        <h2 className="text-5xl text-center mb-20">Indicators</h2>
        {renderProducts(indicators, indicatorsToShow, setIndicatorsToShow)}
      </section>*/}

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
