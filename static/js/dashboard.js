const API_BASE_URL = 'http://127.0.0.1:5000/api';

// ==========================================
// KHAI BÁO BIẾN TOÀN CỤC CHO CÁC BIỂU ĐỒ (GLOBAL INSTANCES)
// ==========================================
let locationChartInstance = null;
let sourceChartInstance = null;
let skillsChartInstance = null;
let skillsRadarChartInstance = null;
let skillsTrendChartInstance = null;
let salaryBarChartInstance = null;
let salaryDoughnutChartInstance = null;
let salaryBoxPlotInstance = null;
let salaryHistogramChartInstance = null;
let salaryScatterChartInstance = null;
let locationPieChartInstance = null;
let trendsLineChartInstance = null;
let trendsStackedBarChartInstance = null;

// Biến lưu trữ dữ liệu thô (Raw Data) để tối ưu hiệu năng bộ lọc
let currentJobsData = []; 
let rawSalaryData = []; 
let rawJobsDataForSalary = [];
let rawLocationJobsData = [];
let rawTrendsData = [];

let isVND = false; 
const EXCHANGE_RATE = 25000;

// ==========================================
// TRANG 1: TỔNG QUAN (DASHBOARD)
// ==========================================
async function loadDashboardData() {
    const refreshBtn = document.getElementById('btn-refresh-dashboard');
    try {
        if(refreshBtn) { refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang xử lý...'; refreshBtn.disabled = true; }

        const [jobsRes, skillsRes, salaryRes, sourceRes, locationRes] = await Promise.all([
            fetch(`${API_BASE_URL}/jobs?limit=1`).then(r => r.json()),
            fetch(`${API_BASE_URL}/stats/top-skills?limit=100`).then(r => r.json()),
            fetch(`${API_BASE_URL}/stats/salary-trends`).then(r => r.json()),
            fetch(`${API_BASE_URL}/stats/sources`).then(r => r.json()),
            fetch(`${API_BASE_URL}/stats/locations?limit=100`).then(r => r.json())
        ]);

        if (jobsRes.status === "success") document.getElementById('kpi-total-jobs').innerText = jobsRes.pagination.total_records;
        
        if (skillsRes.status === "success") {
            document.getElementById('kpi-total-skills').innerText = skillsRes.count;
            const ul = document.getElementById('top-5-skills-list');
            if(ul) {
                ul.innerHTML = ''; 
                skillsRes.data.slice(0, 5).forEach((item, index) => {
                    ul.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center py-2">
                        <span><span class="badge bg-secondary me-2">#${index + 1}</span> <strong>${item.skill}</strong></span>
                        <span class="text-primary fw-bold text-sm">${item.count} jobs</span></li>`;
                });
            }
        }
        
        if (salaryRes.data && salaryRes.data.length > 0) {
            let total = 0; salaryRes.data.forEach(i => total += i.average_salary);
            document.getElementById('kpi-avg-salary').innerText = "$" + (total / salaryRes.data.length).toFixed(0); 
        }
        
        if (sourceRes.status === "success" && sourceRes.data) {
            if (sourceRes.data.length > 0) {
                document.getElementById('kpi-top-source').innerText = sourceRes.data[0].source || "Khác";
            }
            renderSourceBarChart(sourceRes.data);
        }
        
        if (locationRes.data) renderLocationDoughnut(locationRes.data);
        
        // Cập nhật đồng hồ thời gian thực
        updateLastUpdatedTime();

    } catch (error) { console.error("Lỗi Dashboard:", error); } 
    finally { if(refreshBtn) { refreshBtn.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Làm mới dữ liệu'; refreshBtn.disabled = false; } }
}

function renderLocationDoughnut(data) {
    const ctx = document.getElementById('locationDoughnutChart');
    if(!ctx) return;
    if (locationChartInstance) locationChartInstance.destroy();

    let hnCount = 0, hcmCount = 0, dnCount = 0, otherCount = 0;
    data.forEach(item => {
        let loc = item.location ? item.location.toLowerCase() : "";
        if (loc.includes("hà nội") || loc.includes("hanoi")) hnCount += item.count;
        else if (loc.includes("hồ chí minh") || loc.includes("ho chi minh") || loc.includes("hcm")) hcmCount += item.count;
        else if (loc.includes("đà nẵng") || loc.includes("da nang")) dnCount += item.count;
        else otherCount += item.count;
    });

    const labels = [], counts = [], colors = [];
    if (hnCount > 0) { labels.push("Hà Nội"); counts.push(hnCount); colors.push('#0d6efd'); }
    if (hcmCount > 0) { labels.push("Hồ Chí Minh"); counts.push(hcmCount); colors.push('#ffc107'); }
    if (dnCount > 0) { labels.push("Đà Nẵng"); counts.push(dnCount); colors.push('#198754'); }
    if (otherCount > 0) { labels.push("Khác"); counts.push(otherCount); colors.push('#6c757d'); }

    locationChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: { labels: labels, datasets: [{ data: counts, backgroundColor: colors, borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } }, cutout: '70%' }
    });
}

function renderSourceBarChart(data) {
    const ctx = document.getElementById('sourceBarChart');
    if(!ctx) return;
    if (sourceChartInstance) sourceChartInstance.destroy();

    const labels = data.map(item => item.source || "Khác");
    const counts = data.map(item => item.count);
    const barColors = ['#198754', '#20c997', '#0dcaf0', '#0d6efd', '#6f42c1'];

    sourceChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Số lượng tin cào được',
                data: counts,
                backgroundColor: barColors.slice(0, labels.length),
                borderRadius: 4,
                maxBarThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function updateLastUpdatedTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const timeString = `${day}/${month}/${year} ${hours}:${minutes}`;
    const timeEl = document.getElementById('last-updated-time');
    if (timeEl) {
        timeEl.innerHTML = `🕒 Cập nhật lần cuối: <span class="fw-bold text-primary">${timeString}</span>`;
    }
}

// ==========================================
// TRANG 2: KHÁM PHÁ VIỆC LÀM (JOB EXPLORER)
// ==========================================
async function loadJobsTable(page = 1) {
    const tbody = document.getElementById('jobsTableBody');
    if(!tbody) return;
    
    const searchVal = document.getElementById('filter-search')?.value || '';
    const locationVal = document.getElementById('filter-location')?.value || '';
    const salaryVal = document.getElementById('filter-salary')?.value || '';
    
    try {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-5 text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Đang tải dữ liệu...</td></tr>';
        const url = `${API_BASE_URL}/jobs?page=${page}&limit=15&search=${encodeURIComponent(searchVal)}&location=${encodeURIComponent(locationVal)}&min_salary=${salaryVal}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.status === "success") {
            currentJobsData = data.data; 
            renderJobsTable(currentJobsData);
            renderPagination(data.pagination);
        }
    } catch (error) { tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">Lỗi tải dữ liệu.</td></tr>'; }
}

function renderJobsTable(jobsList) {
    const tbody = document.getElementById('jobsTableBody');
    tbody.innerHTML = ''; 
    if (jobsList.length === 0) { tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Không có dữ liệu phù hợp.</td></tr>'; return; }

    jobsList.forEach((job, index) => {
        let salaryDisplay = `<span class="badge bg-secondary">Thỏa thuận</span>`;
        if (job.salary_min && job.salary_max) salaryDisplay = `<span class="fw-bold text-success">$${job.salary_min} - $${job.salary_max}</span>`;

        tbody.innerHTML += `
            <tr class="job-row">
                <td class="text-muted">#${job.id}</td>
                <td class="fw-bold text-primary">${job.title}</td>
                <td><i class="far fa-building text-muted me-1"></i>${job.company}</td>
                <td>${job.location || 'Không xác định'}</td>
                <td>${salaryDisplay}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary rounded-circle me-1" onclick="openJobModal(${index})"><i class="fas fa-eye"></i></button>
                    <a href="${job.url}" target="_blank" class="btn btn-sm btn-outline-info rounded-circle"><i class="fas fa-external-link-alt"></i></a>
                </td>
            </tr>`;
    });
}

function renderPagination(pagination) {
    const ul = document.getElementById('paginationControls');
    if(!ul) return;
    ul.innerHTML = ''; 
    document.getElementById('pageInfo').innerText = `Đang hiển thị trang ${pagination.current_page} / ${pagination.total_pages}`;

    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${pagination.current_page === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<button class="page-link">Trước</button>`;
    prevLi.onclick = () => { if(pagination.current_page > 1) loadJobsTable(pagination.current_page - 1); };
    ul.appendChild(prevLi);

    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${pagination.current_page === pagination.total_pages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<button class="page-link">Sau</button>`;
    nextLi.onclick = () => { if(pagination.current_page < pagination.total_pages) loadJobsTable(pagination.current_page + 1); };
    ul.appendChild(nextLi);
}

function openJobModal(arrayIndex) {
    const job = currentJobsData[arrayIndex];
    if(!job) return;
    document.getElementById('modal-job-title').innerText = job.title || "";
    document.getElementById('modal-job-company').innerText = job.company || "";
    document.getElementById('modal-job-location').innerText = job.location || "Chưa cập nhật";
    document.getElementById('modal-job-desc').innerText = job.description || "Không có mô tả.";
    document.getElementById('modal-job-link').href = job.url || "#";
    document.getElementById('modal-job-salary').innerText = (job.salary_min && job.salary_max) ? `$${job.salary_min} - $${job.salary_max}` : "Thỏa thuận";
    bootstrap.Modal.getOrCreateInstance(document.getElementById('jobDetailModal')).show();
}

// ==========================================
// TRANG 3: PHÂN TÍCH KỸ NĂNG (SKILLS ANALYTICS)
// ==========================================
async function loadSkillsAnalytics(limit = 20) {
    try {
        const fetchLimit = limit < 50 ? 50 : limit; 
        
        const [skillsRes, jobsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/stats/top-skills?limit=${fetchLimit}`).then(r => r.json()),
            fetch(`${API_BASE_URL}/jobs?limit=500`).then(r => r.json())
        ]);
        
        if (skillsRes.status === "success") {
            const displayData = skillsRes.data.slice(0, limit);
            renderSkillsBarChart(displayData);
            renderWordCloud(displayData);
            renderSkillsRadarChart(skillsRes.data);

            if (jobsRes.status === "success" && jobsRes.data) {
                renderSkillsTrendChart(skillsRes.data.slice(0, 5), jobsRes.data);
            }
        }
    } catch (error) { console.error("Lỗi Tải Dữ Liệu Skills Analytics:", error); }
}

function renderSkillsBarChart(data) {
    const ctx = document.getElementById('skillsBarChart');
    if(!ctx) return;
    if (skillsChartInstance) skillsChartInstance.destroy();
    skillsChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: { labels: data.map(i => i.skill), datasets: [{ data: data.map(i => i.count), backgroundColor: 'rgba(13, 110, 253, 0.75)', borderRadius: 4 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function renderWordCloud(data) {
    const cloudContainer = document.getElementById('skillsWordCloud');
    if(!cloudContainer) return;
    cloudContainer.innerHTML = ''; 
    if (data.length === 0) return;

    const maxCount = data[0].count, minCount = data[data.length - 1].count;
    const colors = ['#0d6efd', '#198754', '#dc3545', '#ffc107', '#0dcaf0', '#6f42c1', '#fd7e14', '#20c997'];
    const shuffledData = [...data].sort(() => 0.5 - Math.random());

    shuffledData.forEach(item => {
        let fontSize = 16; 
        if (maxCount > minCount) fontSize = 16 + ((item.count - minCount) / (maxCount - minCount)) * 34;

        const span = document.createElement('span');
        span.innerText = item.skill;
        span.title = `Xuất hiện trong ${item.count} công việc`;
        span.style = `font-size: ${fontSize}px; color: ${colors[Math.floor(Math.random() * colors.length)]}; font-weight: ${fontSize > 24 ? 'bold' : '600'}; padding: 5px; transition: transform 0.2s; cursor: pointer; display: inline-block;`;
        span.onmouseover = () => span.style.transform = 'scale(1.2) rotate(-3deg)';
        span.onmouseout = () => span.style.transform = 'scale(1) rotate(0deg)';
        cloudContainer.appendChild(span);
    });
}

function renderSkillsRadarChart(data) {
    const ctx = document.getElementById('skillsRadarChart');
    if(!ctx) return;
    if (skillsRadarChartInstance) skillsRadarChartInstance.destroy();

    const categories = { 'Web Backend': 0, 'Web Frontend': 0, 'Data & AI': 0, 'DevOps & Cloud': 0, 'Mobile App': 0, 'System & Security': 0 };

    data.forEach(item => {
        const skill = item.skill.toLowerCase();
        const count = item.count;
        if (/(java(?!script)|python|c#|\.net|node|php|ruby|golang|c\+\+|spring|laravel|django)/.test(skill)) categories['Web Backend'] += count;
        else if (/(react(?! native)|angular|vue|html|css|javascript|typescript|bootstrap|tailwind)/.test(skill)) categories['Web Frontend'] += count;
        else if (/(sql|mysql|postgres|mongo|data|machine learning|ai|pandas|spark|hadoop)/.test(skill)) categories['Data & AI'] += count;
        else if (/(aws|docker|kubernetes|azure|ci\/cd|linux|jenkins|terraform|ansible|gcp|cloud)/.test(skill)) categories['DevOps & Cloud'] += count;
        else if (/(ios|android|flutter|react native|swift|kotlin|dart)/.test(skill)) categories['Mobile App'] += count;
        else if (/(security|network|bash|shell|system)/.test(skill)) categories['System & Security'] += count;
    });

    skillsRadarChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'radar',
        data: { labels: Object.keys(categories), datasets: [{ label: 'Nhu cầu thị trường', data: Object.values(categories), backgroundColor: 'rgba(13, 202, 240, 0.4)', borderColor: '#0dcaf0', borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { r: { angleLines: { display: true }, suggestedMin: 0, ticks: { display: false } } }, plugins: { legend: { position: 'bottom' } } }
    });
}

function renderSkillsTrendChart(topSkills, jobsData) {
    const ctx = document.getElementById('skillsTrendChart');
    if(!ctx) return;
    if (skillsTrendChartInstance) skillsTrendChartInstance.destroy();

    const skillNames = topSkills.map(s => s.skill);
    const dateMap = {};

    jobsData.forEach(job => {
        if (!job.created_at) return;
        const dateStr = job.created_at.substring(0, 10);
        
        if (!dateMap[dateStr]) {
            dateMap[dateStr] = {};
            skillNames.forEach(s => dateMap[dateStr][s] = 0);
        }

        const textToSearch = (job.title + " " + (job.description || "")).toLowerCase();
        
        skillNames.forEach(skill => {
            const safeSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase();
            const regex = new RegExp(`(^|[^a-z0-9])${safeSkill}([^a-z0-9]|$)`, 'i');
            if (regex.test(textToSearch)) {
                dateMap[dateStr][skill]++;
            }
        });
    });

    const sortedDates = Object.keys(dateMap).sort((a, b) => new Date(a) - new Date(b));
    const colors = ['#0d6efd', '#dc3545', '#198754', '#ffc107', '#6f42c1'];
    
    const datasets = skillNames.map((skillName, index) => {
        return {
            label: skillName,
            data: sortedDates.map(date => dateMap[date][skillName]),
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length],
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 4
        };
    });

    skillsTrendChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: { labels: sortedDates, datasets: datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}

// ==========================================
// TRANG 4: PHÂN TÍCH LƯƠNG CHUYÊN SÂU (SALARY ANALYTICS)
// ==========================================
async function loadSalaryAnalytics() {
    try {
        const [resBar, resJobs] = await Promise.all([
            fetch(`${API_BASE_URL}/stats/salary-trends`).then(r => r.json()),
            fetch(`${API_BASE_URL}/jobs?limit=300`).then(r => r.json())
        ]);
        if (resBar.status === "success") rawSalaryData = resBar.data;
        if (resJobs.status === "success") rawJobsDataForSalary = resJobs.data.filter(j => j.salary_min && j.salary_max);
        
        updateSalaryCharts();
    } catch (error) { console.error("Lỗi tải dữ liệu lương:", error); }
}

function updateSalaryCharts() {
    const rate = isVND ? EXCHANGE_RATE : 1;
    const symbol = isVND ? '₫' : '$';

    // 1. Horizontal Bar
    let topSkills = [...rawSalaryData].sort((a, b) => b.average_salary - a.average_salary).slice(0, 10);
    renderHorizontalBar(topSkills.map(i => i.skill), topSkills.map(i => i.average_salary * rate), symbol);

    // 2. Doughnut
    const avgSalaries = rawJobsDataForSalary.map(job => ((job.salary_min + job.salary_max) / 2) * rate);
    let b1 = 0, b2 = 0, b3 = 0, b4 = 0;
    avgSalaries.forEach(sal => {
        const usdSal = isVND ? sal / EXCHANGE_RATE : sal; 
        if (usdSal < 1000) b1++; else if (usdSal < 2000) b2++; else if (usdSal < 3000) b3++; else b4++;
    });
    renderDoughnutChart([`< 1000$`, `1000$ - 2000$`, `2000$ - 3000$`, `> 3000$`], [b1, b2, b3, b4]);

    // 3. Histogram
    renderHistogram(avgSalaries, symbol);

    // 4. Box Plot
    const expGroups = { 'Fresher/Intern': [], 'Junior': [], 'Middle': [], 'Senior': [], 'Lead/Manager': [] };
    rawJobsDataForSalary.forEach(job => {
        const title = job.title.toLowerCase();
        const sal = ((job.salary_min + job.salary_max) / 2) * rate;
        if (title.includes('intern') || title.includes('fresher') || title.includes('thực tập')) expGroups['Fresher/Intern'].push(sal);
        else if (title.includes('junior')) expGroups['Junior'].push(sal);
        else if (title.includes('senior') || title.includes('chuyên viên')) expGroups['Senior'].push(sal);
        else if (title.includes('lead') || title.includes('manager') || title.includes('quản lý')) expGroups['Lead/Manager'].push(sal);
        else expGroups['Middle'].push(sal); 
    });
    renderBoxPlot(expGroups, symbol);

    // 5. Scatter Plot
    const scatterData = rawJobsDataForSalary.map(job => ({ x: job.salary_min * rate, y: job.salary_max * rate, rawTitle: job.title }));
    renderScatterPlot(scatterData, symbol);
}

function renderHorizontalBar(labels, data, symbol) {
    const ctx = document.getElementById('salaryBarChart');
    if(!ctx) return;
    if (salaryBarChartInstance) salaryBarChartInstance.destroy();
    salaryBarChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: { labels: labels, datasets: [{ data: data, backgroundColor: '#0d6efd', borderRadius: 4, maxBarThickness: 25 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function renderDoughnutChart(labels, data) {
    const ctx = document.getElementById('salaryDoughnutChart');
    if(!ctx) return;
    if (salaryDoughnutChartInstance) salaryDoughnutChartInstance.destroy();
    salaryDoughnutChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: { labels: labels, datasets: [{ data: data, backgroundColor: ['#6c757d', '#198754', '#ffc107', '#dc3545'] }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });
}

function renderHistogram(data, symbol) {
    const ctx = document.getElementById('salaryHistogramChart');
    if(!ctx) return;
    if (salaryHistogramChartInstance) salaryHistogramChartInstance.destroy();
    
    const bins = [0, 0, 0, 0, 0];
    const binLabels = isVND ? ['< 15 Tr', '15-25 Tr', '25-40 Tr', '40-60 Tr', '> 60 Tr'] : ['< $600', '$600 - 1k', '$1k - 1.6k', '$1.6k - 2.4k', '> $2.4k'];
    data.forEach(sal => {
        const usdSal = isVND ? sal / EXCHANGE_RATE : sal;
        if (usdSal < 600) bins[0]++; else if (usdSal < 1000) bins[1]++; else if (usdSal < 1600) bins[2]++; else if (usdSal < 2400) bins[3]++; else bins[4]++;
    });

    salaryHistogramChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: { labels: binLabels, datasets: [{ label: 'Số lượng việc làm', data: bins, backgroundColor: '#20c997', maxBarThickness: 50 }] },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { display: true, title: { display: true, text: `Dải lương (${symbol})` } } } }
    });
}

function renderBoxPlot(groups, symbol) {
    const ctx = document.getElementById('salaryBoxPlot');
    if(!ctx || typeof Chart.controllers.boxplot === 'undefined') return;
    if (salaryBoxPlotInstance) salaryBoxPlotInstance.destroy();

    const labels = Object.keys(groups);
    const boxplotData = labels.map(key => groups[key].length > 0 ? groups[key] : [0]);

    salaryBoxPlotInstance = new Chart(ctx.getContext('2d'), {
        type: 'boxplot',
        data: { labels: labels, datasets: [{ label: 'Dải lương thị trường', backgroundColor: 'rgba(13, 202, 240, 0.5)', borderColor: '#0dcaf0', borderWidth: 2, outlierBackgroundColor: '#dc3545', data: boxplotData }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function renderScatterPlot(data, symbol) {
    const ctx = document.getElementById('salaryScatterChart');
    if(!ctx) return;
    if (salaryScatterChartInstance) salaryScatterChartInstance.destroy();
    salaryScatterChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'scatter',
        data: { datasets: [{ data: data, backgroundColor: 'rgba(111, 66, 193, 0.6)', borderColor: '#6f42c1', pointRadius: 6, pointHoverRadius: 9 }] },
        options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false },
            tooltip: { callbacks: { label: function(context) { return ` ${context.raw.rawTitle || 'Công việc'} | Min: ${context.parsed.x.toLocaleString()} ${symbol} - Max: ${context.parsed.y.toLocaleString()} ${symbol}`; } } } },
            scales: { x: { title: { display: true, text: `Lương Min (${symbol})` } }, y: { title: { display: true, text: `Lương Max (${symbol})` } } }
        }
    });
}

// ==========================================
// TRANG 5: BẢN ĐỒ TUYỂN DỤNG (LOCATION ANALYTICS)
// ==========================================
async function loadLocationAnalytics() {
    try {
        const res = await fetch(`${API_BASE_URL}/jobs?limit=500`);
        const data = await res.json();
        if (data.status === "success") {
            rawLocationJobsData = data.data;
            updateLocationCharts();
        }
    } catch (error) { console.error("Lỗi tải dữ liệu khu vực:", error); }
}

function updateLocationCharts() {
    let hnJobs = [], hcmJobs = [], dnJobs = [], otherJobs = [];

    rawLocationJobsData.forEach(job => {
        let loc = job.location ? job.location.toLowerCase() : "";
        if (loc.includes("hà nội") || loc.includes("hanoi")) { job.cleanLocation = "Hà Nội"; hnJobs.push(job); } 
        else if (loc.includes("hồ chí minh") || loc.includes("ho chi minh") || loc.includes("hcm")) { job.cleanLocation = "Hồ Chí Minh"; hcmJobs.push(job); } 
        else if (loc.includes("đà nẵng") || loc.includes("da nang")) { job.cleanLocation = "Đà Nẵng"; dnJobs.push(job); } 
        else { job.cleanLocation = "Khác"; otherJobs.push(job); }
    });

    const labels = [], counts = [], colors = [];
    if (hnJobs.length > 0) { labels.push("Hà Nội"); counts.push(hnJobs.length); colors.push('#0d6efd'); }
    if (hcmJobs.length > 0) { labels.push("Hồ Chí Minh"); counts.push(hcmJobs.length); colors.push('#ffc107'); }
    if (dnJobs.length > 0) { labels.push("Đà Nẵng"); counts.push(dnJobs.length); colors.push('#198754'); }
    if (otherJobs.length > 0) { labels.push("Khác"); counts.push(otherJobs.length); colors.push('#6c757d'); }

    renderLocationPieChart(labels, counts, colors);
    renderTopCompanies("Tất cả khu vực"); 
}

function renderLocationPieChart(labels, data, colors) {
    const ctx = document.getElementById('locationPieChart');
    if (!ctx) return;
    if (locationPieChartInstance) locationPieChartInstance.destroy();

    locationPieChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'pie',
        data: { labels: labels, datasets: [{ data: data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const clickedIndex = elements[0].index;
                    renderTopCompanies(labels[clickedIndex]);
                } else {
                    renderTopCompanies("Tất cả khu vực");
                }
            }
        }
    });
}

function renderTopCompanies(locationFilter) {
    const badge = document.getElementById('current-location-filter');
    if(badge) badge.innerText = locationFilter;
    
    const tbody = document.getElementById('topCompaniesTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';

    let filteredJobs = rawLocationJobsData;
    if (locationFilter !== "Tất cả khu vực") {
        filteredJobs = rawLocationJobsData.filter(job => job.cleanLocation === locationFilter);
    }

    const companyCounts = {};
    filteredJobs.forEach(job => {
        const compName = (job.company || "Công ty ẩn danh").trim();
        companyCounts[compName] = (companyCounts[compName] || 0) + 1;
    });

    const sortedCompanies = Object.keys(companyCounts)
        .map(key => ({ name: key, count: companyCounts[key] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

    if (sortedCompanies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4">Không có dữ liệu công ty</td></tr>';
        return;
    }

    sortedCompanies.forEach((comp, index) => {
        let rankDisplay = `<span class="fw-bold text-secondary">#${index + 1}</span>`;
        if (index === 0) rankDisplay = `<i class="fas fa-medal fs-4" style="color: #FFD700;"></i>`;
        else if (index === 1) rankDisplay = `<i class="fas fa-medal fs-5" style="color: #C0C0C0;"></i>`;
        else if (index === 2) rankDisplay = `<i class="fas fa-medal fs-5" style="color: #CD7F32;"></i>`;

        tbody.innerHTML += `
            <tr>
                <td class="text-center">${rankDisplay}</td>
                <td class="fw-bold text-dark">${comp.name}</td>
                <td class="text-center"><span class="badge bg-light text-dark border px-3 py-2">${comp.count} Việc làm</span></td>
            </tr>`;
    });
}

// ==========================================
// TRANG 6: XU HƯỚNG THỊ TRƯỜNG (TRENDS)
// ==========================================
async function loadTrendsAnalytics() {
    try {
        const res = await fetch(`${API_BASE_URL}/jobs?limit=1000`);
        const data = await res.json();
        if (data.status === "success") {
            rawTrendsData = data.data;
            updateTrendsChart("all"); 
        }
    } catch (error) { console.error("Lỗi tải dữ liệu Xu hướng:", error); }
}

function updateTrendsChart(timeRange) {
    const now = new Date();
    let cutoffDate = new Date(0); 
    if (timeRange !== "all") {
        cutoffDate = new Date(now.getTime() - (parseInt(timeRange) * 24 * 60 * 60 * 1000));
    }

    const jobsByDate = {};
    const techGroupsByDate = {};

    rawTrendsData.forEach(job => {
        if (!job.created_at) return;
        const dateString = job.created_at.substring(0, 10);
        const jobDate = new Date(dateString);
        
        if (jobDate >= cutoffDate) {
            jobsByDate[dateString] = (jobsByDate[dateString] || 0) + 1;

            if (!techGroupsByDate[dateString]) {
                techGroupsByDate[dateString] = { 'Backend': 0, 'Frontend': 0, 'Data/AI': 0, 'DevOps/Cloud': 0, 'Khác': 0 };
            }

            const textToSearch = (job.title + " " + (job.description || "")).toLowerCase();
            let matched = false;

            if (/(java(?!script)|python|c#|\.net|node|php|ruby|golang|spring|laravel)/.test(textToSearch)) { techGroupsByDate[dateString]['Backend']++; matched = true; }
            if (/(react|angular|vue|html|css|javascript|typescript|tailwind)/.test(textToSearch)) { techGroupsByDate[dateString]['Frontend']++; matched = true; }
            if (/(sql|mysql|postgres|mongo|data|machine learning|ai|pandas)/.test(textToSearch)) { techGroupsByDate[dateString]['Data/AI']++; matched = true; }
            if (/(aws|docker|kubernetes|azure|ci\/cd|linux|jenkins)/.test(textToSearch)) { techGroupsByDate[dateString]['DevOps/Cloud']++; matched = true; }
            
            if (!matched) techGroupsByDate[dateString]['Khác']++;
        }
    });

    const sortedDates = Object.keys(jobsByDate).sort((a, b) => new Date(a) - new Date(b));
    const lineCounts = sortedDates.map(date => jobsByDate[date]);

    if (sortedDates.length === 0) { sortedDates.push("Chưa có dữ liệu"); lineCounts.push(0); }

    renderTrendsLineChart(sortedDates, lineCounts);
    renderTrendsStackedBarChart(sortedDates, techGroupsByDate);
}

function renderTrendsLineChart(labels, data) {
    const ctx = document.getElementById('trendsLineChart');
    if (!ctx) return;
    if (trendsLineChartInstance) trendsLineChartInstance.destroy();

    trendsLineChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: { 
            labels: labels, 
            datasets: [{ 
                label: 'Tổng số tin tuyển dụng mới', 
                data: data, 
                borderColor: '#0d6efd', 
                backgroundColor: 'rgba(13, 110, 253, 0.15)', 
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointRadius: 4,
                fill: true, 
                tension: 0.3 
            }] 
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
    });
}

function renderTrendsStackedBarChart(labels, techGroupsByDate) {
    const ctx = document.getElementById('trendsStackedBarChart');
    if (!ctx) return;
    if (trendsStackedBarChartInstance) trendsStackedBarChartInstance.destroy();

    const backendData = [], frontendData = [], dataAiData = [], devopsData = [], khacData = [];

    labels.forEach(date => {
        const dayData = techGroupsByDate[date] || { 'Backend': 0, 'Frontend': 0, 'Data/AI': 0, 'DevOps/Cloud': 0, 'Khác': 0 };
        backendData.push(dayData['Backend']);
        frontendData.push(dayData['Frontend']);
        dataAiData.push(dayData['Data/AI']);
        devopsData.push(dayData['DevOps/Cloud']);
        khacData.push(dayData['Khác']);
    });

    trendsStackedBarChartInstance = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Backend', data: backendData, backgroundColor: '#0d6efd' },
                { label: 'Frontend', data: frontendData, backgroundColor: '#ffc107' },
                { label: 'Data/AI', data: dataAiData, backgroundColor: '#198754' },
                { label: 'DevOps/Cloud', data: devopsData, backgroundColor: '#6f42c1' },
                { label: 'Khác', data: khacData, backgroundColor: '#6c757d' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } },
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// ==========================================
// TRANG 7: CÀI ĐẶT HỆ THỐNG (SETTINGS)
// ==========================================
function updateSettingsInfo() {
    const totalJobsElement = document.getElementById('kpi-total-jobs');
    const settingsJobsElement = document.getElementById('settings-total-jobs');
    if (totalJobsElement && settingsJobsElement) {
        settingsJobsElement.innerText = totalJobsElement.innerText + " records";
    }
}

function showTerminalInstruction(actionName) {
    document.getElementById('terminal-action-name').innerText = actionName;
    const modal = new bootstrap.Modal(document.getElementById('terminalInstructionModal'));
    modal.show();
}

// ==========================================
// KHỞI ĐỘNG HỆ THỐNG VÀ GẮN SỰ KIỆN AN TOÀN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Kích hoạt tải dữ liệu cho tất cả các trang độc lập
    loadDashboardData().then(() => { updateSettingsInfo(); });
    loadJobsTable(1);
    loadSkillsAnalytics(20);
    loadSalaryAnalytics();
    loadLocationAnalytics();
    loadTrendsAnalytics(); 

    // 2. Gắn các bộ lắng nghe sự kiện (Event Listeners) an toàn
    const btnRefresh = document.getElementById('btn-refresh-dashboard');
    if (btnRefresh) btnRefresh.addEventListener('click', loadDashboardData);

    const btnFilter = document.getElementById('btn-apply-filters');
    if (btnFilter) btnFilter.addEventListener('click', () => loadJobsTable(1));

    const inputSearch = document.getElementById('filter-search');
    if (inputSearch) inputSearch.addEventListener('keypress', (e) => { if (e.key === 'Enter') loadJobsTable(1); });

    const selectSkills = document.getElementById('select-top-skills');
    if (selectSkills) selectSkills.addEventListener('change', function() { loadSkillsAnalytics(this.value); });

    const toggleCurrency = document.getElementById('toggle-currency');
    if (toggleCurrency) {
        toggleCurrency.addEventListener('change', function() {
            isVND = this.checked;
            document.getElementById('label-currency').innerText = isVND ? "Đơn vị: VNĐ" : "Đơn vị: USD";
            document.getElementById('label-currency').className = isVND ? "form-check-label fw-bold text-danger mb-0 pt-1" : "form-check-label fw-bold text-success mb-0 pt-1";
            updateSalaryCharts();
        });
    }
    
    const selectSort = document.getElementById('select-salary-sort');
    if (selectSort) selectSort.addEventListener('change', updateSalaryCharts);

    const selectTrendTime = document.getElementById('select-trend-time');
    if (selectTrendTime) selectTrendTime.addEventListener('change', function() { updateTrendsChart(this.value); });

    // 3. Cơ chế Sidebar chuyển đổi trạng thái Active (Chống kẹt nút)
    const allNavLinks = document.querySelectorAll('.sidebar .nav-link');
    allNavLinks.forEach(link => {
        link.addEventListener('click', function() {
            allNavLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
});