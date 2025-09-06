import React from 'react'
import { Phone, Mail, Facebook, Instagram, Linkedin } from 'lucide-react'

const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-gradient-to-br from-blue-900 to-blue-800 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="text-xl font-bold text-white mb-4">Accredited Financial Services</div>
            <p className="mb-4">Helping individuals and families improve their credit scores and achieve financial freedom since 2018.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white transition-colors"><Facebook size={20} /></a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors"><Linkedin size={20} /></a>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#benefits" className="hover:text-white transition-colors">Why Choose Us</a></li>
              <li><a href="#testimonials" className="hover:text-white transition-colors">Success Stories</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#booking" className="hover:text-white transition-colors">Book Consultation</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start"><Phone className="h-5 w-5 mr-3 mt-0.5" /> <span>(602) 555-1234</span></li>
              <li className="flex items-start"><Mail className="h-5 w-5 mr-3 mt-0.5" /> <span>info@accreditedfinancial.com</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-blue-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">&copy; {new Date().getFullYear()} Accredited Financial Services. All rights reserved.</div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-[#f0d541] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#f0d541] transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
export default Footer
