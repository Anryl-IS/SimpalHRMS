
const SUPABASE_URL = "https://hzafznqoyinfjbqrrerp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6YWZ6bnFveWluZmpicXJyZXJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDYzMzcsImV4cCI6MjA3NjA4MjMzN30.qQFFQ6fzqBXxl63JG4JWNZ0JR0ZVnoyiU65J4VlDNG8";

let supabaseClient;
try {
  if (!window.supabase || !window.supabase.createClient) {
    console.error('Supabase library not loaded');
  } else {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
} catch (err) {
  console.error('Supabase initialization error:', err);
}

const irTbody = document.getElementById("irTbody");
const irModal = document.getElementById("irModal");
const irForm = document.getElementById("irForm");

const ir_record_id = document.getElementById("ir_record_id");
const ir_agent = document.getElementById("ir_agent");
const ir_area = document.getElementById("ir_area");
const ir_date = document.getElementById("ir_date");
const ir_status = document.getElementById("ir_status");
const ir_file = document.getElementById("ir_file");
const ir_file_preview = document.getElementById("ir_file_preview");

const addIrBtn = document.getElementById("addIrBtn");
const refreshBtn = document.getElementById("refreshBtn");
const irCancelBtn = document.getElementById("irCancelBtn");


const kpiTotal = document.getElementById("kpiTotal");
const kpiOpen = document.getElementById("kpiOpen");
const kpiPending = document.getElementById("kpiPending");
const kpiClosed = document.getElementById("kpiClosed");

const TABLE = "ir_cases";


function showModal() {
  irModal.classList.add("show");
  irModal.removeAttribute("aria-hidden");
  ir_agent.focus();
}

function hideModal() {
  irModal.classList.remove("show");
  irModal.setAttribute("aria-hidden", "true");
}


async function loadReports() {
  if (!supabaseClient) {
    console.error('Supabase client not initialized');
    irTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted)">Supabase not loaded. Please refresh the page.</td></tr>';
    return;
  }

  const { data, error } = await supabaseClient
    .from(TABLE)
    .select("*")
    .order("date_posted", { ascending: false });

  if (error) {
    console.error(error);
    irTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted)">Error loading data</td></tr>';
    return;
  }

  if (!data || data.length === 0) {
    irTbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted)">No incident reports</td></tr>';
    kpiTotal.textContent = 0;
    kpiOpen.textContent = 0;
    kpiPending.textContent = 0;
    kpiClosed.textContent = 0;
    return;
  }

  kpiTotal.textContent = data.length;
  kpiOpen.textContent = data.filter(r => r.status === "Open").length;
  kpiPending.textContent = data.filter(r => r.status === "Pending").length;
  kpiClosed.textContent = data.filter(r => r.status === "Closed").length;

  // Escape HTML helper
  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m]));
  }

  irTbody.innerHTML = data.map(r => {
    const statusClass = `status-${String(r.status || '').toLowerCase().replace(/\s+/g, '-')}`;
    const fileCell = r.file_url ? `<a href="${escapeHtml(r.file_url)}" target="_blank" style="color: #0a84ff; text-decoration: none;">${escapeHtml(r.file_name || 'file')}</a>` : '-';
    return `
    <tr>
      <td>${escapeHtml(r.transcode || '')}</td>
      <td>${escapeHtml(r.agent_name || '')}</td>
      <td>${fileCell}</td>
      <td>${new Date(r.date_posted).toLocaleDateString()}</td>
      <td>${escapeHtml(r.area || '')}</td>
      <td><span class="status-badge ${statusClass}">${escapeHtml(r.status || '')}</span></td>
      <td class="actions">
        <button class="ghost-btn" onclick="editReport('${r.id}')">Edit</button>
        <button class="ghost-btn" onclick="deleteReport('${r.id}')">Delete</button>
      </td>
    </tr>
  `;
  }).join("");

}

