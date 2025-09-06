import React, { useState } from 'react'
import { Menu, X } from 'lucide-react'

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="text-xl font-bold text-blue-800">
              Accredited Financial Services
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#services" className="text-gray-700 hover:text-blue-800 transition-colors">Services</a>
            <a href="#pricing" className="text-gray-700 hover:text-blue-800 transition-colors">Pricing</a>
            <a href="#benefits" className="text-gray-700 hover:text-blue-800 transition-colors">Why Choose Us</a>
            <a href="#testimonials" className="text-gray-700 hover:text-blue-800 transition-colors">Success Stories</a>
            <a href="#about" className="text-gray-700 hover:text-blue-800 transition-colors">About Us</a>
            <a href="#booking" className="bg-[#f0d541] text-blue-800 px-4 py-2 rounded-md hover:bg-[#e6cb3d] transition-colors font-medium">Book Consultation</a>
          </div>
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg rounded-b-md">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#services" className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-800 rounded-md" onClick={() => setIsMenuOpen(false)}>Services</a>
            <a href="#pricing" className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-800 rounded-md" onClick={() => setIsMenuOpen(false)}>Pricing</a>
            <a href="#benefits" className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-800 rounded-md" onClick={() => setIsMenuOpen(false)}>Why Choose Us</a>
            <a href="#testimonials" className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-800 rounded-md" onClick={() => setIsMenuOpen(false)}>Success Stories</a>
            <a href="#about" className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-800 rounded-md" onClick={() => setIsMenuOpen(false)}>About Us</a>
            <a href="#booking" className="block px-3 py-2 bg-[#f0d541] text-blue-800 font-medium rounded-md" onClick={() => setIsMenuOpen(false)}>Book Consultation</a>
          </div>
        </div>
      )}
    </nav>
  )
}
export default Navbar
