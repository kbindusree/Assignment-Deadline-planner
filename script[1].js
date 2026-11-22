const STORAGE_KEY = "duemate_assignments_v1";
let assignments = loadAssignments();
let toastTimer;

const $ = (id) => document.getElementById(id);
const today = new Date();
today.setHours(0, 0, 0, 0);

function loadAssignments() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Could not read saved assignments:", error);
    return [];
  }
}
function saveAssignments() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
}
function dateOnly(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
function formatDate(value, options = { day: "numeric", month: "short", year: "numeric" }) {
  return dateOnly(value).toLocaleDateString("en-IN", options);
}
function daysUntil(value) {
  return Math.round((dateOnly(value) - today) / 86400000);
}
function dueText(value) {
  const difference = daysUntil(value);
  if (difference < 0) return `${Math.abs(difference)} day${difference === -1 ? "" : "s"} overdue`;
  if (difference === 0) return "Due today";
  if (difference === 1) return "Due tomorrow";
  return `Due in ${difference} days`;
}
function effectiveStatus(item) {
  if (item.status === "Completed") return "Completed";
  if (daysUntil(item.dueDate) < 0) return "Overdue";
  return item.status;
}
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function setPage(view) {
  const isDashboard = view === "dashboard";
  $("dashboardView").classList.toggle("active-page", isDashboard);
  $("assignmentsView").classList.toggle("active-page", !isDashboard);
  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  $("pageName").textContent = isDashboard ? "Dashboard" : "My assignments";
  $("sidebar").classList.remove("open");
  if (!isDashboard) renderAssignments();
}
function openModal(item = null) {
  $("assignmentForm").reset();
  $("formError").textContent = "";
  $("assignmentId").value = item ? item.id : "";
  $("modalTitle").textContent = item ? "Update assignment" : "Add an assignment";
  $("saveBtn").textContent = item ? "Save changes" : "Save assignment";
  $("titleInput").value = item?.title || "";
  $("subjectInput").value = item?.subject || "";
  $("categoryInput").value = item?.category || "Assignment";
  $("dueDateInput").value = item?.dueDate || "";
  $("priorityInput").value = item?.priority || "Medium";
  $("statusInput").value = item?.status || "Pending";
  $("notesInput").value = item?.notes || "";
  $("modalBackdrop").classList.add("open");
  $("modalBackdrop").setAttribute("aria-hidden", "false");
  setTimeout(() => $("titleInput").focus(), 50);
}
function closeModal() {
  $("modalBackdrop").classList.remove("open");
  $("modalBackdrop").setAttribute("aria-hidden", "true");
}
function validateForm() {
  const title = $("titleInput").value.trim();
  const subject = $("subjectInput").value.trim();
  const dueDate = $("dueDateInput").value;
  if (!title || !subject || !dueDate) return "Please complete all required fields.";
  if (title.length < 3) return "Assignment title must contain at least 3 characters.";
  if (subject.length < 2) return "Please enter a valid subject name.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return "Please choose a valid due date.";
  return "";
}
function saveForm(event) {
  event.preventDefault();
  const error = validateForm();
  if (error) { $("formError").textContent = error; return; }
  const id = $("assignmentId").value;
  const record = {
    id: id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    title: $("titleInput").value.trim(),
    subject: $("subjectInput").value.trim(),
    category: $("categoryInput").value,
    dueDate: $("dueDateInput").value,
    priority: $("priorityInput").value,
    status: $("statusInput").value,
    notes: $("notesInput").value.trim(),
    createdAt: id ? (assignments.find(item => item.id === id)?.createdAt || Date.now()) : Date.now()
  };
  if (id) {
    assignments = assignments.map(item => item.id === id ? record : item);
    showToast("Assignment updated successfully.");
  } else {
    assignments.push(record);
    showToast("Assignment added successfully.");
  }
  saveAssignments();
  closeModal();
  renderAll();
}
function deleteAssignment(id) {
  const item = assignments.find(task => task.id === id);
  if (!item) return;
  if (!confirm(`Delete "${item.title}"? This action cannot be undone.`)) return;
  assignments = assignments.filter(task => task.id !== id);
  saveAssignments();
  renderAll();
  showToast("Assignment deleted.");
}
function updateStatus(id, status) {
  assignments = assignments.map(item => item.id === id ? { ...item, status } : item);
  saveAssignments();
  renderAll();
  showToast(status === "Completed" ? "Great work! Assignment completed." : "Assignment status updated.");
}
function priorityRank(value) { return ({ High: 3, Medium: 2, Low: 1 })[value] || 0; }
function statusClass(status) {
  if (status === "Completed") return "status-completed";
  if (status === "In Progress") return "status-progress";
  return "status-pending";
}
function priorityClass(priority) { return `priority-${priority.toLowerCase()}`; }
function emptyState(title, message) {
  return `<div class="empty-state"><b>${escapeHTML(title)}</b>${escapeHTML(message)}</div>`;
}
function renderDashboard() {
  const total = assignments.length;
  const pending = assignments.filter(item => item.status === "Pending" && daysUntil(item.dueDate) >= 0).length;
  const inProgress = assignments.filter(item => item.status === "In Progress" && daysUntil(item.dueDate) >= 0).length;
  const completed = assignments.filter(item => item.status === "Completed").length;
  const overdue = assignments.filter(item => effectiveStatus(item) === "Overdue").length;
  $("totalStat").textContent = total;
  $("pendingStat").textContent = pending + overdue;
  $("progressStat").textContent = inProgress;
  $("completedStat").textContent = completed;
  $("navCount").textContent = total;
  const percent = total ? Math.round(completed / total * 100) : 0;
  $("completionPercent").textContent = `${percent}%`;
  $("progressRing").style.background = `conic-gradient(var(--purple) ${percent * 3.6}deg, #eeedf5 0deg)`;
  $("progressCaption").textContent = total ? `${completed} of ${total} assignments completed${overdue ? ` • ${overdue} overdue` : ""}.` : "Add your first assignment to start tracking your progress.";

  const upcoming = assignments.filter(item => item.status !== "Completed")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || priorityRank(b.priority) - priorityRank(a.priority)).slice(0, 4);
  $("upcomingList").innerHTML = upcoming.length ? upcoming.map(item => {
    const d = dateOnly(item.dueDate);
    const due = dueText(item.dueDate);
    return `<div class="upcoming-item">
      <div class="task-date"><strong>${d.getDate()}</strong><small>${d.toLocaleDateString("en-IN",{month:"short"})}</small></div>
      <div class="task-info"><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.subject)} · ${escapeHTML(item.category)}</small></div>
      <span class="due-label ${daysUntil(item.dueDate)<0 ? "overdue" : ""}">${due}</span>
    </div>`;
  }).join("") : emptyState("You're all caught up!", "No upcoming assignments. Add a task whenever you need to.");

  const recent = [...assignments].sort((a,b) => b.createdAt - a.createdAt).slice(0,5);
  $("recentTable").innerHTML = recent.length ? recent.map(item => `
    <tr><td><div class="table-title">${escapeHTML(item.title)}</div><div class="table-sub">${escapeHTML(item.category)}</div></td>
    <td>${escapeHTML(item.subject)}</td><td>${formatDate(item.dueDate)}</td>
    <td><span class="${priorityClass(item.priority)}">● ${escapeHTML(item.priority)}</span></td>
    <td><span class="badge ${statusClass(item.status)}">${escapeHTML(item.status)}</span></td></tr>`).join("") :
    `<tr><td colspan="5">${emptyState("No assignments yet", "Your recently added tasks will appear here.")}</td></tr>`;
}
function renderAssignments() {
  const query = $("searchInput").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  const priority = $("priorityFilter").value;
  const sort = $("sortFilter").value;
  let filtered = assignments.filter(item => {
    const matchesText = `${item.title} ${item.subject} ${item.category} ${item.notes}`.toLowerCase().includes(query);
    const matchesStatus = status === "all" || (status === "Pending" ? item.status === "Pending" || effectiveStatus(item) === "Overdue" : item.status === status);
    const matchesPriority = priority === "all" || item.priority === priority;
    return matchesText && matchesStatus && matchesPriority;
  });
  filtered.sort((a,b) => {
    if (sort === "dateDesc") return b.dueDate.localeCompare(a.dueDate);
    if (sort === "priority") return priorityRank(b.priority) - priorityRank(a.priority) || a.dueDate.localeCompare(b.dueDate);
    if (sort === "recent") return b.createdAt - a.createdAt;
    return a.dueDate.localeCompare(b.dueDate);
  });
  $("resultCount").textContent = `${filtered.length} assignment${filtered.length === 1 ? "" : "s"}`;
  $("assignmentList").innerHTML = filtered.length ? filtered.map(item => {
    const effective = effectiveStatus(item);
    const badge = effective === "Overdue" ? "status-pending" : statusClass(item.status);
    return `<article class="assignment-card">
      <div class="assignment-main">
        <div class="assignment-title-row"><span class="assignment-title">${escapeHTML(item.title)}</span><span class="badge ${badge}">${effective}</span></div>
        <div class="assignment-meta"><span>▣ ${escapeHTML(item.subject)}</span><span>▤ ${escapeHTML(item.category)}</span><span>◷ ${formatDate(item.dueDate)}</span><span class="${priorityClass(item.priority)}">● ${escapeHTML(item.priority)} priority</span><span>${dueText(item.dueDate)}</span></div>
        ${item.notes ? `<p class="assignment-notes">${escapeHTML(item.notes)}</p>` : ""}
      </div>
      <div class="assignment-actions">
        <select class="status-select" aria-label="Change status for ${escapeHTML(item.title)}" data-status-id="${item.id}">
          <option ${item.status==="Pending"?"selected":""}>Pending</option><option ${item.status==="In Progress"?"selected":""}>In Progress</option><option ${item.status==="Completed"?"selected":""}>Completed</option>
        </select>
        <button class="icon-btn" data-edit="${item.id}" aria-label="Edit ${escapeHTML(item.title)}">✎ Edit</button>
        <button class="icon-btn" data-delete="${item.id}" aria-label="Delete ${escapeHTML(item.title)}">⌫ Delete</button>
      </div>
    </article>`;
  }).join("") : emptyState("No matching assignments", assignments.length ? "Try changing your search or filters." : "Use the New assignment button to add your first task.");
}
function renderAll() { renderDashboard(); renderAssignments(); }

