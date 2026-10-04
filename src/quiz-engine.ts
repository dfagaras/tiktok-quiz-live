export type Answer = "A" | "F";

export interface Question {
  id: number;
  text: string;
  answer: Answer;
  category: string;
}

export interface Player {
  username: string;
  score: number;
  streak: number;
  bestStreak: number;
  answer?: Answer;
  answeredAt?: number;
}

export interface QuizState {
  phase: "question" | "reveal";
  question: Question;
  round: number;
  totalRounds: number;
  secondsLeft: number;
  answers: { A: number; F: number };
  players: Player[];
}

export class QuizEngine {
  private players = new Map<string, Player>();
  private index = 0;
  private phase: "question" | "reveal" = "question";
  private secondsLeft: number;
  private questionStartedAt = Date.now();

  constructor(private questions: Question[], private questionSeconds = 10) {
    this.secondsLeft = questionSeconds;
  }

  get current() { return this.questions[this.index % this.questions.length]; }

  submit(username: string, answer: Answer) {
    if (this.phase !== "question") return;
    const key = username.toLowerCase();
    const player = this.players.get(key) ?? { username, score: 0, streak: 0, bestStreak: 0 };
    if (player.answer) return;
    player.answer = answer;
    player.answeredAt = Date.now();
    this.players.set(key, player);
  }

  tick() {
    if (this.phase !== "question") return;
    this.secondsLeft = Math.max(0, this.secondsLeft - 1);
  }

  reveal() {
    if (this.phase === "reveal") return;
    this.phase = "reveal";
    for (const player of this.players.values()) {
      if (player.answer === this.current.answer) {
        const elapsed = Math.min(this.questionSeconds * 1000, (player.answeredAt ?? Date.now()) - this.questionStartedAt);
        const speedBonus = Math.max(0, Math.round((1 - elapsed / (this.questionSeconds * 1000)) * 50));
        player.streak += 1;
        player.bestStreak = Math.max(player.bestStreak, player.streak);
        player.score += 100 + speedBonus + Math.min(player.streak * 5, 50);
      } else if (player.answer) {
        player.streak = 0;
      }
    }
  }

  next() {
    this.index = (this.index + 1) % this.questions.length;
    this.phase = "question";
    this.secondsLeft = this.questionSeconds;
    this.questionStartedAt = Date.now();
    for (const player of this.players.values()) {
      delete player.answer;
      delete player.answeredAt;
    }
  }

  state(): QuizState {
    const all = [...this.players.values()];
    return {
      phase: this.phase,
      question: this.current,
      round: this.index + 1,
      totalRounds: this.questions.length,
      secondsLeft: this.secondsLeft,
      answers: {
        A: all.filter(p => p.answer === "A").length,
        F: all.filter(p => p.answer === "F").length
      },
      players: all.sort((a,b) => b.score - a.score).slice(0, 10)
    };
  }
}
