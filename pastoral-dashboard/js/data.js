// ================= HELPER FUNCTIONS =================

/**
 * Helper to get initials or generate from name (3-letter logic)
 * Depends on STAFF_INITIALS_MAP from config.js
 */
function getStaffInitials(name) { 
    if (!name) return "--"; 
    const upperName = name.toUpperCase(); 
    // Check map first 
    for (const [fullName, init] of Object.entries(STAFF_INITIALS_MAP)) { 
        if (upperName.includes(fullName)) return init; 
    } 
    // Fallback: First letter of first name + First 2 letters of surname 
    const parts = name.split(' '); 
    if (parts.length >= 2) { 
        const first = parts[0][0]; 
        const last = parts[1].substring(0, 2); 
        return (first + last).toUpperCase(); 
    } 
    return name.substring(0, 3).toUpperCase(); 
} 

/**
 * Helper to get Week Number (ISO standard)
 */
function getWeekNumber(d) { 
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); 
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7)); 
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1)); 
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7); 
    return weekNo; 
} 

/**
 * Converts various date formats (including Excel serial dates) to Date object.
 */
function parseDate(d) { 
    if (typeof d === 'number') return excelDateToJSDate(d); 
    if (!d) return null; 
    const dateParts = d.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/); 
    if (dateParts) { 
        const year = dateParts[3].length === 2 ? `20${dateParts[3]}` : dateParts[3]; 
        const month = dateParts[2]; 
        const day = dateParts[1]; 
        const dt = new Date(`${year}-${month}-${day}`); 
        return isNaN(dt) ? null : dt; 
    } 
    return null; 
} 

/**
 * Converts Excel serial date to JS Date object.
 */
function excelDateToJSDate(d) { 
    const dt = new Date((d - (25567 + 1))*86400*1000); 
    return isNaN(dt) ? new Date() : dt; 
} 

/**
 * Maps a time string to a school period number (1-6).
 */
const getPeriodFromTime = (timeStr) => { 
    if (!timeStr) return 0; 
    const parts = timeStr.split(':'); 
    if (parts.length < 2) return 0; 
    const hour = parseInt(parts[0], 10); 
    const minute = parseInt(parts[1], 10); 
    const timeVal = hour + (minute / 60); 
    if (timeVal < 9.75) return 1; // Approx. 9:45
    if (timeVal < 10.75) return 2; // Approx. 10:45
    if (timeVal < 12.0) return 3; // Approx. 12:00
    if (timeVal < 13.0) return 4; // Approx. 1:00
    if (timeVal < 14.5) return 5; // Approx. 2:30
    return 6; 
}; 

/**
 * Diagnoses an incident string into one of the main categories.
 * Depends on DIAGNOSIS_MAP from config.js
 */
const diagnose = (str) => { 
    if(!str) return "General Behaviour"; 
    const s = str.toLowerCase(); 
    if(DIAGNOSIS_MAP.safety.some(k => s.includes(k))) return "Safety & Regulation"; 
    if(DIAGNOSIS_MAP.defiance.some(k => s.includes(k))) return "Respect & Cooperation"; 
    if(DIAGNOSIS_MAP.disruption.some(k => s.includes(k))) return "Engagement & Focus"; 
    if(DIAGNOSIS_MAP.organisation.some(k => s.includes(k))) return "Organisation"; 
    return "General Behaviour"; 
}; 

/**
 * Returns the CSS class for a diagnostic category.
 */
const getDiagClass = (d) => { 
    if(d.includes("Safety")) return "diag-saf"; 
    if(d.includes("Respect")) return "diag-def"; 
    if(d.includes("Engagement")) return "diag-dis"; 
    if(d.includes("Organisation")) return "diag-org"; 
    return "diag-gen"; 
}; 

/**
 * Returns the CSS color class for a heatmap cell based on incident count.
 */
const getHeatmapColor = (count) => { 
    if (!count || count === 0) return "bg-white"; 
    if (count < 3) return "bg-red-50 text-red-700"; 
    if (count < 6) return "bg-red-200 text-red-800"; 
    if (count < 10) return "bg-red-400 text-red-900"; 
    if (count < 15) return "bg-red-600 text-white"; 
    return "bg-red-900 text-white"; 
}; 

