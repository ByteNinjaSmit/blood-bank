import React, { useState, useEffect } from "react";
import { ArrowLeft, TestTube, AlertCircle, Check, Loader2, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const ComponentSeparate = ({ onBack }) => {
  const [formData, setFormData] = useState({
    bagNo: "",
    components: [],
    componentVolumes: {},
    componentStatus: {},
    componentExpiry: {},
  });
  
  // State for previously added bags in queue
  const [previousBags, setPreviousBags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch previously added bags
  useEffect(() => {
    const fetchPreviousBags = async () => {
      setIsLoading(true);
      try {
        // API connection code (commented for now)
        /*
        // Get blood bags that have passed testing but not yet separated
        const response = await axios.get('/api/bloodbags?status=passed');
        if (response.data && Array.isArray(response.data)) {
          // Format the data for our component
          const formattedBags = response.data.map(bag => ({
            bagNo: bag.bagNo,
            status: bag.status,
            date: new Date(bag.collectionDate).toISOString().split('T')[0]
          }));
          setPreviousBags(formattedBags);
        }
        */
        
        // Using mock data instead
        setPreviousBags([
          { bagNo: "25/D0097", status: "in-stock", date: "2023-12-15" },
          { bagNo: "25/D0098", status: "reserved", date: "2023-12-16" },
          { bagNo: "25/D0099", status: "in-stock", date: "2023-12-17" },
          { bagNo: "25/D0100", status: "issued", date: "2023-12-18" },
          { bagNo: "25/D0101", status: "passed", date: "2023-12-19" },
        ]);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load blood bags');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPreviousBags();
  }, []);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available component types based on the server controller
  const availableComponents = [
    { id: "RBC", name: "Red Blood Cells", defaultExpiry: "35 days", defaultVolume: 250 },
    { id: "FFP", name: "Fresh Frozen Plasma", defaultExpiry: "1 year", defaultVolume: 200 },
    { id: "Platelet", name: "Platelets", defaultExpiry: "5 days", defaultVolume: 50 },
    { id: "Cryo", name: "Cryoprecipitate", defaultExpiry: "1 year", defaultVolume: 20 },
  ];
  
  // Status options
  const statusOptions = ["in-stock", "reserved", "issued", "discarded"];

  const handleComponentToggle = (componentType) => {
    setFormData((prev) => {
      const isSelected = prev.components.includes(componentType);
      
      if (isSelected) {
        // Remove component and its related data
        const { componentVolumes, componentStatus, componentExpiry } = prev;
        const newVolumes = { ...componentVolumes };
        const newStatus = { ...componentStatus };
        const newExpiry = { ...componentExpiry };
        
        delete newVolumes[componentType];
        delete newStatus[componentType];
        delete newExpiry[componentType];
        
        return {
          ...prev,
          components: prev.components.filter((c) => c !== componentType),
          componentVolumes: newVolumes,
          componentStatus: newStatus,
          componentExpiry: newExpiry
        };
      } else {
        // Add component with default values
        const component = availableComponents.find(c => c.id === componentType);
        return {
          ...prev,
          components: [...prev.components, componentType],
          componentVolumes: {
            ...prev.componentVolumes,
            [componentType]: component.defaultVolume
          },
          componentStatus: {
            ...prev.componentStatus,
            [componentType]: "in-stock"
          },
          componentExpiry: {
            ...prev.componentExpiry,
            [componentType]: component.defaultExpiry
          }
        };
      }
    });
  };
  
  const handleVolumeChange = (componentType, volume) => {
    setFormData(prev => ({
      ...prev,
      componentVolumes: {
        ...prev.componentVolumes,
        [componentType]: volume
      }
    }));
  };
  
  const handleStatusChange = (componentType, status) => {
    setFormData(prev => ({
      ...prev,
      componentStatus: {
        ...prev.componentStatus,
        [componentType]: status
      }
    }));
  };
  
  const handleExpiryChange = (componentType, expiry) => {
    setFormData(prev => ({
      ...prev,
      componentExpiry: {
        ...prev.componentExpiry,
        [componentType]: expiry
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.bagNo.trim()) newErrors.bagNo = "Bag number is required";
    if (formData.components.length === 0)
      newErrors.components = "At least one component must be selected";
      
    // Validate volumes
    formData.components.forEach(component => {
      const volume = formData.componentVolumes[component];
      if (!volume || volume <= 0) {
        newErrors[`volume_${component}`] = `Volume for ${component} is required and must be positive`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Prepare data for API call
      const componentsToSeparate = formData.components.map(componentType => ({
        componentType,
        volumeMl: formData.componentVolumes[componentType],
        status: formData.componentStatus[componentType],
        // Convert expiry string to actual date based on collection date
        // This is a simplified version - in production, you'd calculate actual dates
        storageLocation: 'Default Storage' // This would be dynamic in a real app
      }));
      
      // API connection code (commented for now)
      /*
      // Make API call to separate components
      const response = await axios.post('/api/components/separate', {
        bagNo: formData.bagNo,
        components: componentsToSeparate
      });
      
      // If successful, update the UI
      if (response.status === 201) {
      */
      
      // Using mock data instead
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simulate successful response
      const success = true;
      
      if (success) {
        // Add the current bag to the previous bags list with updated status
        const newBag = {
          bagNo: formData.bagNo,
          status: "component-separated",
          date: new Date().toISOString().split('T')[0]
        };
        
        // Update the previous bags list
        setPreviousBags(prev => {
          // Remove the bag if it already exists in the list
          const filteredBags = prev.filter(bag => bag.bagNo !== formData.bagNo);
          // Add the updated bag at the beginning
          return [newBag, ...filteredBags];
        });

        // Reset form after successful submission
        setFormData({
          bagNo: "",
          components: [],
          componentVolumes: {},
          componentStatus: {},
          componentExpiry: {},
        });

        toast.success("Components separated successfully!");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error separating components. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to format bag number to match the required format (25/D0097)
  const formatBagNumber = (input) => {
    // If the input already matches the format, return it
    if (/^\d+\/D\d+$/.test(input)) return input;
    
    // If it's just numbers, format it as 25/D{number with leading zeros}
    if (/^\d+$/.test(input)) {
      const paddedNumber = input.padStart(4, '0');
      return `25/D${paddedNumber}`;
    }
    
    // Otherwise return the input as is
    return input;
  };
  
  // Handle bag number change with formatting
  const handleBagNumberChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      bagNo: value
    }));
  };
  
  // Function to use a previous bag
  const usePreviousBag = async (bagNo) => {
    try {
      setIsLoading(true);
      
      // API connection code (commented for now)
      /*
      // Fetch the blood bag details from the API
      const response = await axios.get(`/api/bloodbags/${bagNo}`);
      
      if (response.data) {
        const bag = response.data;
        
        // Set the form data with the bag number
        setFormData(prev => ({
          ...prev,
          bagNo: bag.bagNo,
          // Clear any previously selected components
          components: [],
          componentVolumes: {},
          componentStatus: {},
          componentExpiry: {}
        }));
        
        toast.info(`Selected bag ${bagNo} for component separation`);
      }
      */
      
      // Using mock data instead
      // Simulate a short delay to mimic API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Set the form data with the bag number
      setFormData(prev => ({
        ...prev,
        bagNo: bagNo,
        // Clear any previously selected components
        components: [],
        componentVolumes: {},
        componentStatus: {},
        componentExpiry: {}
      }));
      
      toast.info(`Selected bag ${bagNo} for component separation`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load bag details');
      
      // Still set the bag number even if API fails
      setFormData(prev => ({
        ...prev,
        bagNo: bagNo
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-red-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={onBack}
            className="flex items-center cursor-pointer gap-3 text-red-800 border border-red-200 hover:bg-red-50 bg-white shadow-sm hover:shadow-md transition-all duration-300 rounded-xl px-6 py-3 mb-6 h-11"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Components
          </button>
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-red-800 to-red-900 rounded-xl">
              <TestTube className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Separate Blood Components</h1>
              <p className="text-gray-600 mt-1">
                Process a blood bag into its individual components
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Blood Bag Number Input */}
            <div>
              <label
                htmlFor="bagNo"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Blood Bag Number
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="bagNo"
                  value={formData.bagNo}
                  onChange={handleBagNumberChange}
                  onBlur={(e) => {
                    const formattedValue = formatBagNumber(e.target.value);
                    setFormData(prev => ({ ...prev, bagNo: formattedValue }));
                  }}
                  className={`w-full px-4 py-2 border ${errors.bagNo ? "border-red-500" : "border-gray-300"} rounded-l-md focus:outline-none focus:ring-2 focus:ring-red-500`}
                  placeholder="Format: 25/D0097"
                />
                <button 
                  type="button"
                  onClick={() => {
                    const nextNumber = previousBags.length > 0 
                      ? String(parseInt(previousBags[0].bagNo.split('/D')[1]) + 1).padStart(4, '0')
                      : "0001";
                    setFormData(prev => ({ ...prev, bagNo: `25/D${nextNumber}` }));
                  }}
                  className="px-4 py-2 bg-gray-100 border border-gray-300 border-l-0 rounded-r-md hover:bg-gray-200 text-gray-700"
                >
                  Auto
                </button>
              </div>
              {errors.bagNo && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.bagNo}
                </p>
              )}
            </div>

            {/* Component Selection Controls */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Component Actions
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allComponents = availableComponents.map(c => c.id);
                      setFormData(prev => {
                        const volumes = {};
                        const statuses = {};
                        const expiries = {};
                        
                        allComponents.forEach(c => {
                          const component = availableComponents.find(comp => comp.id === c);
                          volumes[c] = component.defaultVolume;
                          statuses[c] = "in-stock";
                          expiries[c] = component.defaultExpiry;
                        });
                        
                        return {
                          ...prev,
                          components: allComponents,
                          componentVolumes: volumes,
                          componentStatus: statuses,
                          componentExpiry: expiries
                        };
                      });
                    }}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        components: [],
                        componentVolumes: {},
                        componentStatus: {},
                        componentExpiry: {}
                      }));
                    }}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Reset
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-2 mt-4"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Separate Components"
                )}
              </button>
            </div>
          </div>

          {/* Previously added bags table */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Previously Added Bags
            </label>
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-4 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bag Number
                    </th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Added
                    </th>
                    <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-center text-sm text-gray-500">
                        <div className="flex justify-center items-center">
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Loading bags...
                        </div>
                      </td>
                    </tr>
                  ) : previousBags.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-center text-sm text-gray-500">
                        No bags available for component separation
                      </td>
                    </tr>
                  ) : (
                    previousBags.slice(0, 5).map((bag, index) => (
                      <tr key={index} className={`hover:bg-gray-50 ${formData.bagNo === bag.bagNo ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {bag.bagNo}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            bag.status === 'in-stock' ? 'bg-green-100 text-green-800' :
                            bag.status === 'reserved' ? 'bg-blue-100 text-blue-800' :
                            bag.status === 'issued' ? 'bg-yellow-100 text-yellow-800' :
                            bag.status === 'component-separated' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {bag.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {bag.date}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            type="button"
                            onClick={() => usePreviousBag(bag.bagNo)}
                            className={`${formData.bagNo === bag.bagNo ? 'text-gray-400' : 'text-red-600 hover:text-red-900'}`}
                            disabled={formData.bagNo === bag.bagNo || isLoading}
                          >
                            {formData.bagNo === bag.bagNo ? 'Selected' : 'Use'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Components to Separate
              </label>
            </div>
            
            {errors.components && (
              <p className="mb-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {errors.components}
              </p>
            )}
            
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bag No.
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Component
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Volume
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {availableComponents.map((component) => {
                    const isSelected = formData.components.includes(component.id);
                    return (
                      <tr key={component.id} className={isSelected ? "bg-red-50" : "hover:bg-gray-50"}>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {formData.bagNo || "Not specified"}
                            {formData.bagNo && (
                              <span className="block text-xs text-gray-500 mt-1">
                                {/^\d+\/D\d+$/.test(formData.bagNo) ? "✓" : "⚠️"}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleComponentToggle(component.id)}
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm font-medium text-gray-900">
                              {component.name}
                            </label>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3">
                          {isSelected ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={formData.componentVolumes[component.id] || ""}
                                onChange={(e) => handleVolumeChange(component.id, parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                                placeholder="Volume"
                              />
                              <span className="text-xs text-gray-500">mL</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">{component.defaultVolume} mL</span>
                          )}
                        </td>
                        
                        <td className="px-4 py-3">
                          {isSelected ? (
                            <select
                              value={formData.componentStatus[component.id] || "in-stock"}
                              onChange={(e) => handleStatusChange(component.id, e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                            >
                              {statusOptions.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs text-gray-400">in-stock</span>
                          )}
                        </td>
                        
                        <td className="px-4 py-3">
                          {isSelected ? (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <input
                                type="text"
                                value={formData.componentExpiry[component.id] || component.defaultExpiry}
                                onChange={(e) => handleExpiryChange(component.id, e.target.value)}
                                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                                placeholder="Expiry"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">{component.defaultExpiry}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComponentSeparate;