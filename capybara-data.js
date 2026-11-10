/* Personal characters and exercise banks retained from Katya’s original lesson. */
const CAST = [
  {id:'meiz', nm:'小美',  py:'Xiǎoměi',   f:true,
   job:'医生', jpy:'yīshēng',  jen:'doctor',
   nat:'中国人', npy:'Zhōngguó rén', nen:'Chinese',
   age:'三十',   apy:'sānshí',   acc:'steth', col:'#eef0ec'},
  {id:'dali', nm:'大力',  py:'Dàlì',      f:false,
   job:'牙医', jpy:'yáyī',     jen:'dentist',
   nat:'美国人', npy:'Měiguó rén',   nen:'American',
   age:'三十五', apy:'sānshíwǔ', acc:'lamp',  col:'#cfe3ee'},
  {id:'wang', nm:'王星',  py:'Wáng Xīng', f:false,
   job:'司机', jpy:'sījī',     jen:'driver',
   nat:'中国人', npy:'Zhōngguó rén', nen:'Chinese',
   age:'二十八', apy:'èrshíbā',  acc:'cap',   col:'#8aa87f'},
  {id:'wen',  nm:'小文',  py:'Xiǎowén',   f:true,
   job:'老师', jpy:'lǎoshī',   jen:'teacher',
   nat:'英国人', npy:'Yīngguó rén',  nen:'British',
   age:'二十六', apy:'èrshíliù', acc:'glass', col:'#d9b8d4'},
  {id:'shan', nm:'大山',  py:'Dàshān',    f:false,
   job:'律师', jpy:'lǜshī',    jen:'lawyer',
   nat:'法国人', npy:'Fǎguó rén',    nen:'French',
   age:'四十',   apy:'sìshí',    acc:'bow',   col:'#4a4f63'},
  {id:'yu',   nm:'小雨',  py:'Xiǎoyǔ',    f:true,
   job:'护士', jpy:'hùshi',    jen:'nurse',
   nat:'日本人', npy:'Rìběn rén',    nen:'Japanese',
   age:'二十四', apy:'èrshísì',  acc:'nurse', col:'#f2d7d7'},
  {id:'dong', nm:'小东',  py:'Xiǎodōng',  f:false,
   job:'秘书', jpy:'mìshū',    jen:'secretary',
   nat:'德国人', npy:'Déguó rén',    nen:'German',
   age:'二十二', apy:'èrshí’èr', acc:'head', col:'#e3c98f'},
  {id:'hai',  nm:'大海',  py:'Dàhǎi',     f:false,
   job:'商人', jpy:'shāngrén', jen:'businessman',
   nat:'美国人', npy:'Měiguó rén',   nen:'American',
   age:'四十五', apy:'sìshíwǔ',  acc:'apron', col:'#c98f5e'},
  {id:'hong', nm:'小红',  py:'Xiǎohóng',  f:true,
   job:'经理', jpy:'jīnglǐ',   jen:'manager',
   nat:'中国人', npy:'Zhōngguó rén', nen:'Chinese',
   age:'三十三', apy:'sānshísān', acc:'tie',  col:'#b8483c'}
];
const TF = [
  {who:'meiz', claim:'律师', ok:false, opts:['医生','老师','商人']},
  {who:'wang', claim:'司机', ok:true},
  {who:'yu',   claim:'医生', ok:false, opts:['护士','秘书','经理']},
  {who:'wen',  claim:'老师', ok:true},
  {who:'hai',  claim:'牙医', ok:false, opts:['商人','律师','司机']},
  {who:'hong', claim:'经理', ok:true},
  {who:'dong', claim:'商人', ok:false, opts:['秘书','医生','老师']},
  {who:'dali', claim:'牙医', ok:true}
];
const YE = [
  {a:'meiz', b:'wang', kind:'shi', frag:'中国人', right:'也是',
   why:'Both of them are Chinese, so the second sentence agrees — 也是 means "also is".'},
  {a:'meiz', b:'dali', kind:'shi', frag:'医生', right:'不是',
   why:'大力 is a dentist, not a doctor. Nothing matches here, so no 也 — just 不是.'},
  {a:'yu',   b:'meiz', kind:'qu',  frag:'医院', right:'也去',
   why:'The nurse and the doctor both head to the hospital, so 也去 — "also goes".'},
  {a:'wen',  b:'hong', kind:'shi', frag:'英国人', right:'不是',
   why:'小红 is Chinese, so she is not British. 也 only works when the two things match.'},
  {a:'shan', b:'dong', kind:'shi', frag:'法国人', right:'不是',
   why:'小东 is German, 大山 is French. Different countries — no 也.'},
  {a:'hai',  b:'hong', kind:'work',frag:'工作', right:'也',
   why:'Both of them work. 工作 is already a verb, so 也 goes straight in front of it.'}
];
const LISTEN = [
  {who:'yu',   say:'她是护士。她是日本人。'},
  {who:'shan', say:'他是律师。他四十岁。'},
  {who:'hong', say:'她是经理。她是中国人。'},
  {who:'dong', say:'他是秘书。他是德国人。'},
  {who:'dali', say:'他不是医生，他是牙医。'},
  {who:'hai',  say:'他是商人。他去商店。'}
];
const SPEAK = ['meiz','wang','wen','shan'];
if(typeof module!=="undefined")module.exports={CAST,TF,YE,LISTEN,SPEAK};
