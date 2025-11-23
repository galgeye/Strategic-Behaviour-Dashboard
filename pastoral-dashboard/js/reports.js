// ================= SECURITY FUNCTIONS =================
/**
 * Unlocks the restricted reporting section.
 * Depends on ACCESS_PASSWORD from config.js
 */
function unlockReports() { 
    const pass = document.getElementById('password-input').value; 
    const overlay = document.getElementById('locked-overlay'); 
    const content = document.getElementById('action-content'); 
    const error = document.getElementById('password-error'); 
    
    if (pass === ACCESS_PASSWORD) { 
        overlay.classList.add('hidden'); 
        content.classList.remove('blur-sm'); 
        error.classList.add('hidden'); 
        document.getElementById('action-plan-section').classList.remove('hidden'); // Ensure section is visible
    } else { 
        error.classList.remove('hidden'); 
    } 
} 


// ================= AI FUNCTIONS =================
/**
 * Placeholder function for determining the target/intervention strategy for reports.
 */
function suggestTarget(issueCategory) {
    if (issueCategory.includes("Respect")) return "Defiance / Respect";
    if (issueCategory.includes("Engagement")) return "Low-Level Disruption";
    if (issueCategory.includes("Organisation")) return "Equipment / Readiness";
    if (issueCategory.includes("Safety")) return "Physical / Self-Regulation";
    return "General Conduct";
}

/**
 * Generates AI-powered insight for a student using Gemini (placeholder integration).
 * Depends on studentData (from main.js) and apiKey (from config.js)
 */
async function generateAIInsight(studentName) { 
    const s = studentData[studentName]; 
    if(!s) return; 

    // UI Updates 
    document.getElementById('ai-container').classList.remove('hidden'); 
    document.getElementById('ai-loading').classList.remove('hidden'); 
    document.getElementById('ai-result').classList.add('hidden'); 

    // Construct Context 
    const recentIncidents = s.incidents.slice(0, 15).map(i => `${i.date.toLocaleDateString()}: ${i.type} in ${i.subj} with ${i.teacher}`).join("\n"); 
    const recentNotes = s.comments.slice(-5).join(" | "); 
    const topSubjects = Object.entries(s.subjects).sort((a,b) => b[1] - a[1]).slice(0, 3).map(i => i[0]).join(", ");
    const topIssues = Object.entries(s.types).sort((a,b) => b[1] - a[1]).slice(0, 3).map(i => i[0]).join(", ");

    const prompt = `Analyze the pastoral data for student ${s.name} (Year ${s.year}, Form ${s.reg}).
    Data Profile: Total Incidents: ${s.count}, SEN: ${s.senStatus}, PP: ${s.isPP ? 'Yes' : 'No'}, Reading Age: ${s.ra}, Prior Attainment: ${s.pa}.
    Top Incidents: ${topIssues}
    Top Subjects: ${topSubjects}
    Recent Events (Last 15):
    ${recentIncidents}
    Recent Teacher Comments: ${recentNotes}
    
    Based on this data, provide a 3-point summary:
    1. Overall Diagnostic Pattern (The core behaviour theme)
    2. Primary Trigger/Hotspot (Subject, Teacher, Time, or type, if identifiable)
    3. Three concise, high-impact strategic actions for their Form Tutor and classroom teachers. Use markdown headings and lists for clarity.`;

    // --- PLACEHOLDER API CALL ---
    // In a real application, this would call the Gemini API
    console.log("Gemini Prompt:", prompt);

    try {
        // --- Simulated API Response ---
        const fakeResult = `
        ## 1. Overall Diagnostic Pattern
        The primary pattern is **Engagement & Focus (Disruption)**, characterised by a high volume of low-level disruptions and 'calling out' behaviour. There is a secondary pattern of **Respect & Cooperation (Defiance)** linked to refusal to follow instructions.
        
        ## 2. Primary Trigger/Hotspot
        The hotspot appears to be **Maths** and **English** lessons during periods P3/P4 (pre-lunch), often linked to the incident type 'Disruption to Learning'. The high volume suggests curriculum access or task anxiety may be a contributing factor.
        
        ## 3. Strategic Actions
        * **Chunking & Movement:** Provide short (5-10 min) chunks of work with a guaranteed, non-confrontational movement break between them.
        * **Non-Verbal Redirection:** Use only non-verbal cues (e.g., a quiet tap on the desk, eye contact) for low-level disruption to avoid escalating the secondary defiance pattern.
        * **Positive Pre-empt:** Start the trigger lessons (Maths/English) with a specific, positive interaction about a non-academic topic (e.g., their weekend, a hobby).
        `;
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        // Process and display result
        const resultDiv = document.getElementById('ai-result'); 
        resultDiv.innerHTML = fakeResult.trim().replace(/\n/g, '<br>'); // Clean potential markdown
        document.getElementById('ai-loading').classList.add('hidden'); 
        resultDiv.classList.remove('hidden'); 
    } catch (error) {
        console.error("AI Error:", error); 
        document.getElementById('ai-loading').classList.add('hidden'); 
        document.getElementById('ai-result').innerHTML = `<p class="text-red-600">Error generating insight. Please check connection/API key.</p>`; 
        document.getElementById('ai-result').classList.remove('hidden'); 
    }
} 

