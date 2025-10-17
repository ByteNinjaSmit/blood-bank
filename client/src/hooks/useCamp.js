import { useState, useEffect } from 'react';
import campService from '@/services/campService';
import apiService from '@/services/api';
import { useAuth } from '@/store/auth';
import { toast } from 'sonner';

// Custom hook for camp operations - Single Responsibility
export const useCamp = () => {
  const { API, authorizationToken } = useAuth();
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize API service
  useEffect(() => {
    if (API && authorizationToken) {
      apiService.initialize(API, authorizationToken);
    }
  }, [API, authorizationToken]);

  // Fetch camps with filters
  const fetchCamps = async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: apiError } = await campService.listCamps(filters);
      
      if (apiError) {
        setError(apiError);
        toast.error(apiError);
      } else {
        setCamps(data.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get camp by ID
  const getCampById = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: apiError } = await campService.getCampById(id);
      
      if (apiError) {
        setError(apiError);
        toast.error(apiError);
        return { success: false, data: null };
      } else {
        return { success: true, data: data.site };
      }
    } finally {
      setLoading(false);
    }
  };

  // Create new camp
  const createCamp = async (campData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: apiError } = await campService.createCamp(campData);
      
      if (apiError) {
        setError(apiError);
        toast.error(apiError);
        return { success: false, data: null };
      } else {
        setCamps(prev => [data.site, ...prev]);
        toast.success('Camp created successfully');
        return { success: true, data: data.site };
      }
    } finally {
      setLoading(false);
    }
  };

  // Update camp
  const updateCamp = async (id, updateData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: apiError } = await campService.updateCamp(id, updateData);
      
      if (apiError) {
        setError(apiError);
        toast.error(apiError);
        return { success: false };
      } else {
        setCamps(prev => prev.map(camp => 
          camp._id === id ? data.site : camp
        ));
        toast.success('Camp updated successfully');
        return { success: true, data: data.site };
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete camp
  const deleteCamp = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error: apiError } = await campService.deleteCamp(id);
      
      if (apiError) {
        setError(apiError);
        toast.error(apiError);
        return { success: false };
      } else {
        setCamps(prev => prev.filter(camp => camp._id !== id));
        toast.success('Camp deleted successfully');
        return { success: true };
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    camps,
    loading,
    error,
    fetchCamps,
    getCampById,
    createCamp,
    updateCamp,
    deleteCamp,
  };
};
