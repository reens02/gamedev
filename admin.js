const API_URL = "http://127.0.0.1:5000";    

/********** Sidebar & Navigation **********/
const links = document.querySelectorAll('.nav a');
const sections = document.querySelectorAll('.content-section');
const sidebar = document.getElementById('sidebar');

links.forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    // Highlight active
    links.forEach(x => x.classList.remove('active'));
    a.classList.add('active');
    // Show target section
    const target = a.dataset.section || 'dashboard';
    sections.forEach(s => s.style.display = s.id === target ? '' : 'none');
    // Close sidebar on small screens
    if(window.innerWidth < 720) sidebar.classList.remove('open');
  });
});

// Sidebar collapse
document.getElementById('collapseBtn').addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

// Mobile toggle
document.getElementById('mobileToggle').addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

/********** Add Trainer Feature **********/
document.getElementById('addTrainer').addEventListener('click', e => {
  e.preventDefault();
  const name = document.getElementById('tname').value.trim();
  const role = document.getElementById('trole').value.trim();
  const photo = document.getElementById('tphoto').value.trim();
  const bio = document.getElementById('tbio').value.trim();
  if (!name || !role) { alert('Please enter name and specialty'); return; }

  const list = document.getElementById('trainersList');
  const card = document.createElement('div');
  card.className = 'card';
  card.style.marginTop='12px';
  card.innerHTML = `
    <div style="display:flex;gap:12px;align-items:center">
      <div style="width:72px;height:72px;border-radius:8px;background:#222;display:flex;align-items:center;justify-content:center;overflow:hidden">
        ${photo ? `<img src="${photo}" style="width:100%;height:100%;object-fit:cover" alt="${name}">` : `<span style="color:var(--muted)">${name.charAt(0)}</span>`}
      </div>
      <div style="flex:1">
        <strong style="color:var(--accent)">${name}</strong>
        <div class="small muted">${role}</div>
        <div style="margin-top:8px">${bio ? bio : '<span class="muted">No bio provided</span>'}</div>
      </div>
      <div><button class="btn ghost" onclick="this.closest('.card').remove()">Remove</button></div>
    </div>
  `;
  list.prepend(card);

  // Clear form
  document.getElementById('tname').value='';
  document.getElementById('trole').value='';
  document.getElementById('tphoto').value='';
  document.getElementById('tbio').value='';
});

/********** Full Members Table (Grouped by Role) **********/
const membersListEl = document.getElementById("membersList");
const membersSearchEl = document.getElementById("membersSearch");

function renderMembersGrouped(list, containerEl) {
  containerEl.innerHTML = "";
  if (list.length === 0) {
    containerEl.innerHTML = `<tr><td colspan="6" style="text-align:center;">No members found</td></tr>`;
    return;
  }

  // Group by role
  const groups = {};
  list.forEach(member => {
    const role = member.role || "—";
    if (!groups[role]) groups[role] = [];
    groups[role].push(member);
  });

  // Render each group
  for (const role in groups) {
    // Role header
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `<td colspan="6" style="background:#333;font-weight:bold;">${role}</td>`;
    containerEl.appendChild(headerRow);

    // Member rows
    groups[role].forEach(member => {
      const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
      const type = member.membershipType || '—';
      const plan = member.plan || '—';
      const start = member.startDate || '—';

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${fullName}</td>
        <td>${role}</td>
        <td>${type}</td>
        <td>${plan}</td>
        <td>${start}</td>
        <td class="actions">
          <button class="btn">View</button>
          <button class="btn ghost">Edit</button>
        </td>
      `;
      containerEl.appendChild(row);
    });
  }
}

async function loadMembers() {
  try {
    const response = await fetch(`${API_URL}/members`);
    if (!response.ok) throw new Error("Failed to fetch members");
    const members = await response.json();

    renderMembersGrouped(members, membersListEl);

    // Live search
    membersSearchEl.addEventListener("input", e => {
      const query = e.target.value.toLowerCase();
      const filtered = members.filter(m =>
        (`${m.firstName || ''} ${m.lastName || ''}`).toLowerCase().includes(query) ||
        (m.role && m.role.toLowerCase().includes(query)) ||
        (m.membershipType && m.membershipType.toLowerCase().includes(query)) ||
        (m.plan && m.plan.toLowerCase().includes(query))
      );
      renderMembersGrouped(filtered, membersListEl);
    });

  } catch (err) {
    console.error(err);
    membersListEl.innerHTML = `<tr><td colspan="6" style="text-align:center;">Failed to load members</td></tr>`;
  }
}

/********** Dashboard Recent Members (Last 5 Only, No Role Grouping) **********/
const dashboardListEl = document.getElementById("membersTable"); // dashboard table body
const dashboardSearchEl = document.getElementById("tableSearch");

async function loadDashboardMembers() {
  try {
    const response = await fetch(`${API_URL}/members`);
    if (!response.ok) throw new Error("Failed to fetch members");
    const members = await response.json();

    renderDashboardMembers(members);

    if(dashboardSearchEl){
      dashboardSearchEl.addEventListener("input", e => {
        const query = e.target.value.toLowerCase();
        const filtered = members.filter(m =>
          (`${m.firstName || ''} ${m.lastName || ''}`).toLowerCase().includes(query) ||
          (m.membershipType && m.membershipType.toLowerCase().includes(query)) ||
          (m.plan && m.plan.toLowerCase().includes(query))
        );
        renderDashboardMembers(filtered);
      });
    }

  } catch (err) {
    console.error(err);
    dashboardListEl.innerHTML = `<tr><td colspan="5" style="text-align:center;">Failed to load members</td></tr>`;
  }
}

function renderDashboardMembers(list) {
  dashboardListEl.innerHTML = "";
  if (list.length === 0) {
    dashboardListEl.innerHTML = `<tr><td colspan="5" style="text-align:center;">No members found</td></tr>`;
    return;
  }

  // Sort latest first
  const sorted = list.sort((a,b) => new Date(b.startDate) - new Date(a.startDate));

  // Show only 5 most recent
  const recent = sorted.slice(0, 5);

  recent.forEach(member => {
    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
    const type = member.membershipType || '—';
    const plan = member.plan || '—';
    const start = member.startDate || '—';

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${fullName}</td>
      <td>${type}</td>
      <td>${plan}</td>
      <td>${start}</td>
      <td class="actions">
        <button class="btn">View</button>
        <button class="btn ghost">Edit</button>
      </td>
    `;
    dashboardListEl.appendChild(row);
  });
}

/********** Init on Page Load **********/
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || user.role !== "Admin") {
    alert("Access denied! Admins only.");
    window.location.href = "login.html";
    return;
  }

  // Show dashboard by default
  sections.forEach(s => s.style.display = s.id === 'dashboard' ? '' : 'none');

  // Load dashboard recent members
  loadDashboardMembers();

  // Load full members section
  loadMembers();

  updateActiveMembersCount();
  updateStaffAndTrainersCount();
  updateSessionsCount();

  // Update sessions count
