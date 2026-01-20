export interface TimeTableEntry {
  day: string;
  time: string;
  module: string;
  instructor: string;
  location: string;
  subgroup: string;
}

// Fixed list of all possible semesters
const FIXED_SEMESTERS = [
  "Y1S1",
  "Y1S2",
  "Y2S1",
  "Y2S2",
  "Y3S1",
  "Y3S2",
  "Y4S1",
  "Y4S2",
];

export function parseTimeTable(htmlContent: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  const groupsBySemester: Record<string, Set<string>> = {};
  const subgroupsByGroup: Record<string, Set<string>> = {};

  // Initialize all semesters
  FIXED_SEMESTERS.forEach((sem) => {
    groupsBySemester[sem] = new Set();
  });



  // Step 1: Extract groups from table of contents and headers
  const allText = doc.body.innerText;

  // Extract all group codes using regex (e.g., Y1.S1.WD.IT.01)
  const groupMatches = allText.matchAll(
    /Y\d+\.S\d+\.[A-Z/]+\.[\w/]+\.\d{2}(?:\.\w+)?/g,
  );

  for (const match of groupMatches) {
    const fullCode = match[0];
    // Extract semester from group code (e.g., "Y1.S1" from "Y1.S1.WD.IT.01")
    const semesterMatch = fullCode.match(/^(Y\d+\.S\d+)/);
    if (!semesterMatch) continue;

    const fullSemesterCode = semesterMatch[1].replace(/\./, ""); // Convert "Y1.S1" to "Y1S1"

    // Check if this semester exists in our fixed list
    const semester = FIXED_SEMESTERS.find((s) => s === fullSemesterCode);
    if (!semester) continue;

    // Check if this is a subgroup (has more than 5 dot-separated parts or extra suffix)
    const parts = fullCode.split(".");
    const isSubgroup = parts.length > 5 || /\.\w+$/.test(fullCode);

    if (isSubgroup) {
      // This is a subgroup - find its parent group
      const groupCode = parts.slice(0, 5).join(".");
      if (!subgroupsByGroup[groupCode]) {
        subgroupsByGroup[groupCode] = new Set();
      }
      subgroupsByGroup[groupCode].add(fullCode);

      // Add parent group to semester
      if (groupsBySemester[semester]) {
        groupsBySemester[semester].add(groupCode);
      }
    } else {
      // This is a regular group (5 parts exactly)
      if (groupsBySemester[semester]) {
        groupsBySemester[semester].add(fullCode);
      }
    }
  }

  // Step 2: Extract 4-digit subgroups from detailed tables (e.g., Y1.S1.WD.IT.0101)
  const detailedTables = doc.querySelectorAll("table.detailed");

  detailedTables.forEach((detailedTable) => {
    const rows = detailedTable.querySelectorAll("tr");
    if (rows.length === 0) return;

    // First row usually contains subgroup codes
    const firstRow = rows[0];
    const cells = firstRow.querySelectorAll("td");

    for (const cell of cells) {
      const subgroupCode = cell.textContent?.trim() || "";

      // Match 4-digit subgroups like Y1.S1.WD.IT.0101
      const subgroupMatch = subgroupCode.match(
        /^(Y\d+\.S\d+\.[A-Z/]+\.[\w/]+\.\d{4})$/,
      );
      if (subgroupMatch) {
        const fullSubgroup = subgroupMatch[1];
        const semesterMatch = fullSubgroup.match(/^(Y\d+\.S\d+)/);
        if (!semesterMatch) continue;

        const fullSemesterCode = semesterMatch[1].replace(/\./, "");
        const semester = FIXED_SEMESTERS.find((s) => s === fullSemesterCode);
        if (!semester) continue;

        // Extract parent group: Y2.S2.WD.IT.0401 -> Y2.S2.WD.IT.04 (first 4 parts + first 2 digits of last part)
        const parts = fullSubgroup.split(".");
        const lastPart = parts[4]; // e.g., "0401"
        const groupLastPart = lastPart.substring(0, 2); // e.g., "04"
        const groupCode = [...parts.slice(0, 4), groupLastPart].join("."); // Y2.S2.WD.IT.04

        // Add group to semester if not already there
        if (!groupsBySemester[semester].has(groupCode)) {
          groupsBySemester[semester].add(groupCode);
        }

        // Add subgroup to group
        if (!subgroupsByGroup[groupCode]) {
          subgroupsByGroup[groupCode] = new Set();
        }
        subgroupsByGroup[groupCode].add(fullSubgroup);

        console.log(
          "[v0] Found 4-digit subgroup:",
          fullSubgroup,
          "under group:",
          groupCode,
        );
      }
    }
  });

  return {
    uniqueSemesters: FIXED_SEMESTERS,
    groupsBySemester: Object.fromEntries(
      Object.entries(groupsBySemester).map(([key, value]) => [
        key,
        Array.from(value).sort(),
      ]),
    ),
    subgroupsByGroup: Object.fromEntries(
      Object.entries(subgroupsByGroup).map(([key, value]) => {
          // Filter out the group itself if it accidentally got added as a subgroup
          const cleanValues = Array.from(value).filter(v => v !== key).sort();
          return [key, cleanValues];
      })
    ),
  };
}

