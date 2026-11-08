const path=require('node:path'),fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const voices=[{name:'Microsoft Xiaoxiao',lang:'zh-CN',voiceURI:'xiao'},{name:'Microsoft 晓伊 - Chinese',lang:'zh-CN',voiceURI:'yi'},{name:'Russian voice',lang:'ru-RU',voiceURI:'ru'}];let calls=[],failPrimary=false;
const synth={getVoices:()=>voices,addEventListener(){},removeEventListener(){},cancel(){},speak(u){calls.push({name:u.voice.name,rate:u.rate,text:u.text});queueMicrotask(()=>{u.onstart?.();if(failPrimary&&u.voice.voiceURI==='yi')u.onerror?.({error:'synthesis-failed'});else u.onend?.()})}};
const win={speechSynthesis:synth,dispatchEvent(){}};
const sandbox={window:win,localStorage:{getItem:()=>null,setItem(){}},CustomEvent:class{},SpeechSynthesisUtterance:class{constructor(text){this.text=text}},setTimeout,clearTimeout,Option:class{},console};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'..','speech.js'),'utf8'),sandbox);
(async()=>{const speech=win.LearningSpeech;assert.equal(speech.getVoice(),'Microsoft 晓伊 - Chinese');assert.equal(speech.getRate(),.65);assert(await speech.speak('你好'));assert.equal(calls[0].name,'Microsoft 晓伊 - Chinese');assert.equal(calls[0].rate,.65);failPrimary=true;calls=[];assert(await speech.speak('加油'));assert.equal(calls.length,2);assert.equal(calls[0].name,'Microsoft 晓伊 - Chinese');assert.equal(calls[1].name,'Microsoft Xiaoxiao');assert.equal(speech.getVoice(),'Microsoft Xiaoxiao');assert(calls.every(c=>c.name!=='Russian voice'));

// Test testButton greeting resolution
failPrimary=false;calls=[];
let testHandler;
const mockButton={addEventListener(evt,cb){if(evt==='click')testHandler=cb;}};
speech.bind({testButton:mockButton});
testHandler();
await new Promise(r=>setTimeout(r,10));
assert.equal(calls[0].text,'你好，卡佳！加油！');

calls=[];
speech.bind({testButton:mockButton,testPhrase:'你好，丽拉！加油！'});
testHandler();
await new Promise(r=>setTimeout(r,10));
assert.equal(calls[0].text,'你好，丽拉！加油！');

console.log('Passed: Xiaoyi priority with Chinese name; slow rate; playback; failed-voice fallback; non-Chinese voices excluded; greeting resolution.');})().catch(e=>{console.error(e);process.exitCode=1});
