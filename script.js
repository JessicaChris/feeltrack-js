import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { Chart, registerables } from "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/+esm";
Chart.register(...registerables);
import confetti from "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/+esm";

document.addEventListener("DOMContentLoaded", async () => {
  const supabase = createClient(
    "https://eymjqphyzdxpbnaotwdn.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bWpxcGh5emR4cGJuYW90d2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcyOTEsImV4cCI6MjA2NzAyMzI5MX0.aO4lzlFKybisPq4pR0EaO4GMfr3ho1GRPlkd0jKZVuA"
  );
console.log("🔥 FeelTrack JS Loaded");

  const user = JSON.parse(localStorage.getItem("feeltrack_user"));
  if (!user) {
    alert("You must be logged in to use FeelTrack.");
    window.location.href = "login.html";
    return;
  }

  const moodButtons = document.querySelectorAll(".mood-btn");
  const habitChecks = document.querySelectorAll(".habit-check");
  const saveBtn = document.getElementById("save-btn");
  const journalInput = document.getElementById("journal");
  const logList = document.getElementById("log-list");
  const darkToggle = document.getElementById("dark-toggle");
  const streakEl = document.getElementById("streak-count");
  const mostMoodEl = document.getElementById("most-mood");

  let selectedMood = "";

  // Dark mode toggle
  darkToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const theme = document.body.classList.contains("dark") ? "dark" : "light";
    localStorage.setItem("theme", theme);
  });

  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }

  moodButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedMood = btn.textContent.trim();
      moodButtons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });

  const loadLogs = async () => {
    const { data: logs, error } = await supabase
      .from("logs")
      .select("*")
      .eq("user_id", user.id)
      .order("id", { ascending: false });

    if (error) {
      console.error("❌ Error loading logs:", error.message);
    } else {
      logList.innerHTML = "";
      logs.forEach(displayLog);
      renderMoodChart(logs);
      showStreak(logs);
      calculateMostMood(logs);
    }
  };

  loadLogs();

  saveBtn.addEventListener("click", async () => {
    const selectedHabits = [];
    habitChecks.forEach((check) => {
      if (check.checked) {
        selectedHabits.push(check.parentElement.textContent.trim());
      }
    });

    if (!selectedMood && selectedHabits.length === 0) {
      alert("⚠️ Please select a mood or at least one habit!");
      return;
    }

    const logEntry = {
      user_id: user.id,
      mood: selectedMood || "None",
      habits: selectedHabits.join(", ") || "None",
      notes: journalInput.value.trim() || "",
      date: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };

    const { data, error } = await supabase.from("logs").insert([logEntry]).select();

    if (error) {
      console.error("❌ Error saving log:", error.message);
      alert("Failed to save log.");
    } else {
      displayLog(data[0]);
      loadLogs();

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
    }

    saveBtn.classList.add("clicked");
    setTimeout(() => saveBtn.classList.remove("clicked"), 300);
  });

  function displayLog(entry) {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${entry.date}</strong><br>
      Mood: ${entry.mood} | Habits: ${entry.habits}<br>
      ${entry.notes ? `<em>📝 ${entry.notes}</em><br>` : ""}
      <button class="delete-btn" data-id="${entry.id}">❌</button>
    `;
    logList.appendChild(li);
  }

  logList.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const logId = e.target.dataset.id;
      const { error } = await supabase
        .from("logs")
        .delete()
        .eq("id", logId)
        .eq("user_id", user.id);

      if (error) {
        console.error("❌ Error deleting log:", error.message);
      } else {
        e.target.parentElement.remove();
        loadLogs();
      }
    }
  });

  function renderMoodChart(logs) {
    const moodCounts = {
      "😄 Happy": 0,
      "😐 Okay": 0,
      "😢 Sad": 0,
      "😡 Angry": 0,
    };

    logs.forEach((log) => {
      const mood = log.mood.trim();
      if (moodCounts.hasOwnProperty(mood)) {
        moodCounts[mood]++;
      }
    });

    const canvas = document.getElementById("mood-chart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (window.moodChart) window.moodChart.destroy();

    window.moodChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: Object.keys(moodCounts),
        datasets: [{
          label: "Mood Distribution",
          data: Object.values(moodCounts),
          backgroundColor: ["#4CAF50", "#FFC107", "#2196F3", "#F44336"],
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
        },
      },
    });
  }

  function showStreak(logs) {
    let streak = 0;
    let currentDate = new Date();
    const datesLogged = logs.map((log) =>
      new Date(log.date).toDateString()
    );

    while (datesLogged.includes(currentDate.toDateString())) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    streakEl.textContent = `🔥 ${streak}-day streak`;
  }

  function calculateMostMood(logs) {
    const moodMap = {};

    logs.forEach((log) => {
      const mood = log.mood.trim();
      moodMap[mood] = (moodMap[mood] || 0) + 1;
    });

    const sorted = Object.entries(moodMap).sort((a, b) => b[1] - a[1]);
    const [mostMood, count] = sorted[0] || [];

    mostMoodEl.textContent = mostMood
      ? `💖 ${mostMood} (${count}x)`
      : "No moods logged yet.";
  }
});
