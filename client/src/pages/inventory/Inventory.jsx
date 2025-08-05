import React from 'react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/table'

function Inventory() {
  // Mock data for blood inventory
  const bloodInventory = [
    { id: 1, type: 'A+', units: 25, lastUpdated: '2023-06-15' },
    { id: 2, type: 'A-', units: 10, lastUpdated: '2023-06-14' },
    { id: 3, type: 'B+', units: 15, lastUpdated: '2023-06-13' },
    { id: 4, type: 'B-', units: 8, lastUpdated: '2023-06-12' },
    { id: 5, type: 'AB+', units: 5, lastUpdated: '2023-06-11' },
    { id: 6, type: 'AB-', units: 3, lastUpdated: '2023-06-10' },
    { id: 7, type: 'O+', units: 30, lastUpdated: '2023-06-09' },
    { id: 8, type: 'O-', units: 12, lastUpdated: '2023-06-08' },
  ]

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Blood Inventory Management</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Input placeholder="Search inventory..." className="w-64" />
          <Button>Search</Button>
        </div>
        <Button>Add New Entry</Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Current Blood Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Blood Type</TableHead>
                <TableHead>Available Units</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bloodInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.type}</TableCell>
                  <TableCell>{item.units}</TableCell>
                  <TableCell>{item.lastUpdated}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Update</Button>
                      <Button variant="outline" size="sm">History</Button>
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

export default Inventory