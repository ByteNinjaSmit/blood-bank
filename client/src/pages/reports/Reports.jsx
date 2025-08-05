import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Button } from '../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Calendar } from '../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Download, BarChart, PieChart, LineChart } from 'lucide-react'

function Reports() {
  const [date, setDate] = useState(new Date())
  const [reportType, setReportType] = useState('inventory')
  const [timeRange, setTimeRange] = useState('month')

  // Sample data for demonstration
  const inventoryData = [
    { bloodType: 'A+', available: 25, used: 12, expired: 3 },
    { bloodType: 'A-', available: 15, used: 8, expired: 1 },
    { bloodType: 'B+', available: 20, used: 10, expired: 2 },
    { bloodType: 'B-', available: 10, used: 5, expired: 0 },
    { bloodType: 'AB+', available: 8, used: 3, expired: 1 },
    { bloodType: 'AB-', available: 5, used: 2, expired: 0 },
    { bloodType: 'O+', available: 30, used: 18, expired: 4 },
    { bloodType: 'O-', available: 12, used: 7, expired: 1 },
  ]

  const donationData = [
    { date: '2023-01-01', donors: 15, collections: 12, rejections: 3 },
    { date: '2023-01-08', donors: 18, collections: 15, rejections: 3 },
    { date: '2023-01-15', donors: 22, collections: 20, rejections: 2 },
    { date: '2023-01-22', donors: 25, collections: 23, rejections: 2 },
    { date: '2023-01-29', donors: 20, collections: 18, rejections: 2 },
    { date: '2023-02-05', donors: 28, collections: 25, rejections: 3 },
  ]

  const hospitalData = [
    { hospital: 'City General Hospital', requests: 25, fulfilled: 22, pending: 3 },
    { hospital: 'Memorial Medical Center', requests: 18, fulfilled: 15, pending: 3 },
    { hospital: 'University Hospital', requests: 30, fulfilled: 28, pending: 2 },
    { hospital: 'Community Health Center', requests: 12, fulfilled: 10, pending: 2 },
    { hospital: 'Children\'s Hospital', requests: 15, fulfilled: 13, pending: 2 },
  ]

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">View and export detailed reports on blood bank operations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-1/3">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inventory">Inventory Report</SelectItem>
              <SelectItem value="donation">Donation Report</SelectItem>
              <SelectItem value="hospital">Hospital Requests</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-1/3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger>
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-1/3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Tabs defaultValue="table" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="chart">Chart</TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Export Report
          </Button>
        </div>

        <TabsContent value="table">
          {reportType === 'inventory' && (
            <Card>
              <CardHeader>
                <CardTitle>Blood Inventory Report</CardTitle>
                <CardDescription>
                  Current inventory levels and usage statistics for all blood types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Blood Type</TableHead>
                      <TableHead>Available Units</TableHead>
                      <TableHead>Used Units</TableHead>
                      <TableHead>Expired Units</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryData.map((item) => (
                      <TableRow key={item.bloodType}>
                        <TableCell className="font-medium">{item.bloodType}</TableCell>
                        <TableCell>{item.available}</TableCell>
                        <TableCell>{item.used}</TableCell>
                        <TableCell>{item.expired}</TableCell>
                        <TableCell>{item.available + item.used + item.expired}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {reportType === 'donation' && (
            <Card>
              <CardHeader>
                <CardTitle>Blood Donation Report</CardTitle>
                <CardDescription>
                  Weekly donation statistics and collection rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week</TableHead>
                      <TableHead>Donors</TableHead>
                      <TableHead>Collections</TableHead>
                      <TableHead>Rejections</TableHead>
                      <TableHead>Success Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donationData.map((item) => (
                      <TableRow key={item.date}>
                        <TableCell className="font-medium">{item.date}</TableCell>
                        <TableCell>{item.donors}</TableCell>
                        <TableCell>{item.collections}</TableCell>
                        <TableCell>{item.rejections}</TableCell>
                        <TableCell>
                          {Math.round((item.collections / item.donors) * 100)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {reportType === 'hospital' && (
            <Card>
              <CardHeader>
                <CardTitle>Hospital Requests Report</CardTitle>
                <CardDescription>
                  Blood requests from hospitals and fulfillment rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Total Requests</TableHead>
                      <TableHead>Fulfilled</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Fulfillment Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hospitalData.map((item) => (
                      <TableRow key={item.hospital}>
                        <TableCell className="font-medium">{item.hospital}</TableCell>
                        <TableCell>{item.requests}</TableCell>
                        <TableCell>{item.fulfilled}</TableCell>
                        <TableCell>{item.pending}</TableCell>
                        <TableCell>
                          {Math.round((item.fulfilled / item.requests) * 100)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>
                {reportType === 'inventory' && 'Blood Inventory Visualization'}
                {reportType === 'donation' && 'Donation Trends Visualization'}
                {reportType === 'hospital' && 'Hospital Requests Visualization'}
              </CardTitle>
              <CardDescription>
                Visual representation of the selected report data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center items-center h-80 bg-muted/20 rounded-md">
                {reportType === 'inventory' && (
                  <div className="text-center">
                    <PieChart className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">
                      Inventory distribution chart would appear here
                    </p>
                  </div>
                )}
                
                {reportType === 'donation' && (
                  <div className="text-center">
                    <LineChart className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">
                      Donation trends chart would appear here
                    </p>
                  </div>
                )}
                
                {reportType === 'hospital' && (
                  <div className="text-center">
                    <BarChart className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">
                      Hospital requests comparison chart would appear here
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Reports