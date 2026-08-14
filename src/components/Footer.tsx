import React from 'react'
import { Link } from 'react-router-dom'
import { Phone, Mail, Facebook, Instagram, Linkedin, MapPinIcon } from 'lucide-react'

const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-gradient-to-br from-blue-900 to-blue-800 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="text-xl font-bold text-white mb-4">Accredited Financial Services</div>
            <p className="mb-4">Helping individuals and families improve their credit scores and achieve financial freedom since 2018. Professional credit repair services with a 90-day money-back guarantee.</p>
            <p className="mb-4 text-sm">Serving residents with expert credit repair, dispute resolution, and financial education services.</p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/people/Accredited-FS/61582643819470/" className="text-gray-300 hover:text-white transition-colors" aria-label="Follow us on Facebook"><Facebook size={20} /></a>
              <a href="https://www.linkedin.com/company/accreditedfs/" className="text-gray-300 hover:text-white transition-colors" aria-label="Connect with us on LinkedIn"><Linkedin size={20} /></a>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Credit Repair Services</h3>
            <ul className="space-y-2">
              <li><a href="#services" className="hover:text-white transition-colors">Credit Services</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Credit Repair Pricing</a></li>
              <li><a href="#benefits" className="hover:text-white transition-colors">Why Choose Our Services</a></li>
              <li><a href="#testimonials" className="hover:text-white transition-colors">Client Success Stories</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#booking" className="hover:text-white transition-colors">Free Consultation</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact Arizona Office</h3>
            <ul className="space-y-3">
              <li className="flex items-start"><Phone className="h-5 w-5 mr-3 mt-0.5" /> <span>(928) 320-7474</span></li>
              <li className="flex items-start"><Mail className="h-5 w-5 mr-3 mt-0.5" /> <span>info@accreditedfs.com</span></li>
              <li className="flex items-start"><MapPinIcon className="h-5 w-5 mr-3 mt-0.5" /> <span>101 N Colorado St, #131 <br /> Chandler, AZ 85244</span></li>
              <li className="text-sm">
                <strong>Service Area:</strong><br />
                {/* Nation wide<br /> */}
                Phoenix, Mesa, Chandler, Tempe, Scottsdale<br />
                & surrounding areas in Arizona
              </li>
              <li className="text-sm">
                <strong>Business Hours:</strong><br />
                Monday - Friday: 10:00 AM - 6:00 PM MST
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-blue-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">&copy; {new Date().getFullYear()} Accredited Financial Services - Arizona Credit Repair Specialists. All rights reserved.</div>
          <div className="flex space-x-6">
            <Link to="/privacy" className="hover:text-[#f0d541] transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#f0d541] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
export default Footer
