import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Building2 } from 'lucide-react';
import { useAuth } from '@/store/auth';
import hospitalApi from '@/services/hospitalApi';

const AddHospital = () => {
  const navigate = useNavigate();
  const { authorizationToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactPerson: '',
    phone: ''
  });

  const [errors, setErrors] = useState({});


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSelectChange = (value, name) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Hospital name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+]?[\d\s\-\(\)]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      // Initialize API service with auth token
      hospitalApi.initialize(authorizationToken);
      
      // Create hospital using Axios API service
      const result = await hospitalApi.createHospital(formData);

      if (!result.success) {
        // Show main error message
        toast.error(result.error || 'Failed to add hospital');
        
        // Handle validation errors if they exist
        if (result.validationErrors && Array.isArray(result.validationErrors)) {
          const newErrors = {};
          result.validationErrors.forEach(errorMsg => {
            // Map backend validation errors to form fields
            const lowerError = errorMsg.toLowerCase();
            if (lowerError.includes('name')) {
              newErrors.name = errorMsg;
            } else if (lowerError.includes('phone')) {
              newErrors.phone = errorMsg;
            } else if (lowerError.includes('address')) {
              newErrors.address = errorMsg;
            } else if (lowerError.includes('contact')) {
              newErrors.contactPerson = errorMsg;
            }
          });
          setErrors(newErrors);
          
          // Show additional toast for validation errors
          if (Object.keys(newErrors).length > 0) {
            toast.error('Please fix the validation errors in the form');
          }
        }
      } else {
        // Success case
        const successMessage = result.data?.message || 'Hospital added successfully!';
        toast.success(successMessage);
        navigate('/hospital/list');
      }
    } catch (error) {
      console.error('Error adding hospital:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      address: '',
      contactPerson: '',
      phone: ''
    });
    setErrors({});
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="relative overflow-hidden p-2.5 bg-gradient-to-br from-red-600 via-red-700 to-red-950 rounded-xl shadow-[0_4px_10px_-2px_rgba(127,29,29,0.55)] ring-1 ring-white/25 before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/40 before:via-white/5 before:to-transparent before:content-['']">
            <Building2 className="w-6 h-6 text-white relative z-10 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Hospital</h1>
            <p className="text-gray-500 text-sm">Register a new hospital / consignee</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hospital Information</CardTitle>
          <CardDescription>
            Fill in the details below to register a new hospital
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hospital Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Hospital Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter hospital name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Contact Person */}
              <div className="space-y-2">
                <Label htmlFor="contactPerson" className="text-sm font-medium">
                  Contact Person <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactPerson"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  placeholder="Enter contact person name"
                  className={errors.contactPerson ? 'border-red-500' : ''}
                />
                {errors.contactPerson && (
                  <p className="text-sm text-red-500">{errors.contactPerson}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone}</p>
                )}
              </div>


            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">
                Address <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter complete hospital address"
                rows={3}
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={loading}
              >
                Reset Form
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {loading ? 'Adding Hospital...' : 'Add Hospital'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddHospital;
