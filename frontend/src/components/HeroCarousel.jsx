import React, { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

const HeroCarousel = () => {
  const [slides, setSlides] = useState([])

  useEffect(() => {
    const fetchHeroProducts = async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4242'
        const res = await fetch(`${backendUrl}/api/products`)

        const data = await res.json()

        // Handle both array and object with records property
        const records = Array.isArray(data) ? data : data.records

        const formattedSlides = records
          .slice(2, 5) // ONLY 3 slides
          .map((r) => ({
            image: r.fields['Thumbnail URL'],
            title: r.fields['Name / Title'],
          }))
          .filter((s) => s.image)

        setSlides(formattedSlides)
      } catch (err) {
        console.error('HeroCarousel fetch error:', err)
      }
    }

    fetchHeroProducts()
  }, [])

  if (slides.length === 0) return null

  return (
    <Swiper
      modules={[Autoplay, Pagination]}
      autoplay={{ delay: 3000, disableOnInteraction: false }}
      pagination={{ clickable: true }}
      loop={slides.length > 1}
      className="h-80 md:h-[28rem] rounded-2xl shadow-2xl overflow-hidden"
    >
      {slides.map((slide, i) => (
        <SwiperSlide key={i}>
          <div className="relative w-full h-full">
            <img
              src={slide.image}
              alt={slide.title}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-black/40 flex items-center justify-center px-6">
              <h2 className="text-3xl md:text-5xl font-bold text-white text-center drop-shadow-lg">
                {slide.title}
              </h2>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  )
}

export default HeroCarousel
