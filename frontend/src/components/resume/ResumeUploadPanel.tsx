"use client";

import { useState, useCallback } from "react";
import { Upload, File, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface ParsedResumeData {
  name: string | null;
  contact: {
    email: string | null;
    phone: string | null;
    linkedin: string | null;
    github: string | null;
    location: string | null;
  };
  summary: string | null;
  education: string[];
  experience: string[];
  projects: string[];
  skills_raw: string[];
  skills_categorized: {
    languages: string[];
    tools: string[];
    frameworks: string[];
    technologies: string[];
    databases: string[];
    cloud: string[];
    soft_skills: string[];
    other: string[];
  };
  achievements: string[];
  awards: string[];
  certifications: string[];
  publications: string[];
  languages: string[];
  volunteering: string[];
  interests: string[];
  confidence_score: number;
  warnings: string[];
  detected_sections: Array<{
    type: string;
    heading: string;
    confidence: number;
    preview: string;
  }>;
}

interface ResumeUploadPanelProps {
  onUploadSuccess?: (data: ParsedResumeData) => void;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
}

export function ResumeUploadPanel({
  onUploadSuccess,
  maxSize = 10,
  acceptedFormats = [".pdf", ".docx", ".doc"],
}: ResumeUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file type
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExt)) {
      return `Invalid file type. Accepted: ${acceptedFormats.join(", ")}`;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return `File too large. Maximum size: ${maxSize}MB (Got: ${fileSizeMB.toFixed(1)}MB)`;
    }

    return null;
  };

  const uploadAndParseResume = async (fileToUpload: File) => {
    try {
      setUploading(true);
      setParsing(false);
      setError(null);
      setSuccess(false);
      setProgress(10);

      // Create form data
      const formData = new FormData();
      formData.append("file", fileToUpload);

      setProgress(30);

      // Upload and parse
      setParsing(true);
      setProgress(50);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

      // Get auth token
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/resumes/parse`, {
        method: "POST",
        body: formData,
        headers,
      });

      setProgress(90);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to parse resume");
      }

      const result = await response.json();
      setProgress(100);

      setSuccess(true);
      setFile(fileToUpload);

      toast.success("Resume parsed successfully!", {
        description: `Found ${result.parsed_data.skills_raw.length} skills, ${result.parsed_data.experience.length} experiences`,
      });

      // Call success callback with parsed data
      if (onUploadSuccess) {
        onUploadSuccess(result.parsed_data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to parse resume");
      toast.error("Failed to parse resume", {
        description: err.message,
      });
    } finally {
      setUploading(false);
      setParsing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    uploadAndParseResume(selectedFile);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setFile(null);
    setError(null);
    setSuccess(false);
    setProgress(0);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!success && (
        <Card
          className={`border-2 border-dashed transition-all ${
            dragActive
              ? "border-cyan-500 bg-cyan-500/10"
              : "border-slate-700 hover:border-slate-600"
          } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="p-12 text-center">
            <div className="flex justify-center mb-4">
              {uploading || parsing ? (
                <Loader2 className="h-12 w-12 text-cyan-400 animate-spin" />
              ) : error ? (
                <XCircle className="h-12 w-12 text-red-400" />
              ) : (
                <Upload className="h-12 w-12 text-slate-400" />
              )}
            </div>

            {uploading || parsing ? (
              <div className="space-y-3">
                <p className="text-lg font-medium text-slate-200">
                  {parsing ? "Parsing resume..." : "Uploading..."}
                </p>
                <Progress value={progress} className="w-full max-w-md mx-auto" />
                <p className="text-sm text-slate-400">{progress}%</p>
              </div>
            ) : error ? (
              <div className="space-y-2">
                <p className="text-lg font-medium text-red-400">Upload Failed</p>
                <p className="text-sm text-slate-400">{error}</p>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-lg font-medium text-slate-200">
                  Upload Your Resume
                </p>
                <p className="text-sm text-slate-400">
                  Drag and drop your resume here, or click to browse
                </p>
                <p className="text-xs text-slate-500">
                  Supported formats: {acceptedFormats.join(", ")} • Max size: {maxSize}MB
                </p>

                <div className="pt-4">
                  <label htmlFor="resume-file-input">
                    <Button
                      variant="default"
                      className="cursor-pointer"
                      onClick={() => document.getElementById("resume-file-input")?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </label>
                  <input
                    id="resume-file-input"
                    type="file"
                    accept={acceptedFormats.join(",")}
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Success State */}
      {success && file && (
        <Card className="border-green-500/50 bg-green-500/5">
          <div className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-200">Resume Parsed Successfully!</p>
              <p className="text-sm text-slate-400 mt-1">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              Upload Different Resume
            </Button>
          </div>
        </Card>
      )}

      {/* Help Text */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-slate-300 mb-2">What we extract:</h4>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• Contact information (email, phone, LinkedIn, GitHub)</li>
          <li>• Skills categorized by type (Languages, Tools, Frameworks, Databases, Cloud)</li>
          <li>• Work experience with dates and descriptions</li>
          <li>• Education history</li>
          <li>• Projects, certifications, achievements, and publications</li>
        </ul>
      </div>
    </div>
  );
}
