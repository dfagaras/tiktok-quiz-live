import express from "express";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import { QuizEngine, Question, Answer } from "./quiz-engine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const questions = JSON.parse(fs.readFileSync(path.join(root, "data/questions.json"), "utf8")) as Question[];
const engine = new QuizEngine(questions, 10);

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static(path.join(root, "public")));
app.use(express.json());

const broadcast = () => io.emit("state", engine.state());

io.on("connection", socket => {
  socket.emit("state", engine.state());
  socket.on("answer", (payload: { username?: string; answer?: string }) => {
    const answer = payload.answer?.toUpperCase();
    if (payload.username && (answer === "A" || answer === "F")) {
      engine.submit(payload.username.trim().slice(0, 30), answer as Answer);
      broadcast();
    }
  });
});

setInterval(() => {
  const state = engine.state();
  if (state.phase === "question") {
    if (state.secondsLeft <= 0) {
      engine.reveal();
      broadcast();
      setTimeout(() => { engine.next(); broadcast(); }, 4000);
    } else {
      engine.tick();
      broadcast();
    }
  }
}, 1000);

server.listen(3000, () => console.log("TikTok Quiz Live: http://localhost:3000"));
