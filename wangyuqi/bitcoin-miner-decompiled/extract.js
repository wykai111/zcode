const fs=require('fs'),zlib=require('zlib'),path=require('path');
const jsDir='js';
const fAssign='70d62df90b7caeaca9ac3327a724306a.js';
const fAppend='e3095eb6bc5fab8a45429eb04fb2ad14.js';
function extractString(file){
  const src=fs.readFileSync(path.join(jsDir,file),'utf8');
  const m=src.match(/__adapter_zip__\s*\+?=\s*"([\s\S]*?)"\s*;?/);
  if(!m) throw new Error('no zip string in '+file);
  return m[1];
}
const b64=extractString(fAssign)+extractString(fAppend);
const buf=Buffer.from(b64,'base64');
const jsonStr=zlib.inflateSync(buf).toString('utf8');
const res=JSON.parse(jsonStr);
const keys=Object.keys(res);
fs.mkdirSync('assets',{recursive:true});

// Decode each value. Two cases:
//  - "data:<mime>;base64,...."  → strip header, decode to binary file
//  - anything else (plain JS/JSON text) → write as UTF-8
let binCount=0,txtCount=0;
const byExt={};
for(const k of keys){
  let v=res[k], out;
  if(typeof v==='string' && v.startsWith('data:') && v.includes(';base64,')){
    const payload=v.substring(v.indexOf(';base64,')+';base64,'.length);
    out=Buffer.from(payload,'base64');
    binCount++;
  } else {
    out=Buffer.from(String(v),'utf8');
    txtCount++;
  }
  const dest=path.join('assets',k);
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.writeFileSync(dest,out);
  const ext=(k.match(/\.([^.\/]+)$/)||[,''])[1].toLowerCase();
  byExt[ext]=(byExt[ext]||0)+1;
}
console.error('decoded: binary='+binCount+' text='+txtCount);
console.error('extensions:',JSON.stringify(byExt));
