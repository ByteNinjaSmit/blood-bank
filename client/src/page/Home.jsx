import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import TestAPI from "@/components/TestAPI"
// import SidebarDemo from "@/components/SidebarDemo"
import {
  Users,
  Heart,
  Shield,
  Database,
  Clock,
  Activity,
  UserCheck,
  Edit3,
  Search,
  Filter,
  Plus,
  Eye,
  BarChart3,
  Lock,
  Smartphone,
  Star,
  CheckCircle,
  ArrowRight,
  Layers,
  Zap,
  Target,
  Award,
  Droplets,
  FileText,
  Calendar,
  AlertTriangle,
} from "lucide-react"
import { GiDrop } from "react-icons/gi";

export default function BloodBankWelcome() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const bloodBankCapabilities = [
    {
      category: "Donor Management System",
      icon: Users,
      color: "orange",
      description: "Complete control over donor registration and management",
      features: [
        { icon: Plus, title: "Register Donors", desc: "Add new donors with medical history and eligibility" },
        { icon: Edit3, title: "Update Profiles", desc: "Modify donor information, status, and medical records" },
        { icon: UserCheck, title: "Eligibility Check", desc: "Verify donor eligibility based on medical criteria" },
        { icon: Search, title: "Donor Search", desc: "Find donors by blood type, location, or availability" },
        { icon: Filter, title: "Smart Filtering", desc: "Filter by blood type, donation history, or status" },
        { icon: Calendar, title: "Appointment Scheduling", desc: "Manage donation appointments and reminders" },
      ],
    },
    {
      category: "Blood Inventory Management",
      icon: Droplets,
      color: "red",
      description: "Real-time blood stock monitoring and inventory control",
      features: [
        { icon: Eye, title: "Stock Monitoring", desc: "Track blood units by type, expiry, and availability" },
        { icon: Clock, title: "Expiry Tracking", desc: "Monitor blood unit expiration dates and alerts" },
        { icon: AlertTriangle, title: "Low Stock Alerts", desc: "Automated notifications for critical stock levels" },
        { icon: Database, title: "Batch Management", desc: "Track blood collection batches and testing results" },
        { icon: Activity, title: "Usage Analytics", desc: "Monitor blood usage patterns and demand forecasting" },
        { icon: Layers, title: "Cross-matching", desc: "Manage blood compatibility and cross-matching records" },
      ],
    },
    {
      category: "Medical Administration",
      icon: Heart,
      color: "blue",
      description: "Comprehensive medical records and healthcare management",
      features: [
        { icon: FileText, title: "Medical Records", desc: "Maintain detailed donor and patient medical histories" },
        { icon: Shield, title: "Safety Protocols", desc: "Implement and monitor blood safety procedures" },
        { icon: Activity, title: "Health Screening", desc: "Manage pre-donation health assessments" },
        { icon: Database, title: "Test Results", desc: "Track blood testing results and quality assurance" },
        { icon: UserCheck, title: "Staff Management", desc: "Manage medical staff roles and certifications" },
        { icon: Lock, title: "Privacy Control", desc: "Ensure HIPAA compliance and data protection" },
      ],
    },
    {
      category: "Analytics & Reports",
      icon: BarChart3,
      color: "green",
      description: "Data-driven insights for better blood bank operations",
      features: [
        { icon: Target, title: "Collection Metrics", desc: "Track donation targets and achievement rates" },
        { icon: Star, title: "Donor Analytics", desc: "Analyze donor behavior and retention patterns" },
        { icon: BarChart3, title: "Usage Reports", desc: "Monitor blood distribution and hospital demands" },
        { icon: Clock, title: "Efficiency Tracking", desc: "Measure processing times and operational efficiency" },
        { icon: Zap, title: "Real-time Dashboard", desc: "Live updates on inventory, donors, and operations" },
        { icon: Award, title: "Quality Metrics", desc: "Track quality indicators and compliance scores" },
      ],
    },
  ]

  const quickAccessLinks = [
    { icon: Users, label: "Donor Management", link: "/donors", color: "orange" },
    { icon: Droplets, label: "Blood Inventory", link: "/inventory", color: "red" },
    { icon: Heart, label: "Medical Records", link: "/medical", color: "blue" },
    { icon: BarChart3, label: "Analytics", link: "/analytics", color: "green" },
  ]

  return (
    <div className="min-h-screen bg-white relative overflow-hidden rounded-2xl">
      {/* Decorative Elements */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-orange-100 rounded-full opacity-50"></div>
      <div className="absolute bottom-32 left-16 w-24 h-24 bg-red-100 rounded-full opacity-50"></div>
      <div className="absolute top-1/3 left-8 w-16 h-16 bg-orange-200 rounded-full opacity-30"></div>
      <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-red-200 rounded-full opacity-40"></div>
      <div className="absolute bottom-1/4 right-8 w-12 h-12 bg-orange-300 rounded-full opacity-60"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        
        {/* Header Section */}
        <div
          className={`text-center mb-16 transition-all duration-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-orange-800 rounded-full flex items-center justify-center border-4 border-orange-200 shadow-2xl">
                <GiDrop  className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              {/*changes*/}
              <div className="border-4 border-red-800 text-white text-3xl font-bold rounded-2xl  flex flex-row shadow-2xl">
                <div className="bg-red-800 text-white text-3xl font-bold py-1 px-2 rounded-l-md shadow-2xl">SANJIVANI</div>
                <div className=" text-red-800 text-3xl font-bold py-1 px-2 rounded-md  shadow-2xl">BLOOD BANK</div>
              </div>

            </div>
            <h1 className="text-4xl font-bold text-red-800 mb-4">KOPARGAON</h1>
            <p className="text-gray-600 text-xl max-w-3xl mx-auto leading-relaxed">
              Your comprehensive blood bank management system. Manage donors, track inventory, maintain medical records,
              and oversee all blood bank operations from this powerful administrative platform.
            </p>
          </div>
        </div>

        {/* Blood Bank Capabilities Grid */}
        <div className="space-y-12">
          {bloodBankCapabilities.map((capability, index) => (
            <div
              key={index}
              className={`transition-all duration-1000 delay-${(index + 1) * 200} ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                }`}
            >
              {/* Category Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-orange-800 rounded-2xl p-4 shadow-xl">
                    <capability.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{capability.category}</h2>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">{capability.description}</p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {capability.features.map((feature, featureIndex) => (
                  <div
                    key={featureIndex}
                    className="bg-white border-2 border-orange-100 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-105 hover:border-orange-200 transition-all duration-300 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-orange-100 rounded-xl p-3 group-hover:bg-orange-200 transition-colors duration-300">
                        <feature.icon className="w-6 h-6 text-orange-800" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-800 font-semibold text-lg mb-2">{feature.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Technology & Security Section */}
        <div
          className={`mt-16 transition-all duration-1000 delay-1000 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
        >
          <div className="bg-orange-50 border-2 border-orange-100 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-orange-800 rounded-2xl p-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Built with Medical Excellence</h2>
              <p className="text-gray-600 text-lg">
                HIPAA-compliant technology ensuring patient privacy and data security
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-orange-800 rounded-2xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-gray-800 font-semibold text-xl mb-3">Modern Interface</h3>
                <ul className="text-gray-600 space-y-2 text-sm">
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-800" />
                    Next.js 15 Framework
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-800" />
                    Tailwind CSS Styling
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-800" />
                    Mobile Responsive
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-800" />
                    Accessibility Ready
                  </li>
                </ul>
              </div>

              <div className="text-center">
                <div className="bg-orange-800 rounded-2xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Database className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-gray-800 font-semibold text-xl mb-3">Secure Database</h3>
                <ul className="text-gray-600 space-y-2 text-sm">
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-800" />
                    Encrypted Storage
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-800" />
                    Real-time Sync
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-800" />
                    Automated Backups
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-800" />
                    Data Recovery
                  </li>
                </ul>
              </div>

              <div className="text-center">
                <div className="bg-orange-800 rounded-2xl p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-gray-800 font-semibold text-xl mb-3">Medical-Grade Security</h3>
                <ul className="text-gray-600 space-y-2 text-sm">
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-800" />
                    HIPAA Compliance
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-800" />
                    Role-based Access
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-800" />
                    Audit Trails
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-800" />
                    Data Encryption
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`text-center mt-16 transition-all duration-1000 delay-1200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
        >
          <div className="bg-orange-50 border-2 border-orange-100 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-orange-800 rounded-xl p-3 mr-3">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-gray-800 text-2xl font-bold">LifeSaver Blood Bank System</h3>
            </div>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Empowering healthcare professionals with comprehensive tools for efficient blood bank management. Built
              for reliability, designed for healthcare, secured for patient privacy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
