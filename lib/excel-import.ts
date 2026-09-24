import JSZip from 'jszip';

// ExcelJS expects unprefixed SpreadsheetML tags. Some valid XLSX exporters
// use an explicit namespace prefix; normalize only those tags in memory.
export async function compatibleExcelBuffer(input: ArrayBuffer): Promise<ArrayBuffer> {
 const zip=await JSZip.loadAsync(input);
 let changed=false;
 for(const entry of Object.values(zip.files)) {
  if(entry.dir||!entry.name.startsWith('xl/')||!entry.name.endsWith('.xml'))continue;
  let xml=await entry.async('string');
  const prefixes=[...xml.matchAll(/xmlns:([A-Za-z_][\w.-]*)=["']http:\/\/schemas\.openxmlformats\.org\/spreadsheetml\/2006\/main["']/g)].map(m=>m[1]);
  for(const prefix of new Set(prefixes)) {
   const escaped=prefix.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   xml=xml.replace(new RegExp(`(<\\/?)(?:${escaped}):`,'g'),'$1');
   xml=xml.replace(new RegExp(`xmlns:${escaped}=(["'])http://schemas.openxmlformats.org/spreadsheetml/2006/main\\1`,'g'),'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"');
   changed=true;
  }
  if(prefixes.length)zip.file(entry.name,xml);
 }
 return changed?await zip.generateAsync({type:'arraybuffer'}):input;
}
