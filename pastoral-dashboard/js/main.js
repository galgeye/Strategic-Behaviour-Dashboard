// ================= GLOBAL STATE =================
let studentData = {};
let onCallStats = { groups:{}, students:{}, subjects:{}, teachers:{} };
let heatmapData = {}; 
let heatmapDrilldown = {}; 
let chartInstance = null;
let recentActiveDates = [];


// ================= MAIN CONTROL FLOW =================

/**
 * Main function to render all dashboard components after data is processed.
 */
function renderDashboard() {
    // 1. Update Status Bar
    document.getElementById('total-incidents').innerText = Object.values(studentData).reduce((sum, s) => sum + s.count, 0);
    
    const statusEl = document.getElementById('status-msg');
    const totalStudents = Object.keys(studentData).length;

    if (totalStudents > 0) {
        statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-green-500"></span> Data loaded: ${totalStudents} students tracked.`;
        document.getElementById('year-matrices').querySelector('.col-span-full').remove();
    } else {
        statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500"></span> No incident data found.`;
    }

    // 2. Render Main Components
    renderMatrices();
    renderOnCallStats();
    renderHeatmap();
    document.getElementById('action-plan-section').classList.remove('hidden');
}


// ================= UI FUNCTIONS =================

function showModal(title, content) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-subtitle').innerText = recentActiveDates.length > 0 
        ? `Data for last ${recentActiveDates.length} school days.` 
        : `All time data.`;
    document.getElementById('modal-content-container').innerHTML = content;
    document.getElementById('detail-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('detail-modal').classList.add('hidden');
}

function closeProfile() {
    document.getElementById('student-focus').classList.add('hidden');
    document.getElementById('ai-feature-container').classList.add('hidden');
}


// ================= DATA LOADING & LISTENERS =================

/**
 * Handles the user uploading a CSV file.
 */
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('status-msg').innerHTML = `<span class="w-2 h-2 rounded-full bg-yellow-500"></span> Parsing CSV...`;

    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.data.length > 0) {
                processData(results.data);
                renderDashboard();
            } else {
                document.getElementById('status-msg').innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500"></span> Error: Empty or invalid CSV format.`;
            }
        },
        error: function(error) {
            console.error("CSV Parsing Error:", error);
            document.getElementById('status-msg').innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500"></span> Parsing failed. Check console for details.`;
        }
    });
}

/**
 * Attaches all necessary event listeners.
 */
function setupListeners() {
    // Data/Upload Buttons
    document.getElementById('file-input').addEventListener('change', handleFileUpload);
    document.getElementById('load-demo-btn').addEventListener('click', loadDemoData);

    // UI Controls
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('close-profile-btn').addEventListener('click', closeProfile);

    // Report Buttons (from index.html)
    document.getElementById('unlock-btn').addEventListener('click', unlockReports);
    document.getElementById('bulletin-btn').addEventListener('click', generateWeeklyBulletin);
    document.getElementById('slt-report-btn').addEventListener('click', generateSLTReport);
    document.getElementById('export-tracker-btn').addEventListener('click', exportActionTracker);
    document.getElementById('action-pdf-btn').addEventListener('click', generateActionPDF);

    // Handle modal backdrop click
    document.getElementById('detail-modal').addEventListener('click', (e) => {
        if (e.target.id === 'detail-modal') {
            closeModal();
        }
    });

    // Ensure action-plan section is visible on load if it has content (only used by unlock logic now)
    document.getElementById('action-plan-section').classList.remove('hidden');
}

// Initial setup call
document.addEventListener('DOMContentLoaded', setupListeners);