import React, { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/table'
import { Badge } from '../../components/ui/badge'

function HospitalRequests() {
  // Mock data for hospital blood requests
  const [requests, setRequests] = useState([
    { id: 1, hospital: 'City General Hospital', bloodType: 'A+', units: 5, urgency: 'High', status: 'Pending', requestDate: '2023-06-15' },
    { id: 2, hospital: 'Memorial Medical Center', bloodType: 'O-', units: 3, urgency: 'Critical', status: 'Approved', requestDate: '2023-06-14' },
    { id: 3, hospital: 'St. Mary\'s Hospital', bloodType: 'B+', units: 2, urgency: 'Medium', status: 'Fulfilled', requestDate: '2023-06-13' },
    { id: 4, hospital: 'University Hospital', bloodType: 'AB+', units: 1, urgency: 'Low', status: 'Pending', requestDate: '2023-06-12' },
    { id: 5, hospital: 'Children\'s Medical Center', bloodType: 'O+', units: 4, urgency: 'High', status: 'Approved', requestDate: '2023-06-11' },
  ])

  // Function to get badge color based on urgency
  const getUrgencyBadgeVariant = (urgency) => {
    switch (urgency) {
      case 'Critical': return 'destructive'
      case 'High': return 'default'
      case 'Medium': return 'secondary'
      case 'Low': return 'outline'
      default: return 'outline'
    }
  }

  // Function to get badge color based on status
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Approved': return 'default'
      case 'Pending': return 'secondary'
      case 'Fulfilled': return 'outline'
      case 'Rejected': return 'destructive'
      default: return 'outline'
    }
  }

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
                    <Badge variant={getUrgencyBadgeVariant(request.urgency)}>
                      {request.urgency}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(request.status)}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{request.requestDate}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">View</Button>
                      {request.status === 'Pending' && (
                        <Button variant="outline" size="sm">Process</Button>
                      )}
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