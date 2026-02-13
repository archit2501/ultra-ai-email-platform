"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  FileCode,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  Book,
} from "lucide-react";

interface ResumeData {
  skills?: {
    programming_languages?: string[];
    frameworks?: string[];
    databases?: string[];
    cloud_devops?: string[];
    tools?: string[];
    soft_skills?: string[];
  };
  experience?: Array<{
    company: string;
    role: string;
    duration: string;
    description?: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field: string;
    year?: string;
  }>;
  certifications?: string[];
  research_papers?: Array<{
    title: string;
    journal?: string;
    year?: string;
  }>;
}

interface ResumeViewerProps {
  data: ResumeData;
  onSave?: (data: ResumeData) => void;
  editable?: boolean;
}

export function ResumeViewer({ data, onSave, editable = true }: ResumeViewerProps) {
  const [editMode, setEditMode] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData>(data);

  const handleSave = () => {
    if (onSave) {
      onSave(resumeData);
    }
    setEditMode(false);
  };

  const addSkill = (category: keyof NonNullable<ResumeData['skills']>) => {
    setResumeData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: [...(prev.skills?.[category] || []), "New Skill"]
      }
    }));
  };

  const removeSkill = (category: keyof NonNullable<ResumeData['skills']>, index: number) => {
    setResumeData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills?.[category]?.filter((_, i) => i !== index) || []
      }
    }));
  };

  const updateSkill = (category: keyof NonNullable<ResumeData['skills']>, index: number, value: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills?.[category]?.map((skill, i) => i === index ? value : skill) || []
      }
    }));
  };

  const skillCategories = [
    { key: 'programming_languages' as const, label: 'Programming Languages', icon: Code, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { key: 'frameworks' as const, label: 'Frameworks', icon: FileCode, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { key: 'databases' as const, label: 'Databases', icon: FileText, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    { key: 'cloud_devops' as const, label: 'Cloud & DevOps', icon: Award, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { key: 'tools' as const, label: 'Tools', icon: Briefcase, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    { key: 'soft_skills' as const, label: 'Soft Skills', icon: GraduationCap, color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Resume Overview</h2>
            <p className="text-slate-400 text-sm">Your professional profile and skills</p>
          </div>
        </div>
        {editable && (
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button onClick={() => setEditMode(false)} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditMode(true)} variant="outline">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Skills Section */}
      <Card className="glass border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Code className="w-5 h-5 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Technical Skills</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skillCategories.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <h4 className="font-semibold text-slate-300">{label}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {resumeData.skills?.[key]?.length || 0}
                  </Badge>
                </div>
                {editMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => addSkill(key)}
                    className="h-7 px-2"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {editMode ? (
                  resumeData.skills?.[key]?.map((skill, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-slate-800 rounded px-2 py-1">
                      <Input
                        value={skill}
                        onChange={(e) => updateSkill(key, idx, e.target.value)}
                        className="h-6 w-auto min-w-[80px] text-xs bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                      />
                      <button
                        onClick={() => removeSkill(key, idx)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  resumeData.skills?.[key]?.map((skill, idx) => (
                    <Badge key={idx} className={color}>
                      {skill}
                    </Badge>
                  ))
                )}
                {!editMode && (!resumeData.skills?.[key] || resumeData.skills[key].length === 0) && (
                  <span className="text-sm text-slate-500">No skills added yet</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Experience Section */}
      <Card className="glass border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Briefcase className="w-5 h-5 text-purple-400" />
          <h3 className="text-xl font-bold text-white">Work Experience</h3>
        </div>

        <div className="space-y-4">
          {resumeData.experience?.map((exp, idx) => (
            <div key={idx} className="bg-slate-800/50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  {editMode ? (
                    <div className="space-y-2">
                      <Input
                        value={exp.company}
                        onChange={(e) => {
                          const newExp = [...(resumeData.experience || [])];
                          newExp[idx] = { ...newExp[idx], company: e.target.value };
                          setResumeData({ ...resumeData, experience: newExp });
                        }}
                        placeholder="Company name"
                        className="bg-slate-900 border-slate-700"
                      />
                      <Input
                        value={exp.role}
                        onChange={(e) => {
                          const newExp = [...(resumeData.experience || [])];
                          newExp[idx] = { ...newExp[idx], role: e.target.value };
                          setResumeData({ ...resumeData, experience: newExp });
                        }}
                        placeholder="Role"
                        className="bg-slate-900 border-slate-700"
                      />
                      <Input
                        value={exp.duration}
                        onChange={(e) => {
                          const newExp = [...(resumeData.experience || [])];
                          newExp[idx] = { ...newExp[idx], duration: e.target.value };
                          setResumeData({ ...resumeData, experience: newExp });
                        }}
                        placeholder="Duration (e.g., 2020-2022)"
                        className="bg-slate-900 border-slate-700"
                      />
                      <Textarea
                        value={exp.description || ''}
                        onChange={(e) => {
                          const newExp = [...(resumeData.experience || [])];
                          newExp[idx] = { ...newExp[idx], description: e.target.value };
                          setResumeData({ ...resumeData, experience: newExp });
                        }}
                        placeholder="Description"
                        className="bg-slate-900 border-slate-700"
                      />
                    </div>
                  ) : (
                    <>
                      <h4 className="text-lg font-semibold text-white">{exp.role}</h4>
                      <p className="text-slate-400">{exp.company}</p>
                      <p className="text-sm text-slate-500">{exp.duration}</p>
                      {exp.description && (
                        <p className="text-slate-300 mt-2">{exp.description}</p>
                      )}
                    </>
                  )}
                </div>
                {editMode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setResumeData({
                        ...resumeData,
                        experience: resumeData.experience?.filter((_, i) => i !== idx)
                      });
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {editMode && (
            <Button
              variant="outline"
              onClick={() => {
                setResumeData({
                  ...resumeData,
                  experience: [
                    ...(resumeData.experience || []),
                    { company: '', role: '', duration: '' }
                  ]
                });
              }}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Experience
            </Button>
          )}
        </div>
      </Card>

      {/* Projects Section */}
      <Card className="glass border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileCode className="w-5 h-5 text-green-400" />
          <h3 className="text-xl font-bold text-white">Projects</h3>
        </div>

        <div className="space-y-4">
          {resumeData.projects?.map((project, idx) => (
            <div key={idx} className="bg-slate-800/50 rounded-lg p-4">
              {editMode ? (
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={project.name}
                        onChange={(e) => {
                          const newProjects = [...(resumeData.projects || [])];
                          newProjects[idx] = { ...newProjects[idx], name: e.target.value };
                          setResumeData({ ...resumeData, projects: newProjects });
                        }}
                        placeholder="Project name"
                        className="bg-slate-900 border-slate-700"
                      />
                      <Textarea
                        value={project.description}
                        onChange={(e) => {
                          const newProjects = [...(resumeData.projects || [])];
                          newProjects[idx] = { ...newProjects[idx], description: e.target.value };
                          setResumeData({ ...resumeData, projects: newProjects });
                        }}
                        placeholder="Description"
                        className="bg-slate-900 border-slate-700"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setResumeData({
                          ...resumeData,
                          projects: resumeData.projects?.filter((_, i) => i !== idx)
                        });
                      }}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="text-lg font-semibold text-white mb-2">{project.name}</h4>
                  <p className="text-slate-300">{project.description}</p>
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {project.technologies.map((tech, techIdx) => (
                        <Badge key={techIdx} variant="outline" className="text-xs border-green-500/30 text-green-400">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {editMode && (
            <Button
              variant="outline"
              onClick={() => {
                setResumeData({
                  ...resumeData,
                  projects: [
                    ...(resumeData.projects || []),
                    { name: '', description: '', technologies: [] }
                  ]
                });
              }}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          )}
        </div>
      </Card>

      {/* Education Section */}
      <Card className="glass border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <GraduationCap className="w-5 h-5 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">Education</h3>
        </div>

        <div className="space-y-4">
          {resumeData.education?.map((edu, idx) => (
            <div key={idx} className="bg-slate-800/50 rounded-lg p-4">
              {editMode ? (
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        value={edu.institution}
                        onChange={(e) => {
                          const newEdu = [...(resumeData.education || [])];
                          newEdu[idx] = { ...newEdu[idx], institution: e.target.value };
                          setResumeData({ ...resumeData, education: newEdu });
                        }}
                        placeholder="Institution"
                        className="bg-slate-900 border-slate-700"
                      />
                      <Input
                        value={edu.degree}
                        onChange={(e) => {
                          const newEdu = [...(resumeData.education || [])];
                          newEdu[idx] = { ...newEdu[idx], degree: e.target.value };
                          setResumeData({ ...resumeData, education: newEdu });
                        }}
                        placeholder="Degree"
                        className="bg-slate-900 border-slate-700"
                      />
                      <Input
                        value={edu.field}
                        onChange={(e) => {
                          const newEdu = [...(resumeData.education || [])];
                          newEdu[idx] = { ...newEdu[idx], field: e.target.value };
                          setResumeData({ ...resumeData, education: newEdu });
                        }}
                        placeholder="Field of study"
                        className="bg-slate-900 border-slate-700"
                      />
                      <Input
                        value={edu.year || ''}
                        onChange={(e) => {
                          const newEdu = [...(resumeData.education || [])];
                          newEdu[idx] = { ...newEdu[idx], year: e.target.value };
                          setResumeData({ ...resumeData, education: newEdu });
                        }}
                        placeholder="Year"
                        className="bg-slate-900 border-slate-700"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setResumeData({
                          ...resumeData,
                          education: resumeData.education?.filter((_, i) => i !== idx)
                        });
                      }}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="text-lg font-semibold text-white">{edu.degree} in {edu.field}</h4>
                  <p className="text-slate-400">{edu.institution}</p>
                  {edu.year && <p className="text-sm text-slate-500">{edu.year}</p>}
                </>
              )}
            </div>
          ))}
          {editMode && (
            <Button
              variant="outline"
              onClick={() => {
                setResumeData({
                  ...resumeData,
                  education: [
                    ...(resumeData.education || []),
                    { institution: '', degree: '', field: '', year: '' }
                  ]
                });
              }}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Education
            </Button>
          )}
        </div>
      </Card>

      {/* Research Papers Section */}
      <Card className="glass border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Book className="w-5 h-5 text-cyan-400" />
          <h3 className="text-xl font-bold text-white">Research Papers</h3>
        </div>

        <div className="space-y-4">
          {resumeData.research_papers?.map((paper, idx) => (
            <div key={idx} className="bg-slate-800/50 rounded-lg p-4">
              {editMode ? (
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={paper.title}
                        onChange={(e) => {
                          const newPapers = [...(resumeData.research_papers || [])];
                          newPapers[idx] = { ...newPapers[idx], title: e.target.value };
                          setResumeData({ ...resumeData, research_papers: newPapers });
                        }}
                        placeholder="Paper title"
                        className="bg-slate-900 border-slate-700"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={paper.journal || ''}
                          onChange={(e) => {
                            const newPapers = [...(resumeData.research_papers || [])];
                            newPapers[idx] = { ...newPapers[idx], journal: e.target.value };
                            setResumeData({ ...resumeData, research_papers: newPapers });
                          }}
                          placeholder="Journal/Conference"
                          className="bg-slate-900 border-slate-700"
                        />
                        <Input
                          value={paper.year || ''}
                          onChange={(e) => {
                            const newPapers = [...(resumeData.research_papers || [])];
                            newPapers[idx] = { ...newPapers[idx], year: e.target.value };
                            setResumeData({ ...resumeData, research_papers: newPapers });
                          }}
                          placeholder="Year"
                          className="bg-slate-900 border-slate-700"
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setResumeData({
                          ...resumeData,
                          research_papers: resumeData.research_papers?.filter((_, i) => i !== idx)
                        });
                      }}
                      className="text-red-400 hover:text-red-300 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="text-lg font-semibold text-white mb-1">{paper.title}</h4>
                  <p className="text-slate-400 text-sm">
                    {paper.journal && `${paper.journal} • `}{paper.year}
                  </p>
                </>
              )}
            </div>
          ))}
          {editMode && (
            <Button
              variant="outline"
              onClick={() => {
                setResumeData({
                  ...resumeData,
                  research_papers: [
                    ...(resumeData.research_papers || []),
                    { title: '', journal: '', year: '' }
                  ]
                });
              }}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Research Paper
            </Button>
          )}
        </div>
      </Card>

      {/* Certifications Section */}
      <Card className="glass border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-5 h-5 text-orange-400" />
          <h3 className="text-xl font-bold text-white">Certifications</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {editMode ? (
            <>
              {resumeData.certifications?.map((cert, idx) => (
                <div key={idx} className="flex items-center gap-1 bg-slate-800 rounded px-3 py-2">
                  <Input
                    value={cert}
                    onChange={(e) => {
                      const newCerts = [...(resumeData.certifications || [])];
                      newCerts[idx] = e.target.value;
                      setResumeData({ ...resumeData, certifications: newCerts });
                    }}
                    className="h-6 w-auto min-w-[120px] text-sm bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                  />
                  <button
                    onClick={() => {
                      setResumeData({
                        ...resumeData,
                        certifications: resumeData.certifications?.filter((_, i) => i !== idx)
                      });
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setResumeData({
                    ...resumeData,
                    certifications: [...(resumeData.certifications || []), 'New Certification']
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Certification
              </Button>
            </>
          ) : (
            resumeData.certifications?.map((cert, idx) => (
              <Badge key={idx} className="bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-2">
                {cert}
              </Badge>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
