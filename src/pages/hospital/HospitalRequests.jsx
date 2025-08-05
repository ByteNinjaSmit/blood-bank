import React, { useState } from 'react'
import { Button } from '../../client/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../client/src/components/ui/card'
import { Input } from '../../client/src/components/ui/input'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../client/src/components/ui/table'

function HospitalRequests() {
  // Mock data for hospital blood requests
  const [requests, setRequests] = useState([
    { id: 1, hospital: 'City General Hospital', bloodType: 'O+', units: 5, urgency: 'High', status: 'Pending', requestDate: '2023-06-15' },
    { id: 2, hospital: 'St. Mary Medical Center', bloodType: 'A-', units: 3, urgency: 'Medium', status: 'Approved', requestDate: '2023-06-14' },
    { id: 3, hospital: 'County Hospital', bloodType: 'B+', units: 2, urgency: 'Low', status: 'Fulfilled', requestDate: '2023-06-13' },
    { id: 4, hospital: 'Children\'s Hospital', bloodType: 'AB+', units: 1, urgency: 'High', status: 'Pending', requestDate: '2023-06-12' },
    { id: 5, hospital: 'Veterans Medical Center', bloodType: 'O-', units: 4, urgency: 'Medium', status: 'Approved', requestDate: '2023-06-11' },
  ])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Hospital Blood Requests</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Input placeholder="Search requests..." className="w-64" />
          <Button>Search</Button>
        </div>
        <Button>New Request</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Current Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital</TableHead>
                <TableHead>Blood Type</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.hospital}</TableCell>
                  <TableCell>{request.bloodType}</TableCell>
                  <TableCell>{request.units}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${request.urgency === 'High' ? 'bg-red-100 text-red-800' : request.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {request.urgency}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${request.status === 'Pending' ? 'bg-blue-100 text-blue-800' : request.status === 'Approved' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                      {request.status}
                    </span>
                  </TableCell>
                  <TableCell>{request.requestDate}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">View</Button>
                      <Button variant="outline" size="sm">Update</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default HospitalRequests