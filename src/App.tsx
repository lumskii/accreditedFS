import React, { Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
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
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import AdminSetup from './pages/AdminSetup'
import AdminDashboard from './pages/AdminDashboard'
import Agreement from './pages/Agreement'
import Success from './components/Success'
import Cancel from './components/Cancel'
import Checkout from './pages/Checkout'
import Verify from './pages/Verify'
import VerifyEmail from './pages/VerifyEmail'
import PaymentMode from './pages/PaymentMode'
import Dashboard from './pages/Dashboard'

const Home: React.FC = () => (
  <main className="flex-grow" id="main-content">
    <Suspense fallback={
      <div className="py-12 flex items-center justify-center" role="status" aria-label="Loading content">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800"></div>
        <span className="sr-only">Loading...</span>
      </div>
    }>
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
        {/* Skip Navigation Link */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-blue-800 text-white p-2 rounded-br-md z-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          Skip to main content
        </a>
        
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/payment-mode" element={<PaymentMode />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          
          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/setup" element={<AdminSetup />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          
          <Route 
            path="/agreement" 
            element={
              <ProtectedRoute requireEmailVerification={true} requireAgreement={false}>
                <Agreement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/checkout" 
            element={
              <ProtectedRoute requireEmailVerification={true} requireAgreement={false}>
                <Checkout />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/success" 
            element={
              <ProtectedRoute requireEmailVerification={true} requireAgreement={true}>
                <Success />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cancel" 
            element={
              <ProtectedRoute requireEmailVerification={true} requireAgreement={true}>
                <Cancel />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requireEmailVerification={true} requireAgreement={true}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>

        <Footer />
      </div>
    </BrowserRouter>
  )
}
