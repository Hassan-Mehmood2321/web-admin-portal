import {
  auth,
  db,
  collection,
  getCountFromServer,
  getDoc,
  getDocs,
  doc,
  writeBatch,
  updateDoc,
  onAuthStateChanged
} from "../config/config.js";

// ========== MOBILE SIDEBAR ==========
const sidebar = document.getElementById("sidebar");
const toggle = document.getElementById("menuToggle");

toggle?.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// Active route detection
const currentPage = location.pathname.split("/").pop();
const links = document.querySelectorAll("#sidebarNav .nav-link");

links.forEach(link => {
  if (link.getAttribute("href") === currentPage) {
    link.classList.add("active");
  }
});

// ========== AUTH & STUDENT COUNT ==========
const totalEl = document.getElementById("Total-students");
const statusEl = document.getElementById("Total-students-status");

if (totalEl) totalEl.textContent = "—";
if (statusEl) statusEl.textContent = "Checking auth...";

const unsubscribe = onAuthStateChanged(auth, async (user) => {
  try {
    if (!user) {
      if (statusEl) statusEl.textContent = "Not authenticated";
      window.location.replace("../login.html");
      return;
    }

    if (statusEl) statusEl.textContent = "Verifying admin role...";
    const adminRef = doc(db, "admins", user.uid);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists() || !adminSnap.data()?.active) {
      if (statusEl) statusEl.textContent = "Access denied";
      await auth.signOut();
      window.location.replace("../login.html");
      return;
    }

    if (statusEl) statusEl.textContent = "Fetching student count...";
    const studentsRef = collection(db, "students");
    const snapshot = await getCountFromServer(studentsRef);
    const totalStudents = snapshot.data().count ?? 0;

    if (totalEl) totalEl.textContent = totalStudents;
    if (statusEl) statusEl.textContent = "Up to date";

  } catch (error) {
    console.error("Error fetching student count:", error);
    if (statusEl) statusEl.textContent = "Error fetching data";
    if (totalEl) totalEl.textContent = "N/A";

    if (error?.code === "permission-denied") {
      console.warn("Permission denied — check Firestore rules.");
    }
  }
});

// ========== ATTENDANCE SYSTEM ==========
// Helper function for date key
function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Attendance percentage calculation
const presentPercentEl = document.getElementById('present-percent');
const absentPercentEl = document.getElementById('absent-percent');
const dateInputEl = document.getElementById('attendance-date');

async function computeAttendancePercent(dateKey) {
  try {
    const studentsSnap = await getDocs(collection(db, 'students'));
    const total = studentsSnap.size || 0;
    let present = 0;
    let absent = 0;

    studentsSnap.forEach(snap => {
      const data = snap.data();
      const status = data?.attendance?.[dateKey];
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
    });

    const presentPct = total ? Math.round((present / total) * 100) : 0;
    const absentPct = total ? Math.round((absent / total) * 100) : 0;

    if (presentPercentEl) presentPercentEl.textContent = `${presentPct}%`;
    if (absentPercentEl) absentPercentEl.textContent = `${absentPct}%`;
  } catch (err) {
    console.error('Error computing attendance percent:', err);
    if (presentPercentEl) presentPercentEl.textContent = '—';
    if (absentPercentEl) absentPercentEl.textContent = '—';
  }
}

// Wire date input
dateInputEl?.addEventListener('change', () => {
  const key = dateInputEl.value || getTodayKey();
  computeAttendancePercent(key);
});

// Track cooldown to prevent rapid clicks
const clickCooldown = new Set();

// Batch updates storage
let pendingUpdates = new Map();

// Event listeners
document.addEventListener("click", async (e) => {
  const presentBtn = e.target.closest(".present-btn");
  const absentBtn = e.target.closest(".absent-btn");
  const saveAllBtn = e.target.closest("#saveAllBtn");
  
  if (presentBtn) {
    await handleAttendanceClick(presentBtn, "present");
  }
  
  if (absentBtn) {
    await handleAttendanceClick(absentBtn, "absent");
  }
  
  if (saveAllBtn) {
    await handleSaveAll();
  }
});

// Keyboard support
document.addEventListener("keydown", async (e) => {
  if (e.key === "Enter" || e.key === " ") {
    const focused = document.activeElement;
    if (focused.classList.contains("present-btn")) {
      await handleAttendanceClick(focused, "present");
    }
    if (focused.classList.contains("absent-btn")) {
      await handleAttendanceClick(focused, "absent");
    }
  }
});

