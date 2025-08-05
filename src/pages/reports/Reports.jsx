import React, { useState } from 'react'
import { Button } from '../../client/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../client/src/components/ui/card'
import { Input } from '../../client/src/components/ui/input'

function Reports() {
  const [selectedReport, setSelectedReport] = useState('donations')
  const [dateRange, setDateRange] = useState({ start: '2023-06-01', end: '2023-06-30' })
  
  const handleReportTypeChange = (type) => {
    setSelectedReport(type)
  }
  
  const handleDateChange = (e, field) => {
    setDateRange({
      ...dateRange,
      [field]: e.target.value
    })
  }
  
  const generateReport = () => {
    // In a real application, this would make an API call to generate the report
    console.log(`Generating ${selectedReport} report for ${dateRange.start} to ${dateRange.end}`)
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Report Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Report Type</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="donations-report"
                      name="report-type"
                      checked={selectedReport === 'donations'}
                      onChange={() => handleReportTypeChange('donations')}
                      className="mr-2"
                    />
                    <label htmlFor="donations-report">Donations Report</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="inventory-report"
                      name="report-type"
                      checked={selectedReport === 'inventory'}
                      onChange={() => handleReportTypeChange('inventory')}
                      className="mr-2"
                    />
                    <label htmlFor="inventory-report">Inventory Report</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="hospital-report"
                      name="report-type"
                      checked={selectedReport === 'hospital'}
                      onChange={() => handleReportTypeChange('hospital')}
                      className="mr-2"
                    />
                    <label htmlFor="hospital-report">Hospital Requests Report</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="donor-report"
                      name="report-type"
                      checked={selectedReport === 'donor'}
                      onChange={() => handleReportTypeChange('donor')}
                      className="mr-2"
                    />
                    <label htmlFor="donor-report">Donor Demographics Report</label>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => handleDateChange(e, 'start')}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">End Date</label>
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => handleDateChange(e, 'end')}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Format</label>
                <div className="flex space-x-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="pdf-format"
                      name="report-format"
                      defaultChecked
                      className="mr-2"
                    />
                    <label htmlFor="pdf-format">PDF</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="excel-format"
                      name="report-format"
                      className="mr-2"
                    />
                    <label htmlFor="excel-format">Excel</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="csv-format"
                      name="report-format"
                      className="mr-2"
                    />
                    <label htmlFor="csv-format">CSV</label>
                  </div>
                </div>
              </div>
              
              <Button onClick={generateReport} className="w-full">
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedReport === 'donations' && 'Donations Report'}
                {selectedReport === 'inventory' && 'Inventory Report'}
                {selectedReport === 'hospital' && 'Hospital Requests Report'}
                {selectedReport === 'donor' && 'Donor Demographics Report'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center border border-dashed border-gray-300 rounded-md">
                <p className="text-gray-500">Select options and generate a report to view it here</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated On</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">Donations_June_2023</td>
                      <td className="px-6 py-4 whitespace-nowrap">Donations</td>
                      <td className="px-6 py-4 whitespace-nowrap">Jun 1 - Jun 30, 2023</td>
                      <td className="px-6 py-4 whitespace-nowrap">Jul 1, 2023</td>
                      <td className="px-6 py-4 whitespace-nowrap space-x-2">
                        <Button variant="outline" size="sm">View</Button>
                        <Button variant="outline" size="sm">Download</Button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">Inventory_Q2_2023</td>
                      <td className="px-6 py-4 whitespace-nowrap">Inventory</td>
                      <td className="px-6 py-4 whitespace-nowrap">Apr 1 - Jun 30, 2023</td>
                      <td className="px-6 py-4 whitespace-nowrap">Jul 2, 2023</td>
                      <td className="px-6 py-4 whitespace-nowrap space-x-2">
                        <Button variant="outline" size="sm">View</Button>
                        <Button variant="outline" size="sm">Download</Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Reports