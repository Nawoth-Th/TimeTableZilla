'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, AlertCircle, FileText, BookOpen, Users, UserCheck } from 'lucide-react';
import { parseTimeTable } from '@/lib/timetable-parser';

interface TimetableUploadProps {
  onDataReady: (data: { html: string; semester: string; group: string; subgroup: string }) => void;
}

export default function TimetableUpload({ onDataReady }: TimetableUploadProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [groups, setGroups] = useState<string[]>([]);
  const [subgroups, setSubgroups] = useState<string[]>([]);
  
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedSubgroup, setSelectedSubgroup] = useState<string>('');
  
  // Fixed semesters list
  const SEMESTERS = ['Y1S1', 'Y1S2', 'Y2S1', 'Y2S2', 'Y3S1', 'Y3S2', 'Y4S1', 'Y4S2'];
  
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    try {
      setError('');
      const text = await file.text();
      setHtmlContent(text);
      
      // Reset form fields
      setGroups([]);
      setSubgroups([]);
      setSelectedSemester('');
      setSelectedGroup('');
      setSelectedSubgroup('');
    } catch (err) {
      setError('Failed to read file. Please ensure it is a valid HTML file.');
      console.error(err);
    }
  };

  const handleSemesterChange = (semester: string) => {
    setSelectedSemester(semester);
    setSelectedGroup('');
    setSelectedSubgroup('');
    
    // Extract groups for this semester
    if (htmlContent) {
      const { groupsBySemester } = parseTimeTable(htmlContent);
      const semesterGroups = groupsBySemester[semester] || [];
      setGroups(semesterGroups);
    }
  };

  const handleGroupChange = (group: string) => {
    setSelectedGroup(group);
    setSelectedSubgroup('');
    
    // Extract subgroups for this group
    if (htmlContent) {
      const { subgroupsByGroup } = parseTimeTable(htmlContent);
      const groupSubgroups = subgroupsByGroup[group] || [];
      setSubgroups(groupSubgroups.length > 0 ? groupSubgroups : [group]);
    }
  };

  const handleContinue = () => {
    if (!selectedSemester || !selectedGroup || !selectedSubgroup) {
      setError('Please select all fields: Semester, Group, and Subgroup');
      return;
    }

    onDataReady({
      html: htmlContent,
      semester: selectedSemester,
      group: selectedGroup,
      subgroup: selectedSubgroup,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8 flex flex-col items-center">
              <div className="relative w-80 h-40 mb-2 drop-shadow-sm hover:scale-105 transition-transform duration-300">
                  <Image 
                      src="/logo.png" 
                      alt="TimeTableZilla Logo" 
                      fill 
                      className="object-contain"
                      priority
                  />
              </div>
              <p className="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed">
                  Unleash the true potential of your schedule. 
                  <br />
                  Exclusively designed for the <span className="font-bold text-primary">SLIIT</span> community, 
                  <span className="font-bold text-foreground"> TimeTable<span className="text-primary">Zilla</span></span> transforms your raw HTML timetables into clear, customizable calendars with Google Tasks sync. 
                  Start owning your semester.
              </p>
          </div>

          {/* File Upload Card */}
          <div className="mb-8">
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                htmlContent
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary hover:bg-primary/5'
              }`}
            >
              <div className={`${htmlContent ? 'text-primary' : 'text-muted-foreground'}`}>
                <FileText className="w-10 h-10" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">
                  {htmlContent ? 'File uploaded' : 'Upload HTML file'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">or drag and drop your timetable</p>
              </div>
            </button>
          </div>

          {/* Selection Form */}
          {htmlContent && (
            <>
              {/* Semester */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <label htmlFor="semester" className="text-sm font-semibold text-foreground">
                    Semester
                  </label>
                </div>
                <select
                  id="semester"
                  value={selectedSemester}
                  onChange={(e) => handleSemesterChange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="">Select semester</option>
                  {SEMESTERS.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
              </div>

              {/* Group */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-primary" />
                  <label htmlFor="group" className="text-sm font-semibold text-foreground">
                    Group
                  </label>
                </div>
                <select
                  id="group"
                  value={selectedGroup}
                  onChange={(e) => handleGroupChange(e.target.value)}
                  disabled={!selectedSemester}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select group</option>
                  {groups.map((grp) => (
                    <option key={grp} value={grp}>
                      {grp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subgroup */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="w-4 h-4 text-primary" />
                  <label htmlFor="subgroup" className="text-sm font-semibold text-foreground">
                    Subgroup
                  </label>
                </div>
                <select
                  id="subgroup"
                  value={selectedSubgroup}
                  onChange={(e) => setSelectedSubgroup(e.target.value)}
                  disabled={!selectedGroup}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select subgroup</option>
                  {subgroups.map((subgrp) => (
                    <option key={subgrp} value={subgrp}>
                      {subgrp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Continue Button */}
              <Button
                onClick={handleContinue}
                disabled={!selectedSemester || !selectedGroup || !selectedSubgroup}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <footer className="w-full py-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Built with <span className="text-red-500 animate-pulse">❤️</span> for the <span className="text-foreground font-semibold">SLIIT Community</span>
        </p>
      </footer>
    </div>
  );
}
