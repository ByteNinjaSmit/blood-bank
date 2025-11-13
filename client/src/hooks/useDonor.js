import { useState, useEffect } from 'react';
import donorService from '@/services/donorService';
import campService from '@/services/campService';
import apiService from '@/services/api';
import { useAuth } from '@/store/auth';
import { toast } from 'sonner';

// Custom hook for donor operations - Single Responsibility
export const useDonor = () => {
  const { API, authorizationToken } = useAuth();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize API service
  useEffect(() => {
    if (API && authorizationToken) {
      apiService.initialize(API, authorizationToken);
    }
  }, [API, authorizationToken]);

  // Fetch donors with filters
  const fetchDonors = async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    const { data, error: apiError } = await donorService.listDonors(filters);
    
    if (apiError) {
      setError(apiError);
      toast.error(apiError);
    } else {
      setDonors(data.donors || []);
    }
    
    setLoading(false);
  };

  // Fetch donors for a specific camp (site)
  const fetchCampDonors = async (siteId) => {
    setLoading(true);
    setError(null);
    
    const { data, error: apiError } = await campService.getCampDonors(siteId);
    
    if (apiError) {
      setError(apiError);
      toast.error(apiError);
    } else {
      setDonors((data && data.data && data.data.donors) ? data.data.donors : []);
    }
    
    setLoading(false);
  };

  // Create new donor
  const createDonor = async (donorData) => {
    setLoading(true);
    setError(null);
    
    const { data, error: apiError } = await donorService.createDonor(donorData);
    
    if (apiError) {
      setError(apiError);
      toast.error(apiError);
      return { success: false, data: null };
    } else {
      setDonors(prev => [data.donor, ...prev]);
      toast.success('Donor created successfully');
      return { success: true, data: data.donor };
    }
    
    setLoading(false);
  };

  // Search donor
  const searchDonor = async (searchCriteria) => {
    setLoading(true);
    setError(null);
    
    const { data, error: apiError } = await donorService.searchDonor(searchCriteria);
    
    if (apiError) {
      setError(apiError);
      return { success: false, data: null };
    } else {
      return { success: true, data: data.donor };
    }
    
    setLoading(false);
  };

  // Update donor
  const updateDonor = async (id, updateData) => {
    setLoading(true);
    setError(null);
    
    const { data, error: apiError } = await donorService.updateDonor(id, updateData);
    
    if (apiError) {
      setError(apiError);
      toast.error(apiError);
      return { success: false };
    } else {
      setDonors(prev => prev.map(donor => 
        donor._id === id ? data.donor : donor
      ));
      toast.success('Donor updated successfully');
      return { success: true, data: data.donor };
    }
    
    setLoading(false);
  };

  // Delete donor
  const deleteDonor = async (id) => {
    setLoading(true);
    setError(null);
    
    const { error: apiError } = await donorService.deleteDonor(id);
    
    if (apiError) {
      setError(apiError);
      toast.error(apiError);
      return { success: false };
    } else {
      setDonors(prev => prev.filter(donor => donor._id !== id));
      toast.success('Donor deleted successfully');
      return { success: true };
    }
    
    setLoading(false);
  };

  return {
    donors,
    loading,
    error,
    fetchDonors,
    createDonor,
    searchDonor,
    updateDonor,
    deleteDonor,
    fetchCampDonors,
  };
};