document.querySelectorAll(".nav-link").forEach(button => button.addEventListener("click", () => setPage(button.dataset.view)));
document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => setPage(button.dataset.go)));
["addTopBtn","addMainBtn"].forEach(id => $(id).addEventListener("click", () => openModal()));
$("closeModal").addEventListener("click", closeModal);
$("cancelModal").addEventListener("click", closeModal);
$("modalBackdrop").addEventListener("click", event => { if (event.target === $("modalBackdrop")) closeModal(); });
$("assignmentForm").addEventListener("submit", saveForm);
$("assignmentList").addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) {
    const item = assignments.find(task => task.id === editButton.dataset.edit);
    if (item) openModal(item);
  }
  if (deleteButton) deleteAssignment(deleteButton.dataset.delete);
});
$("assignmentList").addEventListener("change", event => {
  if (event.target.matches("[data-status-id]")) updateStatus(event.target.dataset.statusId, event.target.value);
});
["searchInput","statusFilter","priorityFilter","sortFilter"].forEach(id => $(id).addEventListener(id === "searchInput" ? "input" : "change", renderAssignments));
$("mobileMenu").addEventListener("click", () => $("sidebar").classList.toggle("open"));
document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });

$("todayLabel").textContent = today.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
$("fullDate").textContent = today.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
renderAll();
