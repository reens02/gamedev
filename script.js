const API_URL = "http://127.0.0.1:5000";

/* ---------------------------
   PLAN → DAYS PARSER
--------------------------- */
function parsePlanToDays(plan) {
    if (!plan) return null;
    const s = plan.toLowerCase();

    let m = s.match(/(\d+)\s*(?:month|months)/);
    if (m) return parseInt(m[1]) * 30;

    let y = s.match(/(\d+)\s*(?:year|years)/);
    if (y) return parseInt(y[1]) * 365;

    if (s.includes("day")) return 1;

    if (s.includes("month")) return 30;

    if (s.includes("session")) return null;

    return 30;
}

/* ---------------------------
   REGISTER
--------------------------- */
async function register() {
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const gender = document.getElementById("gender").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;
    const username = document.getElementById("regUsername").value;
    const password = document.getElementById("regPassword").value;
    const birthday = document.getElementById("birthday").value;

    const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, gender, email, phone , username, password, birthday })
    });

    const data = await res.json();
    document.getElementById("message").innerText = data.message;

    if (!res.ok) return;

    // AUTO LOGIN
    const loginRes = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
        document.getElementById("message").innerText = "Error logging in after registration.";
        return;
    }

    localStorage.setItem("user", JSON.stringify(loginData.user));

    setTimeout(() => window.location.href = "member.html", 700);
}

/* ---------------------------
   UPDATE PLAN DROPDOWN
--------------------------- */
function updatePlanOptions() {
    const membershipType = document.getElementById("membershipType").value;
    const planSelect = document.getElementById("plan");
    planSelect.innerHTML = "<option value=''>Select Plan</option>";

    let plans = [];

    if (membershipType === "Member") {
        plans = ["₱1,000 / month", "₱2,500 / 3 months", "₱4,500 / 6 months", "₱8,000 / 1 year"];
    } else if (membershipType === "Walk-in") {
        plans = ["₱150 / day"];
    } else if (membershipType === "Student") {
        plans = ["₱800 / month"];
    } else if (membershipType === "Personal Training") {
        plans = [
            "₱2,500 (5 sessions)",
            "₱2,750 (8 sessions)",
            "₱3,000 (10 sessions)",
            "₱3,500 (15 sessions)",
            "₱4,500 (Unlimited)",
            "₱8,500 (2 months / 40 sessions)",
            "₱11,500 (3 months / 60 sessions)",
            "₱500 / session (Walk-in)"
        ];
    }

    plans.forEach(plan => {
        const option = document.createElement("option");
        option.value = plan;
        option.textContent = plan;
        option.style.color = "black"; // **FIX: Make visible**
        planSelect.appendChild(option);
    });
}





/* ---------------------------
   LOGIN
--------------------------- */
async function login() {
    const username = document.getElementById("loginUsername")?.value;
    const password = document.getElementById("loginPassword")?.value;

    if (!username || !password) {
        document.getElementById("message").innerText = "Please fill in all fields";
        return;
    }

    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    document.getElementById("message").innerText = data.message;

    if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));

        setTimeout(() => {
            const role = data.user.role;
            if (role === "Admin") window.location.href = "admin.html";
            else if (role === "Staff") window.location.href = "managemembers.html";
            else if (role === "Trainer") window.location.href = "trainerDashboard.html";
            else window.location.href = "member.html";
        }, 1000);
    }
}




/* ---------------------------
   LOAD MEMBER DETAILS
--------------------------- */
async function loadMemberDetails() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  try {
    const res = await fetch(`${API_URL}/member/${user.username}`);
    const data = await res.json();

    if (!res.ok) {
      document.getElementById("status").textContent = "Inactive";
      return;
    }

    // Basic info
    document.getElementById("membershipType").textContent = data.membershipType || "—";
    document.getElementById("plan").textContent = data.plan || "—";
    document.getElementById("startDate").textContent = data.startDate || "—";
    document.getElementById("gender").textContent = data.gender;
    document.getElementById("birthday").textContent = data.birthday;
    document.getElementById("email").textContent = data.email;

    // FIX: Use data.expiry (not data.expiryDate)
    let expiry = data.expiry || null;

    // Compute expiry from plan if missing
    if (!expiry && data.startDate && data.plan) {
      const days = parsePlanToDays(data.plan);
      if (days) {
        const start = new Date(data.startDate);
        const expiryDate = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
        expiry = expiryDate.toISOString().slice(0, 10);
      }
    }

    document.getElementById("expiry").textContent = expiry || "—";

    // COUNTDOWN
    if (data.startDate && expiry) {
      const start = new Date(data.startDate);
      const exp = new Date(expiry);
      const today = new Date();

      const totalDays = Math.ceil((exp - start) / 86400000);
      const daysPassed = Math.ceil((today - start) / 86400000);
      const displayDays = Math.min(daysPassed, totalDays);

      const countdownEl = document.getElementById("countdownProgress");
      if (countdownEl) countdownEl.textContent = `${displayDays}/${totalDays} days`;

      const updateCountdown = () => {
        const now = new Date();
        const passed = Math.ceil((now - start) / 86400000);
        countdownEl.textContent = `${Math.min(passed, totalDays)}/${totalDays} days`;
      };

      const msUntilMidnight =
        new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1) - today;

      setTimeout(() => {
        updateCountdown();
        setInterval(updateCountdown, 86400000);
      }, msUntilMidnight);
    }

    // Sessions Left (Personal Training)
    let sessionsLeft = "—";
    if (data.membershipType === "Personal Training" && data.plan) {
      const match = data.plan.match(/\((\d+)\s*sessions?\)/);
      if (match) sessionsLeft = match[1];
      else if (data.plan.toLowerCase().includes("unlimited")) sessionsLeft = "Unlimited";
    }

    const sessionsEl = document.getElementById("sessionsLeft");
    if (sessionsEl) sessionsEl.textContent = sessionsLeft;

  } catch (err) {
    console.error("Error loading member info:", err);
  }
}


