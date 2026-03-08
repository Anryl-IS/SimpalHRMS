document.addEventListener("DOMContentLoaded", () => {
  // Ensure the Supabase CDN is in your HTML <head>
  const { createClient } = supabase;
  const supabaseClient = createClient(
    "https://hzafznqoyinfjbqrrerp.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Ensure this is your public anon key
  );

  let editingEmployeeId = null;

  // ======== DOM Elements ========
  const modal = document.getElementById("employeeModal");
  const dbTbody = document.getElementById("dbTbody");
  const addEmployeeBtn = document.getElementById("addEmployeeBtn");
  const employeeForm = document.getElementById("employeeForm");
  const photoPreview = document.getElementById("photoPreview");
  const reportsTbody = document.getElementById("reportsTbody");
  const irModal = document.getElementById("irModal");
  const irForm = document.getElementById("irForm");

  // ======== Employees Logic ========
  async function loadEmployees() {
    const { data, error } = await supabaseClient.from("employees").select("*").order("id", { ascending: true });
    if (error) return console.error("Error loading employees:", error);

    dbTbody.innerHTML = data.map(e => `
      <tr>
        <td>${e.id}</td>
        <td>${e.photo_url ? `<img src="${e.photo_url}" class="db-photo" width="40">` : "No Photo"}</td>
        <td>${e.name_english || ""}</td>
        <td>${e.email || ""}</td>
        <td>${e.position || ""}</td>
        <td>
          <button class="action-btn edit" onclick="editEmployee(${e.id})">Edit</button>
          <button class="action-btn delete" onclick="deleteEmployee(${e.id})">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  window.editEmployee = async id => {
    const { data, error } = await supabaseClient.from("employees").select("*").eq("id", id).single();
    if (error) return alert("Error fetching employee");

    // Populate form
    const f = employeeForm.elements;
    f.name_english.value = data.name_english;
    f.email.value = data.email;
    f.position.value = data.position;
    // ... populate other fields ...

    editingEmployeeId = id;
    modal.style.display = "flex";
  };

  // ======== Incident Reports Logic (Fixed Table Names) ========
  const IR_TABLE = "incident_reports_sales"; // Ensure this matches your DB exactly

  async function fetchIRs() {
    const { data, error } = await supabaseClient.from(IR_TABLE).select('*').order('date_posted', { ascending: false });
    if (error) return console.error("Error fetching IRs:", error);

    reportsTbody.innerHTML = data.map(ir => `
      <tr>
        <td>${ir.agent_name}</td>
        <td>${ir.file_name ? `<a href="${ir.file_url}" target="_blank">View File</a>` : 'None'}</td>
        <td>${ir.date_posted}</td>
        <td>${ir.area}</td>
        <td><span class="status-pill">${ir.status}</span></td>
        <td>
          <button class="action-btn edit" onclick="prepareIREdit(${ir.id})">Edit</button>
          <button class="action-btn delete" onclick="deleteIR(${ir.id})">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  window.prepareIREdit = async (id) => {
    const { data } = await supabaseClient.from(IR_TABLE).select('*').eq('id', id).single();
    if (data) {
      document.getElementById('irId').value = data.id;
      document.getElementById('agent_name').value = data.agent_name;
      document.getElementById('area').value = data.area;
      document.getElementById('date_posted').value = data.date_posted;
      document.getElementById('status').value = data.status;
      irModal.classList.add('show');
    }
  };

  window.deleteIR = async (id) => {
    if (!confirm("Delete report?")) return;
    await supabaseClient.from(IR_TABLE).delete().eq('id', id);
    fetchIRs();
  };

  // ======== Initialization ========
  loadEmployees();
  fetchIRs();
});