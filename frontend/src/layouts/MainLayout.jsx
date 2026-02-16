import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function MainLayout({ children, showAllProducts, footerRef }) {
  return (
    <>
      <Navbar showAllProducts={showAllProducts} />
      <main>{children}</main>
      <Footer footerRef={footerRef} />
    </>
  )
}
