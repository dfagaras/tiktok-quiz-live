import fs from"node:fs";import path from"node:path";import crypto from"node:crypto";
export class ElevenLabsTTS{
 private apiKey=process.env.ELEVENLABS_API_KEY??"";private voiceId=process.env.ELEVENLABS_VOICE_ID??"";private cacheDir:string;
 constructor(root:string){this.cacheDir=path.join(root,".cache","tts");fs.mkdirSync(this.cacheDir,{recursive:true})}
 get enabled(){return Boolean(this.apiKey&&this.voiceId)}
 async audioFor(text:string){if(!this.enabled)throw new Error("ElevenLabs not configured");const key=crypto.createHash("sha256").update(this.voiceId+"|"+text).digest("hex"),file=path.join(this.cacheDir,key+".mp3");if(fs.existsSync(file))return{file,cached:true};
 const response=await fetch("https://api.elevenlabs.io/v1/text-to-speech/"+this.voiceId+"?output_format=mp3_44100_128",{method:"POST",headers:{"xi-api-key":this.apiKey,"Content-Type":"application/json","Accept":"audio/mpeg"},body:JSON.stringify({text,model_id:"eleven_multilingual_v2",voice_settings:{stability:.55,similarity_boost:.8,style:.15,use_speaker_boost:true}})});
 if(!response.ok)throw new Error("ElevenLabs "+response.status+": "+await response.text());const bytes=Buffer.from(await response.arrayBuffer());fs.writeFileSync(file,bytes);return{file,cached:false}}
}