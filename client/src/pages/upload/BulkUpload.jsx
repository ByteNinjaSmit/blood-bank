import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Progress } from '../../components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react'

function BulkUpload() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResults, setUploadResults] = useState([])

  const handleFileChange = (e) => {
    if (e.target.files.length) {
      const selectedFiles = Array.from(e.target.files)
      setFiles(selectedFiles)
    }
  }

  const handleUpload = () => {
    if (files.length === 0) return
    
    setUploading(true)
    setUploadProgress(0)
    setUploadResults([])
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          simulateUploadCompletion()
          return 100
        }
        return prev + 5
      })
    }, 200)
  }

  const simulateUploadCompletion = () => {
    // Simulate processing results
    setTimeout(() => {
      const results = files.map(file => ({
        fileName: file.name,
        status: Math.random() > 0.2 ? 'success' : 'error',
        records: Math.floor(Math.random() * 100) + 1,
        errors: Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0
      }))
      
      setUploadResults(results)
      setUploading(false)
    }, 1000)
  }

  const clearFiles = () => {
    setFiles([])
    setUploadResults([])
    setUploadProgress(0)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Bulk Upload</h1>
        <p className="text-muted-foreground">Upload multiple donor or inventory records at once.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <CardDescription>Select CSV or Excel files to upload</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => document.getElementById('file-upload').click()}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-medium">Drop files here or click to browse</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Support for CSV, XLS, XLSX files. Max 10MB per file.
                </p>
                <input 
                  id="file-upload" 
                  type="file" 
                  multiple 
                  accept=".csv,.xls,.xlsx" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Selected Files ({files.length})</h4>
                    <Button variant="ghost" size="sm" onClick={clearFiles}>
                      <X className="h-4 w-4 mr-1" /> Clear All
                    </Button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center p-2 bg-muted/50 rounded">
                        <FileText className="h-5 w-5 mr-2 text-muted-foreground" />
                        <span className="text-sm truncate flex-1">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={clearFiles} disabled={uploading || files.length === 0}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={uploading || files.length === 0}>
                  {uploading ? 'Uploading...' : 'Upload Files'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload Results</CardTitle>
            <CardDescription>Status and summary of uploaded files</CardDescription>
          </CardHeader>
          <CardContent>
            {uploadResults.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{result.fileName}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {result.status === 'success' ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                              <span>Success</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                              <span>Failed</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{result.records}</TableCell>
                      <TableCell>{result.errors}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-2" />
                <h3 className="text-lg font-medium">No Upload Results</h3>
                <p className="text-sm mt-1">
                  Upload files to see results and processing status
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default BulkUpload