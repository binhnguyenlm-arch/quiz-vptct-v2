const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),out=path.join(root,'public','ocr');
for(const dir of ['', 'core','lang'])fs.mkdirSync(path.join(out,dir),{recursive:true});
fs.copyFileSync(path.join(root,'node_modules/tesseract.js/dist/worker.min.js'),path.join(out,'worker.min.js'));
const core=path.join(root,'node_modules/tesseract.js-core');
for(const file of fs.readdirSync(core))if(/\.wasm(?:\.js)?$/.test(file))fs.copyFileSync(path.join(core,file),path.join(out,'core',file));
for(const lang of ['vie','eng'])fs.copyFileSync(path.join(root,'node_modules/@tesseract.js-data',lang,'4.0.0',lang+'.traineddata.gz'),path.join(out,'lang',lang+'.traineddata.gz'));
fs.writeFileSync(path.join(out,'NOTICE.txt'),'Tesseract.js / Tesseract.js-core: Apache-2.0; trained language data: Apache-2.0. https://github.com/naptha/tesseract.js https://github.com/naptha/tessdata');
console.log('Prepared local OCR worker, WebAssembly and Vietnamese/English models.');
