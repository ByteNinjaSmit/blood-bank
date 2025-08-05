import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Save, ArrowLeft } from 'lucide-react'

import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form'

// Mock data for blood samples
const mockSamples = [
  { id: 1, donorId: 1, donorName: 'John Doe', bloodType: 'O+', collectionDate: '2023-10-15', expiryDate: '2023-11-15', status: 'Tested', testResults: { hemoglobin: '14.5 g/dL', hbsag: 'Negative', hiv: 'Negative', hcv: 'Negative', vdrl: 'Negative' } },
  { id: 2, donorId: 2, donorName: 'Jane Smith', bloodType: 'A-', collectionDate: '2023-09-22', expiryDate: '2023-10-22', status: 'Processing', testResults: { hemoglobin: '13.5 g/dL', hbsag: 'Negative', hiv: 'Negative', hcv: 'Negative', vdrl: 'Negative' } },
  { id: 3, donorId: 3, donorName: 'Robert Johnson', bloodType: 'B+', collectionDate: '2023-08-05', expiryDate: '2023-09-05', status: 'Expired', testResults: { hemoglobin: '15.0 g/dL', hbsag: 'Negative', hiv: 'Negative', hcv: 'Negative', vdrl: 'Negative' } },
  { id: 4, donorId: 4, donorName: 'Emily Davis', bloodType: 'AB+', collectionDate: '2023-11-10', expiryDate: '2023-12-10', status: 'Quarantined', testResults: { hemoglobin: '12.5 g/dL', hbsag: 'Positive', hiv: 'Negative', hcv: 'Negative', vdrl: 'Negative' } },
  { id: 5, donorId: 5, donorName: 'Michael Wilson', bloodType: 'O-', collectionDate: '2023-10-30', expiryDate: '2023-11-30', status: 'Available', testResults: { hemoglobin: '14.0 g/dL', hbsag: 'Negative', hiv: 'Negative', hcv: 'Negative', vdrl: 'Negative' } },
]

// Mock data for donors
const mockDonors = [
  { id: 1, name: 'John Doe', bloodType: 'O+' },
  { id: 2, name: 'Jane Smith', bloodType: 'A-' },
  { id: 3, name: 'Robert Johnson', bloodType: 'B+' },
  { id: 4, name: 'Emily Davis', bloodType: 'AB+' },
  { id: 5, name: 'Michael Wilson', bloodType: 'O-' },
]

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const sampleStatuses = ['Processing', 'Tested', 'Quarantined', 'Available', 'Expired']
const testResults = ['Positive', 'Negative', 'Inconclusive']

function SampleForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id
  
  const form = useForm({
    defaultValues: {
      donorId: '',
      bloodType: '',
      collectionDate: '',
      expiryDate: '',
      status: 'Processing',
      hemoglobin: '',
      hbsag: 'Negative',
      hiv: 'Negative',
      hcv: 'Negative',
      vdrl: 'Negative'
    }
  })
  
  useEffect(() => {
    if (isEditMode) {
      // In a real app, you would fetch the sample data from an API
      const sample = mockSamples.find(s => s.id === parseInt(id))
      if (sample) {
        form.reset({
          donorId: sample.donorId.toString(),
          bloodType: sample.bloodType,
          collectionDate: sample.collectionDate,
          expiryDate: sample.expiryDate,
          status: sample.status,
          hemoglobin: sample.testResults.hemoglobin,
          hbsag: sample.testResults.hbsag,
          hiv: sample.testResults.hiv,
          hcv: sample.testResults.hcv,
          vdrl: sample.testResults.vdrl
        })
      }
    }
  }, [id, isEditMode, form])
  
  const onSubmit = (data) => {
    console.log('Form submitted:', data)
    // In a real app, you would save the data to an API
    navigate('/lab')
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => navigate('/lab')} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">
          {isEditMode ? 'Edit Sample' : 'Add New Sample'}
        </h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Sample Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="donorId"
                  rules={{ required: 'Donor is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Donor</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select donor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockDonors.map(donor => (
                            <SelectItem key={donor.id} value={donor.id.toString()}>
                              {donor.name} ({donor.bloodType})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bloodType"
                  rules={{ required: 'Blood type is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select blood type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bloodTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="collectionDate"
                  rules={{ required: 'Collection date is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Collection Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="expiryDate"
                  rules={{ required: 'Expiry date is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sampleStatuses.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="hemoglobin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hemoglobin</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 14.5 g/dL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="hbsag"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>HBsAg (Hepatitis B)</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select result" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {testResults.map(result => (
                                <SelectItem key={result} value={result}>{result}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="hiv"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>HIV</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select result" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {testResults.map(result => (
                                <SelectItem key={result} value={result}>{result}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="hcv"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>HCV (Hepatitis C)</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select result" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {testResults.map(result => (
                                <SelectItem key={result} value={result}>{result}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="vdrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VDRL (Syphilis)</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select result" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {testResults.map(result => (
                                <SelectItem key={result} value={result}>{result}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end space-x-4">
                <Button variant="outline" type="button" onClick={() => navigate('/lab')}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {isEditMode ? 'Update Sample' : 'Save Sample'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default SampleForm