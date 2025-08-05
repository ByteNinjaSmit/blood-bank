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
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const donorData = mockDonors.find(d => d.id === parseInt(id))
      if (donorData) {
        setDonor(donorData)
        const history = mockDonationHistory.filter(d => d.donorId === parseInt(id))
        setDonationHistory(history)
      }
      setLoading(false)
    }, 100)
  }, [id])
  
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this donor? This action cannot be undone.')) {
      // In a real app, you would delete the donor via API
      navigate('/donor')
    }
  }
  
  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading donor details...</p>
        </div>
      </div>
    )
  }
  
  if (!donor) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-lg font-semibold text-muted-foreground mb-4">Donor not found</p>
          <Button onClick={() => navigate('/donor')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Donor List
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/donor')} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Donor Details</h2>
            <p className="text-muted-foreground mt-1">View and manage donor information</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/donor/edit/${id}`)}
            className="flex-1 sm:flex-none"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            className="flex-1 sm:flex-none"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium w-1/3">Name</TableCell>
                  <TableCell>{donor.name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Age</TableCell>
                  <TableCell>{donor.age} years</TableCell>
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
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      donor.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {donor.status}
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Last Donation</TableCell>
                  <TableCell>{donor.lastDonation}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium w-1/3">Phone</TableCell>
                  <TableCell>
                    <a href={`tel:${donor.phone}`} className="text-blue-600 hover:underline">
                      {donor.phone}
                    </a>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Email</TableCell>
                  <TableCell>
                    <a href={`mailto:${donor.email}`} className="text-blue-600 hover:underline">
                      {donor.email}
                    </a>
                  </TableCell>
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
      
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Donation History</CardTitle>
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Donation
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {donationHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableBody>
                  {donationHistory.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell className="font-medium min-w-[100px]">{donation.date}</TableCell>
                      <TableCell className="min-w-[120px]">Hemoglobin: {donation.hemoglobin}</TableCell>
                      <TableCell className="min-w-[100px]">BP: {donation.bloodPressure}</TableCell>
                      <TableCell className="min-w-[100px]">Weight: {donation.weight}</TableCell>
                      <TableCell className="min-w-[80px]">
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          {donation.status}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-[120px]">
                        <Button variant="ghost" size="sm">
                          <Activity className="mr-2 h-4 w-4" />
                          View Report
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">No donation history available</p>
              <p className="text-sm">This donor hasn't made any donations yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DonorDetails