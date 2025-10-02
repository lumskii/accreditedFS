import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
const Hero = React.lazy(() => import('./components/Hero'))
const Services = React.lazy(() => import('./components/Services'))
const PricingSection = React.lazy(() => import('./components/PricingSection'))
const EmailSubscription = React.lazy(() => import('./components/EmailSubscription'))
const Benefits = React.lazy(() => import('./components/Benefits'))
const Testimonials = React.lazy(() => import('./components/Testimonials'))
const About = React.lazy(() => import('./components/About'))
const BookingCTA = React.lazy(() => import('./components/BookingCTA'))
import Footer from './components/Footer'
import Signup from './pages/Signup'
import Agreement from './pages/Agreement'
import Success from './components/Success'
import Cancel from './components/Cancel'
import Checkout from './pages/Checkout'

const Home: React.FC = () => (
  <main className="flex-grow">
    <Suspense fallback={<div className="py-12">Loading…</div>}>
      <Hero />
      <Services />
      <PricingSection />
      <EmailSubscription />
      <Benefits />
      <Testimonials />
      <About />
      <BookingCTA />
    </Suspense>
  </main>
)

export function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen w-full bg-white">
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/agreement" element={<Agreement />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/success" element={<Success />} />
          <Route path="/cancel" element={<Cancel />} />
        </Routes>

        <Footer />
      </div>
    </BrowserRouter>
  )
}
