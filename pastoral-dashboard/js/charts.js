// ================= RENDERING FUNCTIONS =================

/**
 * Renders the Year Group Analysis matrices.
 */
function renderMatrices() {
    const container = document.getElementById('year-matrices');
    container.innerHTML = '';
    
    // Group all student data by year
    const dataByYear = {};
    Object.values(studentData).forEach(s => {
        if (!dataByYear[s.year]) dataByYear[s.year] = { 
            students: [], 
            totalCount: 0, 
            issueCounts: {} 
        };
        dataByYear[s.year].students.push(s);
        dataByYear[s.year].totalCount += s.count;

        // Aggregate issue types
        Object.entries(s.types).forEach(([type, count]) => {
            dataByYear[s.year].issueCounts[type] = (dataByYear[s.year].issueCounts[type] || 0) + count;
        });
    });

    const sortedYears = Object.keys(dataByYear).sort((a, b) => parseInt(a) - parseInt(b));

    if (sortedYears.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400 bg-white border-2 border-dashed border-slate-300 rounded-xl">
            <p>No data processed. Upload a CSV file or click "Load Demo Data".</p>
        </div>`;
        return;
    }

    sortedYears.forEach(year => {
        const yearData = dataByYear[year];
        const topIssues = Object.entries(yearData.issueCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); // Top 5 issues

        const issuesHTML = topIssues.map(([issue, count]) => {
            const diag = diagnose(issue);
            const diagClass = getDiagClass(diag);
            return `<div class="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                        <span class="truncate pr-2">${issue}</span>
                        <span class="font-bold text-slate-800 ${diagClass} px-2 py-0.5 rounded text-[10px]">${count}</span>
                    </div>`;
        }).join('');

        const cardHTML = `
            <div class="bg-white p-4 rounded-xl shadow-md border border-emerald-100 animate-fade-in">
                <div class="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                    <h3 class="text-xl font-bold text-emerald-900">Year ${year}</h3>
                    <span class="text-3xl font-black text-red-600">${yearData.totalCount}</span>
                </div>
                <div class="space-y-2">
                    <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Top 5 Incidents:</h4>
                    ${issuesHTML}
                </div>
                <button onclick="showModal('Year ${year} Incidents', renderModalContent('year', '${year}'))" class="mt-4 w-full text-center text-xs text-yellow-600 font-bold hover:text-yellow-700 transition">
                    View Top Students & Details →
                </button>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}

/**
 * Renders the top hotspots from the onCallStats.
 */
function renderOnCallStats() { 
    const renderList = (data, elemId) => { 
        const el = document.getElementById(elemId); 
        const sorted = Object.entries(data).sort((a,b) => b[1]-a[1]).slice(0,5); 
        if (sorted.length === 0) { 
            el.innerHTML = `<div class="text-xs text-slate-400 italic">No specific data found.</div>`; 
            return; 
        } 
        el.innerHTML = sorted.map(([k, v], i) => 
            `<div class="flex justify-between items-center text-xs border-b border-slate-50 py-1.5 last:border-0">
                <div class="truncate pr-2 w-3/4 text-slate-600">
                    <span class="font-bold text-emerald-200 mr-2">${i+1}</span> ${k}
                </div>
                <div class="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">${v}</div>
            </div>`).join(''); 
    }; 
    renderList(onCallStats.students, 'oc-students'); 
    renderList(onCallStats.subjects, 'oc-subjects'); 
    renderList(onCallStats.teachers, 'oc-teachers'); 
    document.getElementById('on-call-analysis').classList.remove('hidden'); 
} 

/**
 * Renders the main weekly intensity heatmap.
 */
function renderHeatmap() { 
    document.getElementById('heatmap-section').classList.remove('hidden'); 
    
    // Set date range text
    const rangeEl = document.getElementById('heatmap-date-range');
    if (recentActiveDates.length > 0) {
        const start = new Date(recentActiveDates[recentActiveDates.length-1]).toLocaleDateString();
        const end = new Date(recentActiveDates[0]).toLocaleDateString();
        rangeEl.innerText = `${start} - ${end}`;
    } else {
        rangeEl.innerText = "Current Week";
    }

    const container = document.getElementById('heatmap-grid'); 
    container.innerHTML = ""; 
    const periods = ["P1 (8:45)", "P2 (9:45)", "P3 (10:45)", "P4 (12:00)", "P5 (1:00)", "P6 (2:30)"];

    [1, 2, 3, 4, 5, 6].forEach(p => { 
        const rowData = heatmapData[p]; 
        if(!rowData) return; 
        const dayCells = [1, 2, 3, 4, 5].map(d => {
            const count = rowData[d] || 0;
            const colorClass = getHeatmapColor(count);
            // Day 1-5 = Mon-Fri. Pass day and period to modal function.
            return `<div onclick="showModal('Hotspot: P${p} - ${['Mon','Tue','Wed','Thu','Fri'][d-1]}', getHeatmapStudents(${d}, ${p}))" class="hm-cell text-center p-2 rounded font-bold text-sm ${colorClass}">${count}</div>`;
        }).join('');

        const rowHTML = `
            <div class="grid grid-cols-6 gap-2 items-center">
                <div class="text-left font-bold text-xs text-slate-600">${periods[p-1]}</div>
                ${dayCells}
            </div>
        `;
        container.innerHTML += rowHTML; 
    }); 
}

/**
 * Renders the strategies in the student profile based on the diagnosis.
 * Depends on STRATEGIES and SEN_PROVISIONS_DB from config.js
 */
function renderStrategies(diag, senStatus) {
    const classroomContainer = document.getElementById('strat-classroom');
    const senContainer = document.getElementById('strat-special');
    const senHeader = document.getElementById('sen-header');

    // --- 1. Classroom Strategies (Based on Primary Diagnosis)
    const classroomStrategies = STRATEGIES[diag] || STRATEGIES["General Behaviour"];
    const classroomHtml = classroomStrategies.map(st => 
        `<div class="strat-card border-l-4 border-emerald-500 bg-emerald-50"><span class="text-emerald-600 font-bold text-lg leading-none mr-2">&#10003;</span><span>${st}</span></div>`
    ).join('');
    classroomContainer.innerHTML = classroomHtml;

    // --- 2. SEN & Special Strategies
    let senHtml = '';
    const isSEN = senStatus !== 'N' && !senStatus.toLowerCase().includes("no special");
    const specificStrategies = isSEN ? (SEN_PROVISIONS_DB[senStatus] || STRATEGIES["SEN_ADD"]) : null;

    if (specificStrategies) {
        senHeader.innerText = `${senStatus} Support Strategies`;
        senHeader.className = "text-xs font-bold text-blue-700 uppercase mb-3 border-b border-blue-100 pb-1";
        senHtml += specificStrategies.map(st => 
            `<div class="strat-card border-l-4 border-blue-500 bg-blue-50"><span class="text-blue-600 font-bold text-lg leading-none mr-2">&#10003;</span><span>${st}</span></div>`
        ).join('');
    } else if (isSEN) {
        senHeader.innerText = "General SEN Strategies";
        senHeader.className = "text-xs font-bold text-purple-600 uppercase mb-3 border-b border-purple-100 pb-1";
        senHtml += STRATEGIES["SEN_ADD"].map(st => 
            `<div class="strat-card border-l-4 border-purple-500"><span class="text-purple-600 font-bold text-lg leading-none mr-2">+</span><span>${st}</span></div>`
        ).join('');
    } else {
        senHeader.innerText = "SEN & Literacy Support";
        senHeader.className = "text-xs font-bold text-slate-400 uppercase mb-3 border-b border-slate-100 pb-1";
        senHtml = `<div class="text-xs text-slate-400 italic p-2">No specific SEN strategies required based on current status.</div>`;
    }
    senContainer.innerHTML = senHtml;
}

/**
 * Creates the Chart.js instance for the student's incident history.
 */
function renderChart(incidents) { 
    const ctx = document.getElementById('student-chart').getContext('2d'); 
    if(chartInstance) chartInstance.destroy(); 
    
    // Group incidents by month
    const months = {}; 
    incidents.forEach(i => { 
        const k = i.date.toLocaleString('default', { month: 'short', year: 'numeric' }); 
        months[k] = (months[k] || 0) + 1; 
    }); 
    
    // Sort months chronologically
    const sortedMonths = Object.entries(months).sort((a,b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateA.getTime() - dateB.getTime();
    });

    const labels = sortedMonths.map(m => m[0]);
    const dataPoints = sortedMonths.map(m => m[1]);

    chartInstance = new Chart(ctx, { 
        type: 'bar', 
        data: { 
            labels: labels, 
            datasets: [{ 
                label: 'Incidents per Month', 
                data: dataPoints, 
                backgroundColor: 'rgba(6, 78, 59, 0.7)', 
                borderColor: 'rgba(6, 78, 59, 1)', 
                borderWidth: 1,
                borderRadius: 4
            }] 
        }, 
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            scales: { 
                y: { 
                    beginAtZero: true, 
                    ticks: {
                        stepSize: 1,
                        color: '#64748b'
                    },
                    grid: {
                        color: '#f1f5f9'
                    }
                }, 
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#64748b'
                    }
                }
            }, 
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#064e3b',
                    titleColor: '#fef3c7',
                    bodyColor: '#ecfdf5',
                }
            }
        } 
    }); 
}

