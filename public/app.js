const socket = io();
const $ = id => document.getElementById(id);
let currentState;

socket.on("state", state => {
  currentState = state;
  $("category").textContent = state.question.category.toUpperCase();
  $("round").textContent = `#${state.round}`;
  $("question").textContent = state.question.text;
  $("seconds").textContent = state.phase === "question" ? state.secondsLeft : "✓";
  $("timerBar").style.width = `${Math.max(0,state.secondsLeft/10*100)}%`;
  $("aCount").textContent = state.answers.A;
  $("fCount").textContent = state.answers.F;

  const result = $("result");
  if (state.phase === "reveal") {
    result.classList.remove("hidden");
    result.textContent = state.question.answer === "A" ? "✅ ADEVĂRAT" : "❌ FALS";
  } else result.classList.add("hidden");

  $("leaders").innerHTML = state.players.map((p,i) =>
    `<li>${escapeHtml(p.username)} ${p.streak >= 2 ? "🔥"+p.streak : ""}<span>${p.score} pct</span></li>`
  ).join("") || "<li>Primul răspuns poate fi al tău 👀</li>";
});

document.querySelectorAll("[data-sim]").forEach(btn => btn.addEventListener("click", () => {
  socket.emit("answer", { username: $("username").value || "Viewer", answer: btn.dataset.sim });
}));

$("crowd").addEventListener("click", () => {
  const names = ["Andrei","Maria","Alex","Ioana","Mihai","Elena","Vlad","Ana","Radu","Daria","Matei","Sofia","Paul","Bianca","Tudor","Iulia","David","Larisa","Robert","Denisa","Cosmin","Alina","George","Teodora","Cristi"];
  names.forEach((name,i) => setTimeout(() => socket.emit("answer", {username:name,answer:Math.random()>.35?"A":"F"}), i*70));
});

function escapeHtml(value) {
  const d=document.createElement("div"); d.textContent=value; return d.innerHTML;
}
