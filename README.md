# 🏦 Accredited Financial Services

**Professional Credit Repair Services Platform for Arizona Residents**

A comprehensive web application built with modern technologies to provide credit repair services, client management, and business operations for Accredited Financial Services.

## 🌐 Live Demo

**Production Site**: [https://accreditedfs.web.app](https://accreditedfs.web.app)  
**Custom Domain**: [https://accreditedfs.com](https://accreditedfs.com)

---

## 🚀 Technology Stack

### **Frontend Framework**
- **React 18** with TypeScript for component-based UI development
- **Vite** as build tool and development server for fast builds and HMR
- **React Router DOM** for client-side routing and navigation
- **Tailwind CSS** for utility-first styling and responsive design

### **Backend & Database**
- **Firebase Realtime Database** for user data, plans, and disputes
- **Firebase Authentication** for secure user registration and login
- **Firebase Hosting** for fast, global CDN deployment
- **Vercel Serverless Functions** for payment processing and webhooks

### **Payment Processing**
- **Stripe Integration** for secure payment processing
- **Stripe Checkout** for subscription management
- **Webhook handling** for payment confirmations and plan updates

### **UI Components & Icons**
- **Lucide React** for modern, customizable icons
- **Custom Components** for consistent design system
- **Responsive Design** optimized for mobile, tablet, and desktop

### **Email & Communication**
- **EmailJS** for contact forms and client communication
- **Automated email responses** for booking confirmations

### **Development Tools**
- **TypeScript** for type safety and better developer experience
- **ESLint & Prettier** for code quality and formatting
- **Git** for version control with GitHub integration

---

## 🏗️ Architecture & Features

### **Client-Side Application**
```
src/
├── components/          # Reusable UI components
│   ├── Hero.tsx        # Landing section with CTA
│   ├── Services.tsx    # Service offerings display
│   ├── PricingSection.tsx # Subscription plans
│   ├── Navbar.tsx      # Navigation with authentication
│   ├── Footer.tsx      # Contact information
│   ├── BookingCTA.tsx  # Consultation booking form
│   └── ...
├── pages/              # Route components
│   ├── Dashboard.tsx   # Client portal
│   ├── AdminDashboard.tsx # Admin management
│   ├── Login.tsx       # Authentication
│   └── ...
├── firebase.ts         # Firebase configuration
└── App.tsx            # Main application component
```

### **Key Features Implemented**

#### **🎯 Business Features**
- **Service Showcase** - Professional credit repair services display
- **Pricing Plans** - Three-tier subscription model (Credit Refresh, Credit Rebuild, Couples Advantage)
- **Consultation Booking** - Integrated scheduling system with EmailJS
- **Client Portal** - Secure dashboard for registered users
- **Admin Panel** - Administrative tools for dispute management

#### **🔐 Authentication & Security**
- **Firebase Authentication** - Secure user registration and login
- **Email Verification** - Required before dashboard access
- **Role-Based Access** - Admin and client user roles
- **Protected Routes** - Authentication-required pages
- **Plan-Based Access** - Features locked behind subscription plans

#### **💳 Payment Integration**
- **Stripe Checkout** - Secure payment processing
- **Subscription Management** - Recurring billing support
- **Webhook Integration** - Real-time payment confirmations
- **Plan Activation** - Automatic feature unlocking after payment

#### **📱 User Experience**
- **Responsive Design** - Mobile-first approach
- **Smooth Scrolling** - Enhanced navigation experience
- **Loading States** - User feedback during async operations
- **Form Validation** - Client-side and server-side validation
- **Error Handling** - Comprehensive error management

---

## 🎨 SEO & Performance Optimizations

### **Search Engine Optimization**
- **Comprehensive Meta Tags** - Title, description, keywords optimized for Arizona credit repair
- **Open Graph Integration** - Social media sharing optimization
- **Structured Data (JSON-LD)** - LocalBusiness schema for better search visibility
- **XML Sitemap** - Complete site structure mapping for search engines
- **Robots.txt** - Search engine crawling directives
- **Canonical URLs** - Duplicate content prevention

### **Performance Enhancements**
- **Image Optimization** - Lazy loading, proper sizing, and modern formats
- **Code Splitting** - Dynamic imports and vendor chunking for faster loads
- **Resource Preloading** - Critical assets preloaded for better performance
- **Build Optimization** - Terser minification and tree shaking
- **Bundle Analysis** - Optimized chunk sizes for better caching

### **Accessibility Features**
- **WCAG Compliance** - Web Content Accessibility Guidelines adherence
- **Keyboard Navigation** - Full keyboard accessibility support
- **Screen Reader Support** - ARIA labels and semantic HTML
- **Focus Management** - Visible focus indicators and skip links
- **Reduced Motion** - Respects user preferences for animations

---

## 🛠️ Development Setup

### **Prerequisites**
- Node.js 18+ and npm
- Firebase account with project setup
- Stripe account for payment processing
- EmailJS account for contact forms

### **Environment Variables**
Create a `.env.local` file with the following configuration:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXX
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_TEMPLATE_ID_REPLY=your_reply_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
VITE_BOOKING_RECIPIENT=info@accreditedfs.com

# API Configuration
VITE_API_PROXY_TARGET=https://accreditedfs.vercel.app
```

### **Installation & Development**

```bash
# Clone the repository
git clone https://github.com/lumskii/accreditedFS.git
cd accreditedFS

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

---

## 🚀 Deployment Pipeline

### **Firebase Hosting**
- **Automatic builds** via Vite production optimization
- **Global CDN** for fast worldwide content delivery
- **SSL certificates** automatically managed
- **Custom domain** support with proper redirects

### **Domain Configuration**
- **Primary Domain**: accreditedfs.com
- **Firebase Domain**: accreditedfs.web.app
- **Redirect Rules**: www to non-www redirect configured
- **SSL/TLS**: Automatic HTTPS enforcement

---

## 📊 Business Logic & Data Flow

### **User Journey**
1. **Landing Page** - Arizona-focused credit repair services showcase
2. **Service Selection** - Three-tier pricing with detailed feature comparison
3. **Registration** - Email-based account creation with verification
4. **Plan Purchase** - Stripe Checkout integration with webhook confirmation
5. **Dashboard Access** - Client portal with dispute tracking and resources
6. **Admin Management** - Backend administrative tools for client support

### **Database Structure**
```
Firebase Realtime Database:
├── users/
│   ├── {userId}/
│   │   ├── profile/          # User information
│   │   ├── flow/            # Payment and plan status
│   │   ├── agreement/       # Terms acceptance
│   │   ├── disputes/        # Credit repair cases
│   │   └── roles/           # Admin permissions
└── disputes/               # Global dispute tracking
```

---

## 🎯 Recent Implementations

### **Performance & Accessibility Improvements (Latest)**
- **Lighthouse Score Optimization** - Performance and accessibility enhancements
- **Image Loading Optimization** - Lazy loading and proper sizing attributes
- **Focus Management** - Enhanced keyboard navigation and screen reader support
- **Build Process Optimization** - Terser minification and vendor chunking

### **Navigation Enhancement**
- **Scroll Offset Fix** - Proper positioning when clicking navigation links
- **Smooth Scrolling** - Enhanced user experience with CSS scroll behavior
- **Mobile Menu** - Improved accessibility with ARIA attributes

### **SEO Overhaul**
- **Arizona-Specific Optimization** - Local SEO for Arizona credit repair services
- **Technical SEO** - Complete meta tags, structured data, and sitemap implementation
- **Content Optimization** - Keyword-rich content throughout all sections

---

## 🔧 Build Configuration

### **Vite Configuration**
```typescript
// vite.config.ts highlights
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor.firebase': ['firebase'],
          'vendor.react': ['react', 'react-dom'],
          'vendor.stripe': ['stripe'],
          // ... optimized chunking strategy
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
})
```

### **Tailwind Configuration**
- **Custom color palette** matching brand identity
- **Responsive breakpoints** for optimal device support
- **Component utilities** for consistent styling

---

## 📈 Business Impact

### **SEO Performance**
- **Target Keywords**: "Arizona credit repair", "credit repair services", "improve credit score"
- **Local SEO**: Phoenix, Tucson, Mesa, and Arizona statewide targeting
- **Structured Data**: LocalBusiness schema for enhanced search visibility

### **User Experience Metrics**
- **Mobile Responsive**: Optimized for 320px to 1920px+ screens
- **Performance**: Lighthouse scores optimized for 90+ in all categories
- **Accessibility**: WCAG 2.1 AA compliance for inclusive user experience

### **Conversion Optimization**
- **Clear CTAs**: Strategically placed consultation booking buttons
- **Trust Signals**: 90-day money-back guarantee prominently displayed
- **Social Proof**: Client testimonials and success stories

---

## 🤝 Contributing

This is a production business website. For inquiries about the codebase or business services, contact:

**Email**: info@accreditedfs.com  
**Website**: [https://accreditedfs.com](https://accreditedfs.com)

---

## 📄 License

© 2025 Accredited Financial Services. All rights reserved.

This project contains proprietary business code and assets. Unauthorized reproduction or distribution is prohibited.
