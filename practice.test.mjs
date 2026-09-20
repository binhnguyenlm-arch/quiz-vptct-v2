import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleQuestions,packageSizes,summarize} from '../lib/practice.ts';
import fs from 'node:fs';
const bank=JSON.parse(fs.readFileSync(new URL('../lib/banks/politics-test.json',import.meta.url),'utf8'));
test('test bank has 100 unique valid questions with source and one key',()=>{assert.equal(bank.questions.length,100);assert.equal(new Set(bank.questions.map(q=>q.id)).size,100);for(const q of bank.questions){assert.equal(Object.keys(q.options).length,4);assert.ok(q.options[q.correct_answer]);assert.ok(q.explanation&&q.source.location);assert.equal(q.is_official,false);}});
test('package choices adapt to smaller or larger banks',()=>{assert.deepEqual(packageSizes(7),[7]);assert.deepEqual(packageSizes(50),[20,50]);assert.deepEqual(packageSizes(83),[20,50,83]);assert.deepEqual(packageSizes(150),[20,50,100,150]);assert.deepEqual(packageSizes(0),[]);});
test('sampling is unique, bounded and leaves bank intact',()=>{const items=Array.from({length:83},(_,i)=>i);const selected=sampleQuestions(items,50,()=>.31);assert.equal(selected.length,50);assert.equal(new Set(selected).size,50);assert.deepEqual(items,Array.from({length:83},(_,i)=>i));for(const n of [0,-1,84,1.2,NaN])assert.throws(()=>sampleQuestions(items,n));});
test('results distinguish wrong and unanswered; denominator is the selected package',()=>{const qs=bank.questions.slice(0,3);const wrong=Object.keys(qs[1].options).find(k=>k!==qs[1].correct_answer);assert.deepEqual(summarize(qs,{[qs[0].id]:qs[0].correct_answer,[qs[1].id]:wrong}),{correct:1,wrong:1,unanswered:1,total:3,percent:33});assert.deepEqual(summarize([],{}),{correct:0,wrong:0,unanswered:0,total:0,percent:0});});