updateSessionsCount();

});

/********** Update Active Members Count by Role **********/
async function updateActiveMembersCount() {
  try {
    const response = await fetch(`${API_URL}/members`);
    if (!response.ok) throw new Error("Failed to fetch members");
    const members = await response.json();

    // Count per role
    const roleCounts = {};
    members.forEach(member => {
      const role = member.role || "Unknown";
      if (!roleCounts[role]) roleCounts[role] = 0;
      roleCounts[role]++;
    });

    // Example: just show total number of members with a role
    const totalRoles = Object.keys(roleCounts).length;
    document.getElementById("membersCount").textContent = totalRoles;

    console.log("Members by role:", roleCounts); // optional: debug
  } catch (err) {
    console.error(err);
    document.getElementById("membersCount").textContent = '—';
  }
}

async function updateSessionsCount() {
  try {
    const response = await fetch(`${API_URL}/members`); // fetch members
    if (!response.ok) throw new Error("Failed to fetch members");

    const members = await response.json(); 
    // Sum all sessionsLeft
    const totalSessions = members
      .filter(m => m.role === "Member" && m.sessionsLeft > 0)
      .reduce((sum, m) => sum + m.sessionsLeft, 0);

    document.getElementById("sessions").textContent = totalSessions;
    console.log("Total sessions left:", totalSessions); 
  } catch (err) {
    console.error(err);
    document.getElementById("sessions").textContent = '—';
  }
}

async function updateStaffAndTrainersCount() {
  try {
    const response = await fetch(`${API_URL}/members`);
    if (!response.ok) throw new Error("Failed to fetch members");
    const members = await response.json();

    let staffCount = 0;
    let trainerCount = 0;

    members.forEach(member => {
      if(member.role === "Staff") staffCount++;
      else if(member.role === "Trainer") trainerCount++;
    });

    document.getElementById("staffCount").textContent = staffCount;
    document.getElementById("trainerCount").textContent = trainerCount;

    console.log("Staff:", staffCount, "Trainers:", trainerCount);

  } catch(err) {
    console.error(err);
    document.getElementById("staffCount").textContent = '—';
    document.getElementById("trainerCount").textContent = '—';
  }
}





const { MongoClient } = require("mongodb");

async function main() {
  const uri = "mongodb://localhost:27017"; // replace with your MongoDB URI
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("gym_db");
    const membershipPlans = db.collection("membershipPlans");

    // Example: Member plans
    const memberPlans = {
      membershipType: "Member",
      plans: [
        { price: 1000, currency: "PHP", label: "1 month" },
        { price: 2500, currency: "PHP", label: "3 months" },
        { price: 4500, currency: "PHP", label: "6 months" },
        { price: 8000, currency: "PHP", label: "1 year" }
      ]
    };

    await membershipPlans.insertOne(memberPlans);
    console.log("Member plans inserted!");
  } finally {
    await client.close();
  }
}

main().catch(console.error);

member.plans.map(plan => `₱${plan.price.toLocaleString()} / ${plan.label}`);
// Example Output: ["₱1,000 / 1 month", "₱2,500 / 3 months", ...]