/* ---------------------------
   PAYMENT SUCCESS
--------------------------- */
async function paymentSuccess() {
    const user = JSON.parse(localStorage.getItem("user"));
    const pending = JSON.parse(localStorage.getItem("pendingMembership"));

    if (!user || !pending) return alert("Missing membership info or login.");

    try {
        const res = await fetch(`${API_URL}/update-plan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: user.username,
                membershipType: pending.membershipType,
                plan: pending.plan,
                birthday: user.birthday
            })
        });

        const data = await res.json();
        alert(data.message);

        if (res.ok) {
            user.membershipType = pending.membershipType;
            user.plan = pending.plan;
            user.startDate = new Date().toISOString().slice(0, 10);

            localStorage.setItem("user", JSON.stringify(user));
            localStorage.removeItem("pendingMembership");

            window.location.href = "member.html";
        }
    } catch (err) {
        console.error(err);
        alert("Failed to update membership after payment.");
    }
}

/* ---------------------------
   UPDATE PLAN (MANUAL SELECT)
--------------------------- */
async function updatePlan(membershipType, plan) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return alert("You must be logged in.");

    const res = await fetch(`${API_URL}/update-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: user.username,
            membershipType,
            plan,
            birthday: user.birthday
        })
    });

    const data = await res.json();

    if (res.ok) {
        user.plan = plan;
        user.membershipType = membershipType;
        user.startDate = new Date().toISOString().slice(0, 10);

        localStorage.setItem("user", JSON.stringify(user));

        alert("Membership updated successfully!");
    } else {
        alert("Error: " + data.message);
    }
}

/* ---------------------------
   PAGE LOAD HANDLER
--------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
        const nameEl = document.getElementById("userName");
        if (nameEl) nameEl.textContent = `${user.firstName} ${user.lastName}`;
    } else {
        window.location.href = "login.html";
        return;
    }

    if (document.getElementById("membersTable")) {
        loadMembers();
        setInterval(loadMembers, 10000);
    }

    if (document.getElementById("plan") && document.getElementById("expiry")) {
        loadMemberDetails();
    }
});

/* ---------------------------
   DELETE MEMBER
--------------------------- */

async function loadMembers() {
    try {
        const res = await fetch(`${API_URL}/members`);
        const members = await res.json();

        const tableBody = document.querySelector("#membersTable tbody");
        tableBody.innerHTML = ""; // Clear existing rows

        members.forEach(member => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${member.firstName} ${member.lastName}</td>
                <td>${member.email}</td>
                <td>
                    <button class="delete-btn">Delete</button>
                </td>
            `;

            // Add delete button event
            row.querySelector(".delete-btn").addEventListener("click", () => {
                deleteMember(member.username);
            });

            tableBody.appendChild(row);
        });

    } catch (err) {
        console.error("Error loading members:", err);
    }
}



const memberId = "USER_MEMBER_ID"; // replace dynamically

async function loadNotifications() {
    const res = await fetch(`http://localhost:5000/get-notifications/${memberId}`);
    const notifications = await res.json();
    const container = document.getElementById('notificationsList');
    container.innerHTML = notifications.map(n => `
        <div style="background:#222; padding:10px; margin-bottom:5px; border-radius:5px;">
            <strong>${n.title}</strong>
            <p>${n.message}</p>
            <small>${n.date} | Status: ${n.status}</small>
        </div>
    `).join('');
}

// Call this on page load
loadNotifications();