// ========== ATTENDANCE FUNCTIONS ==========
async function handleAttendanceClick(button, status) {
  const studentId = button.dataset.id;
  
  // Prevent rapid clicks
  if (clickCooldown.has(studentId)) return;
  clickCooldown.add(studentId);
  
  // Check if already marked today
  const dateKey = getTodayKey();
  try {
    const studentDoc = await getDoc(doc(db, "students", studentId));
    const existingStatus = studentDoc.data()?.attendance?.[dateKey];
    
    if (existingStatus && existingStatus !== status) {
      const confirmChange = confirm(
        `Student was marked as ${existingStatus}. Change to ${status}?`
      );
      if (!confirmChange) {
        clickCooldown.delete(studentId);
        return;
      }
    }
  } catch (err) {
    console.error("Error checking existing status:", err);
  }
  
  // Show loading state
  const originalText = button.textContent;
  button.textContent = "Saving...";
  button.disabled = true;
  
  try {
    // Option 1: Immediate update
    await markAttendance(studentId, status);
    
    // Option 2: Batch update (uncomment if using batch)
    // pendingUpdates.set(studentId, status);
    // button.textContent = "Pending";
    // button.style.backgroundColor = "#FFA726";
    
  } finally {
    // Re-enable after delay (if not using batch)
    setTimeout(() => {
      button.disabled = false;
      button.textContent = originalText;
      clickCooldown.delete(studentId);
    }, 500);
  }
}

async function markAttendance(studentId, status) {
  try {
    const dateKey = getTodayKey();
    
    await updateDoc(doc(db, "students", studentId), {
      [`attendance.${dateKey}`]: status,
      lastUpdated: new Date()
    });
    
    console.log(`Marked ${status} for ${studentId}`);
    updateAttendanceUI(studentId, status);
    // Recompute percentages for currently selected date
    const currentKey = dateInputEl?.value || dateKey;
    computeAttendancePercent(currentKey);
    
  } catch (err) {
    console.error("Attendance error:", err);
    alert("Failed to save attendance. Please try again.");
  }
}

async function handleSaveAll() {
  if (pendingUpdates.size === 0) {
    alert("No pending changes to save.");
    return;
  }
  
  try {
    const saveBtn = document.getElementById("saveAllBtn");
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "Saving...";
    saveBtn.disabled = true;
    
    const batch = writeBatch(db);
    const dateKey = getTodayKey();
    
    for (const [studentId, status] of pendingUpdates) {
      const studentRef = doc(db, "students", studentId);
      batch.update(studentRef, {
        [`attendance.${dateKey}`]: status,
        lastUpdated: new Date()
      });
    }
    
    await batch.commit();
    console.log(`Saved ${pendingUpdates.size} updates`);
    
    // Update UI for all pending updates
    for (const [studentId, status] of pendingUpdates) {
      updateAttendanceUI(studentId, status);
    }
    
    pendingUpdates.clear();
    
    saveBtn.textContent = "All Changes Saved!";
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }, 2000);
    
  } catch (err) {
    console.error("Batch save error:", err);
    alert("Failed to save changes. Please try again.");
  }
}

function updateAttendanceUI(studentId, status) {
  // Update the specific button
  const statusBtn = document.querySelector(`[data-id="${studentId}"].${status}-btn`);
  if (statusBtn) {
    statusBtn.classList.add("marked");
    statusBtn.innerHTML = status === "present" 
      ? `<span>✓</span> Present` 
      : `<span>✗</span> Absent`;
    statusBtn.style.backgroundColor = status === "present" ? "#4CAF50" : "#F44336";
  }
  
  // Optional: Update the other button to normal state
  const otherStatus = status === "present" ? "absent" : "present";
  const otherBtn = document.querySelector(`[data-id="${studentId}"].${otherStatus}-btn`);
  if (otherBtn) {
    otherBtn.classList.remove("marked");
    otherBtn.innerHTML = otherStatus === "present" ? "Present" : "Absent";
    otherBtn.style.backgroundColor = "";
  }
  
  // Optional: Update student row styling
  const studentRow = document.querySelector(`[data-id="${studentId}"]`)?.closest('tr');
  if (studentRow) {
    studentRow.classList.remove("present-row", "absent-row");
    studentRow.classList.add(`${status}-row`);
  }
}

// ========== CLEANUP ==========
window.addEventListener("beforeunload", () => {
  unsubscribe?.();
});