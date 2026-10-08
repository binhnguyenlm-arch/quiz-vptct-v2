import test from 'node:test';import assert from 'node:assert/strict';
import {cameraCrop} from '../lib/lookup-camera.ts';
import {findLookup,makeLookupIndex,parseLookupText} from '../lib/lookup-match.ts';import fs from 'node:fs';
const bank=['command','party','public'].flatMap(a=>JSON.parse(fs.readFileSync(new URL('../lib/banks/politics-'+a+'-2026.json',import.meta.url))).questions.map(q=>({...q,audience:a}))),index=makeLookupIndex(bank);
test('cover preview cropping maps portrait and landscape without reading the masked area',()=>{const c=cameraCrop(1920,1080,360,640,{left:18,top:192,width:324,height:256});for(const [k,v] of Object.entries({x:686.625,y:324,width:546.75,height:432}))assert.ok(Math.abs(c[k]-v)<0.000001);assert.deepEqual(cameraCrop(1080,1920,360,640,{left:18,top:192,width:324,height:256}),{x:54,y:576,width:972,height:768});assert.throws(()=>cameraCrop(0,0,360,640,{left:0,top:0,width:300,height:300}));});
test('real screen-photo OCR: chrome, timers, source text and radio circles cannot pollute question',()=>{for(const [number,text] of [
 ['56','D Ôn tập và x +\n\nhttps://ontap-vptct-seven.vercel.app/nhan-thuc\n\n“au 92V\n\n"Thời gian toàn bài: 25:21 / 30 phút\n\nTheo tài liệu, có bao nhiêu nhóm nguyên nhân chính gây cháy?\nCau 56 trong t\n\nChọn một đáp án\nO A. 3nhóm\nO B. 2nhóm\nO C. 4nhóm\n© D. 5nhóm.\n\nI\n-'],
 ['43','“au =i2v\n\n"Thời gian toàn bài: 26:52 / 30 phút\n\nNguyên nhân tự cháy có máy loại?\n\nChọn một đáp án\n\nThử lại OK'],
 ['18','Vptct-seven.vercel.app\n\n“au o\n\nthời gian toàn bai: 28:34\n\nNhững lưu ý đói với người nhận ca?\n\nChọn một đáp án\nO A. Không được giao ca qua loa đại khái.\n\n© B. Không tin tưởng nề nang nên không kiềm tra kỹ.\n\n© C. Không uống rượu, chất kích thích khi giao nhận ca?\n\nO D. Cảa,bvàc.\n\nDừng lượt thi |\n\nxa']
 ]){const r=findLookup(text,index);assert.equal(r.hits[0]?.question.id,'public-'+number);assert.equal(r.automatic,true);}});
test('wrapped full question is retained and multiple questions still abstain',()=>{const q=bank.find(q=>q.id==='public-56');assert.equal(parseLookupText('Browser junk\n\nTheo tài liệu, có bao nhiêu nhóm\nnguyên nhân chính gây cháy?\n\nChọn một đáp án').question,'Theo tài liệu, có bao nhiêu nhóm\nnguyên nhân chính gây cháy?');assert.equal(findLookup(q.question+'\n\nNguyên nhân tự cháy có mấy loại?',index).automatic,false);});

