'use client';

import { useState } from 'react';
import TimetableUpload from '@/components/timetable-upload';
import TimetableViewer from '@/components/timetable-viewer';

export default function Home() {
  const [timetableData, setTimetableData] = useState<{
    html: string;
    semester: string;
    group: string;
    subgroup: string;
  } | null>(null);

  const handleReset = () => {
    setTimetableData(null);
  };

  return (
    <main className="min-h-screen bg-background">
      {!timetableData ? (
        <TimetableUpload onDataReady={setTimetableData} />
      ) : (
        <TimetableViewer data={timetableData} onReset={handleReset} />
      )}
    </main>
  );
}
