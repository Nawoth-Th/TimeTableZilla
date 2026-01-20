'use client';

import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { CalendarCheck, Loader2 } from 'lucide-react';
import { TimeTableEntry } from '@/lib/timetable-parser';
import { toast } from 'sonner';

interface GoogleTasksSyncProps {
  entries: TimeTableEntry[];
}

export default function GoogleTasksSync({ entries }: GoogleTasksSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      toast.success('Signed in with Google!');
    },
    scope: 'https://www.googleapis.com/auth/tasks',
  });

  const syncToGoogleTasks = async () => {
    if (!accessToken) return;
    
    setIsSyncing(true);
    try {
      // 1. Get or Create Task List
      let taskListId = await getOrCreateTaskList(accessToken, 'TimeTableZilla');
      
      // 2. Create tasks for each entry
      let count = 0;
      for (const entry of entries) {
        await createTaskForEntry(accessToken, taskListId, entry);
        count++;
      }
      
      toast.success(`Successfully synced ${count} classes to Google Tasks!`);
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync to Google Tasks');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      {!accessToken ? (
        <Button onClick={() => login()} variant="outline" className="gap-2">
            <CalendarCheck className="w-4 h-4" />
            Sign in with Google
        </Button>
      ) : (
        <Button 
            onClick={syncToGoogleTasks} 
            disabled={isSyncing}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
            {isSyncing ? 'Syncing...' : 'Sync to Google Tasks'}
        </Button>
      )}
    </>
  );
}

// --- Helper Functions ---

async function getOrCreateTaskList(token: string, title: string): Promise<string> {
  // 1. List Task Lists
  const listRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const listData = await listRes.json();
  
  if (listData.items) {
    const existing = listData.items.find((l: any) => l.title === title);
    if (existing) return existing.id;
  }

  // 2. Create if not exists
  const createRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    method: 'POST',
    headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ title: title })
  });
  const newList = await createRes.json();
  return newList.id;
}

async function createTaskForEntry(token: string, taskListId: string, entry: TimeTableEntry) {
    // Calculate due date (Next occurrence of this day)
    const dueDate = getNextDateForDay(entry.day, entry.time);
    const dueString = dueDate.toISOString(); // RFC 3339 timestamp

    const taskTitle = `[Class] ${entry.module} (${entry.subgroup})`;
    const taskNotes = `Location: ${entry.location}\nInstructor: ${entry.instructor}\nTime: ${entry.time}`;

    await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
        method: 'POST',
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
            title: taskTitle,
            notes: taskNotes,
            due: dueString, 
        })
    });
}

function getNextDateForDay(dayName: string, timeString: string): Date {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDayIndex = days.indexOf(dayName);
    if (targetDayIndex === -1) return new Date(); // Fallback

    const now = new Date();
    const currentDayIndex = now.getDay();
    
    let daysToAdd = targetDayIndex - currentDayIndex;
    if (daysToAdd <= 0) daysToAdd += 7; // Next week if today or passed

    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysToAdd);

    // Set time (assuming HH:MM - HH:MM format)
    const startPart = timeString.split('-')[0].trim();
    const [hours, minutes] = startPart.split(':').map(Number);
    if (!isNaN(hours)) {
        targetDate.setHours(hours, minutes || 0, 0, 0);
    }
    
    return targetDate;
}