async function saveReport(e) {
  e.preventDefault();

  if (!supabaseClient) {
    alert('Supabase is not loaded. Please refresh the page.');
    return;
  }

  let uploadedUrl = null;
  const file = ir_file.files[0];

  if (file) {
    // Clean filename - remove special characters and spaces
    const safeName = file.name.replace(/[^\w.-]/g, "_").replace(/\s+/g, "_");
    const path = `ir_cases/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabaseClient
      .storage
      .from("incident_reports_sales")
      .upload(path, file);


    if (uploadError) {
      console.error("Upload failed:", uploadError);
      alert('File upload failed. Please try again.');
      return;
    }

    const { data: urlData } = supabaseClient
      .storage
      .from("incident_reports_sales")
      .getPublicUrl(path);
    uploadedUrl = urlData?.publicUrl || null;
  }


  let transcode;
  if (!ir_record_id.value) {

    const { data: existing } = await supabaseClient
      .from(TABLE)
      .select("id")
      .eq("area", ir_area.value);
    const nextNum = (existing?.length || 0) + 1;
    transcode = `${ir_area.value}-IR-${String(nextNum).padStart(3, "0")}`;
  } else {

    const { data: existing } = await supabaseClient
      .from(TABLE)
      .select("transcode")
      .eq("id", ir_record_id.value)
      .single();
    transcode = existing.transcode;
  }

  const payload = {
    agent_name: ir_agent.value,
    area: ir_area.value,
    date_posted: ir_date.value,
    status: ir_status.value,
    file_url: uploadedUrl,
    file_name: file?.name || null,
    transcode
  };

  try {
    if (ir_record_id.value) {
      const { error } = await supabaseClient.from(TABLE).update(payload).eq("id", ir_record_id.value);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient.from(TABLE).insert(payload);
      if (error) throw error;
    }
    hideModal();
    irForm.reset();
    ir_record_id.value = "";
    ir_file_preview.textContent = "No file selected";
    await loadReports();
  } catch (err) {
    console.error("Save failed:", err);
    alert('Error saving report: ' + (err.message || 'Please check console for details.'));
  }
}

async function editReport(id) {
  if (!supabaseClient) {
    alert('Supabase is not loaded. Please refresh the page.');
    return;
  }

  const { data, error } = await supabaseClient
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    alert('Error loading report. Please try again.');
    return;
  }

  ir_record_id.value = data.id;
  ir_agent.value = data.agent_name || '';
  ir_area.value = data.area || '';
  ir_date.value = data.date_posted || '';
  ir_status.value = data.status || '';
  ir_file_preview.textContent = data.file_name || "No file selected";

  // Update visual indicator
  ir_status.className = ''; // Reset classes
  if (data.status) {
    ir_status.classList.add(`status-${data.status.toLowerCase()}`);
  }

  showModal();
}

async function deleteReport(id) {
  if (!supabaseClient) {
    alert('Supabase is not loaded. Please refresh the page.');
    return;
  }

  if (!confirm("Delete this report? This cannot be undone.")) return;

  try {
    const { error } = await supabaseClient.from(TABLE).delete().eq("id", id);
    if (error) throw error;
    await loadReports();
  } catch (err) {
    console.error("Delete failed:", err);
    alert('Error deleting report. Please try again.');
  }
}


addIrBtn.addEventListener("click", () => {
  irForm.reset();
  ir_record_id.value = "";
  ir_file_preview.textContent = "No file selected";
  ir_status.className = ''; // Reset status indicator
  showModal();
});

ir_file.addEventListener("change", () => {
  ir_file_preview.textContent = ir_file.files[0]?.name || "No file selected";
});

// Update status select visual indicator
ir_status.addEventListener("change", () => {
  const status = ir_status.value;
  ir_status.className = ''; // Reset classes
  if (status) {
    ir_status.classList.add(`status-${status.toLowerCase()}`);
  }
});

irCancelBtn.addEventListener("click", hideModal);
irForm.addEventListener("submit", saveReport);
refreshBtn.addEventListener("click", loadReports);


window.editReport = editReport;
window.deleteReport = deleteReport;

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (supabaseClient) {
      loadReports();
    }
  });
} else {
  if (supabaseClient) {
    loadReports();
  }
}

document.getElementById("logoutBtn").addEventListener("click", () => {

  localStorage.removeItem("user");
  localStorage.removeItem("role");
  sessionStorage.clear();

  window.location.href = "../index.html";
});

const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", () => {
  const filter = searchInput.value.toLowerCase();

  const rows = irTbody.querySelectorAll("tr");
  rows.forEach(row => {
    const cellsText = Array.from(row.cells)
      .map(cell => cell.textContent.toLowerCase())
      .join(" ");

    row.style.display = cellsText.includes(filter) ? "" : "none";
  });
});

