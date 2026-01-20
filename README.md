# Timetable Setup App

A web application for parsing, filtering, and viewing university timetables from HTML exports. Upload your timetable HTML file, select your semester, group, and subgroup, and instantly view your personalized schedule.

## Features

- **HTML Upload**: Upload your university timetable in HTML format
- **Smart Parsing**: Automatically extracts semesters, groups, and subgroups from timetable data
- **Semester Selection**: Choose from predefined semesters (Y1S1 through Y4S2)
- **Group & Subgroup Filtering**: Dynamically populated dropdowns based on your timetable
- **Structured View**: Display timetable entries organized by day and time with module details
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Getting Started

### Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Step 1: Upload Timetable
- Click the upload area or drag and drop an HTML file containing your university timetable
- The file must be in HTML format (`.html` or `.htm`)

### Step 2: Select Semester
- Choose your semester from the dropdown
- Supported semesters: Y1S1, Y1S2, Y2S1, Y2S2, Y3S1, Y3S2, Y4S1, Y4S2

### Step 3: Select Group
- The available groups will automatically populate based on the selected semester
- Choose your group from the dropdown

### Step 4: Select Subgroup
- Available subgroups will populate based on the selected group
- Choose your subgroup to finalize the setup

### Step 5: View Timetable
- Click "Continue" to view your personalized timetable
- Your schedule will display organized by day and time slot
- Each entry shows: Module, Instructor, and Location

## Project Structure

```
├── app/
│   ├── page.tsx              # Main app component with state management
│   ├── layout.tsx            # Root layout configuration
│   └── globals.css           # Global styles and Tailwind configuration
├── components/
│   ├── timetable-upload.tsx  # Upload form and selection interface
│   └── timetable-viewer.tsx  # Timetable display component
├── lib/
│   └── timetable-parser.ts   # HTML parsing and filtering logic
└── README.md                 # This file
```

## Technical Details

### Components

**TimetableUpload**
- Handles HTML file upload
- Manages semester, group, and subgroup selection
- Validates user input before proceeding

**TimetableViewer**
- Displays filtered timetable entries
- Organizes entries by day and time
- Provides reset functionality to return to upload screen

### Core Logic (timetable-parser.ts)

**parseTimeTable(htmlContent)**
- Extracts all semesters, groups, and subgroups from HTML
- Returns structured data for population of dropdowns
- Handles both standard groups and 4-digit subgroups

**filterTimetable(htmlContent, targetSubgroup)**
- Filters timetable entries for a specific subgroup
- Extracts module, instructor, location, day, and time information
- Returns an array of TimeTableEntry objects

## Technologies

- **Next.js 16**: React framework with App Router
- **React 19**: UI library with hooks for state management
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library built on Radix UI
- **Lucide Icons**: SVG icon library

## Timetable Format

The app expects HTML timetables with the following structure:
- Main tables containing timetable data
- Detailed nested tables within cells for subgroup information
- Table headers with day names (Monday-Friday)
- Time slots in 24-hour format (HH:MM)
- Group codes following the pattern: Y[1-4].S[1-2].[CODE].[CODE].[NUMBER]

## Troubleshooting

**File Upload Not Working**
- Ensure the file is in HTML format (.html or .htm)
- Check that the file contains valid timetable data

**Groups Not Appearing**
- Verify the HTML file contains group data for the selected semester
- Check that group codes follow the expected format

**Subgroups Not Populated**
- Ensure the selected group has subgroups in the timetable
- Some groups may not have subgroups

## Future Enhancements

- Export timetable as PDF or iCal format
- Support for multiple timetable formats
- Timetable sharing via QR code or link
- Calendar integration with Google Calendar or Outlook
- Search and filter by module name
- Conflict detection for overlapping modules

## License

This project is provided as-is for educational purposes.

## Support

For issues or questions, please check the troubleshooting section above. If you encounter persistent problems, verify your HTML timetable format matches the expected structure.
