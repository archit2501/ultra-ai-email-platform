'use client'

import { useState, useRef } from 'react'
import { Upload, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CSVUploaderProps {
  onFileSelected: (file: File) => void
  isLoading?: boolean
}

export function CSVUploader({ onFileSelected, isLoading }: CSVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (isValidFile(file)) {
        setSelectedFile(file)
        onFileSelected(file)
      }
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      const file = files[0]
      if (isValidFile(file)) {
        setSelectedFile(file)
        onFileSelected(file)
      }
    }
  }

  const isValidFile = (file: File): boolean => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]
    return validTypes.includes(file.type)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-white">Upload CSV File</h2>
        <p className="text-slate-400">Import your contacts from an Excel or CSV file</p>
      </div>

      {/* File Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-slate-900'
            : selectedFile
            ? 'border-green-500 bg-slate-900'
            : 'border-slate-800 bg-slate-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {selectedFile ? (
          <div className="space-y-3">
            <div className="flex justify-center">
              <Check className="w-12 h-12 text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-white">{selectedFile.name}</p>
              <p className="text-sm text-slate-400">{formatFileSize(selectedFile.size)}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Choose Different File
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center">
              <Upload className="w-12 h-12 text-slate-400" />
            </div>
            <div>
              <p className="font-semibold text-white mb-1">Drop your CSV or Excel file here</p>
              <p className="text-sm text-slate-400 mb-3">or</p>
            </div>
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              Browse Files
            </Button>
            <p className="text-xs text-slate-400 mt-3">Supported formats: CSV, XLS, XLSX</p>
          </div>
        )}
      </div>

      {/* File Format Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 className="font-semibold text-white mb-2">File Format Requirements</h3>
        <ul className="text-sm text-slate-300 space-y-1">
          <li>• First row should contain column headers</li>
          <li>• Required columns: Email</li>
          <li>• Optional columns: Name, Company, Job Title, Website, Phone</li>
          <li>• Maximum file size: 10 MB</li>
        </ul>
      </div>

      {/* Example */}
      <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
        <h3 className="font-semibold text-white mb-2">Example Format</h3>
        <div className="overflow-x-auto">
          <table className="text-sm w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left p-2 font-semibold text-white">Name</th>
                <th className="text-left p-2 font-semibold text-white">Email</th>
                <th className="text-left p-2 font-semibold text-white">Company</th>
                <th className="text-left p-2 font-semibold text-white">Job Title</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-800">
                <td className="p-2 text-slate-200">John Smith</td>
                <td className="p-2 text-slate-200">john@acme.com</td>
                <td className="p-2 text-slate-200">Acme Corp</td>
                <td className="p-2 text-slate-200">CEO</td>
              </tr>
              <tr>
                <td className="p-2 text-slate-200">Sarah Johnson</td>
                <td className="p-2 text-slate-200">sarah@tech.io</td>
                <td className="p-2 text-slate-200">Tech IO</td>
                <td className="p-2 text-slate-200">CTO</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
