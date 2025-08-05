import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="py-4 px-6 flex items-center justify-between bg-white shadow-sm">
        <div className="flex items-center">
          <div className="bg-red-500 text-white p-2 rounded-md mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg text-red-600">Sanjivani</h1>
            <p className="text-xs text-gray-500">Blood Bank Management</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Login</Link>
          <Link to="/donor">
            <Button className="bg-red-500 hover:bg-red-600 text-white text-sm">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6 md:px-12 lg:px-24 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-6">
            ⚕️ Modern Blood Bank Management
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-red-600">Revolutionizing</span> <span className="text-purple-700">Blood Bank</span> <span className="text-blue-700">Operations</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamline your blood bank operations with our comprehensive management system.
            From donor registration to hospital requests, manage everything efficiently with real-time tracking.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/dashboard">
              <Button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-md">
                Explore Dashboard
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </Link>
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 px-6 py-3 rounded-md">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-6 md:px-12 lg:px-24 grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
        <div className="text-center">
          <h3 className="text-4xl font-bold text-red-500 mb-1">2,500+</h3>
          <p className="text-sm text-gray-600">Registered Donors</p>
        </div>
        <div className="text-center">
          <h3 className="text-4xl font-bold text-red-500 mb-1">1,200+</h3>
          <p className="text-sm text-gray-600">Blood Units Managed</p>
        </div>
        <div className="text-center">
          <h3 className="text-4xl font-bold text-red-500 mb-1">98%</h3>
          <p className="text-sm text-gray-600">Success Rate</p>
        </div>
        <div className="text-center">
          <h3 className="text-4xl font-bold text-red-500 mb-1">24/7</h3>
          <p className="text-sm text-gray-600">System Availability</p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 md:px-12 lg:px-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Comprehensive Blood Bank Solution</h2>
          <p className="text-center text-gray-600 mb-16 max-w-3xl mx-auto">Everything you need to manage a modern blood bank efficiently and safely</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="bg-red-100 text-red-600 p-3 rounded-lg inline-block mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Donor Management</h3>
                <p className="text-gray-600 text-sm">Complete donor registration, tracking, and management system with barcode generation.</p>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="bg-red-100 text-red-600 p-3 rounded-lg inline-block mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Real-time Inventory</h3>
                <p className="text-gray-600 text-sm">Live blood inventory tracking with expiry monitoring and automated alerts.</p>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="bg-red-100 text-red-600 p-3 rounded-lg inline-block mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Lab Integration</h3>
                <p className="text-gray-600 text-sm">Seamless lab testing workflow with component separation and quality control.</p>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="bg-red-100 text-red-600 p-3 rounded-lg inline-block mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Request Management</h3>
                <p className="text-gray-600 text-sm">Efficient hospital request processing with automatic matching and approval.</p>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="bg-red-100 text-red-600 p-3 rounded-lg inline-block mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Analytics & Reports</h3>
                <p className="text-gray-600 text-sm">Comprehensive reporting system with detailed analytics and insights.</p>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="bg-red-100 text-red-600 p-3 rounded-lg inline-block mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Quality Assurance</h3>
                <p className="text-gray-600 text-sm">End-to-end traceability with complete audit trails and compliance tracking.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 md:px-12 lg:px-24 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Blood Bank?</h2>
          <p className="text-gray-600 mb-8">Join hospitals and blood banks worldwide in modernizing their operations</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-md">
              Start Free Trial
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Button>
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 px-6 py-3 rounded-md">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-4">
            <div className="bg-red-500 text-white p-1 rounded-md mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-800">Sanjivani BBMS</h3>
              <p className="text-xs text-gray-500">Saving lives through technology</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">© 2024 Sanjivani Blood Bank Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage