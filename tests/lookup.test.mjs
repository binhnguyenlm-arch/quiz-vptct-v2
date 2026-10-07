import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {findLookup,makeLookupIndex,normalizeLookup,parseLookupText} from '../lib/lookup-match.ts';
const bank=['command','party','public'].flatMap(a=>JSON.parse(fs.readFileSync(new URL('../lib/banks/politics-'+a+'-2026.json',import.meta.url))).questions.map(q=>({...q,audience:a})));
const index=makeLookupIndex(bank);
const photo=q=>`Câu ${q.number}. ${q.question}\n`+Object.entries(q.options).map(([k,v])=>`${k.replace(/([A-HĐ])2/, '$1')}. ${v}`).join('\n');
test('900 canonical records: no missing keys; exact and unaccented lookup never return a wrong automatic answer',()=>{
 assert.equal(bank.length,900);let automatic=0;
 for(const q of bank){assert.ok(q.options[q.correct_answer]);for(const txt of [photo(q),photo(q).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D')]){const r=findLookup(txt,index);if(r.automatic){automatic++;assert.equal(normalizeLookup(r.hits[0].question.options[r.hits[0].question.correct_answer]),normalizeLookup(q.options[q.correct_answer]),q.id);}}}
 console.log('Automatic matches on exact + accentless fixtures:',automatic,'/1800');assert.ok(automatic>700);
});
test('missing options, close questions, minor OCR damage and no match abstain safely',()=>{
 const q=bank[0],twin={...q,id:'twin',options:{...q.options,A:'Phương án thay đổi hoàn toàn'},correct_answer:'A'};const i=makeLookupIndex([q,twin]);
 assert.equal(findLookup(q.question,i).automatic,false);
 assert.equal(findLookup('Hôm nay chúng ta nên ăn món gì vào buổi trưa ở nhà hàng?',index).automatic,false);
 assert.equal(findLookup('Câu 1. Rất ngắn?',index).hits.length,0);
 assert.equal(findLookup(photo(q)+'\nCâu 999. Câu khác?',index).automatic,false);
 const altered=photo(q).replace(/2026/g,'2027');if(altered!==photo(q))assert.equal(findLookup(altered,makeLookupIndex([q])).automatic,false);
 const noisy=photo(q).replace('Việt Nam','Viet Narn').replace('chính trị','chinh tri');const r=findLookup(noisy,index);if(r.automatic)assert.equal(r.hits[0].question.correct_answer,q.correct_answer);
});
test('option permutation maps answer text to photographed label; letter references abstain',()=>{
 const q={id:'x',number:'1',audience:'party',question:'Địa danh nào là thủ đô của nước Việt Nam?',options:{A:'Hà Nội',B:'Huế',C:'Đà Nẵng',D:'Cần Thơ'},correct_answer:'A'};
 const r=findLookup(q.question+'\nA. Huế\nB. Đà Nẵng\nC. Cần Thơ\nD. Hà Nội',makeLookupIndex([q]));assert.equal(r.automatic,true);assert.equal(r.hits[0].imageAnswer,'D');
 const ref={...q,options:{...q.options,A:'Cả B và C'},correct_answer:'A'};assert.equal(findLookup(ref.question+'\nA. Huế\nB. Cả B và C\nC. Đà Nẵng\nD. Cần Thơ',makeLookupIndex([ref])).automatic,false);
});
test('parser reads inline options and retains duplicate labels',()=>{assert.deepEqual(Object.keys(parseLookupText('Câu hỏi đủ dài ở đây? A. Một B. Hai C. Ba C. Bốn').options),['A','B','C','C2']);});
test('original numeric option labels are retained, not replaced with guessed letters',()=>{const q=bank.find(q=>q.id==='command-471');const parsed=parseLookupText(photo(q));assert.deepEqual(Object.keys(parsed.options),Object.keys(q.options));const r=findLookup(photo(q),index);assert.equal(r.automatic,true);assert.equal(r.hits[0].imageAnswer,q.correct_answer);});
test('damaged accents, clipped text, random character OCR errors never force a wrong answer',()=>{
 for(let i=0;i<bank.length;i+=9){const q=bank[i];for(const txt of [photo(q).replace(/n/g,'m'),photo(q).slice(12,-40),photo(q).replace(/\b20\d\d\b/g,'2099')]){const r=findLookup(txt,index);if(r.automatic)assert.equal(normalizeLookup(r.hits[0].question.options[r.hits[0].question.correct_answer]),normalizeLookup(q.options[q.correct_answer]),q.id);}}
});

