'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Clock, BookOpen, Users, MapPin, Printer, Globe, Pencil, Trash2, Plus } from 'lucide-react';
import { filterTimetable, type TimeTableEntry } from '@/lib/timetable-parser';
import { useReactToPrint } from 'react-to-print';
import GoogleTasksSync from './google-tasks-sync';

interface TimetableViewerProps {
  data: {
    html: string;
    semester: string;
    group: string;
    subgroup: string;
  };
  onReset: () => void;
}

// Pastel colors for modules
const MODULE_COLORS = [
  'bg-blue-50/80 border-blue-200 hover:border-blue-300 print:bg-blue-100 print:border-blue-300 dark:bg-blue-950/20 dark:border-blue-800',
  'bg-green-50/80 border-green-200 hover:border-green-300 print:bg-green-100 print:border-green-300 dark:bg-green-950/20 dark:border-green-800',
  'bg-orange-50/80 border-orange-200 hover:border-orange-300 print:bg-orange-100 print:border-orange-300 dark:bg-orange-950/20 dark:border-orange-800',
  'bg-purple-50/80 border-purple-200 hover:border-purple-300 print:bg-purple-100 print:border-purple-300 dark:bg-purple-950/20 dark:border-purple-800',
];

function getModuleColor(moduleName: string): string {
  let hash = 0;
  for (let i = 0; i < moduleName.length; i++) {
    hash = moduleName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % MODULE_COLORS.length;
  return MODULE_COLORS[index];
}

const TIME_SLOTS = [
  "08:30 - 09:30", "09:30 - 10:30", "10:30 - 11:30", "11:30 - 12:30",
  "12:30 - 13:30", "13:30 - 14:30", "14:30 - 15:30", "15:30 - 16:30",
  "16:30 - 17:30", "17:30 - 18:30", "18:30 - 19:30"
];

function TimetableGrid({ entries }: { entries: TimeTableEntry[] }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Helper to check if a slot matches an entry
  const findEntry = (day: string, slotTime: string) => {
    return entries.find(e => 
      e.day === day && e.time.startsWith(slotTime.split(' - ')[0])
    );
  };

  return (
    <div className="hidden print:block w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#262d35] mb-2">Timetable</h1>
        {entries.length > 0 && <p className="text-[#262d35]/80 font-medium">Group: {entries[0].subgroup}</p>}
      </div>

      <table className="w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr>
            <th className="bg-[#262d35] text-white p-3 border border-white w-32">Time</th>
            {days.map(day => (
              <th key={day} className="bg-[#262d35] text-white p-3 border border-white w-1/5">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIME_SLOTS.map((slot) => (
            <tr key={slot}>
              <td className="bg-[#262d35] text-white p-3 border border-white font-medium text-xs text-center">
                {slot}
              </td>
              {days.map(day => {
                const entry = findEntry(day, slot);
                return (
                  <td key={day} className="border border-white bg-gray-100 p-1 align-top h-24">
                    {entry && (
                      <div className={`h-full w-full p-2 rounded ${getModuleColor(entry.module)} text-xs`}>
                        <div className="font-bold text-[#262d35] mb-1">{entry.module}</div>
                        <div className="text-[#262d35]/90 mb-1">{entry.location}</div>
                        <div className="text-[#262d35]/70 italic">{entry.instructor}</div>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getDateOfWeek(dayName: string) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const targetIndex = days.indexOf(dayName);
  if (targetIndex === -1) return '';
  
  const today = new Date();
  const currentDayIndex = today.getDay();
  const diff = targetIndex - currentDayIndex;
  
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);
  
  return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface EditEntryDialogProps {
  entry?: TimeTableEntry;
  day: string;
  subgroup: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: TimeTableEntry) => void;
  availableModules: string[];
}

function EditEntryDialog({ entry, day, subgroup, isOpen, onOpenChange, onSave, availableModules }: EditEntryDialogProps) {
  const [formData, setFormData] = useState<TimeTableEntry>({
    day: day,
    time: '08:30 - 10:30',
    module: '',
    instructor: '',
    location: '',
    subgroup: subgroup
  });

  useEffect(() => {
    if (entry) {
      setFormData(entry);
    } else {
      setFormData({
        day: day,
        time: '08:30 - 10:30',
        module: '',
        instructor: '',
        location: '',
        subgroup: subgroup
      });
    }
  }, [entry, day, subgroup, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{entry ? 'Edit Class' : 'Add Class'}</DialogTitle>
          <DialogDescription>
            {entry ? 'Make changes to this class session.' : 'Add a new class session to your timetable.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="module" className="text-right">Module</Label>
            <div className="col-span-3">
              <Select
                value={formData.module}
                onValueChange={(value) => setFormData({ ...formData, module: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Modules</SelectLabel>
                    {availableModules.map((module) => (
                      <SelectItem key={module} value={module}>
                        {module}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right">Time</Label>
            <Input
              id="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="col-span-3"
              placeholder="08:30 - 10:30"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="col-span-3"
              placeholder="Online or Location"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="instructor" className="text-right">Instructor</Label>
            <Input
              id="instructor"
              value={formData.instructor}
              onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function TimetableViewer({ data, onReset }: TimetableViewerProps) {
  const [entries, setEntries] = useState<TimeTableEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<{ entry?: TimeTableEntry, index?: number, day: string } | null>(null);
  const [availableModules, setAvailableModules] = useState<string[]>([]);

  useEffect(() => {
    const filtered = filterTimetable(data.html, data.subgroup);
    setEntries(filtered);
    
    // Extract unique modules
    const modules = Array.from(new Set(filtered.map(e => e.module))).sort();
    setAvailableModules(modules);
  }, [data]);

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const groupedByDay = groupEntriesByDay(entries);

  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: contentRef,
    documentTitle: `Timetable - ${data.subgroup}`,
  });

  const handleSaveEntry = (newEntry: TimeTableEntry) => {
    if (editingEntry?.index !== undefined && editingEntry.index >= 0) {
      // Update existing
      const newEntries = [...entries];
      // We need to find the correct index in the main array, not the grouped one.
      // But passing the direct reference or index from the main array is safer.
      // For simplicity, we'll assume the index passed from the list is correct relative to the 'day' view? No.
      // Let's rely on finding the object or just simple replacement if we have the absolute index.
      // Actually, since 'groupedByDay' creates new arrays, indices are tricky.
      // Better strategy: Filter OUT the old entry (if editing) and push the new one? Or map?
      
      // Let's use a simpler approach: Reconstruct the entries state.
      // Since we don't have unique IDs, we can't easily find the exact entry to update if there are duplicates.
      // Detailed strategy:
      // When clicking edit, we pass the actual object reference.
      // In handleSave, we `map` the entries array. If entry === editingEntry.entry, return newEntry.
      // This works unless the identical object is in there twice (unlikely for filtered data).
      
      setEntries(prev => prev.map(e => e === editingEntry.entry ? newEntry : e));
    } else {
      // Add new
      setEntries(prev => [...prev, newEntry]);
    }
    setEditingEntry(null);
  };

  const handleDeleteEntry = (entryToDelete: TimeTableEntry) => {
    setEntries(prev => prev.filter(e => e !== entryToDelete));
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Edit Dialog */}
      {editingEntry && (
        <EditEntryDialog
          isOpen={!!editingEntry}
          onOpenChange={(open) => !open && setEditingEntry(null)}
          day={editingEntry.day}
          subgroup={data.subgroup}
          entry={editingEntry.entry}
          onSave={handleSaveEntry}
          availableModules={availableModules}
        />
      )}

      <div className="max-w-5xl mx-auto">
        <style type="text/css" media="print">
          {`
            @page { size: auto;  margin: 10mm; }
          `}
        </style>
        
        {/* Header Actions */}
        <div className="mb-8 flex items-center justify-between print:hidden">
          <button
            onClick={onReset}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-2">
            <GoogleTasksSync entries={entries} />
            <Button onClick={() => handlePrint()} variant="outline" className="gap-2">
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </Button>
          </div>
        </div>

        {/* Printable Content Container */}
        <div ref={contentRef} className="print:p-4 print:bg-white print:text-black">
          
          {/* ---- GRID VIEW (Print Only) ---- */}
          <TimetableGrid entries={entries} />

          {/* ---- LIST VIEW (Screen Only) ---- */}
          <div className="print:hidden">
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h1 className="text-2xl font-bold text-foreground">Your Timetable</h1>
                
                <div className="flex items-center gap-2 text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-md border border-border/50">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Semester
                  </p>
                  <p className="text-lg font-semibold text-foreground">{data.semester}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Group
                  </p>
                  <p className="text-lg font-semibold text-foreground">{data.group}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Subgroup
                  </p>
                  <p className="text-lg font-semibold text-primary">{data.subgroup}</p>
                </div>
              </div>
            </div>

            {/* List Content */}
            {entries.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center">
                <p className="text-muted-foreground mb-4">No classes found for your selection.</p>
                <Button onClick={() => setEditingEntry({ day: 'Monday', index: -1 })}>
                   <Plus className="w-4 h-4 mr-2" />
                   Add Your First Class
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {dayOrder.map((day) => {
                  const dayEntries = groupedByDay[day] || [];
                  const dateInfo = getDateOfWeek(day);
                  
                  return (
                    <div key={day} className="break-inside-avoid">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                          <div className="w-1 h-6 bg-primary rounded-full" />
                          {day} <span className="text-muted-foreground font-medium text-base ml-1 opacity-80">{dateInfo}</span>
                        </h2>
                        
                      </div>
                      
                      <div className="space-y-3">
                        {dayEntries.length === 0 ? (
                          <div className="bg-card/50 border border-border/50 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center">
                            <Clock className="w-8 h-8 text-muted-foreground/30 mb-2" />
                            <p className="text-muted-foreground font-medium mb-3">No classes scheduled</p>
                            <Button variant="ghost" size="sm" onClick={() => setEditingEntry({ day, index: -1 })}>
                              <Plus className="w-4 h-4 mr-2" /> Add Class
                            </Button>
                          </div>
                        ) : (
                          <>
                            {dayEntries.map((entry, idx) => (
                              <div
                                key={idx}
                                className={`border rounded-lg p-5 transition-colors group break-inside-avoid ${getModuleColor(entry.module)} relative`}
                              >
                                {/* Edit/Delete Actions */}
                                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button 
                                    size="icon" 
                                    variant="secondary" 
                                    className="h-8 w-8" 
                                    onClick={() => setEditingEntry({ entry, index: 1, day })} 
                                  >
                                    <Pencil className="w-4 h-4" />
                                    <span className="sr-only">Edit</span>
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="destructive" 
                                    className="h-8 w-8"
                                    onClick={() => handleDeleteEntry(entry)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                                  {/* Time */}
                                  <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                        Time
                                      </p>
                                      <p className="text-base font-bold text-foreground">
                                        {entry.time}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Module */}
                                  <div className="flex items-start gap-3 md:col-span-2">
                                    <BookOpen className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                        Module
                                      </p>
                                      <p className="text-base font-semibold text-foreground">
                                        {entry.module}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Location */}
                                <div className="flex items-start gap-3">
                                  {entry.location === 'Online' ? (
                                      <Globe className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                  ) : (
                                      <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                  )}
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                      Location
                                    </p>
                                    <p className={`text-sm font-semibold ${entry.location === 'Online' ? 'text-blue-500' : 'text-primary'}`}>
                                      {entry.location}
                                    </p>
                                  </div>
                                </div>
                                </div>

                                {/* Instructor */}
                                <div className="mt-4 pt-4 border-t border-black/5 flex items-center gap-2">
                                  <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-semibold text-foreground">Instructor:</span> {entry.instructor}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {/* Add Button at bottom of list */}
                            <Button 
                              variant="ghost" 
                              className="w-full border border-dashed border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50"
                              onClick={() => setEditingEntry({ day, index: -1 })}
                            >
                              <Plus className="w-4 h-4 mr-2" /> Add Class to {day}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function groupEntriesByDay(entries: TimeTableEntry[]): Record<string, TimeTableEntry[]> {
  const grouped: Record<string, TimeTableEntry[]> = {};
  
  entries.forEach((entry) => {
    if (!grouped[entry.day]) {
      grouped[entry.day] = [];
    }
    grouped[entry.day].push(entry);
  });

  // Sort entries within each day by time
  Object.keys(grouped).forEach((day) => {
    grouped[day].sort((a, b) => {
      const timeA = parseInt(a.time.split(':')[0]);
      const timeB = parseInt(b.time.split(':')[0]);
      return timeA - timeB;
    });
  });

  return grouped;
}
