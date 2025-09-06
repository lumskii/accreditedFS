import React from 'react'

const About: React.FC = () => {
  return (
    <section id="about" className="py-16 bg-gradient-to-b from-white to-[#f8f8f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-12">
            <img src="https://images.unsplash.com/photo-1556741533-6e6a62bd8b49?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80" alt="Accredited Financial Services Team" className="rounded-lg shadow-lg w-full" />
          </div>
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">About Accredited Financial Services</h2>
            <p className="text-gray-600 mb-6">Founded in 2010, Accredited Financial Services (AFS) has been helping individuals and families throughout the country improve their credit scores and achieve financial freedom. Our team of credit experts has over 30 years of combined experience in credit repair, financial planning, and consumer advocacy.</p>
            <p className="text-gray-600 mb-6">We believe that everyone deserves a second chance at financial success. Our mission is to empower our clients with the knowledge and tools they need to improve their credit scores and maintain good credit for life.</p>
            <p className="text-gray-600 mb-6">What sets us apart is our personalized approach. We don't just offer a standard solution – we take the time to understand your unique financial situation and create a customized plan that addresses your specific needs and goals.</p>
            <div className="flex space-x-4">
              <a href="#booking" className="bg-[#f0d541] text-blue-800 font-semibold px-6 py-3 rounded-md hover:bg-[#e6cb3d] transition-colors">Schedule a Consultation</a>
              <a href="#contact" className="bg-white text-gray-800 font-semibold px-6 py-3 rounded-md border border-gray-300 hover:bg-gray-100 transition-colors">Contact Us</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
export default About
