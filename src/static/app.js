document.addEventListener("DOMContentLoaded", () => {
  const activitiesListEl = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageEl = document.getElementById("message");

  let activities = {};

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) throw new Error("Failed to load activities");
      activities = await response.json();
      renderActivities();
      populateActivitySelect();
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  function renderActivities() {
    activitiesListEl.innerHTML = "";
    if (!Object.keys(activities).length) {
      activitiesListEl.innerHTML = '<p class="info">No activities available</p>';
      return;
    }
    Object.entries(activities).forEach(([name, details]) => {
      const card = document.createElement("div");
      card.className = "activity-card";
      card.dataset.activity = name;
      card.innerHTML = `
        <h4>${escapeHtml(name)}</h4>
        <p><strong>When:</strong> ${escapeHtml(details.schedule)}</p>
        <p>${escapeHtml(details.description)}</p>
        <div class="participants-section">
          <h5 class="participants-heading">Participants</h5>
          ${renderParticipants(details.participants)}
        </div>
      `;
      activitiesListEl.appendChild(card);
    });
  }

  function renderParticipants(list) {
    if (!list || !list.length) {
      return '<ul class="participants-list"><li class="participant-item participant-empty">No participants yet</li></ul>';
    }
    const items = list.map((p) => `<li class="participants-list-item participant-item">${escapeHtml(p)}</li>`).join("");
    return `<ul class="participants-list">${items}</ul>`;
  }

  function populateActivitySelect() {
    activitySelect.querySelectorAll('option:not([value=""])').forEach((o) => o.remove());
    Object.keys(activities).forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      activitySelect.appendChild(opt);
    });
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const activityName = document.getElementById("activity").value;
    if (!email || !activityName) {
      showMessage("Please provide your email and select an activity", "error");
      return;
    }
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(err.detail || "Signup failed");
      }
      await response.json();
      if (!activities[activityName].participants) activities[activityName].participants = [];
      activities[activityName].participants.push(email);
      updateActivityCard(activityName);
      showMessage(`Signed up ${email} for ${activityName}`, "success");
      signupForm.reset();
    } catch (error) {
      showMessage(error.message, "error");
    }
  });

  function updateActivityCard(activityName) {
    const card = document.querySelector(`.activity-card[data-activity="${CSS.escape(activityName)}"]`);
    if (!card) return;
    const participantsSection = card.querySelector(".participants-section");
    if (!participantsSection) return;
    participantsSection.innerHTML = `
      <h5 class="participants-heading">Participants</h5>
      ${renderParticipants(activities[activityName].participants)}
    `;
  }

  function showMessage(text, type = "info") {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.classList.remove("hidden");
    setTimeout(() => {
      messageEl.classList.add("hidden");
    }, 4000);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"'`=\/]/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "/": "&#x2F;",
        "`": "&#x60;",
        "=": "&#x3D;",
      }[c];
    });
  }

  // Initialize app
  fetchActivities();
});
