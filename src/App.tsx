import React from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Services from './components/Services'
import PricingSection from './components/PricingSection'
import EmailSubscription from './components/EmailSubscription'
import Benefits from './components/Benefits'
import Testimonials from './components/Testimonials'
import About from './components/About'
import BookingCTA from './components/BookingCTA'
import Footer from './components/Footer'

export function App() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-white">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Services />
        <PricingSection />
        <EmailSubscription />
        <Benefits />
        <Testimonials />
        <About />
        <BookingCTA />
      </main>
      <Footer />
    </div>
  )
}