// ================= REPORTING FUNCTIONS =================

/**
 * Generates a Weekly Staff Bulletin PDF with key stats and year group analysis.
 * Depends on recentActiveDates (from main.js)
 */
function generateWeeklyBulletin() { 
    if (!window.jspdf) { alert("PDF library not loaded."); return; } 
    const { jsPDF } = window.jspdf; 
    const doc = new jsPDF(); 
    const dateText = new Date().toLocaleDateString(); 

    // Header
    doc.setFillColor(6, 78, 59); 
    doc.rect(0, 0, 210, 25, 'F'); 
    doc.setTextColor(255); 
    doc.setFontSize(20); 
    doc.setFont(undefined, 'bold'); 
    doc.text("Weekly Staff Bulletin", 14, 17); 
    doc.setFontSize(10); 
    doc.text(dateText, 170, 17); 

    let y = 40;
    let totalWeek = 0; 
    const recentSet = new Set(recentActiveDates); 
    const yearStats = {}; // Store stats per year group 

    // Calculate Stats
    Object.values(studentData).forEach(s => { 
        const rec = s.incidents.filter(i => recentSet.has(i.date.setHours(0,0,0,0))); 
        if (rec.length > 0) { 
            totalWeek += rec.length; 
            if (!yearStats[s.year]) yearStats[s.year] = { count: 0, types: {} }; 
            yearStats[s.year].count += rec.length; 
            rec.forEach(i => yearStats[s.year].types[i.type] = (yearStats[s.year].types[i.type] || 0) + 1);
        } 
    });

    const years = ["7", "8", "9", "10", "11"];
    const yearTableData = years.map(y => {
        const stats = yearStats[y];
        if (!stats) return [`Year ${y}`, "0", "N/A"];
        const topIssue = Object.entries(stats.types).sort((a,b) => b[1] - a[1])[0];
        const topIssueStr = topIssue ? `${topIssue[0]} (${topIssue[1]})` : "N/A";
        return [`Year ${y}`, stats.count.toString(), topIssueStr];
    }).filter(row => row); // Filter out any undefined rows

    // 1. Weekly Overview Table
    doc.setFontSize(14); 
    doc.setTextColor(6, 78, 59);
    doc.text(`Weekly Overview: ${totalWeek} Incidents Processed`, 14, y);
    y += 8;
    
    doc.autoTable({
        startY: y,
        head: [['Year Group', 'Incidents (Last 5 Days)', 'Top Issue']],
        body: yearTableData,
        theme: 'striped',
        headStyles: { fillColor: [6, 78, 59] },
        styles: { fontSize: 9 }
    });
    y = doc.lastAutoTable.finalY + 10;

    // 2. Focus Strategies (General Reminder)
    doc.setFontSize(14); 
    doc.text("Classroom Focus: Top 3 Universal Strategies", 14, y);
    y += 8;
    
    const generalStrategies = STRATEGIES["General Behaviour"].map(s => [s]);
    doc.autoTable({
        startY: y,
        head: [['Strategy']],
        body: generalStrategies,
        theme: 'grid',
        headStyles: { fillColor: [217, 119, 6] },
        styles: { fontSize: 10 }
    });
    y = doc.lastAutoTable.finalY + 10;

    // Footer
    doc.setFontSize(8); 
    doc.setTextColor(156, 163, 175);
    doc.text(`*Data covers ${recentActiveDates.length} school days. Focus on positive routines at all time.`, 14, 290); 

    doc.save(`Staff_Bulletin_${dateText}.pdf`); 
} 

