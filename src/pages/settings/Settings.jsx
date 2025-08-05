import React from 'react'
import { Button } from '../../client/src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../client/src/components/ui/card'
import { Input } from '../../client/src/components/ui/input'

function Settings() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Blood Bank Name</label>
              <Input defaultValue="Sanjivani Blood Bank" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Email</label>
              <Input defaultValue="contact@sanjivanibloodbank.com" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Phone</label>
              <Input defaultValue="+91 1234567890" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <Input defaultValue="123 Main Street, City, State, 400001" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Email Notifications</span>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input type="checkbox" id="email-toggle" className="sr-only" defaultChecked />
                <label htmlFor="email-toggle" className="block h-6 rounded-full bg-gray-300 cursor-pointer"></label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>SMS Notifications</span>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input type="checkbox" id="sms-toggle" className="sr-only" defaultChecked />
                <label htmlFor="sms-toggle" className="block h-6 rounded-full bg-gray-300 cursor-pointer"></label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>Low Inventory Alerts</span>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input type="checkbox" id="inventory-toggle" className="sr-only" defaultChecked />
                <label htmlFor="inventory-toggle" className="block h-6 rounded-full bg-gray-300 cursor-pointer"></label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Low Inventory Threshold (Units)</label>
              <Input type="number" defaultValue="10" />
            </div>
            <Button>Save Notification Settings</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Manage Users</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>System Backup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Last Backup</label>
              <Input readOnly defaultValue="2023-06-15 10:30 AM" />
            </div>
            <Button className="w-full">Create New Backup</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Settings