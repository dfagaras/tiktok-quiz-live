import WebSocket from "ws";
type Handler=(username:string,comment:string)=>void;
export function connectTikFinity(onChat:Handler,onStatus:(s:string)=>void){
 const url=process.env.TIKFINITY_WS_URL||"ws://127.0.0.1:21213/";
 let ws:WebSocket|undefined,retry:NodeJS.Timeout|undefined;
 const connect=()=>{onStatus("connecting");ws=new WebSocket(url);
  ws.on("open",()=>onStatus("connected"));
  ws.on("message",raw=>{try{const msg=JSON.parse(raw.toString());if(msg.event!=="chat")return;const d=msg.data??{};const username=d.user?.uniqueId||d.user?.nickname||d.uniqueId||d.nickname||"viewer";const comment=d.comment;if(typeof comment==="string"&&comment.trim())onChat(String(username),comment)}catch(e){console.warn("TikFinity message ignored:",e)}});
  ws.on("close",()=>{onStatus("disconnected");retry=setTimeout(connect,2000)});
  ws.on("error",()=>{onStatus("disconnected");ws?.close()});
 };
 connect();return()=>{if(retry)clearTimeout(retry);ws?.close()};
}