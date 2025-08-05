import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Save, ArrowLeft } from 'lucide-react'

import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form'

// Mock data for donors
const mockDonors = [
  { id: 1, name: 'John Doe', age: 28, bloodType: 'O+', phone: '9876543210', email: 'john@example.com', address: '123 Main St', city: 'Mumbai', lastDonation: '2023-10-15', status: 'Active' },
  { id: 2, name: 'Jane Smith', age: 35, bloodType: 'A-', phone: '8765432109', email: 'jane@example.com', address: '456 Park Ave', city: 'Delhi', lastDonation: '2023-09-22', status: 'Active' },
  { id: 3, name: 'Robert Johnson', age: 42, bloodType: 'B+', phone: '7654321098', email: 'robert@example.com', address: '789 Oak St', city: 'Bangalore', lastDonation: '2023-08-05', status: 'Inactive' },
]

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function DonorForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id
  const [loading, setLoading] = useState(false)
  
  const form = useForm({
    defaultValues: {
      name: '',
      age: '',
      bloodType: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      status: 'Active'
    }
  })
  
  useEffect(() => {
    if (isEditMode) {
      setLoading(true)
      // Simulate API call
      setTimeout(() => {
        const donor = mockDonors.find(d => d.id === parseInt(id))
        if (donor) {
          form.reset({
            ...donor,
            age: donor.age.toString()
          })
        }
        setLoading(false)
      }, 100)
    }
  }, [id, isEditMode, form])
  
  const onSubmit = (data) => {
    setLoading(true)
    console.log('Form submitted:', data)
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      navigate('/donor')
    }, 1000)
  }
  
  if (loading && isEditMode) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading donor information...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => navigate('/donor')} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {isEditMode ? 'Edit Donor' : 'Add New Donor'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? 'Update donor information' : 'Register a new blood donor'}
          </p>
        </div>
      </div>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Donor Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: 'Name is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="age"
                  rules={{ 
                    required: 'Age is required',
                    min: { value: 18, message: 'Donor must be at least 18 years old' },
                    max: { value: 65, message: 'Donor must be under 65 years old' }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter age" {...field} />
                      </FormControl>
                      <FormDescription>
                        Age must be between 18 and 65 years
                      </FormDescription>
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
                        value={field.value}
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
                  name="phone"
                  rules={{ 
                    required: 'Phone number is required',
                    pattern: { value: /^\d{10}$/, message: 'Please enter a valid 10-digit phone number' }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter 10-digit mobile number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  rules={{ 
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email address' }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter city" {...field} />
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
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => navigate('/donor')}
                  className="w-full sm:w-auto"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {loading ? 'Saving...' : (isEditMode ? 'Update Donor' : 'Save Donor')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default DonorForm