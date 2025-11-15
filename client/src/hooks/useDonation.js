import { useState, useEffect } from 'react';
import donationService from '@/services/donationService';
import campService from '@/services/campService';
import apiService from '@/services/api';
import { useAuth } from '@/store/auth';
import { toast } from 'sonner';

// Custom hook for donation operations - Single Responsibility
export const useDonation = () => {
  const { API, authorizationToken } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize API service
  useEffect(() => {
    if (API && authorizationToken) {
      apiService.initialize(API, authorizationToken);
    }
  }, [API, authorizationToken]);

  // Fetch donations with filters
  const fetchDonations = async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    const { data, error: apiError } = await donationService.listDonations(filters);
    
    if (apiError) {
      setError(apiError);
      toast.error(apiError);
    } else {
      setDonations(data.data || []);
    }
    
    setLoading(false);
  };

  // Get single donation details by ID (non-blocking for global loading state)
  const getDonationById = async (id) => {
    const { data, error: apiError } = await donationService.getDonationById(id);

    if (apiError) {
      toast.error(apiError);
      return { success: false, data: null };
    }

    return { success: true, data: data?.data || null };
  };

  // Fetch donations for a specific camp (site)
  const fetchCampDonations = async (siteId) => {
    setLoading(true);
    setError(null);
    
    const { data, error: apiError } = await campService.getCampDonations(siteId);
    
    if (apiError) {
      setError(apiError);
      toast.error(apiError);
    } else {
      setDonations((data && data.data && data.data.donations) ? data.data.donations : []);
    }
    
    setLoading(false);
  };

  // Create new donation
  const createDonation = async (donationData) => {
    setLoading(true);
    setError(null);
    
    const { data, error: apiError } = await donationService.createDonation(donationData);
    
    if (apiError) {
      setError(apiError);
      toast.error(apiError);
      return { success: false, data: null };
    } else {
      setDonations(prev => [data.data, ...prev]);
      toast.success('Donation created successfully');
      return { success: true, data: data.data };
    }
    
    setLoading(false);
  };

  // Update donation
  const updateDonation = async (id, updateData) => {
    setLoading(true);
    setError(null);
    
    const { data, error: apiError } = await donationService.updateDonation(id, updateData);
    
    if (apiError) {
      setError(apiError);
      toast.error(apiError);
      return { success: false };
    } else {
      setDonations(prev => prev.map(donation => 
        donation._id === id ? data.data : donation
      ));
      toast.success('Donation updated successfully');
      return { success: true, data: data.data };
    }
    
    setLoading(false);
  };

  // Update donation status
  const updateDonationStatus = async (id, status) => {
    setLoading(true);
    setError(null);
    
    const { data, error: apiError } = await donationService.updateDonationStatus(id, status);
    
    if (apiError) {
      setError(apiError);
      toast.error(apiError);
      return { success: false };
    } else {
      setDonations(prev => prev.map(donation => 
        donation._id === id ? { ...donation, status } : donation
      ));
      toast.success('Donation status updated successfully');
      return { success: true };
    }
    
    setLoading(false);
  };

  // Delete donation
  const deleteDonation = async (id) => {
    setLoading(true);
    setError(null);
    
    const { error: apiError } = await donationService.deleteDonation(id);
    
    if (apiError) {
      setError(apiError);
      toast.error(apiError);
      return { success: false };
    } else {
      setDonations(prev => prev.filter(donation => donation._id !== id));
      toast.success('Donation deleted successfully');
      return { success: true };
    }
    
    setLoading(false);
  };

  return {
    donations,
    loading,
    error,
    fetchDonations,
    createDonation,
    updateDonation,
    updateDonationStatus,
    deleteDonation,
    fetchCampDonations,
    getDonationById,
  };
};
