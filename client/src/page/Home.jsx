import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import TestAPI from "@/components/TestAPI"
import useAccess from "@/features/access/useAccess"
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
  BookOpen,
} from "lucide-react"
import { GiDrop } from "react-icons/gi";

export default function BloodBankWelcome() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { canViewModule: canViewRegistryModule } = useAccess()

  // This capabilities list predates the canonical access-registry module
  // ids and keys tiles by display name — map onto the registry rather than
  // rewriting every tile below.
  const DISPLAY_NAME_TO_REGISTRY_MODULE = {
    Dashboard: 'dashboard',
    Requisition: 'requisition',
    Hospital: 'hospital',
    Camp: 'camp',
    Component: 'component',
    Labs: 'labs',
    Inventory: 'inventory',
    'Master Register': 'donor',
    Appointment: 'appointment',
    Discard: 'discard',
    Admin: 'admin',
    MIS: 'mis',
  }

  const canViewModule = (moduleName) => {
    if (!moduleName) return true
    const registryId = DISPLAY_NAME_TO_REGISTRY_MODULE[moduleName]
    return registryId ? canViewRegistryModule(registryId) : false
  }

  const rawBloodBankCapabilities = [
    {
      category: "Donor & Camp Management",
      icon: Users,
      color: "orange",
      description: "End-to-end management of donors, donations, appointments, and camps.",
      features: [
        {
          icon: Users,
          title: "All Donors",
          desc: "Unified master register of all in-house and camp donors.",
          moduleName: "Master Register",
          link: "/master-register/donors",
        },
        {
          icon: Heart,
          title: "All Donations",
          desc: "Combined master register of all in-house and camp donations.",
          moduleName: "Master Register",
          link: "/master-register/donations",
        },
        {
          icon: Plus,
          title: "Donor Creation",
          desc: "Unified donor registration and donation fitness checks.",
          moduleName: "Master Register",
          link: "/master-register/donor-creation",
        },
        {
          icon: Calendar,
          title: "Donor Appointment",
          desc: "Review public site appointment form submissions.",
          moduleName: "Appointment",
          link: "/appointments/donors",
        },
        {
          icon: Users,
          title: "Camp Registration",
          desc: "Plan and register new blood donation camps.",
          moduleName: "Camp",
          link: "/camp-registration",
        },
        {
          icon: Users,
          title: "Camp List",
          desc: "View all scheduled and completed camps.",
          moduleName: "Camp",
          link: "/camp-listing",
        },
        {
          icon: Users,
          title: "Camp Donors",
          desc: "Manage donors associated with specific camps.",
          moduleName: "Camp",
          link: "/camp-donors",
        },
        {
          icon: Users,
          title: "Camp Donations",
          desc: "Track donations collected at each camp.",
          moduleName: "Camp",
          link: "/camp-donation",
        },
        {
          icon: BarChart3,
          title: "Camp Reports",
          desc: "Analyze camp performance and collection outcomes.",
          moduleName: "Camp",
          link: "/camp-reports",
        },
      ],
    },
    {
      category: "Inventory & Components",
      icon: Droplets,
      color: "red",
      description: "Real-time control of stock, reservations, issues, and components.",
      features: [
        {
          icon: Droplets,
          title: "Inventory Stock",
          desc: "Monitor available units by group, component, and expiry.",
          moduleName: "Inventory",
          link: "/inventory/stock",
        },
        {
          icon: Layers,
          title: "Reserve Units",
          desc: "Reserve blood units for hospitals and critical patients.",
          moduleName: "Inventory",
          link: "/inventory/reserve",
        },
        {
          icon: Activity,
          title: "Issue Units",
          desc: "Issue blood and track utilization in real time.",
          moduleName: "Inventory",
          link: "/inventory/issue",
        },
        {
          icon: Database,
          title: "Components List",
          desc: "View all separated blood components across inventory.",
          moduleName: "Component",
          link: "/component/list",
        },
        {
          icon: Database,
          title: "Separate Components",
          desc: "Process and separate whole blood into components.",
          moduleName: "Component",
          link: "/component/separate",
        },
        {
          icon: AlertTriangle,
          title: "Near-Expiry Components",
          desc: "Identify components nearing expiry for priority usage.",
          moduleName: "Component",
          link: "/component/near-expiry",
        },
        {
          icon: AlertTriangle,
          title: "Near-Expiry Inventory",
          desc: "Monitor near-expiry stock to minimize wastage.",
          moduleName: "Inventory",
          link: "/inventory/near-expiry",
        },
        {
          icon: AlertTriangle,
          title: "Discard List",
          desc: "Review and manage discarded units with reasons and audit.",
          moduleName: "Discard",
          link: "/discard",
        },
      ],
    },
    {
      category: "Hospitals, Labs & Admin",
      icon: Heart,
      color: "blue",
      description: "Hospital mapping, requisitions, laboratory workflows, and admin.",
      features: [
        {
          icon: FileText,
          title: "Add Hospital",
          desc: "Register new hospitals linked to the blood bank.",
          moduleName: "Hospital",
          link: "/hospital/add",
        },
        {
          icon: FileText,
          title: "Hospital List",
          desc: "View and manage all registered hospitals.",
          moduleName: "Hospital",
          link: "/hospital/list",
        },
        {
          icon: FileText,
          title: "Requisition Workflow",
          desc: "Create and process blood requisitions from hospitals.",
          moduleName: "Requisition",
          link: "/requisition",
        },
        {
          icon: FileText,
          title: "Requisition List",
          desc: "Monitor pending, in-progress, and completed requisitions.",
          moduleName: "Requisition",
          link: "/requisition/list",
        },
        {
          icon: Activity,
          title: "TTD Testing",
          desc: "Enter TTD testing results for collected units.",
          moduleName: "Labs",
          link: "/labs/ttd",
        },
        {
          icon: Eye,
          title: "TTD Testing Results",
          desc: "Review finalized TTD testing results and statuses.",
          moduleName: "Labs",
          link: "/labs/ttd-testing",
        },
        {
          icon: Shield,
          title: "User & Role Admin",
          desc: "Manage users, roles, and permissions for the system.",
          moduleName: "Admin",
          link: "/admin/user-manage",
        },
      ],
    },
    {
      category: "Analytics & MIS",
      icon: BarChart3,
      color: "green",
      description: "Dashboards and MIS reports for operational and regulatory insights.",
      features: [
        {
          icon: BarChart3,
          title: "Operations Dashboard",
          desc: "High-level operational view of key blood bank KPIs.",
          moduleName: "Dashboard",
          link: "/dashboard",
        },
        {
          icon: Users,
          title: "Donor MIS",
          desc: "Analytics on donor base, activity, and retention.",
          moduleName: "MIS",
          link: "/mis/donors",
        },
        {
          icon: Heart,
          title: "Donation MIS",
          desc: "Track donation patterns across in-house and camps.",
          moduleName: "MIS",
          link: "/mis/donations",
        },
        {
          icon: Users,
          title: "Camp MIS",
          desc: "Camp-wise KPIs, performance, and rankings.",
          moduleName: "MIS",
          link: "/mis/camps",
        },
        {
          icon: Droplets,
          title: "Bag MIS",
          desc: "Lifecycle analytics for blood bags and processing.",
          moduleName: "MIS",
          link: "/mis/bags",
        },
        {
          icon: Layers,
          title: "Component MIS",
          desc: "Component stock, near-expiry, and utilization analytics.",
          moduleName: "MIS",
          link: "/mis/components",
        },
        {
          icon: Droplets,
          title: "Inventory MIS",
          desc: "Stock, reservations, and utilization analytics.",
          moduleName: "MIS",
          link: "/mis/inventory",
        },
        {
          icon: AlertTriangle,
          title: "Discard MIS",
          desc: "Discard reasons, wastage trends, and compliance.",
          moduleName: "MIS",
          link: "/mis/discards",
        },
        {
          icon: Activity,
          title: "Testing MIS",
          desc: "Testing load, positivity, and quality metrics.",
          moduleName: "MIS",
          link: "/mis/testing",
        },
        {
          icon: Shield,
          title: "Exception MIS",
          desc: "Exception tracking and audit trail analytics.",
          moduleName: "MIS",
          link: "/mis/exceptions",
        },
        {
          icon: Shield,
          title: "Regulatory MIS",
          desc: "Mandatory testing, compliance, and statutory reports.",
          moduleName: "MIS",
          link: "/mis/regulatory",
        },
        {
          icon: Award,
          title: "Executive MIS",
          desc: "Top-level MIS KPIs and regulatory overview.",
          moduleName: "MIS",
          link: "/mis/executive",
        },
      ],
    },
  ]

  const bloodBankCapabilities = rawBloodBankCapabilities
    .map((capability) => ({
      ...capability,
      features: capability.features.filter((feature) => canViewModule(feature.moduleName)),
    }))
    .filter((capability) => capability.features.length > 0)

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
            <div className="mt-6 flex justify-center">
              <Link
                to="/software-guide"
                className="inline-flex items-center gap-2 bg-orange-800 hover:bg-orange-900 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                Software Guide
              </Link>
            </div>
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
                  feature.link ? (
                    <Link
                      key={featureIndex}
                      to={feature.link}
                      className="block group focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white rounded-2xl"
                    >
                      <div className="bg-white border-2 border-orange-100 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-105 hover:border-orange-200 transition-all duration-300 cursor-pointer">
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
                    </Link>
                  ) : (
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
                  )
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
                Secure technology ensuring patient privacy and data security
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
                    Data Privacy Compliance
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
