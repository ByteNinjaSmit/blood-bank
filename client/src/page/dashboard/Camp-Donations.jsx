import React from "react"
import { useState } from "react"
import { Users, Plus, Droplets, ArrowLeft, UserPlus, Activity } from "lucide-react"
import CreateDonor from "../../components/camp/Create-Donor"
import CreateDonation from "../../components/camp/Create-Donation"
import ViewDonor from "../../components/camp/View-Donor"
import ViewDonations from "../../components/camp/View-Donations"


const CampDonations = () => {
    const [activeView, setActiveView] = useState("hub")

    const facilities = [
        {
            id: "create-donor",
            title: "Create Donor",
            description: "Register new blood donors with complete medical and personal information",
            icon: UserPlus,
            color: "from-orange-800 to-orange-600",
            stats: "2,847 Total Donors",
        },
        {
            id: "view-donor",
            title: "View Donors",
            description: "Browse, search, and manage existing donor records and history",
            icon: Users,
            color: "bg-orange-800",
            stats: "156 Active This Month",
        },
        {
            id: "create-donation",
            title: "Create Donation",
            description: "Record new blood donations with vitals, tests, and bag information",
            icon: Plus,
            color: "bg-orange-800",
            stats: "1,234 Total Donations",
        },
        {
            id: "view-donations",
            title: "View Donations",
            description: "Manage donation records, track status, and view test results",
            icon: Activity,
            color: "bg-orange-800",
            stats: "89 This Week",
        },
    ]

    const handleFacilityClick = (facilityId) => {
        setActiveView(facilityId)
    }

    const handleBack = () => {
        setActiveView("hub")
    }

    if (activeView === "create-donor") {
        return <CreateDonor onBack={handleBack} />
    }

    if (activeView === "create-donation") {
        return <CreateDonation onBack={handleBack} onCreateDonor={() => setActiveView("create-donor")} />
    }

    if (activeView === "view-donor") {
        return <ViewDonor onBack={handleBack} />
    }

    if (activeView === "view-donations") {
        return <ViewDonations onBack={handleBack} />
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="bg-white border-b border-orange-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 ">
                    <button
                        className="flex items-center cursor-pointer gap-3 text-orange-800 border border-orange-200 hover:bg-orange-50 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-xl px-6 py-3 mb-6 h-11"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Camp
                    </button>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-gradient-to-br from-orange-800 to-orange-900 rounded-xl">
                            <Droplets className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Donor & Donation Management</h1>
                            <p className="text-gray-600 mt-1">Comprehensive blood bank donor and donation management system</p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Management Facilities</h2>
                    <p className="text-gray-600">Choose a facility to manage donors and donations efficiently</p>
                </div> */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {facilities.map((facility) => {
                        const IconComponent = facility.icon
                        return (
                            <div
                                key={facility.id}
                                onClick={() => handleFacilityClick(facility.id)}
                                className="group cursor-pointer bg-white rounded-2xl border border-gray-200 transition-transform duration-700 hover:shadow-xl hover:shadow-orange-100 overflow-hidden"
                            >
                                <div className="p-8">
                                    <div className="flex items-start justify-between mb-6">
                                        <div
                                            className={`p-4 bg-orange-800 rounded-xl group-hover:scale-110 transition-transform duration-700`}
                                        >
                                            <IconComponent className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Current</p>
                                            <p className="text-lg font-semibold text-orange-800">{facility.stats}</p>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-800 transition-colors">
                                        {facility.title}
                                    </h3>
                                    <p className="text-gray-600 mb-6 leading-relaxed">{facility.description}</p>

                                    <div className="flex items-center text-orange-800 font-medium group-hover:text-orange-700 transition-colors">
                                        <span>Access Facility</span>
                                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>

                            </div>
                        )
                    })}
                </div>

                {/* Additional Info */}
                <div className="mt-16 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 border border-orange-200">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-800 to-orange-900 rounded-full mb-4">
                            <Droplets className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Medical-Grade Security</h3>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            All donor and donation data is protected with HIPAA-compliant security measures, ensuring complete privacy
                            and regulatory compliance for your blood bank operations.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CampDonations