/**
 * Generates modal content for a heatmap cell drilldown.
 */
function getHeatmapStudents(day, period) { 
    const data = heatmapDrilldown[period][day]; 
    const tableBody = Object.entries(data).map(([year, classes]) => { 
        const validClasses = Object.entries(classes).filter(([code, count]) => code !== "Unknown" && code.trim() !== ""); 
        if (validClasses.length === 0) return ''; 
        
        return validClasses.map(([code, count]) => {
             // Find the students involved in these incidents for this group.
             const studentList = [];
             Object.values(studentData).forEach(s => {
                 s.incidents.forEach(i => {
                     // Check if incident matches day/period/year/group
                     const i_day = i.date.getDay();
                     const i_period = getPeriodFromTime(i.timeStr);
                     if (i_day === day && i_period === period && s.year === year && i.grp === code) {
                         if (!studentList.some(item => item.name === s.name)) {
                             studentList.push({ name: s.name, form: s.reg, count: 1 });
                         } else {
                            studentList.find(item => item.name === s.name).count++;
                         }
                     }
                 });
             });

             const studentRows = studentList.sort((a,b) => b.count - a.count).map(s => `
                <tr class="hover:bg-slate-100 cursor-pointer" onclick="closeModal(); loadProfile('${s.name.replace(/'/g, "\\'")}')">
                    <td class="px-6 py-3 font-bold text-slate-700">${s.name}</td>
                    <td class="px-6 py-3 font-mono text-slate-600">${s.form}</td>
                    <td class="px-6 py-3 text-center text-red-600 font-bold">${s.count}</td>
                </tr>
             `).join('');

             return `
                <tr class="bg-gray-100 border-t border-b border-gray-300">
                    <td colspan="3" class="px-6 py-2 text-sm font-bold text-emerald-900">
                        Year ${year} / Class: ${code} (${count} events)
                    </td>
                </tr>
                ${studentRows}
            `;

        }).join('');
    }).join(''); 

    return `
        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-red-50">
                    <tr class="text-left text-red-900 uppercase text-xs font-bold">
                        <th class="px-6 py-3 text-left">Student Name</th>
                        <th class="px-6 py-3 text-left">Form</th>
                        <th class="px-6 py-3 text-center">Incidents in Period</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-slate-200">
                    ${tableBody}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Determines if an incident row should be ignored (e.g., if it's not a removal/on-call).
 */
function isIgnored(row) {
    const type = get(row, ["eventType", "reason", "eventCode"]) || "Other";
    // For this dashboard, we only focus on significant pastoral incidents.
    const ignored = ["praise", "house point", "merit", "positive"].some(k => type.toLowerCase().includes(k));
    return ignored;
}

/**
 * Robust way to get a value from a row using multiple possible column names.
 */
function get(row, keys) {
    for (const key of keys) {
        // Find a case-insensitive match for the key in the row object
        const matchingKey = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase());
        if (matchingKey !== undefined && row[matchingKey] !== undefined && row[matchingKey] !== null) {
            return row[matchingKey];
        }
    }
    return null;
}


// ================= CORE DATA PROCESSOR =================

function processData(rows) {
    // Reset global state (defined in main.js)
    studentData = {}; 
    onCallStats = { groups:{}, students:{}, subjects:{}, teachers:{} }; 
    heatmapData = {}; 
    heatmapDrilldown = {}; 
    recentActiveDates = [];
    
    // Initialize heatmap structures
    [1,2,3,4,5,6].forEach(p => { 
        heatmapData[p] = {1:0, 2:0, 3:0, 4:0, 5:0}; 
        heatmapDrilldown[p] = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {} }; 
    }); 

    // Find the 5 most recent unique dates to define the reporting period
    const allDates = [...new Set(rows.map(row => parseDate(get(row, ["whenDate", "date", "createdDate"]))?.setHours(0,0,0,0)).filter(d => d))].sort((a, b) => b - a);
    recentActiveDates = allDates.slice(0, 5); // Take the 5 most recent dates
    const recentActiveDatesSet = new Set(recentActiveDates);

    rows.forEach(row => {
        let name = get(row, ["firstName"]) + " " + get(row, ["lastName"]) || get(row, ["name"]) || "Unknown Student";
        let year = (get(row, ["studentYearGroup", "year", "yearGroup"]) || "Unknown").toString().replace(/Year\s*/i, '').trim(); 
        let reg = get(row, ["tutorGroupName", "form", "reg"]) || "N/A"; 
        let type = get(row, ["eventType", "reason", "eventCode"]) || "Other"; 
        let subj = get(row, ["subject"]) || "General"; 
        let comments = get(row, ["schoolNotes", "comments"]) || ""; 
        let teacher = get(row, ["staffMembersInvolved", "teacher", "createdBy"]) || "Unknown"; 
        let grp = get(row, ["groupName", "group", "class"]) || "Unknown"; 
        
        if (isIgnored(row)) return;

        let dStr = get(row, ["whenDate", "date", "createdDate"]); 
        let d = parseDate(dStr); 
        if(!d) d = new Date(); 

        // 1. Process for Heatmap
        if (recentActiveDatesSet.has(d.setHours(0,0,0,0))) { 
            const day = new Date(d).getDay(); 
            let timeStr = get(row, ["whenTime", "time"]); 
            if (!timeStr) { 
                const cd = get(row, ["createdDate"]); 
                if (cd && cd.match(/\d{1,2}:\d{2}/)) timeStr = cd.match(/\d{1,2}:\d{2}/)[0]; 
            } 
            const period = getPeriodFromTime(timeStr); 

            if (day >= 1 && day <= 5 && period >= 1 && period <= 6) { 
                heatmapData[period][day]++; 
                if (!heatmapDrilldown[period][day][year]) heatmapDrilldown[period][day][year] = {}; 
                if (!heatmapDrilldown[period][day][year][grp]) heatmapDrilldown[period][day][year][grp] = 0; 
                heatmapDrilldown[period][day][year][grp]++; 
            } 
        }

        // 2. Student Data Aggregation
        let sen = get(row, ["SEN status", "sen"]); 
        let isSEN = (sen && !sen.toLowerCase().includes("no special") && sen !== "N"); 
        let pp = get(row, ["Pupil Premium Indicator", "pupil premium", "Disadvantaged"]); 
        let isPP = (pp && (String(pp).toUpperCase() === "TRUE" || pp === "1" || String(pp).toUpperCase() === "YES")); 
        let ra = get(row, ["Reading age", "reading age"]); 
        let pa = get(row, ["Prior Attainment (KS2)", "Prior Attainment"]); 

        if(!studentData[name]) { 
            studentData[name] = { 
                name, year, reg, count:0, 
                isSEN, senStatus: sen || "N", 
                isPP, 
                ra: ra || "--", 
                pa: pa || "--", 
                types: {}, 
                subjects: {}, 
                incidents: [], 
                comments: []
            };
        } 
        
        studentData[name].count++; 
        studentData[name].types[type] = (studentData[name].types[type] || 0) + 1; 
        studentData[name].subjects[subj] = (studentData[name].subjects[subj] || 0) + 1; 
        studentData[name].incidents.push({ date: d, type, subj, teacher, timeStr, grp });
        if (comments) studentData[name].comments.push(comments); 

        // 3. On-Call/Removal Stats (Focus on Incidents that are high-level)
        const onCallKeywords = ["on call", "removal", "exclusion", "safe", "physical"];
        if (onCallKeywords.some(k => type.toLowerCase().includes(k))) {
            onCallStats.groups[year] = (onCallStats.groups[year] || 0) + 1;
            onCallStats.students[name] = (onCallStats.students[name] || 0) + 1;
            onCallStats.subjects[subj] = (onCallStats.subjects[subj] || 0) + 1;
            
            const initials = getStaffInitials(teacher);
            onCallStats.teachers[initials] = (onCallStats.teachers[initials] || 0) + 1;
        }
    });

    // Sort incidents by date descending
    Object.values(studentData).forEach(s => {
        s.incidents.sort((a,b) => b.date.getTime() - a.date.getTime());
    });
}

/**
 * Creates the filtered and processed list of students needed for the action reports.
 * Depends on recentActiveDates (from main.js) and diagnose (from data.js)
 */
function getStudentStatsForActions() {
    const recentSet = new Set(recentActiveDates);
    const weekNum = recentActiveDates.length > 0 ? getWeekNumber(new Date(recentActiveDates[0])) : 0;

    return Object.values(studentData).map(s => {
        const recentIncidents = s.incidents.filter(i => recentSet.has(i.date.setHours(0,0,0,0)));
        if (recentIncidents.length === 0) return null;

        const typeCounts = {};
        recentIncidents.forEach(i => typeCounts[i.type] = (typeCounts[i.type] || 0) + 1);
        
        const topIssue = Object.entries(typeCounts).sort((a,b)=>b[1]-a[1])[0][0];
        const issueCat = diagnose(topIssue);

        return { 
            name: s.name, 
            year: s.year,
            reg: s.reg,
            recentCount: recentIncidents.length, 
            topIssue, 
            issueCat,
            weekNum 
        };
    }).filter(s => s !== null).sort((a,b) => b.recentCount - a.recentCount);
}

// ================= DEMO DATA GENERATOR =================

function loadDemoData() {
    // Sample student names
    const names = [
        "Abdus Samad Sarwar", "Adam Ammar Khodja", "Alexia Smith", "Ben Carter", "Chloe Davis", 
        "Daniel Evans", "Ella Fisher", "George Hall", "Hannah Jones", "Isaac Kelly", 
        "Jasmine Lee", "Liam Miller", "Mia Nolan", "Noah Owens", "Olivia Price"
    ];
    // Sample forms
    const forms = ["7B", "7G", "8R", "8W", "9H", "9C", "10T", "10A", "11K", "11S"];
    // Sample incident types (keywords match the DIAGNOSIS_MAP)
    const types = [
        "Disruption to Learning", "Uniform Infraction", "Refusal to Follow Instruction", 
        "Equipment Missing", "Calling Out", "Physical Altercation", "Late to Lesson", 
        "Shouting in Class", "Defiance", "Safeguarding Concern"
    ];
    // Sample subjects
    const subjects = ["Maths", "English", "Science", "History", "Geography", "Art", "PE", "Technology"];

    const demoData = [];
    const today = new Date();

    for (let i = 0; i < 300; i++) {
        const n = names[Math.floor(Math.random() * names.length)];
        const t = types[Math.floor(Math.random() * types.length)];
        const s = subjects[Math.floor(Math.random() * subjects.length)];
        const daysAgo = Math.floor(Math.random() * 30); // Last 30 days
        
        const d = new Date(today);
        d.setDate(d.getDate() - daysAgo);

        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const dateStr = `${dd}-${mm}-${yyyy}`;

        const hour = 9 + Math.floor(Math.random() * 6); // 9am to 3pm
        const min = Math.floor(Math.random() * 60);
        const timeStr = `${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`;

        // Ensure specific students have SEN status for profile testing
        let isSen = (n === "Abdus Samad Sarwar" || n === "Adam Ammar Khodja") ? "K" : (Math.random() > 0.8 ? "K" : "N");
        
        demoData.push({ 
            "firstName": n.split(" ")[0], 
            "lastName": n.split(" ").slice(1).join(" "), 
            "studentYearGroup": Math.floor(Math.random() * 5) + 7, // Years 7-11
            "tutorGroupName": forms[Math.floor(Math.random() * forms.length)], 
            "eventType": t, 
            "subject": s, 
            "whenDate": dateStr, 
            "whenTime": timeStr, 
            "SEN status": isSen, 
            "Pupil Premium Indicator": Math.random() > 0.7 ? "TRUE" : "FALSE", 
            "schoolNotes": `Student was ${t.toLowerCase()} in lesson. refused to follow instructions.`, 
            "groupName": `${d.getFullYear()}${s.substring(0,2)}1` // Simple class name 
        });
    }

    processData(demoData);
    renderDashboard();
}