/**
 * Populates the modal with dynamic content based on a type (e.g., 'year').
 */
function renderModalContent(type, key) {
    if (type === 'year') {
        // Find all students in this year group and sort by incident count
        const analysisData = Object.values(studentData)
            .filter(s => s.year === key)
            .sort((a, b) => b.count - a.count)
            .map(s => {
                const types = Object.entries(s.types).sort((a, b) => b[1] - a[1]);
                const topIssue = types[0] ? types[0][0] : 'N/A';
                const onCallCount = s.incidents.filter(i => i.type.toLowerCase().includes("on call") || i.type.toLowerCase().includes("removal")).length;
                const physCount = s.incidents.filter(i => i.type.toLowerCase().includes("physical") || i.type.toLowerCase().includes("fighting")).length;
                return {
                    name: s.name,
                    reg: s.reg,
                    primaryIssue: topIssue,
                    totalEvents: s.count,
                    onCallCount: onCallCount,
                    physCount: physCount
                };
            });

        let html = '';
        if (analysisData.length === 0) {
            html += `<div class="p-10 text-center text-slate-400 italic">No student data found for Year ${key}.</div>`;
        } else {
            html += `
                <div class="bg-white rounded-lg shadow-lg overflow-hidden">
                    <table class="min-w-full divide-y divide-slate-200">
                        <thead class="bg-red-50">
                            <tr class="text-left text-red-900 uppercase text-xs font-bold">
                                <th class="px-6 py-3 text-left">Student Name</th>
                                <th class="px-6 py-3 text-left">Primary Issue</th>
                                <th class="px-6 py-3 text-center">Total Events</th>
                                <th class="px-6 py-3 text-center">On Call Count</th>
                                <th class="px-6 py-3 text-center">Physical Alt. Count</th>
                                <th class="px-6 py-3 text-center">Suggested Action</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-slate-200">
            `;
            
            analysisData.slice(0, 50).forEach((data, index) => {
                const isTop5 = index < 5;
                const decisionClass = isTop5 
                    ? "bg-red-100 text-red-800 border border-red-200" 
                    : "bg-green-100 text-green-800 border border-green-200";
                const decisionText = isTop5 ? "High Monitoring" : "Monitor";
                html += `
                    <tr class="hover:bg-slate-50 border-b border-slate-100 cursor-pointer" onclick="closeModal(); loadProfile('${data.name.replace(/'/g, "\\'")}')">
                        <td class="px-6 py-3 font-bold text-slate-700">${data.name}</td>
                        <td class="px-6 py-3"><span class="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">${data.primaryIssue}</span></td>
                        <td class="px-6 py-3 text-center font-bold text-slate-800">${data.totalEvents}</td>
                        <td class="px-6 py-3 text-center text-slate-600">${data.onCallCount}</td>
                        <td class="px-6 py-3 text-center text-slate-600">${data.physCount}</td>
                        <td class="px-6 py-3 text-center"><span class="text-[10px] font-bold uppercase px-3 py-1 rounded-full ${decisionClass}">${decisionText}</span></td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        return html;
    }
    return `<div class="p-10 text-center text-red-400">Error: Unknown modal type.</div>`;
}

/**
 * Loads and displays the deep-dive profile for a specific student.
 */
function loadProfile(name) { 
    const s = studentData[name]; 
    if(!s) return; 

    // Setup UI for AI button
    document.getElementById('ai-container').classList.add('hidden'); 
    document.getElementById('ai-feature-container').classList.remove('hidden');
    const triggerBtn = document.getElementById('ai-trigger-btn'); 
    triggerBtn.onclick = () => generateAIInsight(name); // Link button to the reporting function

    // UI visibility and scroll
    document.getElementById('student-focus').classList.remove('hidden'); 
    document.getElementById('student-focus').scrollIntoView({ behavior: 'smooth' }); 

    // Populate basic profile data
    document.getElementById('focus-name').innerText = s.name; 
    document.getElementById('focus-reg').innerText = s.reg; 
    document.getElementById('focus-count').innerText = s.count; 
    document.getElementById('focus-ra').innerText = s.ra; 
    document.getElementById('focus-pa').innerText = s.pa; 
    document.getElementById('focus-sen-detail').innerText = s.senStatus; 
    document.getElementById('focus-pp-detail').innerText = s.isPP ? "Yes" : "No"; 

    // Populate badges
    const badgeContainer = document.getElementById('focus-badges'); 
    badgeContainer.innerHTML = ""; 
    if(s.isSEN) badgeContainer.innerHTML += `<span class="tag tag-sen">SEN</span>`; 
    if(s.isPP) badgeContainer.innerHTML += `<span class="tag tag-pp">Pupil Premium</span>`; 

    // Determine primary diagnosis for strategy engine
    const sortedIssues = Object.entries(s.types).sort((a,b)=>b[1]-a[1]); 
    let topIssue = sortedIssues[0]?.[0] || "General"; 
    let diag = diagnose(topIssue); 

    // Refine diagnosis if the top one is 'General' but others exist
    if (diag === "General Behaviour" && sortedIssues.length > 1) { 
        const secondIssue = sortedIssues[1][0]; 
        const secondDiag = diagnose(secondIssue); 
        if (secondDiag !== "General Behaviour") { 
            topIssue = secondIssue; 
            diag = secondDiag;
        }
    }

    // Set diagnosis display
    const focusDiag = document.getElementById('focus-diagnosis');
    focusDiag.innerText = diag;
    focusDiag.className = `font-bold px-2 py-1 rounded text-xs uppercase ${getDiagClass(diag)}`;

    // Set top subject display
    const sortedSubjects = Object.entries(s.subjects).sort((a,b)=>b[1]-a[1]);
    document.getElementById('focus-dept').innerText = sortedSubjects[0]?.[0] || "--";

    // Set comment analysis (simple concatenation for now)
    document.getElementById('comment-analysis').innerText = s.comments.length > 0 ? s.comments.slice(-5).join('; ') : "No recent comments available.";

    // Render components
    renderStrategies(diag, s.senStatus);
    renderChart(s.incidents);
}