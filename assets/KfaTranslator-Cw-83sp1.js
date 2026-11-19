var S=Object.defineProperty;var I=(o,n,e)=>n in o?S(o,n,{enumerable:!0,configurable:!0,writable:!0,value:e}):o[n]=e;var f=(o,n,e)=>I(o,typeof n!="symbol"?n+"":n,e);import{J as m,F as a,e as h,B as d,L as E,c as O,P as b,a as z}from"./index-iSa0Nmfo.js";import{M as A,T as W}from"./TextField-BOC-cViA.js";import{M as R,C as D}from"./MenuItem-DnSV4GwQ.js";import"./Grow-B7aLh8Sk.js";function j(o){const n=[];let e=0;for(;e<o.length;){const t=o[e];if(/\s/.test(t)){let r="";for(;e<o.length&&/\s/.test(o[e]);)r+=o[e],e++;n.push({type:"whitespace",value:r})}else if(/[^\w\s]/.test(t)){let r="";for(;e<o.length&&/[^\w\s]/.test(o[e]);)r+=o[e],e++;n.push({type:"punctuation",value:r})}else{let r="";for(;e<o.length&&(/\w/.test(o[e])||o[e]==="'"&&e+1<o.length&&/\w/.test(o[e+1]));)r+=o[e],e++;n.push({type:"word",value:r.toLowerCase(),originalCase:r})}}return n}function U(o,n){const e=[],t=Array.from(n.keys()).sort((s,i)=>i.length-s.length);let r=0;for(;r<o.length;){const s=o[r];if(/[\s\p{P}]/u.test(s)){e.push(s),r++;continue}let i=!1;for(const c of t)if(o.substring(r,r+c.length)===c){e.push(c),r+=c.length,i=!0;break}i||(e.push(s),r++)}return e}const T=new Map([["əʊ","uU"],["ow","uU"],["aɪ","uy"],["aj","uy"],["eɪ","ay"],["ej","ay"],["aʊ","aO"],["aw","aO"],["uʌ","Uu"],["ɪə","ir"],["eə","er"],["ʊə","ur"],["ɔɪ","oy"],["iː","y"],["biˈ","by"],["iˈ","y"],["siˈɪ","syy"],["siˈ","sy"],["ɜː","ur"],["uː","U"],["uˈ","U"],["ɑː","o"],["ɔː","o"],["wɚ","wur"],["ɚ","ur"],["ə","u"],["ɪŋk","ynk"],["ɪnk","ynk"],["ɪŋ","yng"],["iŋ","yng"],["ɪ","i"],["i","y"],["sɪˈ","sy"],["æ","a"],["e","e"],["ɛ","e"],["ʌ","u"],["ɒ","o"],["ɔ","o"],["ɑ","o"],["ʊ","O"],["dʒ","j"],["ʤ","j"],["tʃ","c"],["ʧ","c"],["ʃ","S"],["ʒ","Z"],["θ","T"],["ð","T"],["ŋ","ng"],["n","n"],["r","r"],["ɹ","r"],["t","t"],["s","s"],["d","d"],["l","l"],["k","k"],["m","m"],["z","z"],["p","p"],["v","v"],["w","w"],["b","b"],["f","f"],["h","h"],["j","Y"],["g","g"],["ɡ","g"]]);function P(o){const n=U(o,T),e=[],t=[];for(const i of n){if(/[\s\p{P}]/u.test(i)){e.push(i);continue}if(i.startsWith("[")&&i.endsWith("]")){e.push(i);continue}const c=T.get(i);if(c)e.push(c);else{if(i.match(/[ˈˌ]/))continue;i.match(/[ɪɨʉɯɘəɵɞɤɣɢʎʟɱɳɲɴɽɾɿʀʁʂʃʈʉʊʋʌʍʎʏʐʑʒʔʕʖʗʘʙʚʛʜʝʞʟʠʡʢʣʤʥʦʧʨʩʪʫʬʭʮʯ]/)&&t.push(i),e.push(i)}}const r=e.join(""),s=t.length>0;return{success:!s,result:r,error:s?`Unknown IPA symbols found: ${[...new Set(t)].join(", ")}`:void 0}}const k=new Map;for(const[o,n]of T.entries())k.has(n)||k.set(n,o);function C(o){const n=U(o,k),e=[];for(const r of n){if(/[\s\p{P}]/u.test(r)){e.push(r);continue}const s=k.get(r);s?e.push(s):e.push(r)}return{success:!0,result:e.join("")}}class L{constructor(){f(this,"dictionary",{});f(this,"ipaToEnglish",new Map);f(this,"isLoaded",!1);f(this,"loadPromise",null)}async loadDictionary(){if(!this.isLoaded)return this.loadPromise?this.loadPromise:(this.loadPromise=this.doLoad(),this.loadPromise)}async doLoad(){var n;try{const e=await fetch("/data/ipadict.json");if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);const t=await e.json();this.dictionary=t;for(const[r,s]of Object.entries(this.dictionary))for(const i of s)this.ipaToEnglish.has(i.ipa)||this.ipaToEnglish.set(i.ipa,[]),(n=this.ipaToEnglish.get(i.ipa))==null||n.push(r);this.isLoaded=!0}catch(e){throw console.error("Failed to load dictionary:",e),e}}translateEnglishToIpa(n){const e=n.toLowerCase().trim(),t=this.dictionary[e];return t&&t.length>0?{success:!0,result:t.reduce((s,i)=>i.priority<s.priority?i:s).ipa}:{success:!1,result:"",error:`Word "${n}" not found in dictionary`}}translateIpaToEnglish(n){const e=this.ipaToEnglish.get(n.trim());return e&&e.length>0?{success:!0,result:e[0]}:{success:!1,result:"",error:`IPA "${n}" not found in dictionary`}}translateEnglishPhraseToIpa(n){const e=j(n),t=[];return{success:!0,result:e.map(i=>{if(i.type==="word"){const c=this.translateEnglishToIpa(i.value);return c.success?{...i,value:c.result}:(t.push(`Word "${i.originalCase||i.value}" not found in dictionary`),{...i,value:`[${i.originalCase||i.value}]`})}return i}).map(i=>i.value).join(""),error:t.length>0?t.join("; "):void 0}}translateIpaPhraseToEnglish(n){const e=n.split(/\s+/),t=[],r=[];for(const s of e){if(s.startsWith("[")&&s.endsWith("]")){t.push(s);continue}const i=this.translateIpaToEnglish(s);i.success?t.push(i.result):(r.push(i.error||`Unknown IPA: ${s}`),t.push(`[${s}]`))}return{success:!0,result:t.join(" "),error:r.length>0?r.join("; "):void 0}}findHomophones(n){const e=[];for(const[t,r]of Object.entries(this.dictionary))for(const s of r)if(s.ipa===n){e.push(t);break}return e.sort()}matchCase(n,e){return e===e.toUpperCase()?n.toUpperCase():e[0]===e[0].toUpperCase()&&e.slice(1)===e.slice(1).toLowerCase()?n[0].toUpperCase()+n.slice(1).toLowerCase():n}translateEnglishPhraseToEnhanced(n){const e=j(n),t=[],r=[];for(const s of e)if(s.type==="word"){const i=this.dictionary[s.value];if(i&&i.length>0){const c=[...i].sort((u,l)=>u.priority-l.priority),g=[];for(const u of c){const l=P(u.ipa),p=this.findHomophones(u.ipa);g.push({english:s.originalCase||s.value,ipa:u.ipa,kfa:l.success?l.result:`[${u.ipa}]`,priority:u.priority,region:u.region});for(const y of p)if(y.toLowerCase()!==s.value.toLowerCase()){const v=this.matchCase(y,s.originalCase||s.value);g.push({english:v,ipa:u.ipa,kfa:l.success?l.result:`[${u.ipa}]`,priority:u.priority+100,region:u.region})}}const w={originalWord:s.originalCase||s.value,pronunciations:g,selectedPronunciation:0,hasMultiplePronunciations:g.length>1};t.push(w)}else{r.push(`Word "${s.originalCase||s.value}" not found in dictionary`);const c={originalWord:s.originalCase||s.value,pronunciations:[{english:`[${s.originalCase||s.value}]`,ipa:`[${s.originalCase||s.value}]`,kfa:`[${s.originalCase||s.value}]`,priority:1,region:""}],selectedPronunciation:0,hasMultiplePronunciations:!1};t.push(c)}}else{const i={originalWord:s.value,pronunciations:[{english:s.value,ipa:s.value,kfa:s.value,priority:1,region:""}],selectedPronunciation:0,hasMultiplePronunciations:!1};t.push(i)}return{success:!0,words:t,errors:r.length>0?r:void 0}}}class M{constructor(){f(this,"dictionary");f(this,"initialized",!1);this.dictionary=new L}async initialize(){if(!this.initialized)try{await this.dictionary.loadDictionary(),this.initialized=!0}catch(n){throw console.error("Failed to initialize translation service:",n),n}}async translateEnglishToIpa(n){return this.initialized||await this.initialize(),this.dictionary.translateEnglishPhraseToIpa(n)}async translateEnglishToKfa(n){this.initialized||await this.initialize();const e=this.dictionary.translateEnglishPhraseToIpa(n);if(!e.success)return e;const t=P(e.result);return{success:e.success&&t.success,result:t.result,error:t.error||e.error}}async translateIpaToEnglish(n){return this.initialized||await this.initialize(),this.dictionary.translateIpaPhraseToEnglish(n)}async translateIpaToKfa(n){return P(n)}async translateKfaToIpa(n){return C(n)}async translateKfaToEnglish(n){this.initialized||await this.initialize();const e=C(n);if(!e.success)return e;const t=this.dictionary.translateIpaPhraseToEnglish(e.result);return{success:e.success&&t.success,result:t.result,error:t.error||e.error}}async translateEnglishToEnhanced(n){return this.initialized||await this.initialize(),this.dictionary.translateEnglishPhraseToEnhanced(n)}async translateText(n,e){const t={english:{success:!1,result:"",error:"Not translated"},ipa:{success:!1,result:"",error:"Not translated"},kfa:{success:!1,result:"",error:"Not translated"}};switch(t[e]={success:!0,result:n},e){case"english":t.ipa=await this.translateEnglishToIpa(n),t.kfa=await this.translateEnglishToKfa(n);break;case"ipa":t.english=await this.translateIpaToEnglish(n),t.kfa=await this.translateIpaToKfa(n);break;case"kfa":t.ipa=await this.translateKfaToIpa(n),t.english=await this.translateKfaToEnglish(n);break}return t}}const Y=({word:o,format:n,onPronunciationChange:e})=>{const[t,r]=m.useState(null),s=!!t,i=l=>{o.hasMultiplePronunciations&&(l.stopPropagation(),r(l.currentTarget))},c=()=>{r(null)},g=l=>p=>{p.stopPropagation(),e(l),c()},u=o.pronunciations[o.selectedPronunciation][n];return a.jsxs(a.Fragment,{children:[a.jsx(h,{component:"span",sx:{textDecoration:o.hasMultiplePronunciations?"underline":"none",cursor:o.hasMultiplePronunciations?"pointer":"default",textDecorationStyle:o.hasMultiplePronunciations?"solid":"none",textDecorationThickness:o.hasMultiplePronunciations?"2px":"auto",textUnderlineOffset:o.hasMultiplePronunciations?"4px":"auto","&:hover":o.hasMultiplePronunciations?{backgroundColor:"action.hover",borderRadius:"4px",padding:"2px 4px",margin:"-2px -4px"}:{}},onClick:i,title:o.hasMultiplePronunciations?"Click to see other pronunciations":void 0,children:u}),o.hasMultiplePronunciations&&a.jsx(A,{anchorEl:t,open:s,onClose:c,PaperProps:{sx:{maxWidth:"300px"}},children:o.pronunciations.map((l,p)=>a.jsxs(R,{onClick:g(p),selected:p===o.selectedPronunciation,sx:{flexDirection:"column",alignItems:"stretch"},children:[a.jsxs(d,{sx:{display:"flex",justifyContent:"space-between",width:"100%",mb:1},children:[a.jsx(h,{variant:"body2",sx:{fontWeight:"bold"},children:l[n]}),a.jsx(D,{label:`Priority ${l.priority}`,size:"small",color:l.priority===1?"primary":"default"})]}),a.jsxs(d,{sx:{display:"flex",gap:1,fontSize:"0.875rem",flexWrap:"wrap"},children:[n!=="english"&&a.jsxs(h,{variant:"body2",sx:{fontSize:"0.875rem"},children:["English: ",a.jsx(d,{component:"span",sx:{fontWeight:"bold"},children:l.english})]}),n!=="ipa"&&a.jsxs(h,{variant:"body2",sx:{fontSize:"0.875rem"},children:["IPA: ",a.jsx(d,{component:"span",sx:{fontWeight:"bold"},children:l.ipa})]}),n!=="kfa"&&a.jsxs(h,{variant:"body2",sx:{fontSize:"0.875rem"},children:["kfa: ",a.jsx(d,{component:"span",sx:{fontWeight:"bold"},children:l.kfa})]})]}),l.region&&a.jsxs(h,{variant:"body2",color:"text.secondary",sx:{fontSize:"0.8rem"},children:["Region: ",l.region]})]},p))})]})},x=({result:o,format:n,title:e,onWordPronunciationChange:t})=>{const r=s=>i=>{t(s,i)};return a.jsxs(d,{children:[a.jsx(h,{variant:"h6",gutterBottom:!0,children:e}),a.jsx(d,{sx:{minHeight:"120px",padding:2,border:"1px solid",borderColor:"divider",borderRadius:1,backgroundColor:"background.paper",fontSize:"1rem",lineHeight:1.6,fontFamily:n==="ipa"?"monospace":"inherit"},children:o.words.map((s,i)=>a.jsx(Y,{word:s,format:n,onPronunciationChange:r(i)},i))}),o.errors&&o.errors.length>0&&a.jsxs(h,{variant:"caption",color:"warning.main",sx:{mt:1,display:"block"},children:["Warnings: ",o.errors.join("; ")]})]})},q=()=>{const[o,n]=m.useState(""),[e,t]=m.useState(null),[r,s]=m.useState(!1),i=m.useRef(new M).current,c=async()=>{if(o.trim()){s(!0);try{const u=await i.translateEnglishToEnhanced(o);t(u)}catch(u){console.error("Translation error:",u),t({success:!1,words:[],errors:["Translation failed"]})}finally{s(!1)}}},g=(u,l)=>{if(!e)return;const p={...e,words:e.words.map((y,v)=>v===u?{...y,selectedPronunciation:l}:y)};t(p)};return a.jsxs(d,{sx:{display:"flex",flexDirection:{xs:"column",md:"row"},gap:3,alignItems:"flex-start"},children:[a.jsxs(d,{sx:{flex:1,minWidth:0},children:[a.jsx(h,{variant:"h4",component:"h1",gutterBottom:!0,align:"center",sx:{textTransform:"none"},children:"kfa Translator"}),a.jsxs(h,{variant:"body2",color:"text.secondary",align:"center",sx:{mb:3},children:["QWERTY Phonetic Alphabet —"," ",a.jsx(E,{href:"https://github.com/jlaustill/kfa",target:"_blank",rel:"noopener noreferrer",children:"GitHub"})," ","—"," ",a.jsx(E,{component:O,to:"/kfa/examples/raven",children:"Tu rayvun"})]}),a.jsxs(d,{sx:{display:"flex",flexDirection:"column",gap:3},children:[a.jsxs(b,{sx:{p:2},variant:"outlined",children:[e?a.jsx(d,{onClick:u=>{var l,p;(u.target===u.currentTarget||!((p=(l=u.target)==null?void 0:l.closest)!=null&&p.call(l,'[role="button"]')))&&t(null)},sx:{cursor:"text"},children:a.jsx(x,{result:e,format:"english",title:"English (click underlined words to change pronunciation, click text to edit)",onWordPronunciationChange:g})}):a.jsxs(a.Fragment,{children:[a.jsx(h,{variant:"h6",gutterBottom:!0,children:"English"}),a.jsx(W,{fullWidth:!0,multiline:!0,rows:4,value:o,onChange:u=>n(u.target.value),placeholder:"Enter English text here...",sx:{mb:2}})]}),a.jsx(z,{variant:"contained",onClick:c,fullWidth:!0,disabled:r||!o.trim(),children:r?"Translating...":"Translate to IPA & kfa"})]}),a.jsx(b,{sx:{p:2},variant:"outlined",children:e?a.jsx(x,{result:e,format:"ipa",title:"IPA (International Phonetic Alphabet)",onWordPronunciationChange:g}):a.jsxs(a.Fragment,{children:[a.jsx(h,{variant:"h6",gutterBottom:!0,children:"IPA (International Phonetic Alphabet)"}),a.jsx(d,{sx:{minHeight:"120px",padding:2,border:"1px solid",borderColor:"divider",borderRadius:1,backgroundColor:"grey.50",display:"flex",alignItems:"center",justifyContent:"center",color:"text.secondary"},children:a.jsx(h,{variant:"body2",children:'Enter English text above and click "Translate to IPA & kfa" to see IPA transcription'})})]})}),a.jsx(b,{sx:{p:2},variant:"outlined",children:e?a.jsx(x,{result:e,format:"kfa",title:"kfa (QWERTY Phonetic Alphabet)",onWordPronunciationChange:g}):a.jsxs(a.Fragment,{children:[a.jsx(h,{variant:"h6",gutterBottom:!0,children:"kfa (QWERTY Phonetic Alphabet)"}),a.jsx(d,{sx:{minHeight:"120px",padding:2,border:"1px solid",borderColor:"divider",borderRadius:1,backgroundColor:"grey.50",display:"flex",alignItems:"center",justifyContent:"center",color:"text.secondary"},children:a.jsx(h,{variant:"body2",children:'Enter English text above and click "Translate to IPA & kfa" to see kfa phonetic spelling'})})]})})]})]}),a.jsx(d,{sx:{flex:1,minWidth:0},children:a.jsxs(b,{sx:{p:2,position:"sticky",top:16},variant:"outlined",children:[a.jsx(h,{variant:"h5",gutterBottom:!0,children:"Documentation"}),a.jsx(d,{sx:{whiteSpace:"pre-line",fontFamily:"monospace",fontSize:"0.85rem",lineHeight:1.4,maxHeight:"calc(100vh - 200px)",overflow:"auto",pr:1},children:`# kfa - QWERTY Phonetic Alphabet

**kfa** is a phonetic alphabet system that uses only the characters available on a standard QWERTY keyboard (uppercase and lowercase letters) to represent the 44 distinct sounds of English. The goal is to create an intuitive mapping where the most frequently used English sounds are represented by the letters that English speakers already associate with those sounds, making it easy to read and learn.

Unlike traditional phonetic alphabets that use special symbols, kfa constrains itself to the 52 letters (A-Z, a-z) available on any standard keyboard, making it practical for digital communication and typing.

## Design Philosophy

### Balancing Phonetic Precision with Practical Usability

**kfa** is designed to achieve two primary goals:
1. **Phonetic enough** that spelling bees would make zero sense (no arbitrary spelling rules)
2. **Simple enough** that users don't need to overthink pronunciation decisions

This balance is achieved through deliberate design choices that prioritize **practical phonetic representation** over academic precision.

### The Schwa Decision: Simplicity Over Distinction

One key example is our treatment of the schwa sound (ə) and the "strut" vowel (ʌ). In traditional IPA, these are distinct symbols representing subtly different sounds:

- **banana**: /bənɑnə/ vs /bʌnɑnə/
- **cup**: /kəp/ vs /kʌp/
- **love**: /ləv/ vs /lʌv/

However, for most English speakers, the acoustic difference between /ə/ and /ʌ/ is often imperceptible or contextually variable. Different speakers and even different TTS voices (like Amazon Polly's Salli vs Joanna) may pronounce these sounds differently, but the distinction requires careful listening to detect.

**kfa's approach**: Always use **u** (representing schwa) for both sounds:
- **banana**: bunanu
- **cup**: kup
- **love**: luv

**Benefits of this simplification**:
- **Eliminates guesswork**: No need to decide between nearly identical sounds
- **Maintains phonetic accuracy**: The sound is captured adequately
- **Natural variation**: Readers will naturally produce contextual variations
- **Consistent system**: One symbol, clear mapping

### Regional Accent Considerations

kfa is designed around **Western American English** pronunciation patterns, which reflect how millions of Americans actually speak. A key example is the **low back merger**, where sounds like /ɑː/ (car), /ɔː/ (caught), and /ɒ/ (hot) are pronounced identically as a single vowel sound.

**kfa approach**: All three sounds use **o**:
- **car, father, palm**: kor, foTur, polm
- **saw, caught, bought**: so, kot, bot
- **hot, dog, wash**: hot, dog, woS

### Phonemic vs Phonetic Distinction

kfa prioritizes **meaning-making sound differences** over academic phonetic precision. The guiding principle: if changing a sound creates a different word, it needs a different symbol. If it's just an accent variation of the same word, one symbol works.

**Examples:**
- **bat vs bot**: Different words → need different symbols (a vs o)
- **car, saw, hot**: Same vowel sound in Western American → all use "o"
- **buk vs bOk**: Different words (buck vs book) → need different symbols (u vs O)

## 44 English Sounds with IPA and kfa Mapping

### Vowels (20 sounds)

| IPA | kfa | Sound Description | Frequency | Example 1 | Example 2 | Example 3 |
|-----|-----|-------------------|-----------|-----------|-----------|-----------|
| ə | u | Schwa | 11.49% | about/ubaOt | sofa/suUfu | banana/bunanu |
| ɪ | i | Short I | 6.32% | bit/bit | ship/Sip | gym/jim |
| iː | y | Long E | 3.61% | see/sy | tree/try | key/ky |
| ɜː | ur | UR sound | 2.86% | bird/burd | word/wurd | nurse/nurs |
| æ | a | Short A | 2.10% | cat/kat | bat/bat | hand/hand |
| uː | U | Long U | 1.93% | moon/mUn | blue/blU | food/fUd |
| e | e | Short E | 1.79% | bed/bed | red/red | bread/bred |
| ʌ | u | Schwa-like | 1.74% | cup/kup | love/luv | blood/blud |
| eɪ | ay | Long A | 1.50% | day/day | make/mayk | rain/rayn |
| aɪ | uy | Long I | 1.50% | my/muy | time/tuym | fly/fluy |
| ɑː | o | Long A | 1.45% | car/kor | father/foTur | palm/polm |
| ɔː | o | Long O | 1.25% | saw/so | caught/kot | bought/bot |
| əʊ | uU | Long O | 1.25% | go/guU | home/huUm | boat/buUt |
| ɒ | o | Short O | 1.18% | hot/hot | dog/dog | wash/woS |
| aʊ | aO | OW sound | 0.50% | now/naO | house/haOs | cloud/klaOd |
| ʊ | O | Short U | 0.43% | book/bOk | good/gOd | put/pOt |
| ɪə | ir | EER sound | 0.30% | here/hir | beer/bir | deer/dir |
| eə | er | AIR sound | 0.25% | hair/her | care/ker | bear/ber |
| ʊə | ur | UUR sound | 0.15% | sure/Sur | cure/kYur | pure/pYur |
| ɔɪ | oy | OY sound | 0.10% | boy/boy | coin/koyn | voice/voys |

### Consonants (24 sounds)

| IPA | kfa | Sound Description | Frequency | Example 1 | Example 2 | Example 3 |
|-----|-----|-------------------|-----------|-----------|-----------|-----------|
| n | n | N sound | 7.11% | no/nuU | dinner/dinur | sun/sun |
| r | r | R sound | 6.94% | red/red | sorry/sory | car/kor |
| t | t | T sound | 6.91% | ten/ten | better/betur | cat/kat |
| s | s | S sound | 4.75% | sun/sun | lesson/lesun | bus/bus |
| d | d | D sound | 4.21% | dog/dog | ladder/ladur | red/red |
| l | l | L sound | 3.96% | love/luv | yellow/YeluU | call/kol |
| k | k | K sound | 3.18% | key/ky | school/skUl | book/bOk |
| ð | T | TH (this) | 2.95% | this/Tis | mother/muTur | breathe/bryT |
| m | m | M sound | 2.76% | man/man | summer/sumur | time/tuym |
| z | z | Z sound | 2.76% | zoo/zU | music/mYUzik | eyes/uyz |
| p | p | P sound | 2.15% | pen/pen | happy/hapy | cup/kup |
| v | v | V sound | 2.01% | very/very | river/rivur | love/luv |
| w | w | W sound | 1.95% | water/wotur | away/uway | quick/kwik |
| b | b | B sound | 1.80% | book/bOk | table/taybul | job/job |
| f | f | F sound | 1.71% | fish/fiS | coffee/kofy | leaf/lyf |
| h | h | H sound | 1.40% | house/haOs | perhaps/purhaps | hello/heluU |
| ŋ | ng | NG sound | 0.99% | sing/syng | thinking/Tyngkyng | long/long |
| ʃ | S | SH sound | 0.97% | ship/Sip | washing/woSyng | fish/fiS |
| j | Y | Y sound | 0.81% | yes/Yes | music/mYUzik | few/fYU |
| g | g | G sound | 0.80% | go/guU | bigger/bigur | bag/bag |
| dʒ | j | J sound | 0.59% | jump/jump | magic/majik | bridge/brij |
| tʃ | c | CH sound | 0.56% | chair/cer | teacher/tycer | watch/woc |
| θ | T | TH (thin) | 0.41% | think/Tyngk | nothing/nuTyng | path/paT |
| ʒ | Z | ZH sound | 0.07% | pleasure/pleZur | vision/viZun | measure/meZur |

## Complete System Achievement

All 44 English phonemes successfully mapped using only QWERTY keyboard letters!

**Core vowels (8):** u, i, y, a, U, e, o, O
**Diphthong combinations (10):** ay, uy, uU, aO, ir, er, ur, oy
**All consonants (24):** Complete mapping using intuitive letter assignments

## Demonstration: The Gettysburg Address

**English:**
"Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal."

**kfa:**
"for skor and sevun Yirz uguU aOr foTurz brot forT on Tis kontunint, u nU naysun, kunsyvd in libirty, and dedukayted tU Tu propuZiSun Tat ol men or kryayted ykwul."

## Demonstration: U vs O — Long and Short OO

English uses "oo" for two distinct sounds. kfa disambiguates them clearly: **U** = long oo (/uː/), **O** = short oo (/ʊ/).

**English:**
"Take a look at the good book for a cool recipe for moon pie, it's one of my favorite foods."

**kfa:**
"tayk u lOk at Tu gOd bOk for u kUl resupy for mUn puy, its wun uv muy fayvrit fUdz."

Notice: **lOk, gOd, bOk** (short oo) vs **kUl, mUn, fUdz** (long oo) — readable at a glance.

## Demonstration: Eliminating English Spelling Confusion

**English:**
"Which witch is which? They're at their house over there! Your dog ate you're dinner, but you're not sure whose dog it was or who's coming to dinner."

**kfa:**
"wic wic iz wic? Ter at Ter haOs uUvur Ter! YOr dog ayt YOr dinur, but YOr not Sur hUz dog it waz or hUz kumyng tU dinur."

This example showcases one of kfa's most powerful features: eliminating the confusion caused by English's inconsistent spelling. Notice how:
- **which/witch** = both 'wic' (identical pronunciation, identical spelling)
- **they're/their/there** = all 'Ter' (same sound, same spelling)
- **your/you're** = both 'YOr' (phonetically identical)
- **whose/who's** = both 'hUz' (eliminates arbitrary apostrophe confusion)

The kfa system represents how words actually sound, not their historical spelling accidents, making it invaluable for language learners and eliminating common English spelling confusion.`})]})})]})};export{q as default};
