export type QuestionType = "true_false" | "multiple_choice" | "number" | "text";
export type ChoiceKey = "A" | "B" | "C" | "D";
export interface Question { id:number; type:QuestionType; text:string; category:string; options?:Record<string,string>; answer:string|number; acceptedAnswers?:string[]; tolerance?:number; unit?:string; }
export interface Player { username:string; score:number; streak:number; bestStreak:number; answer?:string; answeredAt?:number; }
const normalize=(v:string)=>v.trim().toLocaleLowerCase("ro-RO").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[.,!?;:]+$/g,"").replace(/\s+/g," ");
export class QuizEngine {
 private players=new Map<string,Player>(); private index=0; private phase:"question"|"reveal"="question"; private secondsLeft:number; private questionStartedAt=Date.now();
 constructor(private questions:Question[],private questionSeconds=10){this.secondsLeft=questionSeconds;}
 get current(){return this.questions[this.index%this.questions.length];}
 parseResponse(raw:string):string|null { const q=this.current,input=raw.trim(); if(!input)return null;
  if(q.type==="true_false"){const n=normalize(input);if(["a","adevarat","adev","true","1"].includes(n))return"A";if(["f","fals","false","0"].includes(n))return"F";return null;}
  if(q.type==="multiple_choice"){const key=input.toUpperCase();if(["A","B","C","D"].includes(key)&&q.options?.[key])return key;for(const [k,v] of Object.entries(q.options??{}))if(normalize(input)===normalize(v))return k;return null;}
  if(q.type==="number"){const cleaned=input.replace(",",".").replace(/[^0-9+\-.]/g,"");const value=Number(cleaned);return Number.isFinite(value)?String(value):null;}
  return input.slice(0,80);
 }
 private isCorrect(response?:string){if(!response)return false;const q=this.current;if(q.type==="number"){const v=Number(response),e=Number(q.answer);return Number.isFinite(v)&&Math.abs(v-e)<=(q.tolerance??0);}return [String(q.answer),...(q.acceptedAnswers??[])].map(normalize).includes(normalize(response));}
 submitRaw(username:string,raw:string){const parsed=this.parseResponse(raw);if(parsed)this.submit(username,parsed);}
 submit(username:string,answer:string){if(this.phase!=="question")return;const key=username.toLowerCase();const p=this.players.get(key)??{username,score:0,streak:0,bestStreak:0};if(p.answer)return;p.answer=answer;p.answeredAt=Date.now();this.players.set(key,p);}
 tick(){if(this.phase==="question")this.secondsLeft=Math.max(0,this.secondsLeft-1);}
 reveal(){if(this.phase==="reveal")return;this.phase="reveal";for(const p of this.players.values()){if(this.isCorrect(p.answer)){const elapsed=Math.min(this.questionSeconds*1000,(p.answeredAt??Date.now())-this.questionStartedAt);const bonus=Math.max(0,Math.round((1-elapsed/(this.questionSeconds*1000))*50));p.streak++;p.bestStreak=Math.max(p.bestStreak,p.streak);p.score+=100+bonus+Math.min(p.streak*5,50);}else if(p.answer)p.streak=0;}}
 next(){this.index=(this.index+1)%this.questions.length;this.phase="question";this.secondsLeft=this.questionSeconds;this.questionStartedAt=Date.now();for(const p of this.players.values()){delete p.answer;delete p.answeredAt;}}
 state(){const all=[...this.players.values()],answers:Record<string,number>={};for(const p of all)if(p.answer)answers[p.answer]=(answers[p.answer]??0)+1;return{phase:this.phase,question:this.current,round:this.index+1,totalRounds:this.questions.length,secondsLeft:this.secondsLeft,answers,responseCount:all.filter(p=>p.answer).length,players:all.sort((a,b)=>b.score-a.score).slice(0,10)};}
}