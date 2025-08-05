import React, { useState } from 'react'
import { Button } from '../../client/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../client/src/components/ui/card'

function BulkUpload() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState(null)
  
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
      setUploadStatus(null)
    }
  }
  
  const handleUpload = () => {
    if (!selectedFile) {
      setUploadStatus({ success: false, message: 'Please select a file first' })
      return
    }
    
    // Simulate upload process
    setUploadStatus({ success: true, message: 'File uploaded successfully. Processing data...' })
    
    // In a real application, you would send the file to the server here
    // and handle the response accordingly
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Bulk Data Upload</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Donor Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload a CSV file containing donor information. The file should include columns for name, contact details, blood type, and donation history.
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="donor-file-upload"
              />
              <label
                htmlFor="donor-file-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-800"
              >
                Click to select a CSV file
              </label>
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected file: {selectedFile.name}
                </p>
              )}
            </div>
            <Button onClick={handleUpload} className="w-full">
              Upload and Process
            </Button>
            {uploadStatus && (
              <div className={`p-3 rounded-md ${uploadStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {uploadStatus.message}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Upload Inventory Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Upload a CSV file containing blood inventory information. The file should include columns for blood type, units available, and expiration dates.
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
              <input
                type="file"
                accept=".csv"
                className="hidden"
                id="inventory-file-upload"
              />
              <label
                htmlFor="inventory-file-upload"
                className="cursor-pointer text-blue-600 hover:text-blue-800"
              >
                Click to select a CSV file
              </label>
            </div>
            <Button className="w-full">
              Upload and Process
            </Button>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Upload History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">donors_june_2023.csv</td>
                    <td className="px-6 py-4 whitespace-nowrap">Donor Data</td>
                    <td className="px-6 py-4 whitespace-nowrap">2023-06-15</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Completed</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button variant="outline" size="sm">View Details</Button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">inventory_june_2023.csv</td>
                    <td className="px-6 py-4 whitespace-nowrap">Inventory Data</td>
                    <td className="px-6 py-4 whitespace-nowrap">2023-06-14</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Completed</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button variant="outline" size="sm">View Details</Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default BulkUpload