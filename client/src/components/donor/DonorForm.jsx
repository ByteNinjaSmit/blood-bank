import React, { useState } from 'react';
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
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
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
    }
  });

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
          <FormField label="Date of Birth" required error={errors.dob?.message}>
            <FormField.Input
              type="date"
              {...register('dob', { required: 'Date of birth is required' })}
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

          <FormField label="Last Donation Date" error={errors.lastDonationDate?.message}>
            <FormField.Input
              type="date"
              {...register('lastDonationDate')}
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
