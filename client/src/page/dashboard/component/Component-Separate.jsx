import React, { useState } from "react";
import { ArrowLeft, TestTube, AlertCircle, Check, Loader2, Volume2, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const ComponentSeparate = ({ onBack }) => {
  const [formData, setFormData] = useState({
    bagNo: "",
    components: [],
    componentVolumes: {},
    componentStatus: {},
    componentExpiry: {},
  });
  
  // Mock data for previously added bags in queue
  const [previousBags, setPreviousBags] = useState([
    { bagNo: "25/D0097", status: "in-stock", date: "2023-12-15" },
    { bagNo: "25/D0098", status: "reserved", date: "2023-12-16" },
    { bagNo: "25/D0099", status: "in-stock", date: "2023-12-17" },
    { bagNo: "25/D0100", status: "issued", date: "2023-12-18" },
  ]);
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
      // This would be an API call in a real application
      console.log("Submitting component separation data:", formData);
      
      // Add the current bag to the previous bags list
      const newBag = {
        bagNo: formData.bagNo,
        status: "in-stock",
        date: new Date().toISOString().split('T')[0]
      };
      
      setPreviousBags(prev => [newBag, ...prev]);

      // Reset form after successful submission
      setFormData({
        bagNo: "",
        components: [],
        componentVolumes: {},
        componentStatus: {},
        componentExpiry: {},
      });

      toast.success("Components separated successfully!");
    } catch (error) {
      console.error("Error separating components:", error);
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
  const usePreviousBag = (bagNo) => {
    setFormData(prev => ({
      ...prev,
      bagNo: bagNo
    }));
    toast.info(`Selected bag ${bagNo} for component separation`);
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
          {/* Previously added bags table */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Previously Added Bags
            </label>
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
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
                  {previousBags.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-3 text-center text-sm text-gray-500">
                        No bags added yet
                      </td>
                    </tr>
                  ) : (
                    previousBags.slice(0, 5).map((bag, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {bag.bagNo}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            bag.status === 'in-stock' ? 'bg-green-100 text-green-800' :
                            bag.status === 'reserved' ? 'bg-blue-100 text-blue-800' :
                            bag.status === 'issued' ? 'bg-yellow-100 text-yellow-800' :
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
                            className="text-red-600 hover:text-red-900"
                          >
                            Use
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

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Components to Separate
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
            
            {errors.components && (
              <p className="mb-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {errors.components}
              </p>
            )}
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      BAG_NO
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" colSpan="2" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Component Type
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 whitespace-nowrap" rowSpan={availableComponents.length + 1}>
                      <div className="text-sm font-medium text-gray-900">
                        {formData.bagNo || "Not specified"}
                        {formData.bagNo && (
                          <span className="block text-xs text-gray-500 mt-1">
                            Format: {/^\d+\/D\d+$/.test(formData.bagNo) ? "Valid" : "Invalid"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" rowSpan={availableComponents.length + 1}>
                      <select 
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                        defaultValue="in-stock"
                      >
                        {statusOptions.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td colSpan="3" className="px-4 py-2 text-center text-xs text-gray-500">
                      Select components below
                    </td>
                  </tr>
                  
                  {availableComponents.map((component) => {
                    const isSelected = formData.components.includes(component.id);
                    return (
                      <tr key={component.id} className={isSelected ? "bg-red-50" : "hover:bg-gray-50"}>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleComponentToggle(component.id)}
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            />
                            <label className="ml-2 block text-sm text-gray-900">
                              {component.name}
                            </label>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3">
                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <Volume2 className="w-4 h-4 text-gray-500" />
                              <input
                                type="number"
                                value={formData.componentVolumes[component.id] || ""}
                                onChange={(e) => handleVolumeChange(component.id, parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                                placeholder="Volume"
                              />
                              <span className="text-xs text-gray-500">mL</span>
                              {errors[`volume_${component.id}`] && (
                                <span className="text-xs text-red-500">{errors[`volume_${component.id}`]}</span>
                              )}
                            </div>
                          )}
                        </td>
                        
                        <td className="px-4 py-3 text-right">
                          {isSelected && (
                            <div className="flex items-center justify-end gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-xs text-gray-500">{component.defaultExpiry}</span>
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

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2"
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
        </form>
      </div>
    </div>
  );
};

export default ComponentSeparate;