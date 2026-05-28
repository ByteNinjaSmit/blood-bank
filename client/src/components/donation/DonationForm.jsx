import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import FormField from '@/components/shared/FormField';
import Button from '@/components/shared/Button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useDonor } from '@/hooks/useDonor';

const DonationForm = ({ 
  initialData = null, 
  onSubmit, 
  onCancel, 
  loading = false,
  campId = null 
}) => {
  const { searchDonor } = useDonor();
  const [donor, setDonor] = useState(null);
  const [searchingDonor, setSearchingDonor] = useState(false);
  const [donorNotFound, setDonorNotFound] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: initialData || {
      bagNo: '',
      segmentNo: '',
      lotNo: '',
      typeOfBag: '',
      collectionDate: new Date().toISOString().split('T')[0],
      hb: '',
      weightKg: '',
      pulse: '',
      tempC: '',
      bp: '',
      bloodGroup: '',
      rh: '',
    }
  });

  // Donor search fields
  const [donorSearch, setDonorSearch] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    uid: '',
    phone: '',
    donorId: '',
  });

  const searchRequiredFilled = 
    donorSearch.firstName.trim() && 
    donorSearch.middleName.trim() && 
    donorSearch.lastName.trim() && 
    donorSearch.dob;

  const handleDonorSearch = async () => {
    setSearchingDonor(true);
    setDonorNotFound(false);
    
    const result = await searchDonor(donorSearch);
    
    if (result.success) {
      setDonor(result.data);
      setValue('bloodGroup', result.data.bloodGroup);
      setValue('rh', result.data.rh);
      setDonorNotFound(false);
    } else {
      setDonorNotFound(true);
      setDonor(null);
    }
    
    setSearchingDonor(false);
  };

  const handleFormSubmit = (data) => {
    if (!donor) {
      alert('Please search and select a donor before submitting.');
      return;
    }

    const payload = {
      bagNo: data.bagNo,
      segmentNo: data.segmentNo,
      lotNo: data.lotNo,
      typeOfBag: data.typeOfBag,
      donor: donor._id,
      initialVitals: {
        hb: parseFloat(data.hb),
        weightKg: parseFloat(data.weightKg),
        pulse: parseInt(data.pulse),
        tempC: parseFloat(data.tempC),
        bp: data.bp,
      },
      bloodGroup: data.bloodGroup,
      rh: data.rh,
      siteId: campId || null,
      donorId: donor.donorId,
    };
    
    onSubmit(payload);
  };

  return (
    <div className="space-y-6">
      {/* Donor Search */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Donor Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries({ 
            firstName: "First Name", 
            middleName: "Middle Name", 
            lastName: "Last Name" 
          }).map(([key, label]) => (
            <FormField key={key} label={label} required>
              <FormField.Input
                value={donorSearch[key]}
                onChange={(e) => setDonorSearch({ ...donorSearch, [key]: e.target.value })}
                placeholder={`Enter ${label}`}
              />
            </FormField>
          ))}
          <FormField label="Date of Birth" required>
            <FormField.Input
              type="date"
              value={donorSearch.dob}
              onChange={(e) => setDonorSearch({ ...donorSearch, dob: e.target.value })}
            />
          </FormField>
        </div>
        
        <div className="mt-3">
          <button 
            type="button" 
            onClick={() => setShowAdvanced(!showAdvanced)} 
            className="text-sm text-orange-800 hover:underline"
          >
            {showAdvanced ? "Hide advanced" : "Show advanced (UID, Phone, Donor ID)"}
          </button>
        </div>
        
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            {Object.entries({ 
              uid: "UID (12 digits)", 
              phone: "Phone (10 digits)", 
              donorId: "Donor ID" 
            }).map(([key, label]) => (
              <FormField key={key} label={label}>
                <FormField.Input
                  value={donorSearch[key]}
                  onChange={(e) => setDonorSearch({ ...donorSearch, [key]: e.target.value })}
                  placeholder={`Enter ${label}`}
                />
              </FormField>
            ))}
          </div>
        )}
        
        <div className="mt-4 flex gap-4">
          <Button
            onClick={handleDonorSearch}
            disabled={searchingDonor || !searchRequiredFilled}
            loading={searchingDonor}
          >
            Search Donor
          </Button>
          {!searchRequiredFilled && (
            <span className="text-sm text-gray-500 self-center">
              Enter First, Middle, Last name and DOB to search
            </span>
          )}
        </div>

        {donorNotFound && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">Donor not found. Please create a new donor.</p>
          </div>
        )}

        {donor && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">
              Donor found: {donor.name?.firstName} {donor.name?.lastName} 
              ({donor.bloodGroup}{donor.rh === "Positive" ? "+" : "-"})
            </p>
          </div>
        )}
      </div>

      {/* Donation Form */}
      {donor && (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Bag Info */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <h3 className="font-semibold text-gray-800 mb-4">Bag Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Bag No" required error={errors.bagNo?.message}>
                <FormField.Input
                  {...register('bagNo', { required: 'Bag number is required' })}
                />
              </FormField>
              <FormField label="Segment No" required error={errors.segmentNo?.message}>
                <FormField.Input
                  {...register('segmentNo', { required: 'Segment number is required' })}
                />
              </FormField>
              <FormField label="Lot No" required error={errors.lotNo?.message}>
                <FormField.Input
                  {...register('lotNo', { required: 'Lot number is required' })}
                />
              </FormField>
              <FormField label="Type of Bag" required error={errors.typeOfBag?.message}>
                <FormField.Select
                  {...register('typeOfBag', { required: 'Bag type is required' })}
                >
                  <option value="">Select type</option>
                  <option value="DB">Double Bag</option>
                  <option value="TB">Triple Bag</option>
                  <option value="QB">Quadruple Bag</option>
                </FormField.Select>
              </FormField>
            </div>
          </div>

          {/* Initial Vitals */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <h3 className="font-semibold text-gray-800 mb-4">Initial Vitals</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Hemoglobin (g/dL)" required error={errors.hb?.message}>
                <FormField.Input
                  type="number"
                  step="0.1"
                  {...register('hb', { 
                    required: 'Hemoglobin is required',
                    min: { value: 0, message: 'Must be positive' }
                  })}
                />
              </FormField>
              <FormField label="Weight (kg)" required error={errors.weightKg?.message}>
                <FormField.Input
                  type="number"
                  step="0.1"
                  {...register('weightKg', { 
                    required: 'Weight is required',
                    min: { value: 0, message: 'Must be positive' }
                  })}
                />
              </FormField>
              <FormField label="Pulse (bpm)" required error={errors.pulse?.message}>
                <FormField.Input
                  type="number"
                  {...register('pulse', { 
                    required: 'Pulse is required',
                    min: { value: 0, message: 'Must be positive' }
                  })}
                />
              </FormField>
              <FormField label="Temperature (°C)" required error={errors.tempC?.message}>
                <FormField.Input
                  type="number"
                  step="0.1"
                  {...register('tempC', { 
                    required: 'Temperature is required',
                    min: { value: 0, message: 'Must be positive' }
                  })}
                />
              </FormField>
              <FormField label="Blood Pressure" required error={errors.bp?.message}>
                <FormField.Input
                  {...register('bp', { required: 'Blood pressure is required' })}
                  placeholder="120/80"
                />
              </FormField>
            </div>
          </div>

          {/* Blood Group Info */}
          <div className="bg-white p-6 rounded-xl shadow border">
            <h3 className="font-semibold text-gray-800 mb-4">Blood Group Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Blood Group" required error={errors.bloodGroup?.message}>
                <FormField.Select
                  {...register('bloodGroup', { required: 'Blood group is required' })}
                >
                  <option value="">Select</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </FormField.Select>
              </FormField>
              <FormField label="Rh Factor" required error={errors.rh?.message}>
                <FormField.Select
                  {...register('rh', { required: 'Rh factor is required' })}
                >
                  <option value="">Select</option>
                  <option value="Positive">Positive</option>
                  <option value="Negative">Negative</option>
                </FormField.Select>
              </FormField>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
            >
              {initialData ? 'Update Donation' : 'Create Donation'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DonationForm;