export function filterTimetable(
  htmlContent: string,
  targetSubgroup: string,
): TimeTableEntry[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");

  const entries: TimeTableEntry[] = [];

  // Extract parent group code (e.g., Y1.S1.WD.IT.01 from Y1.S1.WD.IT.0101)
  // Logic: Split by dot, take first 4 parts + first 2 chars of 5th part
  // Or more simply based on the pattern seen: Y2.S2.WD.IT.04 from Y2.S2.WD.IT.0401
  let targetGroup = "";
  const parts = targetSubgroup.split(".");
  if (parts.length >= 5) {
    const lastPart = parts[4];
    if (lastPart.length >= 2) {
      targetGroup = [...parts.slice(0, 4), lastPart.substring(0, 2)].join(".");
    }
  }



  // Get all main tables
  const mainTables = Array.from(doc.querySelectorAll('table')).filter(
    (table) => !table.classList.contains('detailed')
  );

  mainTables.forEach((table) => {
    // strict check: the table must belong to the target ID (Group or Subgroup)
    // usually found in the headers: <th colspan="5">Y2.S2.WD.IT.04</th>
    const headers = table.querySelectorAll('th');
    let isRelevantTable = false;
    
    // Normalize string for comparison: remove all whitespace/hidden chars
    const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();
    const cleanTargetGroup = targetGroup ? normalize(targetGroup) : '';
    const cleanSubgroup = normalize(targetSubgroup);

    for (const th of headers) {
        const text = th.textContent || '';
        const cleanText = normalize(text);
        
        // Use includes to be safe against surrounding text/garbage
        if (cleanText.includes(cleanSubgroup) || (cleanTargetGroup && cleanText.includes(cleanTargetGroup))) {
            isRelevantTable = true;
            break;
        }
    }

    if (!isRelevantTable) {
        return;
    }

    if (!isRelevantTable) {
      return;
    }

    // Extract days
    const headerRows = table.querySelectorAll("thead tr");
    const dayHeaders: string[] = [];
    headerRows.forEach((headerRow) => {
      const headerCells = headerRow.querySelectorAll("th.xAxis");
      if (headerCells.length > 0) {
        headerCells.forEach((cell) => {
          // Some tables might use 'Monday', others might be different, but assuming standard format
          dayHeaders.push(cell.textContent?.trim() || "");
        });
      }
    });

    // We expect 5 days: Mon-Fri
    // Create a map to track occupied cells due to ROWSPAN
    // occupied[colIndex] = rowsRemaining
    const occupied: Record<number, number> = {};
    const totalCols = dayHeaders.length; // usually 5

    const bodyRows = table.querySelectorAll("tbody tr");

    bodyRows.forEach((row) => {
      // Use children to get only direct descendants (avoid nested table cells)
      const cells = Array.from(row.children).filter(el => 
          el.tagName.toLowerCase() === 'td' || el.tagName.toLowerCase() === 'th'
      ) as HTMLElement[];
      
      // First cell contains time (yAxis header)
      const timeCell = row.querySelector(':scope > th.yAxis') || row.querySelector('th.yAxis'); // fallback for robustness
      if (!timeCell) return;
      
      const time = timeCell.textContent?.trim() || "";
      if (!time || time.match(/^\d{2}:\d{2}$/)) {
        // Valid time format HH:MM
      } else {
        return;
      }

      // Start processing columns (Days)
      // We skip index 0 which is the time column itself
      let cellIndex = 1; // Index in the 'cells' array

      for (let dayIdx = 0; dayIdx < totalCols; dayIdx++) {
        // Check if this position is occupied by a rowspan from a previous row
        if (occupied[dayIdx] && occupied[dayIdx] > 0) {
          occupied[dayIdx]--;
          continue; // Skip this day, it's covered by previous row
        }

        // Get the next available cell from the DOM
        const cell = cells[cellIndex];
        if (!cell) break; // Should not happen in well-formed tables

        // Check for rowspan on this cell
        const rowspan = parseInt(cell.getAttribute("rowspan") || "1");
        if (rowspan > 1) {
          occupied[dayIdx] = rowspan - 1;
        }

        cellIndex++; // Move to next DOM cell

        // Robust text extraction FIRST
        const cellHtml = cell.innerHTML.replace(/<br\s*\/?>/gi, '\n');
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cellHtml;
        const cellContent = tempDiv.textContent || '';
        
        const lines = cellContent
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
          
        const cleanLines = lines.filter(l => l !== '---' && l !== '-x-');

        // Detailed check inside detailed tables
        const detailedTable = cell.querySelector('table.detailed');


        if (detailedTable) {
             const detailedRows = detailedTable.querySelectorAll('tr');
             if (detailedRows.length >= 4) {
                 // Check if our subgroup is in the header row
                 const subgroupCells = detailedRows[0].querySelectorAll('td');
                 let foundIdx = -1;
                 for (let k = 0; k < subgroupCells.length; k++) {
                     if (subgroupCells[k].textContent?.trim() === targetSubgroup) {
                         foundIdx = k;
                         break;
                     }
                 }
                 
                 if (foundIdx !== -1) {
                    const module = detailedRows[1].querySelectorAll('td')[foundIdx]?.textContent?.trim() || '';
                    const instructor = detailedRows[2].querySelectorAll('td')[foundIdx]?.textContent?.trim() || 'TBA';
                    const location = detailedRows[3].querySelectorAll('td')[foundIdx]?.textContent?.trim() || 'TBA';
                    
                    if (module) {
                         entries.push({
                            day: dayHeaders[dayIdx],
                            time,
                            module,
                            instructor,
                            location,
                            subgroup: targetSubgroup
                        });
                    }
                 }
             }
        } else {
             // Non-detailed cell (Common Lecture/Workshop)
             // Since we are iterating ONLY through 'isRelevantTable' tables (filtered at the top),
             // any content in this table is implicitly for our target group.
             
             const hasMatch = true;
             
             // DEBUG: Trace implicit matching

             if (hasMatch && cleanLines.length >= 2) {
                 // Format determination
                 // Usually: Groups, Module, Instructor, Location
                 let moduleIdx = 1;
                 
                 // If the first line doesn't look like a group list (doesn't contain our group),
                 // maybe it's the module? (Edge case)
                 const safeGroup = targetGroup ? targetGroup.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
                 const groupRegex = new RegExp(`${safeGroup}(?!\\d)`);
                 
                 if (
                    !cleanLines[0].includes(targetSubgroup) && 
                    (!targetGroup || !groupRegex.test(cleanLines[0]))
                 ) {
                     moduleIdx = 0;
                 }

                 if (cleanLines[moduleIdx]) {
                     entries.push({
                        day: dayHeaders[dayIdx],
                        time,
                        module: cleanLines[moduleIdx],
                        instructor: cleanLines[moduleIdx + 1] || 'TBA',
                        location: cleanLines[moduleIdx + 2] || 'TBA',
                        subgroup: targetSubgroup
                     });
                 }
             }
        }
      }
    });
  });
  
  // Post-processing: Deduplication and cleanup
  const uniqueEntries: TimeTableEntry[] = [];
  const seen = new Set<string>();

  entries.forEach(entry => {
      // 1. Detect Online location
      if (entry.module.toLowerCase().includes('online') || entry.location === 'TBA') {
          if (entry.module.toLowerCase().includes('online') || entry.instructor.toLowerCase().includes('online')) {
              entry.location = 'Online';
          }
      }

      // 2. Create unique key
      const key = `${entry.day}-${entry.time}-${entry.module}-${entry.location}`;
      if (!seen.has(key)) {
          seen.add(key);
          uniqueEntries.push(entry);
      }
  });


  return uniqueEntries;
}
