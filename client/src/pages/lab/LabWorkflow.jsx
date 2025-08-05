import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { Plus, Search, Eye, Edit, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'

import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

import SampleDetails from './SampleDetails'
import SampleForm from './SampleForm'

// Mock data for blood samples
const mockSamples = [
  { id: 1, donorId: 1, donorName: 'John Doe', bloodType: 'O+', collectionDate: '2023-10-15', expiryDate: '2023-11-15', status: 'Tested', testResults: { hemoglobin: '14.5 g/dL', hbsag: 'Negative', hiv: 'Negative', hcv: 'Negative', vdrl: 'Negative' } },
  { id: 2, donorId: 2, donorName: 'Jane Smith', bloodType: 'A-', collectionDate: '2023-09-22', expiryDate: '2023-10-22', status: 'Processing', testResults: { hemoglobin: '13.5 g/dL', hbsag: 'Negative', hiv: 'Negative', hcv: 'Negative', vdrl: 'Negative' } },
  { id: 3, donorId: 3, donorName: 'Robert Johnson', bloodType: 'B+', collectionDate: '2023-08-05', expiryDate: '2023-09-05', status: 'Expired', testResults: { hemoglobin: '15.0 g/dL', hbsag: 'Negative', hiv: 'Negative', hcv: 'Negative', vdrl: 'Negative' } },
  { id: 4, donorId: 4, donorName: 'Emily Davis', bloodType: 'AB+', collectionDate: '2023-11-10', expiryDate: '2023-12-10', status: 'Quarantined', testResults: { hemoglobin: '12.5 g/dL', hbsag: 'Positive', hiv: 'Negative', hcv: 'Negative', vdrl: 'Negative' } },
  { id: 5, donorId: 5, donorName: 'Michael Wilson', bloodType: 'O-', collectionDate: '2023-10-30', expiryDate: '2023-11-30', status: 'Available', testResults: { hemoglobin: '14.0 g/dL', hbsag: 'Negative', hiv: 'Negative', hcv: 'Negative', vdrl: 'Negative' } },
]

function SampleList() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [samples, setSamples] = useState(mockSamples)
  
  const filteredSamples = samples.filter(sample => 
    sample.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sample.bloodType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sample.status.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const handleDelete = (id) => {
    // In a real app, you would delete the sample via API
    setSamples(samples.filter(sample => sample.id !== id))
  }
  
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Available':
        return 'bg-green-100 text-green-800'
      case 'Processing':
        return 'bg-blue-100 text-blue-800'
      case 'Tested':
        return 'bg-purple-100 text-purple-800'
      case 'Quarantined':
        return 'bg-yellow-100 text-yellow-800'
      case 'Expired':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Lab Workflow</h2>
        <Button onClick={() => navigate('/lab/add')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Sample
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Blood Sample List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search samples..."
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
                  <TableHead>Donor Name</TableHead>
                  <TableHead>Blood Type</TableHead>
                  <TableHead>Collection Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSamples.length > 0 ? (
                  filteredSamples.map((sample) => (
                    <TableRow key={sample.id}>
                      <TableCell className="font-medium">{sample.donorName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          {sample.bloodType}
                        </span>
                      </TableCell>
                      <TableCell>{sample.collectionDate}</TableCell>
                      <TableCell>{sample.expiryDate}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(sample.status)}`}>
                          {sample.status === 'Quarantined' && <AlertTriangle className="mr-1 h-3 w-3" />}
                          {sample.status === 'Available' && <CheckCircle className="mr-1 h-3 w-3" />}
                          {sample.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/lab/${sample.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/lab/edit/${sample.id}`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(sample.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No samples found.
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

function LabWorkflow() {
  return (
    <Routes>
      <Route index element={<SampleList />} />
      <Route path="add" element={<SampleForm />} />
      <Route path="edit/:id" element={<SampleForm />} />
      <Route path=":id" element={<SampleDetails />} />
    </Routes>
  )
}

export default LabWorkflow