import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Calendar, Activity } from 'lucide-react'

import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableRow } from '../../components/ui/table'

// Mock data for donors
const mockDonors = [
  { id: 1, name: 'John Snow', age: 28, bloodType: 'O+', phone: '9876543210', email: 'john@example.com', address: '123 Main St', city: 'Mumbai', lastDonation: '2023-10-15', status: 'Active' },
  { id: 2, name: 'Robert Baratheon', age: 35, bloodType: 'A-', phone: '8765432109', email: 'jane@example.com', address: '456 Park Ave', city: 'Delhi', lastDonation: '2023-09-22', status: 'Active' },
  { id: 3, name: 'Jaime Lannister', age: 42, bloodType: 'B+', phone: '7654321098', email: 'robert@example.com', address: '789 Oak St', city: 'Bangalore', lastDonation: '2023-08-05', status: 'Inactive' },
]

// Mock donation history
const mockDonationHistory = [
  { id: 1, donorId: 1, date: '2023-10-15', hemoglobin: '14.5 g/dL', bloodPressure: '120/80', weight: '75 kg', status: 'Successful' },
  { id: 2, donorId: 1, date: '2023-07-20', hemoglobin: '14.2 g/dL', bloodPressure: '118/78', weight: '74 kg', status: 'Successful' },
  { id: 3, donorId: 1, date: '2023-04-05', hemoglobin: '13.8 g/dL', bloodPressure: '122/82', weight: '76 kg', status: 'Successful' },
  { id: 4, donorId: 2, date: '2023-09-22', hemoglobin: '13.5 g/dL', bloodPressure: '110/70', weight: '65 kg', status: 'Successful' },
  { id: 5, donorId: 3, date: '2023-08-05', hemoglobin: '15.0 g/dL', bloodPressure: '130/85', weight: '80 kg', status: 'Successful' },
]

function DonorDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [donor, setDonor] = useState(null)
  const [donationHistory, setDonationHistory] = useState([])
  
  useEffect(() => {
    // In a real app, you would fetch the donor data from an API
    const donorData = mockDonors.find(d => d.id === parseInt(id))
    if (donorData) {
      setDonor(donorData)
      // Get donation history for this donor
      const history = mockDonationHistory.filter(d => d.donorId === parseInt(id))
      setDonationHistory(history)
    }
  }, [id])
  
  if (!donor) {
    return <div>Loading...</div>
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/donor')} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Donor Details</h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate(`/donor/edit/${id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => {
            // In a real app, you would delete the donor via API
            navigate('/donor')
          }}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Name</TableCell>
                  <TableCell>{donor.name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Age</TableCell>
                  <TableCell>{donor.age}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Blood Type</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      {donor.bloodType}
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Status</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${donor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {donor.status}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Phone</TableCell>
                  <TableCell>{donor.phone}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Email</TableCell>
                  <TableCell>{donor.email}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Address</TableCell>
                  <TableCell>{donor.address}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">City</TableCell>
                  <TableCell>{donor.city}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Donation History</CardTitle>
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Donation
          </Button>
        </CardHeader>
        <CardContent>
          {donationHistory.length > 0 ? (
            <Table>
              <TableBody>
                {donationHistory.map((donation) => (
                  <TableRow key={donation.id}>
                    <TableCell className="font-medium">{donation.date}</TableCell>
                    <TableCell>Hemoglobin: {donation.hemoglobin}</TableCell>
                    <TableCell>BP: {donation.bloodPressure}</TableCell>
                    <TableCell>Weight: {donation.weight}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        {donation.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Activity className="mr-2 h-4 w-4" />
                        View Report
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              No donation history available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DonorDetails