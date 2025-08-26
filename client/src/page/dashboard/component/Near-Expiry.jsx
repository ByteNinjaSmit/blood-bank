import React, { useState, useEffect } from "react";
import { ArrowLeft, Clock, AlertTriangle, Filter, Search, X, Droplets, Volume2 } from "lucide-react";
import { toast } from "sonner";

const NearExpiry = ({ onBack }) => {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    days: 7,
    componentType: "",
    bloodGroup: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Available component types and blood groups for filtering
  const componentTypes = ["RBC", "FFP", "Platelet", "Cryo"];
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  // Mock data for demonstration
  useEffect(() => {
    setTimeout(() => {
      setComponents([
        {
          _id: "1",
          componentId: "RBC-20240101-001",
          bagNo: "BG20240101001",
          bloodGroup: "A+",
          componentType: "RBC",
          expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          status: "in-stock",
          createdAt: "2024-01-01",
          volumeMl: 250
        },
        {
          _id: "2",
          componentId: "FFP-20240102-001",
          bagNo: "BG20240102001",
          bloodGroup: "B+",
          componentType: "FFP",
          expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          status: "in-stock",
          createdAt: "2024-01-02",
          volumeMl: 200
        },
        {
          _id: "3",
          componentId: "Platelet-20240103-001",
          bagNo: "BG20240103001",
          bloodGroup: "O-",
          componentType: "Platelet",
          expiryDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
          status: "in-stock",
          createdAt: "2024-01-03",
          volumeMl: 50
        },
        {
          _id: "4",
          componentId: "Cryo-20240104-001",
          bagNo: "BG20240104001",
          bloodGroup: "AB+",
          componentType: "Cryo",
          expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
          status: "in-stock",
          createdAt: "2024-01-04",
          volumeMl: 20
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  // Function to fetch near-expiry components from API
  const fetchNearExpiryComponents = async () => {
    setLoading(true);
    try {
      // This would be an API call in a real application
      // const response = await fetch(`/api/inventory/near-expiry?days=${filters.days}`);
      // const data = await response.json();
      // setComponents(data);
      console.log("Fetching near-expiry components with filters:", filters);
      // Mock implementation - in real app, this would be replaced with actual API call
      setTimeout(() => setLoading(false), 500);
    } catch (error) {
      console.error("Error fetching near-expiry components:", error);
      toast.error("Failed to load near-expiry components");
      setLoading(false);
    }
  };

  // Apply filters when they change
  useEffect(() => {
    fetchNearExpiryComponents();
  }, [filters.days]);

  // Handle discard action
  const handleDiscard = async (component) => {
    if (window.confirm(`Are you sure you want to discard ${component.componentId}?`)) {
      try {
        // This would be an API call in a real application
        // await fetch(`/api/inventory/discard`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     componentIds: [component._id],
        //     reason: 'Expired'
        //   })
        // });
        
        // Update local state
        setComponents(components.filter(c => c._id !== component._id));
        toast.success(`${component.componentId} has been discarded`);
      } catch (error) {
        console.error("Error discarding component:", error);
        toast.error("Failed to discard component");
      }
    }
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get appropriate color based on days until expiry
  const getExpiryColor = (days) => {
    if (days <= 1) return "text-red-600 bg-red-100";
    if (days <= 3) return "text-orange-600 bg-orange-100";
    return "text-yellow-600 bg-yellow-100";
  };

  // Filter components based on search term and filters
  const filteredComponents = components.filter(component => {
    const matchesSearch = searchTerm === "" || 
      component.componentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.bagNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesComponentType = filters.componentType === "" || 
      component.componentType === filters.componentType;
    
    const matchesBloodGroup = filters.bloodGroup === "" || 
      component.bloodGroup === filters.bloodGroup;
    
    return matchesSearch && matchesComponentType && matchesBloodGroup;
  });

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      days: 7,
      componentType: "",
      bloodGroup: "",
    });
    setSearchTerm("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-yellow-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={onBack}
            className="flex items-center cursor-pointer gap-3 text-yellow-800 border border-yellow-200 hover:bg-yellow-50 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-xl px-6 py-3 mb-6 h-11"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Components
          </button>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-red-800 to-red-900 rounded-xl">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Near-Expiry Components</h1>
              <p className="text-gray-600 mt-1">
                Monitor and manage blood components approaching their expiry date
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and filter controls */}
        <div className="bg-white shadow-md rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by ID, bag number, or blood group"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
              >
                <X className="w-5 h-5" />
                Reset
              </button>
            </div>
          </div>

          {/* Expandable filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Days Until Expiry
                </label>
                <select
                  value={filters.days}
                  onChange={(e) => setFilters({ ...filters, days: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="3">3 days</option>
                  <option value="5">5 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Component Type
                </label>
                <select
                  value={filters.componentType}
                  onChange={(e) => setFilters({ ...filters, componentType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">All Types</option>
                  {componentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blood Group
                </label>
                <select
                  value={filters.bloodGroup}
                  onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">All Groups</option>
                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Components listing */}
        {loading ? (
          <div className="bg-white shadow-md rounded-xl p-6 flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
              <p className="text-gray-500">Loading components...</p>
            </div>
          </div>
        ) : filteredComponents.length === 0 ? (
          <div className="bg-white shadow-md rounded-xl p-6 flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
              <p className="text-gray-700 font-medium">No near-expiry components found</p>
              <p className="text-gray-500 max-w-md">
                There are no components expiring within {filters.days} days that match your filters.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Component ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Blood Group
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volume
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredComponents.map((component) => {
                    const daysUntilExpiry = getDaysUntilExpiry(component.expiryDate);
                    const expiryColor = getExpiryColor(daysUntilExpiry);
                    
                    return (
                      <tr key={component._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-red-50">
                              <Droplets className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{component.componentId}</div>
                              <div className="text-sm text-gray-500">Bag: {component.bagNo}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {component.bloodGroup}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {component.componentType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Volume2 className="w-4 h-4 text-gray-400" />
                            {component.volumeMl} mL
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(component.expiryDate).toLocaleDateString()}
                          </div>
                          <div className={`text-xs ${expiryColor} px-2 py-0.5 rounded-full inline-flex items-center mt-1`}>
                            <Clock className="w-3 h-3 mr-1" />
                            {daysUntilExpiry} {daysUntilExpiry === 1 ? "day" : "days"} left
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {component.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDiscard(component)}
                            className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors duration-200"
                          >
                            Discard
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearExpiry;