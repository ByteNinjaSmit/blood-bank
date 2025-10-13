import React, { useState } from 'react';
import { useAuth } from '@/store/auth';
import { useCamp } from '@/hooks/useCamp';
import Button from '@/components/shared/Button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const TestAPI = () => {
  const { API, authorizationToken } = useAuth();
  const { fetchCamps, camps, loading, error } = useCamp();
  const [testResult, setTestResult] = useState('');

  const testAPI = async () => {
    setTestResult('Testing API connection...');
    
    try {
      // Test basic API call
      const response = await fetch(`${API}/health`, {
        method: 'GET',
        headers: {
          'Authorization': authorizationToken,
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResult(`✅ API Health Check: ${JSON.stringify(data, null, 2)}`);
      } else {
        setTestResult(`❌ API Health Check failed: ${response.status}`);
      }
    } catch (err) {
      setTestResult(`❌ API Error: ${err.message}`);
    }
  };

  const testCamps = async () => {
    setTestResult('Testing camps API...');
    await fetchCamps();
    if (camps.length > 0) {
      setTestResult(`✅ Found ${camps.length} camps`);
    } else {
      setTestResult('⚠️ No camps found or API error');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">API Test</h2>
      
      <div className="mb-4">
        <p><strong>API URL:</strong> {API}</p>
        <p><strong>Token:</strong> {authorizationToken ? 'Present' : 'Missing'}</p>
      </div>

      <div className="flex gap-4 mb-4">
        <Button onClick={testAPI}>
          Test Health Check
        </Button>
        <Button onClick={testCamps}>
          Test Camps API
        </Button>
      </div>

      {loading && <LoadingSpinner message="Testing API..." />}
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {testResult && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <pre className="text-sm">{testResult}</pre>
        </div>
      )}

      {camps.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Camps Found:</h3>
          <ul className="list-disc list-inside">
            {camps.map((camp, index) => (
              <li key={index}>{camp.name} (ID: {camp._id})</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TestAPI;
