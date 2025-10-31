import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Phone, Mail, Users, Calendar, Droplets, Plus, Activity } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '@/components/shared/Button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useCamp } from '@/hooks/useCamp';
import EnhancedLoader from '@/components/utils/Spinner';

const CampDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getCampById, loading, error } = useCamp();
  const [camp, setCamp] = useState(null);

  const campId = searchParams.get('id');

  useEffect(() => {
    if (!campId) {
      navigate('/camp-listing');
      return;
    }
    fetchCampDetails(campId);
  }, [campId, navigate]);

  const fetchCampDetails = async (id) => {
    const result = await getCampById(id);
    if (result.success) {
      setCamp(result.data);
    }
  };

  const handleFacilityClick = (facilityType) => {
    switch (facilityType) {
      case 'view-donor':
        navigate(`/camp-donors?id=${campId}`);
        break;
      case 'create-donation':
        navigate(`/donations/create-donation?campId=${campId}`);
        break;
      case 'view-donations':
        navigate(`/camp-donation?id=${campId}`);
        break;
      default:
        break;
    }
  };

  const getProgressStatus = (camp) => {
    if (!camp.dateFrom || !camp.dateTo) return "N/A";

    const now = new Date();
    const start = new Date(camp.dateFrom);
    const end = new Date(camp.dateTo);

    if (now < start) return "Upcoming";
    if (now >= start && now <= end) return "Ongoing";
    return "Completed";
  };

  const getProgressBadge = (status) => {
    const colors = {
      Upcoming: "bg-blue-100 text-blue-800",
      Ongoing: "bg-green-100 text-green-800",
      Completed: "bg-gray-100 text-gray-800",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return <EnhancedLoader message="Loading camp details..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Camp</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate('/camp-listing')}>
            Go to Camp List
          </Button>
        </div>
      </div>
    );
  }

  if (!camp) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Camp Not Found</h2>
          <p className="text-gray-600 mb-6">The requested camp could not be found.</p>
          <Button onClick={() => navigate('/camp-listing')}>
            Go to Camp List
          </Button>
        </div>
      </div>
    );
  }

  const facilities = [
    {
      id: "view-donor",
      title: "View Donors",
      description: "Browse, search, and manage existing donor records and history",
      icon: Users,
      color: "bg-orange-800",
      stats: `${camp?.donorCount || 0} Active This Month`,
    },
    {
      id: "create-donation",
      title: "Create Donation",
      description: "Record new blood donations with vitals, tests, and bag information",
      icon: Plus,
      color: "bg-orange-800",
      stats: `${camp?.bagsCount || 0} Total Donations`,
    },
    {
      id: "view-donations",
      title: "View Donations",
      description: "Manage donation records, track status, and view test results",
      icon: Activity,
      color: "bg-orange-800",
      stats: `${camp?.bagsCount || 0} This Camp`,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="outline"
            onClick={() => navigate('/camp-listing')}
            className="flex items-center gap-3 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Camp List
          </Button>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-orange-800 to-orange-900 rounded-xl">
              <Droplets className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Camp Management</h1>
              <p className="text-gray-600 mt-1">Comprehensive blood bank camp management system</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Camp Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{camp.name}</h2>
            {getProgressBadge(getProgressStatus(camp))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                <p className="text-gray-600 text-sm">{camp.description || "No description provided"}</p>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Address</p>
                  <p className="text-gray-600 text-sm">{camp.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Phone</p>
                  <p className="text-gray-600 text-sm">{camp.contactInfo?.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-gray-600 text-sm">{camp.contactInfo?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Created By</p>
                  <p className="text-gray-600 text-sm">{camp.createdBy?.name?.first} {camp.createdBy?.name?.last}</p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Site ID</p>
                <p className="text-gray-600 font-mono text-sm">{camp.siteId}</p>
              </div>
              
              <div className="flex flex-col gap-3">
                {/* Staff Count */}
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Staff Count</p>
                    <p className="text-gray-600 text-sm">{camp.staff?.length || 0} members</p>
                  </div>
                </div>

                {/* Staff List */}
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Staff Members</p>
                  <div className="grid gap-2">
                    {camp.staff && camp.staff.length > 0 ? (
                      camp.staff.map((member, index) => (
                        <div
                          key={member._id || index}
                          className="flex items-center justify-between p-3 rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 transition"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {member.name?.first} {member.name?.last}
                            </p>
                            <p className="text-xs text-gray-500">
                              {member.role ? member.role.charAt(0).toUpperCase() + member.role.slice(1) : "Staff"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">{member.email}</p>
                            <p className="text-xs text-gray-600">{member.phone}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-500">
                        No staff assigned
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Created Date</p>
                  <p className="text-gray-600 text-sm">{new Date(camp.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Updated By</p>
                  <p className="text-gray-600 text-sm">{camp.lastUpdatedBy?.name?.first} {camp.lastUpdatedBy?.name?.last}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {facilities.map((facility) => {
            const IconComponent = facility.icon;
            return (
              <div
                key={facility.id}
                onClick={() => handleFacilityClick(facility.id)}
                className="group cursor-pointer bg-white rounded-2xl border border-gray-200 transition-transform duration-300 hover:shadow-xl hover:shadow-orange-100 overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`p-4 bg-orange-800 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
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
            );
          })}
        </div>

        {/* Security Notice */}
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
  );
};

export default CampDetails;