/**
 * Generates the SLT Strategic Report PDF.
 */
function generateSLTReport() { 
    if (!window.jspdf) { alert("PDF library not loaded."); return; }
    const { jsPDF } = window.jspdf; 
    const doc = new jsPDF(); 

    // Header 
    doc.setFontSize(18); 
    doc.text("SLT Strategic Behaviour Overview", 14, 20); 
    doc.setFontSize(10); 
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 26); 
    
    let y = 40; 

    // 1. Key Students per Year Group (Top 3) 
    const studentStats = getStudentStatsForActions();

    doc.setFontSize(14); 
    doc.text("1. Key Students of Concern (Top 3 per Year)", 14, y); 
    y += 8; 
    
    const keyStudentRows = []; 
    const years = ["7", "8", "9", "10", "11"]; 
    years.forEach(yr => { 
        const top3 = studentStats.filter(s => s.year === yr).slice(0, 3); 
        top3.forEach(s => { 
            keyStudentRows.push([`Year ${yr}`, s.name, s.reg, s.recentCount, s.topIssue]); 
        }); 
    }); 

    doc.autoTable({ 
        startY: y, 
        head: [['Year', 'Student', 'Form', 'Incidents (Last 5 Days)', 'Top Issue']], 
        body: keyStudentRows, 
        theme: 'striped', 
        headStyles: { fillColor: [126, 34, 206] }, // Purple
        styles: { fontSize: 9 }
    }); 
    y = doc.lastAutoTable.finalY + 10; 

    // 2. On-Call/Removal Hotspots (Top 5 Subjects) 
    doc.setFontSize(14); 
    doc.text("2. On-Call/Removal Hotspots (Top 5 Subjects/Staff)", 14, y); 
    y += 8; 

    const subjectRows = Object.entries(onCallStats.subjects).sort((a,b) => b[1]-a[1]).slice(0, 5).map(([subj, count]) => ["Subject", subj, count]);
    const teacherRows = Object.entries(onCallStats.teachers).sort((a,b) => b[1]-a[1]).slice(0, 5).map(([teacher, count]) => ["Staff (Initials)", teacher, count]);
    const hotspotRows = [...subjectRows, ...teacherRows];

    doc.autoTable({ 
        startY: y, 
        head: [['Category', 'Hotspot', 'On-Call/Removal Count']], 
        body: hotspotRows, 
        theme: 'striped', 
        headStyles: { fillColor: [185, 28, 28] }, // Red
        styles: { fontSize: 9 }
    }); 
    y = doc.lastAutoTable.finalY + 10; 

    // 3. Strategic Action Areas Summary
    doc.setFontSize(14);
    doc.text("3. Strategic Action Area Summary (Based on Diagnostics)", 14, y);
    y += 8;

    const diagCounts = {};
    studentStats.forEach(s => {
        diagCounts[s.issueCat] = (diagCounts[s.issueCat] || 0) + 1;
    });

    const sortedDiags = Object.entries(diagCounts).sort((a, b) => b[1] - a[1]);
    const diagRows = sortedDiags.map(([cat, count]) => [cat, count.toString(), suggestTarget(cat)]);

    doc.autoTable({ 
        startY: y, 
        head: [['Diagnostic Pattern', 'Students Affected (Top)', 'Suggested Focus for SLT']], 
        body: diagRows, 
        theme: 'striped', 
        headStyles: { fillColor: [217, 119, 6] }, // Gold
        styles: { fontSize: 9 }
    }); 
    y = doc.lastAutoTable.finalY + 10; 

    doc.save(`SLT_Strategic_Report_${new Date().toLocaleDateString()}.pdf`); 
}

/**
 * Generates the Action Tracker CSV file for Excel import.
 * Depends on SLT_LEADS, HOY_LEADS (from config.js)
 */
