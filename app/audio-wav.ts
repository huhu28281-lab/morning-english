export function encodeWav(samples: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(44+samples.length*2), view = new DataView(buffer);
  const ascii = (offset:number,text:string) => [...text].forEach((c,i)=>view.setUint8(offset+i,c.charCodeAt(0)));
  ascii(0,"RIFF"); view.setUint32(4,36+samples.length*2,true); ascii(8,"WAVE"); ascii(12,"fmt ");
  view.setUint32(16,16,true); view.setUint16(20,1,true); view.setUint16(22,1,true);
  view.setUint32(24,16000,true); view.setUint32(28,32000,true); view.setUint16(32,2,true); view.setUint16(34,16,true);
  ascii(36,"data"); view.setUint32(40,samples.length*2,true);
  for (let i=0;i<samples.length;i++) { const s=Number.isFinite(samples[i]) ? Math.max(-1,Math.min(1,samples[i])) : 0; view.setInt16(44+i*2,Math.round(s*(s<0?32768:32767)),true); }
  return buffer;
}
export function wavDuration(bytes: Uint8Array): number {
  if (bytes.length<44) throw new Error("Invalid WAV");
  const view = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const ascii=(a:number,b:number)=>new TextDecoder().decode(bytes.slice(a,b));
  if (ascii(0,4)!=="RIFF" || ascii(8,12)!=="WAVE" || ascii(12,16)!=="fmt " || ascii(36,40)!=="data" || view.getUint32(16,true)!==16 || view.getUint16(20,true)!==1 || view.getUint16(22,true)!==1 || view.getUint32(24,true)!==16000 || view.getUint32(28,true)!==32000 || view.getUint16(32,true)!==2 || view.getUint16(34,true)!==16 || view.getUint32(4,true)!==bytes.length-8 || view.getUint32(40,true)!==bytes.length-44 || (bytes.length-44)%2!==0) throw new Error("Unsupported WAV");
  const duration = (bytes.length-44)/32000;
  if (duration<0.5 || duration>22) throw new Error("Invalid duration");
  return duration;
}
export async function recordingToWav(blob: Blob): Promise<ArrayBuffer> {
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer());
    if (decoded.duration<0.5 || decoded.duration>22) throw new Error("한 문장을 1~20초 정도로 녹음해 주세요.");
    const offline = new OfflineAudioContext(1,Math.ceil(decoded.duration*16000),16000);
    const source = offline.createBufferSource(); source.buffer=decoded; source.connect(offline.destination); source.start();
    const result = await offline.startRendering();
    const wav=encodeWav(result.getChannelData(0)); wavDuration(new Uint8Array(wav)); return wav;
  } finally { await context.close(); }
}
