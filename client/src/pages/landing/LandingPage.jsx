import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'

function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-red-50 to-red-100 p-4">
      <div className="max-w-5xl w-full space-y-12 text-center">
        {/* Hero Section */}
        <div className="space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-red-600">Sanjivani Blood Bank</h1>
          <p className="text-xl md:text-2xl text-gray-700">Connecting donors with those in need, saving lives one donation at a time.</p>
          
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white">
              <Link to="/donor">Become a Donor</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-red-600 text-red-600 hover:bg-red-50">
              <Link to="/dashboard">Access Dashboard</Link>
            </Button>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-red-200 bg-white/50 backdrop-blur-sm">
            <CardContent className="pt-6 text-center">
              <div className="rounded-full bg-red-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Donate Blood</h3>
              <p className="text-gray-600">Your donation can save up to three lives. Schedule an appointment today.</p>
            </CardContent>
          </Card>
          
          <Card className="border-red-200 bg-white/50 backdrop-blur-sm">
            <CardContent className="pt-6 text-center">
              <div className="rounded-full bg-red-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Request Blood</h3>
              <p className="text-gray-600">Hospitals and clinics can request blood units through our streamlined process.</p>
            </CardContent>
          </Card>
          
          <Card className="border-red-200 bg-white/50 backdrop-blur-sm">
            <CardContent className="pt-6 text-center">
              <div className="rounded-full bg-red-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Learn More</h3>
              <p className="text-gray-600">Discover how blood donation works and why it's so important.</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Stats Section */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 text-red-600">Our Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-4xl font-bold text-red-600">1,200+</p>
              <p className="text-gray-600">Regular Donors</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-red-600">5,000+</p>
              <p className="text-gray-600">Lives Saved</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-red-600">24/7</p>
              <p className="text-gray-600">Emergency Support</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-12 text-center text-gray-600">
        <p>© 2023 Sanjivani Blood Bank. All rights reserved.</p>
        <p className="mt-2">
          <Link to="/dashboard" className="text-red-600 hover:underline">Staff Login</Link>
        </p>
      </footer>
    </div>
  )
}

export default LandingPage