function exportActionTracker() { 
    const studentStats = getStudentStatsForActions();

    const csvRows = [ 
        ["Week #", "Date", "Role", "Staff Initials", "Student Name", "Form", "Incidents", "Top Issue", "Action Required", "Status", "Notes", "Follow-up Date"] 
    ]; 
    const assignedStudents = new Set(); 
    const dateStr = new Date().toLocaleDateString();

    // A. SLT (Assistant Heads) 
    studentStats.slice(0, 5).forEach(s => { 
        assignedStudents.add(s.name); 
        const staffInit = SLT_LEADS[s.year] || "SLT"; 
        csvRows.push([s.weekNum, dateStr, "Assistant Head", staffInit, s.name, s.reg, s.recentCount, s.topIssue, "Review Exclusion Risk", "Pending", "", ""]); 
    }); 

    // B. HOY (Heads of Year) 
    const years = ["7", "8", "9", "10", "11"]; 
    years.forEach(y => { 
        const yearStudents = studentStats.filter(s => s.year === y && s.recentCount > 5 && !assignedStudents.has(s.name)).slice(0, 3); 
        yearStudents.forEach(s => { 
            assignedStudents.add(s.name); 
            const staffInit = HOY_LEADS[y] || "HOY"; 
            csvRows.push([s.weekNum, dateStr, "Head of Year", staffInit, s.name, s.reg, s.recentCount, s.topIssue, `Red Report - Focus: ${suggestTarget(s.issueCat)}`, "Pending", "", ""]); 
        }); 
    }); 

    // C. Tutors (Top 1 per form, > 3 events, NOT assigned to SLT/HOY)
    const forms = [...new Set(studentStats.map(s => s.reg))];
    forms.forEach(f => {
        const topStudent = studentStats.find(s => s.reg === f && s.recentCount > 3 && !assignedStudents.has(s.name));
        if (topStudent) {
            assignedStudents.add(topStudent.name);
            csvRows.push([topStudent.weekNum, dateStr, "Form Tutor", topStudent.reg, topStudent.name, topStudent.reg, topStudent.recentCount, topStudent.topIssue, `Contact Home - Strategy: ${suggestTarget(topStudent.issueCat)}`, "Pending", "", ""]); 
        }
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n"); 
    const encodedUri = encodeURI(csvContent); 
    const link = document.createElement("a"); 
    link.setAttribute("href", encodedUri); 
    link.setAttribute("download", `Action_Tracker_Week_${studentStats[0]?.weekNum || 'NA'}.csv`); 
    document.body.appendChild(link); // Required for Firefox 
    link.click(); 
    document.body.removeChild(link); 
} 

/**
 * Generates a Form-by-Form Actions PDF.
 */
async function generateActionPDF() { 
    if (!window.jspdf) { alert("PDF library not loaded."); return; } 
    const { jsPDF } = window.jspdf; 
    const doc = new jsPDF(); 
    
    const studentStats = getStudentStatsForActions(); 
    const assignedStudents = new Set(); 
    const dateRangeText = recentActiveDates.length > 0 ? `${new Date(recentActiveDates[recentActiveDates.length-1]).toLocaleDateString()} - ${new Date(recentActiveDates[0]).toLocaleDateString()}` : "All Time";

    // Global Header
    doc.setFontSize(18); 
    doc.text("Pastoral Action Plan (Week Focus)", 14, 20); 
    doc.setFontSize(10); 
    doc.text(`Data Range: ${dateRangeText}`, 14, 26);
    
    let y = 35;

    // Section 1: SLT / Assistant Head Actions (Top 5 School-Wide) 
    const top5School = studentStats.slice(0, 5); 
    top5School.forEach(s => assignedStudents.add(s.name)); 

    doc.setFillColor(126, 34, 206); // Purple
    doc.rect(14, y, 182, 8, 'F'); 
    doc.setTextColor(255); 
    doc.setFontSize(12); 
    doc.setFont(undefined, 'bold'); 
    doc.text("SLT / Assistant Head Actions (Top 5 School-Wide)", 16, y + 5.5); 
    y += 10; 
    doc.setTextColor(0); 
    doc.setFontSize(10); 

    const sltData = top5School.map(s => [ 
        s.name, 
        s.reg, 
        s.recentCount, 
        s.issueCat, 
        `Review Red Report / Exclusion Risk (Lead: ${SLT_LEADS[s.year] || "SLT"})`
    ]);
    
    doc.autoTable({ 
        startY: y, 
        head: [['Student', 'Form', 'Count', 'Pattern', 'SLT Action']], 
        body: sltData, 
        theme: 'striped', 
        headStyles: {fillColor: [126, 34, 206]}, 
        styles: {fontSize: 8} 
    });
    y = doc.lastAutoTable.finalY + 8;


    // Section 2: Heads of Year
    const years = ["7", "8", "9", "10", "11"];
    const topPerYear = {};
    years.forEach(y => {
        topPerYear[y] = studentStats 
            .filter(s => s.year === y && s.recentCount > 5 && !assignedStudents.has(s.name)) 
            .slice(0, 3); 
        topPerYear[y].forEach(s => assignedStudents.add(s.name));
    });

    doc.addPage(); 
    y = 20;

    doc.setFillColor(217, 119, 6); // Gold
    doc.rect(14, y, 182, 8, 'F'); 
    doc.setTextColor(255); 
    doc.setFontSize(12); 
    doc.setFont(undefined, 'bold'); 
    doc.text("Head of Year Actions (Top 3 Per Year > 5 Events - Excluding SLT List)", 16, y + 5.5); 
    y += 10; 
    doc.setTextColor(0); 
    doc.setFontSize(10); 

    years.forEach(yr => { 
        if(!topPerYear[yr] || topPerYear[yr].length === 0) return; 
        
        if (y > 270) { doc.addPage(); y = 20; } 
        doc.setFont(undefined, 'bold'); 
        doc.text(`Year ${yr} (Lead: ${HOY_LEADS[yr] || 'HOY'})`, 14, y); 
        y += 2; 
        
        const hoyData = topPerYear[yr].map(s => [ 
            s.name, 
            s.reg, 
            s.recentCount, 
            s.issueCat, 
            `Issue RED Monitoring Form (Focus: ${suggestTarget(s.issueCat)})` 
        ]); 

        doc.autoTable({ 
            startY: y + 1, 
            head: [['Student', 'Form', 'Count', 'Pattern', 'HOY Action']], 
            body: hoyData, 
            theme: 'striped', 
            headStyles: {fillColor: [217, 119, 6]}, 
            styles: {fontSize: 8} 
        }); 
        y = doc.lastAutoTable.finalY + 8; 
    }); 

    // Section 3: Form Tutors (Top 1 per Form, > 3 events, NOT in SLT/HOY list)
    doc.addPage(); 
    y = 20; 

    doc.setFillColor(5, 150, 105); // Emerald
    doc.rect(14, y, 182, 8, 'F'); 
    doc.setTextColor(255); 
    doc.setFontSize(12); 
    doc.setFont(undefined, 'bold'); 
    doc.text("Form Tutor Actions (Top Student Per Form > 3 Events - Excluding SLT/HOY List)", 16, y + 5.5); 
    y += 10; 
    doc.setTextColor(0); 
    doc.setFontSize(10); 

    const formTutorData = [];
    const forms = [...new Set(studentStats.map(s => s.reg))];
    forms.forEach(f => {
        const topStudent = studentStats.find(s => s.reg === f && s.recentCount > 3 && !assignedStudents.has(s.name));
        if (topStudent) {
            formTutorData.push([
                topStudent.name,
                topStudent.reg,
                topStudent.recentCount,
                topStudent.issueCat,
                `Contact Home for Support (Focus: ${suggestTarget(topStudent.issueCat)})`
            ]);
        }
    });

    if (formTutorData.length > 0) {
        doc.autoTable({
            startY: y + 1,
            head: [['Student', 'Form', 'Count', 'Pattern', 'Tutor Action']],
            body: formTutorData,
            theme: 'striped',
            headStyles: {fillColor: [5, 150, 105]},
            styles: {fontSize: 8}
        });
        y = doc.lastAutoTable.finalY + 8;
    } else {
        doc.text("No students meet the criteria for Form Tutor-led action this week.", 14, y + 5);
    }
    
    doc.save(`Form_Actions_Week_${studentStats[0]?.weekNum || 'NA'}.pdf`);
}