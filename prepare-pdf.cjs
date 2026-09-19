const fs=require('fs'),path=require('path'),zlib=require('zlib');
const root=path.resolve(__dirname,'../public/pdfjs');const files=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'pdf-assets.json.gz'))));
for(const [name,data] of Object.entries(files)){const dest=path.resolve(root,name);if(!dest.startsWith(root+path.sep))throw Error('Invalid PDF asset path');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,Buffer.from(data,'base64'));}
