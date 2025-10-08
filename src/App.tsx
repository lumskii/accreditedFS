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
