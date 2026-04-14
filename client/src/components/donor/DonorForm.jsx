import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import FormField from '@/components/shared/FormField';
import Button from '@/components/shared/Button';
import { states } from '@/constants/states';

const DonorForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: (() => {
      if (!initialData) return {
        donorId: '',
        firstName: '',
        middleName: '',
        lastName: '',
        uid: '',
        dob: '',
        sex: '',
        phone: '',
        email: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        district: '',
        state: '',
        pincode: '',
        occupation: '',
        weightKg: '',
        bloodGroup: '',
        rh: '',
        eligibilityStatus: '',
        lastDonationDate: '',
        dobDisplay: '',
        lastDonationDateDisplay: '',
      };

      // Helper to format date for display
      const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // Handle both flat and nested initialData
      return {
        ...initialData,
        // Flatten name if nested
        firstName: initialData.firstName || initialData.name?.firstName || '',
        middleName: initialData.middleName || initialData.name?.middleName || '',
        lastName: initialData.lastName || initialData.name?.lastName || '',
        // Flatten address if nested
        addressLine1: initialData.addressLine1 || initialData.address?.line1 || '',
        addressLine2: initialData.addressLine2 || initialData.address?.line2 || '',
        city: initialData.city || initialData.address?.city || '',
        district: initialData.district || initialData.address?.district || '',
        state: initialData.state || initialData.address?.state || '',
        pincode: initialData.pincode || initialData.address?.pincode || '',
        // Format dates
        dobDisplay: formatDate(initialData.dob),
        lastDonationDateDisplay: formatDate(initialData.lastDonationDate),
        // Ensure standard date format for internal fields
        dob: initialData.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '',
        lastDonationDate: initialData.lastDonationDate ? new Date(initialData.lastDonationDate).toISOString().split('T')[0] : '',
      };
    })()
  });

  const watchDob = watch('dob');
  const watchWeight = watch('weightKg');

  useEffect(() => {
    if (watchDob && watchWeight) {
      const dobDate = new Date(watchDob);
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) age--;

      const weightNum = parseFloat(watchWeight);
      if (!isNaN(age) && !isNaN(weightNum)) {
        // Eligibility Criteria: 18-65 years old and at least 45kg
        const isEligible = age >= 18 && age <= 65 && weightNum >= 45;
        setValue('eligibilityStatus', isEligible ? 'eligible' : 'deferred');
      }
    }
  }, [watchDob, watchWeight, setValue]);

  useEffect(() => {
    if (initialData) {
      const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };

      reset({
        ...initialData,
        firstName: initialData.firstName || initialData.name?.firstName || '',
        middleName: initialData.middleName || initialData.name?.middleName || '',
        lastName: initialData.lastName || initialData.name?.lastName || '',
        addressLine1: initialData.addressLine1 || initialData.address?.line1 || '',
        addressLine2: initialData.addressLine2 || initialData.address?.line2 || '',
        city: initialData.city || initialData.address?.city || '',
        district: initialData.district || initialData.address?.district || '',
        state: initialData.state || initialData.address?.state || '',
        pincode: initialData.pincode || initialData.address?.pincode || '',
        dobDisplay: formatDate(initialData.dob),
        lastDonationDateDisplay: formatDate(initialData.lastDonationDate),
        dob: initialData.dob ? new Date(initialData.dob).toISOString().split('T')[0] : '',
        lastDonationDate: initialData.lastDonationDate ? new Date(initialData.lastDonationDate).toISOString().split('T')[0] : '',
      });
    } else {
      reset({
        donorId: '',
        firstName: '',
        middleName: '',
        lastName: '',
        uid: '',
        dob: '',
        sex: '',
        phone: '',
        email: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        district: '',
        state: '',
        pincode: '',
        occupation: '',
        weightKg: '',
        bloodGroup: '',
        rh: '',
        eligibilityStatus: '',
        lastDonationDate: '',
        dobDisplay: '',
        lastDonationDateDisplay: '',
      });
    }
  }, [initialData, reset]);

  const handleDobDisplayChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 8);
    let display = val;
    if (val.length > 4) {
      display = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4, 8)}`;
    } else if (val.length > 2) {
      display = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }
    
    setValue('dobDisplay', display);
    
    if (val.length === 8) {
      const d = val.slice(0, 2);
      const m = val.slice(2, 4);
      const y = val.slice(4, 8);
      setValue('dob', `${y}-${m}-${d}`);
    }
  };

  const handleLastDonationDateDisplayChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 8);
    let display = val;
    if (val.length > 4) {
      display = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4, 8)}`;
    } else if (val.length > 2) {
      display = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }
    
    setValue('lastDonationDateDisplay', display);
    
    if (val.length === 8) {
      const d = val.slice(0, 2);
      const m = val.slice(2, 4);
      const y = val.slice(4, 8);
      setValue('lastDonationDate', `${y}-${m}-${d}`);
    }
  };

  const validateDate = (value) => {
    if (!value) return true;
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(value)) return "Format must be DD/MM/YYYY";

    const parts = value.match(regex);
    const d = parseInt(parts[1], 10);
    const m = parseInt(parts[2], 10);
    const y = parseInt(parts[3], 10);

    if (m < 1 || m > 12) return "Invalid month (01-12)";
    const daysInMonth = new Date(y, m, 0).getDate();
    if (d < 1 || d > daysInMonth) return `Invalid day for month (01-${daysInMonth})`;

    const inputDate = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (inputDate > today) return "Date cannot be in the future";

    return true;
  };

  const handleFormSubmit = (data) => {
    // Transform data to match API structure
    const transformedData = {
      ...data,
      name: {
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
      },
      address: {
        line1: data.addressLine1,
        line2: data.addressLine2,
        city: data.city,
        district: data.district,
        state: data.state,
        pincode: data.pincode,
      },
      weightKg: Number(data.weightKg),
    };

    onSubmit(transformedData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Donor ID" required error={errors.donorId?.message}>
            <FormField.Input
              {...register('donorId', { required: 'Donor ID is required' })}
              placeholder="DNR-YY-MM-DD-HH-MM"
            />
          </FormField>

          <FormField label="UID (12 digits)" error={errors.uid?.message}>
            <FormField.Input
              {...register('uid', {
                pattern: {
                  value: /^\d{12}$/,
                  message: 'UID must be exactly 12 digits'
                }
              })}
              placeholder="123456789012"
              maxLength={12}
            />
          </FormField>
        </div>
      </div>

      {/* Personal Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <FormField label="First Name" required error={errors.firstName?.message}>
            <FormField.Input
              {...register('firstName', { required: 'First name is required' })}
            />
          </FormField>

          <FormField label="Middle Name" error={errors.middleName?.message}>
            <FormField.Input
              {...register('middleName')}
            />
          </FormField>

          <FormField label="Last Name" required error={errors.lastName?.message}>
            <FormField.Input
              {...register('lastName', { required: 'Last name is required' })}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Date of Birth" required error={errors.dobDisplay?.message}>
            <FormField.Input
              type="text"
              placeholder="DD/MM/YYYY"
              {...register('dobDisplay', { 
                required: 'Date of birth is required',
                validate: validateDate,
                onChange: handleDobDisplayChange
              })}
            />
          </FormField>

          <FormField label="Sex" required error={errors.sex?.message}>
            <FormField.Select
              {...register('sex', { required: 'Sex is required' })}
            >
              <option value="">Select</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </FormField.Select>
          </FormField>

          <FormField label="Weight (Kg)" required error={errors.weightKg?.message}>
            <FormField.Input
              type="number"
              min="1"
              {...register('weightKg', {
                required: 'Weight is required',
                min: { value: 1, message: 'Weight must be greater than 0' }
              })}
            />
          </FormField>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <FormField label="Phone (10 digits)" required error={errors.phone?.message}>
            <FormField.Input
              type="tel"
              placeholder="9876543210"
              maxLength={10}
              {...register('phone', {
                required: 'Phone is required',
                pattern: {
                  value: /^\d{10}$/,
                  message: 'Phone must be exactly 10 digits'
                }
              })}
            />
          </FormField>

          <FormField label="Email" error={errors.email?.message}>
            <FormField.Input
              type="email"
              {...register('email', {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email format'
                }
              })}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <FormField label="Address Line 1" error={errors.addressLine1?.message}>
            <FormField.Input
              {...register('addressLine1')}
            />
          </FormField>

          <FormField label="Address Line 2" error={errors.addressLine2?.message}>
            <FormField.Input
              {...register('addressLine2')}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField label="City" required error={errors.city?.message}>
            <FormField.Input
              {...register('city', { required: 'City is required' })}
            />
          </FormField>

          <FormField label="District" required error={errors.district?.message}>
            <FormField.Input
              {...register('district', { required: 'District is required' })}
            />
          </FormField>

          <FormField label="State" required error={errors.state?.message}>
            <FormField.Select
              {...register('state', { required: 'State is required' })}
            >
              <option value="">Select State</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </FormField.Select>
          </FormField>

          <FormField label="Pincode" required error={errors.pincode?.message}>
            <FormField.Input
              {...register('pincode', { required: 'Pincode is required' })}
            />
          </FormField>
        </div>
      </div>

      {/* Medical Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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

          <FormField label="Eligibility Status" required error={errors.eligibilityStatus?.message}>
            <FormField.Select
              {...register('eligibilityStatus', { required: 'Eligibility status is required' })}
            >
              <option value="">Select</option>
              <option value="eligible">Eligible</option>
              <option value="deferred">Deferred</option>
              <option value="temp-deferred">Temporarily Deferred</option>
            </FormField.Select>
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Occupation" error={errors.occupation?.message}>
            <FormField.Input
              {...register('occupation')}
            />
          </FormField>

          <FormField label="Last Donation Date" error={errors.lastDonationDateDisplay?.message}>
            <FormField.Input
              type="text"
              placeholder="DD/MM/YYYY"
              {...register('lastDonationDateDisplay', { 
                validate: validateDate,
                onChange: handleLastDonationDateDisplayChange
              })}
            />
          </FormField>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
        >
          {initialData ? 'Update Donor' : 'Create Donor'}
        </Button>
      </div>
    </form>
  );
};

export default DonorForm;
