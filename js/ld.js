document.addEventListener("DOMContentLoaded", async () => {
    const { createClient } = supabase;
    const client = createClient(
        "https://hzafznqoyinfjbqrrerp.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6YWZ6bnFveWluZmpicXJyZXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDYzMzcsImV4cCI6MjA3NjA4MjMzN30.qQFFQ6fzqBXxl63JG4JWNZ0JR0ZVnoyiU65J4VlDNG8"
    );

    // DOM ELEMENTS
    const tabs = document.querySelectorAll(".tab-btn");
    const contents = document.querySelectorAll(".tab-content");
    const loader = document.getElementById("loader");
    const loaderTxt = document.getElementById("loaderTxt");

    const recentTbody = document.getElementById("recentActivityTbody");
    const trackerTbody = document.getElementById("trackerTbody");
    const assignmentTbody = document.getElementById("assignmentTbody");
    const statsTotal = document.getElementById("statsTotalAssigned");
    const statsSub = document.getElementById("statsSubmitted");
    const statsPen = document.getElementById("statsPending");
    const statsOve = document.getElementById("statsOverdue");

    const assignEmployeeSelect = document.getElementById("assignEmployee");
    const subEmployeeSelect = document.getElementById("subEmployee");
    const subAssignmentSelect = document.getElementById("subAssignment");

    const assignmentModal = document.getElementById("assignmentModal");
    const addAssignmentBtn = document.getElementById("addAssignmentBtn");
    const closeAssignmentModal = document.getElementById("closeAssignmentModal");
    const assignmentForm = document.getElementById("assignmentForm");
    const submissionForm = document.getElementById("submissionForm");

    const logoutBtn = document.getElementById("logoutBtn");
    const trackerTypeFilter = document.getElementById("trackerTypeFilter");
    const trackerStatusFilter = document.getElementById("trackerStatusFilter");

    // DATA STORAGE
    let employees = [];
    let assignments = [];
    let submissions = [];

    // HELPERS
    function showLoader(text = "Loading...") {
        loader.style.display = "flex";
        loaderTxt.textContent = text;
    }
    function hideLoader() { loader.style.display = "none"; }

    function getStatus(dueDate, subDate) {
        if (!subDate) {
            return new Date(dueDate) < new Date() ? "Late" : "Pending";
        }
        return new Date(subDate) > new Date(dueDate) ? "Late" : "Submitted";
    }

    // TAB SWITCHING
    tabs.forEach(btn => {
        btn.addEventListener("click", () => {
            tabs.forEach(b => b.classList.remove("active"));
            contents.forEach(c => c.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById(btn.dataset.tab).classList.add("active");
        });
    });

    // FETCH DATA
    async function fetchData() {
        showLoader("Fetching Dashboard Data...");
        try {
            // Employees
            const { data: empData, error: empErr } = await client.from("employees").select("*").order("name_english", { ascending: true });
            if (empErr) throw empErr;
            employees = empData || [];

            // Assignments (try ld_assignments if it exists, otherwise use what we have)
            const { data: assignData, error: assignErr } = await client.from("ld_assignments").select("*");
            // If table doesn't exist, assignErr will be present. For this task, we will simulate if empty.
            assignments = assignData || [];

            // Submissions
            const { data: subData, error: subErr } = await client.from("ld_submissions").select("*");
            submissions = subData || [];

            renderAll();
        } catch (error) {
            console.error(error);
            alert("Error fetching L&D data. Some features may be restricted.");
        } finally {
            hideLoader();
        }
    }

    function renderAll() {
        populateSelects();
        renderStats();
        renderRecentActivity();
        renderTracker();
        renderAssignments();
    }

    function populateSelects() {
        const empHtml = employees.map(e => `<option value="${e.name_english}">${e.name_english}</option>`).join("");
        assignEmployeeSelect.innerHTML = empHtml;
        subEmployeeSelect.innerHTML = `<option value="">Select Employee...</option>` + empHtml;

        subEmployeeSelect.onchange = () => {
            const empName = subEmployeeSelect.value;
            const empAssigns = assignments.filter(a => a.employee_name === empName);
            subAssignmentSelect.innerHTML = `<option value="">Select Assignment...</option>` +
                empAssigns.map(a => `<option value="${a.id}">${a.report_type} (${a.due_date})</option>`).join("");
        };
    }

    function renderStats() {
        const total = assignments.length;
        const subCount = submissions.filter(s => {
            const assign = assignments.find(a => a.id == s.assignment_id);
            return getStatus(assign?.due_date, s.submission_date) === "Submitted";
        }).length;
        const overdueCount = assignments.filter(a => {
            const sub = submissions.find(s => s.assignment_id == a.id);
            return getStatus(a.due_date, sub?.submission_date) === "Late";
        }).length;

        statsTotal.textContent = total;
        statsSub.textContent = subCount;
        statsOve.textContent = overdueCount;
        statsPen.textContent = total - subCount - overdueCount;
    }

    function renderRecentActivity() {
        const sortedSub = [...submissions].sort((a, b) => new Date(b.submission_date) - new Date(a.submission_date)).slice(0, 5);
        recentTbody.innerHTML = sortedSub.map(s => {
            const assign = assignments.find(a => a.id == s.assignment_id);
            const status = getStatus(assign?.due_date, s.submission_date);
            return `
                <tr>
                    <td>${s.employee_name}</td>
                    <td>${assign?.report_type || "General Report"}</td>
                    <td><span class="report-type-badge">${assign?.report_type || "N/A"}</span></td>
                    <td><span class="ld-status status-${status.toLowerCase()}">${status}</span></td>
                    <td>${new Date(s.submission_date).toLocaleDateString()}</td>
                </tr>
            `;
        }).join("");
    }

    function renderTracker() {
        // Current Filter states
        const typeFilter = trackerTypeFilter?.value || "all";
        const statusFilter = trackerStatusFilter?.value || "all";

        // Sort submissions by date descending to get the latest first
        const sortedSubmissions = [...submissions].sort((a, b) => new Date(b.submission_date) - new Date(a.submission_date));

        const filteredAssignments = assignments.filter(a => {
            const sub = sortedSubmissions.find(s => s.assignment_id == a.id);
            const status = getStatus(a.due_date, sub?.submission_date);

            const matchesType = typeFilter === "all" || a.report_type === typeFilter;
            const matchesStatus = statusFilter === "all" || status === statusFilter;

            return matchesType && matchesStatus;
        });

        trackerTbody.innerHTML = filteredAssignments.map(a => {
            const sub = sortedSubmissions.find(s => s.assignment_id == a.id);
            const status = getStatus(a.due_date, sub?.submission_date);
            const fileLink = sub?.file_url ? `<a href="${sub.file_url}" target="_blank" class="action-btn" style="padding: 4px 8px; font-size: 11px;">View File</a>` : "No File";

            return `
                <tr>
                    <td>${a.employee_name}</td>
                    <td>${a.report_type}</td>
                    <td>${new Date(a.due_date).toLocaleDateString()}</td>
                    <td>${sub ? new Date(sub.submission_date).toLocaleDateString() : "Pending"}</td>
                    <td><span class="ld-status status-${status.toLowerCase()}">${status}</span></td>
                    <td>${fileLink}</td>
                </tr>
            `;
        }).join("");
    }

    // Filter Listeners
    trackerTypeFilter?.addEventListener("change", renderTracker);
    trackerStatusFilter?.addEventListener("change", renderTracker);

    function renderAssignments() {
        assignmentTbody.innerHTML = assignments.map(a => `
            <tr>
                <td>${a.employee_name}</td>
                <td>${a.department || "-"}</td>
                <td>${a.report_type}</td>
                <td>Fixed (System)</td>
                <td>${new Date(a.due_date).toLocaleDateString()}</td>
                <td>
                    <button onclick="editAssignment('${a.id}')" class="action-btn" style="background: #444;">Adjust Date</button>
                    <button onclick="deleteAssignment('${a.id}')" class="action-btn" style="background: #ef4444;">Delete</button>
                </td>
            </tr>
        `).join("");
    }

    // FORM ACTIONS
    addAssignmentBtn.onclick = () => {
        assignmentForm.reset();
        document.getElementById("assignmentId").value = "";
        assignmentModal.style.display = "flex";
    };

    closeAssignmentModal.onclick = () => assignmentModal.style.display = "none";
    document.getElementById("cancelAssignment").onclick = () => assignmentModal.style.display = "none";

    assignmentForm.onsubmit = async (e) => {
        e.preventDefault();
        showLoader("Saving Assignment...");
        const id = document.getElementById("assignmentId").value;
        const employee_name = document.getElementById("assignEmployee").value;
        const report_type = document.getElementById("assignType").value;
        const department = document.getElementById("assignDept").value;
        const due_date = document.getElementById("assignDueDate").value;

        try {
            if (id) {
                await client.from("ld_assignments").update({ employee_name, report_type, department, due_date }).eq("id", id);
            } else {
                await client.from("ld_assignments").insert([{ employee_name, report_type, department, due_date }]);
            }
            fetchData();
            assignmentModal.style.display = "none";
        } catch (error) {
            console.error(error);
            alert("Error saving assignment.");
        } finally { hideLoader(); }
    };

    submissionForm.onsubmit = async (e) => {
        e.preventDefault();
        showLoader("Uploading Report...");
        const employee_name = subEmployeeSelect.value;
        const assignment_id = subAssignmentSelect.value;
        const notes = document.getElementById("subNotes").value;
        const fileInput = document.getElementById("subFile");
        const area = assignments.find(a => a.id == assignment_id)?.report_type || "Report";

        try {
            let file_url = "https://example.com/mock-file.pdf";
            if (fileInput.files.length) {
                const file = fileInput.files[0];
                const fileName = `ld_${Date.now()}_${file.name}`;
                const { data: uploadData, error: uploadError } = await client.storage.from("cases").upload(fileName, file);
                if (uploadError) throw uploadError;

                // getPublicUrl returns { data: { publicUrl } } in v2
                const { data } = client.storage.from("cases").getPublicUrl(fileName);
                file_url = data?.publicUrl;
            }

            await client.from("ld_submissions").insert([{
                employee_name,
                assignment_id,
                report_type: area,
                file_url,
                notes,
                submission_date: new Date().toISOString()
            }]);

            alert("Report Submitted Successfully!");
            submissionForm.reset();
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Error submitting report.");
        } finally { hideLoader(); }
    };

    window.editAssignment = (id) => {
        const a = assignments.find(x => x.id == id);
        if (!a) return;
        document.getElementById("assignmentId").value = a.id;
        document.getElementById("assignEmployee").value = a.employee_name;
        document.getElementById("assignType").value = a.report_type;
        document.getElementById("assignDept").value = a.department;
        document.getElementById("assignDueDate").value = a.due_date.split("T")[0];
        assignmentModal.style.display = "flex";
    };

    window.deleteAssignment = async (id) => {
        if (!confirm("Are you sure?")) return;
        showLoader("Deleting...");
        await client.from("ld_assignments").delete().eq("id", id);
        fetchData();
        hideLoader();
    };

    logoutBtn.onclick = () => window.location.href = "../index.html";

    fetchData();
});
