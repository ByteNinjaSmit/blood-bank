import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react'

import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

import DonorForm from './DonorForm'
import DonorDetails from './DonorDetails'

// Mock data for donors
const mockDonors = [
  { id: 1, name: 'John Snow', age: 28, bloodType: 'O+', phone: '9876543210', email: 'john@example.com', address: '123 Main St', city: 'Mumbai', lastDonation: '2023-10-15', status: 'Active' },
  { id: 2, name: 'Jaime Lannister', age: 35, bloodType: 'A-', phone: '8765432109', email: 'jane@example.com', address: '456 Park Ave', city: 'Delhi', lastDonation: '2023-09-22', status: 'Active' },
  { id: 3, name: 'Robert Baratheon', age: 42, bloodType: 'B+', phone: '7654321098', email: 'robert@example.com', address: '789 Oak St', city: 'Bangalore', lastDonation: '2023-08-05', status: 'Inactive' },
  { id: 4, name: 'Emily Davis', age: 29, bloodType: 'AB+', phone: '6543210987', email: 'emily@example.com', address: '101 Pine St', city: 'Chennai', lastDonation: '2023-11-10', status: 'Active' },
  { id: 5, name: 'Michael Wilson', age: 45, bloodType: 'O-', phone: '5432109876', email: 'michael@example.com', address: '202 Elm St', city: 'Hyderabad', lastDonation: '2023-10-30', status: 'Active' },
]

function DonorList() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [donors, setDonors] = useState(mockDonors)
  
  const filteredDonors = donors.filter(donor => 
    donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.bloodType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.city.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const handleDelete = (id) => {
    // In a real app, you would delete the donor via API
    setDonors(donors.filter(donor => donor.id !== id))
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Donor Management</h2>
        <Button onClick={() => navigate('/donor/add')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Donor
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Donor List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search donors..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Blood Type</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Last Donation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDonors.length > 0 ? (
                  filteredDonors.map((donor) => (
                    <TableRow key={donor.id}>
                      <TableCell className="font-medium">{donor.name}</TableCell>
                      <TableCell>{donor.age}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          {donor.bloodType}
                        </span>
                      </TableCell>
                      <TableCell>{donor.city}</TableCell>
                      <TableCell>{donor.lastDonation}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${donor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {donor.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/donor/${donor.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/donor/edit/${donor.id}`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(donor.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No donors found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DonorManagement() {
  return (
    <Routes>
      <Route index element={<DonorList />} />
      <Route path="add" element={<DonorForm />} />
      <Route path="edit/:id" element={<DonorForm />} />
      <Route path=":id" element={<DonorDetails />} />
    </Routes>
  )
}

export default DonorManagement