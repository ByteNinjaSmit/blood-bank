import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'

import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableRow } from '../../components/ui/table'

// Mock data for blood samples
const mockSamples = [
  { id: 1, donorId: 1, donorName: 'John Doe', bloodType: 'O+', collectionDate: '2023-10-15', expiryDate: '2023-11-15', status: 'Tested', testResults: { hemoglobin: '14.5 g/dL', hbsag: 'Negative', hiv: 'Negative', hcv: 'Negative', vdrl: 'Negative' } },
  { id: 2, donorId: 2, donorName: 'Jane Smith', bloodType: 'A-', collectionDate: '2023-09-22', expiryDate: '2023-10-22', status: 'Processing', testResults: { hemoglobin: '13.5 g/dL', hbsag: 'Negative', hiv: 'Negative', hcv: 'Negative', vdrl: 'Negative' } },
  { id: 3, donorId: 3, donorName: 'Robert Johnson', bloodType: 'B+', collectionDate: '2023-08-05', expiryDate: '2023-09-05', status: 'Expired', testResults: { hemoglobin: '15.0 g/dL', hbsag: 'Negative', hiv: 'Negative', hcv: 'Negative', vdrl: 'Negative' } },
  { id: 4, donorId: 4, donorName: 'Emily Davis', bloodType: 'AB+', collectionDate: '2023-11-10', expiryDate: '2023-12-10', status: 'Quarantined', testResults: { hemoglobin: '12.5 g/dL', hbsag: 'Positive', hiv: 'Negative', hcv: 'Negative', vdrl: 'Negative' } },
  { id: 5, donorId: 5, donorName: 'Michael Wilson', bloodType: 'O-', collectionDate: '2023-10-30', expiryDate: '2023-11-30', status: 'Available', testResults: { hemoglobin: '14.0 g/dL', hbsag: 'Negative', hiv: 'Negative', hcv: 'Negative', vdrl: 'Negative' } },
]

function SampleDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [sample, setSample] = useState(null)
  
  useEffect(() => {
    // In a real app, you would fetch the sample data from an API
    const sampleData = mockSamples.find(s => s.id === parseInt(id))
    if (sampleData) {
      setSample(sampleData)
    }
  }, [id])
  
  if (!sample) {
    return <div>Loading...</div>
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
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/lab')} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">Sample Details</h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate(`/lab/edit/${id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => {
            // In a real app, you would delete the sample via API
            navigate('/lab')
          }}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sample Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Donor Name</TableCell>
                  <TableCell>{sample.donorName}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Blood Type</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      {sample.bloodType}
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Collection Date</TableCell>
                  <TableCell>{sample.collectionDate}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Expiry Date</TableCell>
                  <TableCell>{sample.expiryDate}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Status</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(sample.status)}`}>
                      {sample.status === 'Quarantined' && <AlertTriangle className="mr-1 h-3 w-3" />}
                      {sample.status === 'Available' && <CheckCircle className="mr-1 h-3 w-3" />}
                      {sample.status}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Hemoglobin</TableCell>
                  <TableCell>{sample.testResults.hemoglobin}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">HBsAg (Hepatitis B)</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sample.testResults.hbsag === 'Negative' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {sample.testResults.hbsag}
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">HIV</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sample.testResults.hiv === 'Negative' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {sample.testResults.hiv}
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">HCV (Hepatitis C)</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sample.testResults.hcv === 'Negative' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {sample.testResults.hcv}
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">VDRL (Syphilis)</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sample.testResults.vdrl === 'Negative' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {sample.testResults.vdrl}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Processing History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Collection</TableCell>
                <TableCell>{sample.collectionDate}</TableCell>
                <TableCell>Completed</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Testing</TableCell>
                <TableCell>{new Date(new Date(sample.collectionDate).getTime() + 86400000).toISOString().split('T')[0]}</TableCell>
                <TableCell>Completed</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Processing</TableCell>
                <TableCell>{new Date(new Date(sample.collectionDate).getTime() + 172800000).toISOString().split('T')[0]}</TableCell>
                <TableCell>{sample.status === 'Processing' ? 'In Progress' : sample.status === 'Quarantined' ? 'Failed' : 'Completed'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Storage</TableCell>
                <TableCell>{new Date(new Date(sample.collectionDate).getTime() + 259200000).toISOString().split('T')[0]}</TableCell>
                <TableCell>{sample.status === 'Processing' || sample.status === 'Tested' ? 'Pending' : sample.status === 'Quarantined' ? 'N/A' : 'Completed'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default SampleDetails