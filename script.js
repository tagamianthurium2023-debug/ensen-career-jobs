
(()=>{
'use strict';

const CFG=window.ENSEN_CONFIG||{};
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

const STATIONS=[
'中野','落合','高田馬場','早稲田','神楽坂','飯田橋','九段下',
'竹橋','大手町','日本橋','茅場町','門前仲町','木場','東陽町',
'南砂町','西葛西','葛西','浦安','南行徳','行徳','妙典',
'原木中山','西船橋','東海神','飯山満','北習志野',
'船橋日大前','八千代緑が丘','八千代中央','村上','東葉勝田台'
];

const OCC={
'事務・オフィスワーク':['一般事務','営業事務','経理','人事・採用','総務','受付'],
'営業':['法人営業','個人営業','ルート営業','営業企画'],
'販売・サービス':['販売スタッフ','接客','カスタマーサポート','飲食・サービス'],
'IT・Web':['エンジニア','Webデザイナー','ITサポート'],
'医療・福祉':['医療事務','介護','保育'],
'その他':['軽作業','物流','製造','企画・マーケティング']
};

const GROUPS={
'休日・勤務日':['完全週休2日制','週休2日制','土日祝休み','平日休み','シフト制','年間休日120日以上','週3日以内OK','週4日勤務OK'],
'勤務日数':['週1〜2日','週3〜4日','週5日'],
'働き方':['残業なし・少なめ','フレックス','時短','扶養内','副業/Wワーク','リモート','フルリモート','転勤なし'],
'給与・待遇':['賞与あり','昇給あり','交通費支給'],
'応募資格・経験':['未経験歓迎','第二新卒歓迎','学歴不問','ブランクOK','資格不問','経験者優遇','職種未経験歓迎','業界未経験歓迎'],
'職場環境':['服装自由','髪型・髪色自由','ネイルOK','ピアスOK','オフィスカジュアル','女性活躍中','研修制度あり','駅チカ'],
'福利厚生・待遇':['社会保険完備','住宅手当あり','資格取得支援','産休・育休制度あり','退職金制度あり','社員登用あり','インセンティブあり','社割・社員特典あり']
};

const state={
jobs:[],
selectedStations:new Set(),
page:1,
activeJob:null,
onlyFavorites:false
};

let favorites;
try{
favorites=new Set(JSON.parse(localStorage.getItem('ensen_favorites')||'[]'));
}catch{
favorites=new Set();
}

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
'&':'&amp;',
'<':'&lt;',
'>':'&gt;',
'"':'&quot;',
"'":'&#39;'
}[c]));

const val=id=>$(id).value;

const notify=s=>{
const t=$('#toast');
t.textContent=s;
t.classList.add('show');
setTimeout(()=>t.classList.remove('show'),3000);
};

const stationsOf=j=>{
let a=j.stations||j['駅情報']||[];
if(typeof a==='string'){
try{
a=JSON.parse(a);
}catch{
a=a.split(/[,、]/).map(s=>({name:s.trim(),walk:null}));
}
}
if(!Array.isArray(a))a=[];
if(!a.length&&(j.station||j['最寄り駅'])){
a=[{name:j.station||j['最寄り駅'],walk:j.walk??j['徒歩分数']}];
}
return a.map(x=>typeof x==='string'
?{name:x,walk:null}
:{
name:x.name||x.station||x['駅名'],
walk:Number(x.walk??x.minutes??x['徒歩分数'])||null
}).filter(x=>x.name);
};

// 写真を最大5枚読み込む
const imagesOf=r=>{
const raw=Array.isArray(r.photos)?r.photos:[];
const candidates=[
r.photo||r['画像URL']||r.imageUrl||raw[0],
r.photo2||r.imageUrl2||r['画像URL2']||raw[1],
r.photo3||r.imageUrl3||r['画像URL3']||raw[2],
r.photo4||r.imageUrl4||r['画像URL4']||raw[3],
r.photo5||r.imageUrl5||r['画像URL5']||raw[4]
];
return [...new Set(
candidates
.map(x=>String(x||'').trim())
.filter(x=>/^https:\/\//i.test(x))
)].slice(0,5);
};

// 写真がない場合の職種別画像
const categoryImage=occupation=>{
const themes={
'事務・オフィスワーク':['#dcefeb','#2c7979','OFFICE'],
'営業':['#e1eafa','#466b9e','SALES'],
'販売・サービス':['#f6e8df','#a06c52','SERVICE'],
'IT・Web':['#e2e4f4','#6268a1','IT / WEB'],
'企画・マーケティング':['#f5e7ef','#9a6385','MARKETING'],
'クリエイティブ':['#eee6f8','#8061a5','CREATIVE'],
'物流・軽作業':['#f2ebdb','#927c47','LOGISTICS'],
'医療・福祉':['#e0f0e8','#56816c','CARE'],
'飲食・フード':['#f8eadb','#aa7548','FOOD'],
'建築・不動産':['#e5ebee','#637d89','PROPERTY']
};
const [bg,fg,label]=themes[occupation]||['#e1eeeb','#477d80','ENSEN CAREER'];
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675"><rect width="1200" height="675" fill="${bg}"/><circle cx="1000" cy="60" r="290" fill="${fg}" opacity=".08"/><circle cx="180" cy="670" r="340" fill="${fg}" opacity=".08"/><path d="M120 490H1080" stroke="${fg}" stroke-width="2" opacity=".25"/><text x="120" y="320" font-family="Arial,sans-serif" font-size="76" font-weight="bold" fill="${fg}">${label}</text><text x="124" y="383" font-family="Arial,sans-serif" font-size="27" fill="${fg}">ENSEN CAREER</text></svg>`;
return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
};

const mainImage=j=>j.photos[0]||categoryImage(j.occupation);

const photoTag=(url,alt)=>`<img src="${esc(url)}" alt="${esc(alt)}" loading="lazy" onerror="this.onerror=null;this.src='${esc(categoryImage('その他'))}'">`;

const normalize=r=>({
id:String(r.id||r['求人ID']||'').trim(),
title:r.title||r['求人タイトル']||'',
industry:r.industry||r['業界']||'',
occupation:r.occupation||r['職種大分類']||'',
subOccupation:r.subOccupation||r['職種小分類']||'',
employment:r.employment||r['雇用形態']||'',
salary:r.salary||r['給与表示']||'',
payType:r.payType||r['給与形態']||'',
payMin:Number(r.payMin??r['給与下限']??0),
payMax:Number(r.payMax??r['給与上限']??0),
stations:stationsOf(r),
tags:Array.isArray(r.tags)?r.tags:String(r.tags||r['検索タグ']||'').split(/[,、|]/).map(s=>s.trim()).filter(Boolean),
description:r.description||r['仕事内容']||'',
qualifications:r.qualifications||r['応募資格']||'',
hours:r.hours||r['勤務時間']||'',
holidays:r.holidays||r['休日']||'',
benefits:r.benefits||r['福利厚生']||'',
photo:r.photo||r['画像URL']||'',
photos:imagesOf(r),
publishedAt:r.publishedAt||r['掲載開始日']||'',
updatedAt:r.updatedAt||r['最終更新日']||'',
diagnosisTags:Array.isArray(r.diagnosisTags)?r.diagnosisTags:String(r.diagnosisTags||r['診断タグ']||'').split(/[,、|]/).map(s=>s.trim()).filter(Boolean),
status:r.status||r['公開状態']||'公開中',
startTime:r.startTime||r['勤務開始時刻']||'',
endTime:r.endTime||r['勤務終了時刻']||''
});

function initFilters(){
const o=$('#occupation');
Object.entries(OCC).forEach(([g,subs])=>{
const opt=document.createElement('option');
opt.value=g;
opt.textContent=g;
o.append(opt);
subs.forEach(s=>{
const p=document.createElement('option');
p.value=s;
p.textContent='　'+s;
o.append(p);
});
});
$('#tagFilters').innerHTML=Object.entries(GROUPS).map(([g,arr])=>`<div class="filter-group"><h3>${esc(g)}</h3><div class="check-grid">${arr.map(t=>`<label><input type="checkbox" class="tag-filter" value="${esc(t)}">${esc(t)}</label>`).join('')}</div></div>`).join('');
renderStations();
}

function renderStations(){
const q=$('#stationSearch').value.trim();
$('#stationOptions').innerHTML=[
['東西線',STATIONS.slice(0,23)],
['東葉高速線',STATIONS.slice(23)]
].map(([g,ss])=>{
const a=ss.filter(s=>s.includes(q));
return a.length?`<div class="station-group"><h3>${g}</h3><div class="station-list">${a.map(s=>`<label><input type="checkbox" data-station="${s}" ${state.selectedStations.has(s)?'checked':''}> ${s}</label>`).join('')}</div></div>`:'';
}).join('')||'<p>該当する駅はありません。</p>';
$$('[data-station]').forEach(el=>{
el.onchange=()=>{
el.checked?state.selectedStations.add(el.dataset.station):state.selectedStations.delete(el.dataset.station);
updateStationLabel();
};
});
}

function updateStationLabel(){
$('#stationLabel').textContent=state.selectedStations.size
?[...state.selectedStations].join('・')
:'駅を選ぶ（複数選択可）';
}

function getFilters(){
return{
occupation:val('#occupation'),
employment:val('#employment'),
walk:Number(val('#walk'))||0,
payType:val('#payType'),
payMin:Number(val('#payMin'))||0,
payMax:Number(val('#payMax'))||0,
startTime:val('#startTime'),
endTime:val('#endTime'),
tags:$$('.tag-filter:checked').map(x=>x.value)
};
}

function matches(j,f){
if(state.onlyFavorites&&!favorites.has(j.id))return false;
if(state.selectedStations.size&&!j.stations.some(s=>state.selectedStations.has(s.name)&&(!f.walk||s.walk!==null&&s.walk<=f.walk)))return false;
if(!state.selectedStations.size&&f.walk&&!j.stations.some(s=>s.walk!==null&&s.walk<=f.walk))return false;
if(f.occupation&&![j.occupation,j.subOccupation].includes(f.occupation))return false;
if(f.employment&&j.employment!==f.employment)return false;
if(f.payType&&j.payType!==f.payType)return false;
if((f.payMin||f.payMax)&&(!j.payMin||f.payMin&&j.payMin<f.payMin||f.payMax&&j.payMin>f.payMax))return false;
if(f.startTime&&(!j.startTime||j.startTime<f.startTime))return false;
if(f.endTime&&(!j.endTime||j.endTime>f.endTime))return false;
if(f.tags.some(t=>!j.tags.includes(t)))return false;
return true;
}

function diagnosisType(){
return new URLSearchParams(location.search).get('type')||'';
}

function relevance(j){
const type=diagnosisType();
return type&&j.diagnosisTags.includes(type)?1:0;
}

function sorted(list){
const mode=val('#sort');
return list.sort((a,b)=>{
if(mode==='pay')return b.payMin-a.payMin;
if(mode==='walk')return Math.min(...a.stations.map(x=>x.walk??999))-Math.min(...b.stations.map(x=>x.walk??999));
return relevance(b)-relevance(a)||String(b.publishedAt).localeCompare(String(a.publishedAt));
});
}

function isNew(j){
if(!j.publishedAt)return false;
const d=new Date(j.publishedAt);
return !isNaN(d)&&Date.now()-d.getTime()>=0&&Date.now()-d.getTime()<7*86400000;
}

function card(j){
const s=j.stations[0];
const location=s?`${esc(s.name)}駅${s.walk!==null?' 徒歩'+s.walk+'分':''}`:'沿線エリア';
return `<article class="job-card">
<div class="job-photo">
${photoTag(mainImage(j),j.occupation+'の求人画像')}
${isNew(j)?'<span class="job-badge">NEW</span>':''}
</div>
<div class="job-card-body">
<div class="job-meta">${esc(j.id)}　/　${esc(j.industry)}</div>
<h3 class="job-title">${esc(j.title)}</h3>
<div class="job-facts">
<span>⌖ ${location}</span>
<span>◷ ${esc(j.employment)}</span>
</div>
<div class="job-salary">${esc(j.salary||((j.payType||'')+(j.payMin?j.payMin.toLocaleString()+'円〜':'')))}</div>
${relevance(j)?'<p class="recommend-note">あなたの診断タイプに関連するお仕事です</p>':''}
<div class="job-tags">${j.tags.slice(0,5).map(t=>`<span>${esc(t)}</span>`).join('')}</div>
</div>
<div class="job-card-foot">
<button class="fav-btn ${favorites.has(j.id)?'active':''}" data-fav="${esc(j.id)}" aria-label="お気に入り">${favorites.has(j.id)?'♥':'♡'}</button>
<button class="card-link" data-detail="${esc(j.id)}">求人詳細を見る →</button>
</div>
</article>`;
}

function render(){
const f=getFilters();
const jobs=sorted(state.jobs.filter(j=>matches(j,f)));
$('#resultCount').textContent=jobs.length+'件';
const pages=Math.ceil(jobs.length/20);
state.page=Math.min(state.page,Math.max(1,pages));
$('#jobList').innerHTML=jobs.slice((state.page-1)*20,state.page*20).map(card).join('');
$('#emptyState').hidden=jobs.length>0;
$('#pagination').innerHTML=pages>1?Array.from({length:pages},(_,i)=>`<button data-page="${i+1}" class="${state.page===i+1?'active':''}">${i+1}</button>`).join(''):'';
const chips=[...state.selectedStations,...f.tags];
if(f.occupation)chips.push(f.occupation);
if(f.employment)chips.push(f.employment);
if(f.walk)chips.push('徒歩'+f.walk+'分以内');
if(state.onlyFavorites)chips.push('お気に入りのみ');
$('#activeChips').innerHTML=chips.map(t=>`<button data-remove="${esc(t)}">${esc(t)} ×</button>`).join('');
renderFavorites();
}

function renderFavorites(){
const jobs=state.jobs.filter(j=>favorites.has(j.id));
$('#favCount').textContent=favorites.size;
$('#favoriteList').innerHTML=jobs.length?jobs.map(j=>`<div class="favorite-item">
<div><strong>${esc(j.title)}</strong><small>${esc(j.id)}　${esc(j.stations[0]?.name||'')}駅</small></div>
<div><button class="text-btn" data-detail="${esc(j.id)}">詳細</button><button class="text-btn" data-fav="${esc(j.id)}">削除</button></div>
</div>`).join(''):'<p class="favorite-empty">気になる求人の♡を押すと、ここに保存されます。</p>';
$('#bulkLine').hidden=!jobs.length;
}

function toggleFavorite(id){
favorites.has(id)?favorites.delete(id):favorites.add(id);
try{
localStorage.setItem('ensen_favorites',JSON.stringify([...favorites]));
}catch{}
render();
}

// 求人詳細・写真ギャラリー
function detail(id){
const j=state.jobs.find(x=>x.id===id);
if(!j)return;
state.activeJob=j;
$('#detailHeader').textContent=j.id;

const facts=[
['勤務地',j.stations.map(s=>s.name+'駅'+(s.walk!==null?' 徒歩'+s.walk+'分':'')).join('、')],
['業界',j.industry],
['職種',j.subOccupation||j.occupation],
['雇用形態',j.employment],
['給与',j.salary],
['勤務時間',j.hours],
['休日',j.holidays],
['福利厚生',j.benefits]
];

const related=state.jobs.filter(x=>x.id!==j.id&&(
x.occupation===j.occupation||
x.stations.some(s=>j.stations.some(t=>s.name===t.name))
)).slice(0,3);

const photos=j.photos.length?j.photos:[categoryImage(j.occupation)];

const gallery=`<div class="ensen-gallery" style="margin:16px 0 24px">
<div style="position:relative">
<img id="ensenMainPhoto" src="${esc(photos[0])}" alt="${esc(j.title)}の写真1" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:14px;display:block" onerror="this.onerror=null;this.src='${esc(categoryImage(j.occupation))}'">
${photos.length>1?`
<button type="button" data-gallery-step="-1" aria-label="前の写真" style="position:absolute;left:10px;top:45%;padding:10px;border:0;border-radius:50%;background:#fffd;cursor:pointer">❮</button>
<button type="button" data-gallery-step="1" aria-label="次の写真" style="position:absolute;right:10px;top:45%;padding:10px;border:0;border-radius:50%;background:#fffd;cursor:pointer">❯</button>
<span id="ensenPhotoCount" style="position:absolute;bottom:10px;right:12px;background:#0009;color:white;border-radius:20px;padding:4px 10px;font-size:12px">1 / ${photos.length}</span>
`:''}
</div>
${photos.length>1?`
<div style="display:flex;gap:8px;overflow-x:auto;margin-top:10px">
${photos.map((url,i)=>`
<button type="button" data-gallery-index="${i}" aria-label="写真${i+1}を表示" style="flex:0 0 78px;padding:2px;border:2px solid ${i===0?'#278591':'transparent'};border-radius:9px;background:transparent;cursor:pointer">
<img src="${esc(url)}" alt="写真${i+1}" style="width:100%;height:55px;object-fit:cover;border-radius:5px" onerror="this.onerror=null;this.src='${esc(categoryImage(j.occupation))}'">
</button>
`).join('')}
</div>
`:''}
</div>`;

$('#detailContent').innerHTML=`
<span class="kicker">JOB DETAIL / ${esc(j.id)}</span>
<h2>${esc(j.title)}</h2>
${gallery}
<div class="detail-stats">${j.tags.slice(0,5).map(t=>`<span>${esc(t)}</span>`).join('')}</div>
<h3>仕事内容</h3>
<p>${esc(j.description||'詳しい仕事内容はLINEでお問い合わせください。')}</p>
<h3>募集要項</h3>
${facts.map(([k,v])=>v?`<div class="favorite-item"><strong>${esc(k)}</strong><span>${esc(v)}</span></div>`:'').join('')}
<h3>応募資格</h3>
<p>${esc(j.qualifications||'詳しくはLINEでご案内します。')}</p>
<h3>似ている求人</h3>
${related.length?related.map(x=>`<div class="favorite-item"><span>${esc(x.title)}</span><button class="text-btn" data-detail="${esc(x.id)}">見る →</button></div>`).join(''):'<p>現在、似ている求人はありません。</p>'}
<p style="font-size:12px">※「応募についてLINEで相談」は正式応募ではありません。求人の詳細をご案内し、ご本人の意思確認後に紹介手続きを進めます。</p>
`;

$('#detailFavorite').textContent=favorites.has(id)?'♥ 保存済み':'♡ 保存';
$('#jobDialog').showModal();
}

function lineText(js,mode='consult'){
if(!js.length)return '沿線キャリアでお仕事を探しています。希望に合うお仕事について相談したいです。';
const heading=mode==='apply'?'【応募希望】':'【応募前の相談】';
return heading+'\n\n'+js.map(j=>`求人ID：${j.id}\n求人名：${j.title}\n勤務地：${j.stations.map(s=>s.name+'駅'+(s.walk!==null?' 徒歩'+s.walk+'分':'')).join('、')}`).join('\n\n')+(mode==='apply'?'\n\nこちらの求人への応募を希望します。今後の手続きについて教えてください。':'\n\nこちらの求人について、応募前に詳しく相談したいです。');
}

function ensureLineDialog(){
if($('#ensenLineDialog'))return;
const d=document.createElement('dialog');
d.id='ensenLineDialog';
d.setAttribute('aria-labelledby','ensenLineTitle');
d.style.cssText='border:0;border-radius:18px;padding:0;max-width:min(94vw,560px);width:100%;box-shadow:0 20px 70px #0004;color:#23414a';
d.innerHTML=`<div style="padding:24px">
<div style="display:flex;align-items:center;justify-content:space-between;gap:16px">
<h2 id="ensenLineTitle" style="font-size:22px;margin:0">LINEでお問い合わせ</h2>
<button type="button" id="ensenLineClose" aria-label="閉じる" style="border:0;background:transparent;font-size:28px;cursor:pointer">×</button>
</div>
<p id="ensenLineGuide" style="line-height:1.8;margin:16px 0">以下の文章をコピーして、LINEのトークに貼り付けて送信してください。</p>
<label for="ensenLineMessage" style="display:block;font-weight:700;margin-bottom:8px">送信するメッセージ（編集できます）</label>
<textarea id="ensenLineMessage" rows="9" style="box-sizing:border-box;width:100%;padding:14px;border:1px solid #cbd9dc;border-radius:10px;font:inherit;line-height:1.6;resize:vertical"></textarea>
<p id="ensenLineFeedback" role="status" style="min-height:24px;font-size:14px"></p>
<div style="display:flex;flex-wrap:wrap;gap:10px">
<button type="button" id="ensenLineCopy" style="flex:1;min-width:180px;padding:15px;background:#e8f3f3;border:1px solid #a9cbce;border-radius:10px;color:#176a73;font:inherit;font-weight:700;cursor:pointer">① メッセージをコピー</button>
<button type="button" id="ensenLineOpen" style="flex:1;min-width:180px;padding:15px;background:#278591;border:0;border-radius:10px;color:white;font:inherit;font-weight:700;cursor:pointer">② LINEを開く ↗</button>
</div>
<p style="font-size:12px;line-height:1.7;color:#667b82;margin:16px 0 0">※ LINEが開いたらトーク画面に文章を貼り付けて送信してください。ボタンを押すだけでは送信されません。正式応募はご本人の意思確認後にご案内します。</p>
</div>`;
document.body.append(d);
$('#ensenLineClose').onclick=()=>d.close();

$('#ensenLineCopy').onclick=async()=>{
const msg=$('#ensenLineMessage').value;
try{
await navigator.clipboard.writeText(msg);
$('#ensenLineFeedback').textContent='コピーできました！ 次に「② LINEを開く」を押してください。';
}catch{
const a=$('#ensenLineMessage');
a.focus();
a.select();
$('#ensenLineFeedback').textContent='文章を選択しました。⌘+C（WindowsはCtrl+C）でコピーしてください。';
}
};

$('#ensenLineOpen').onclick=()=>{
if(CFG.lineOfficialUrl&&/^https:\/\//.test(CFG.lineOfficialUrl)){
window.open(CFG.lineOfficialUrl,'_blank','noopener');
$('#ensenLineFeedback').textContent='LINEが開いたら、コピーした文章を貼り付けて送信してください。';
}else{
$('#ensenLineFeedback').textContent='LINEのURLが未設定です。config.jsを確認してください。';
}
};
}

function line(js,mode='consult'){
ensureLineDialog();
$('#ensenLineTitle').textContent=mode==='apply'?'この求人に応募したい':'応募前に相談したい';
$('#ensenLineGuide').textContent=mode==='apply'?'応募希望の文章を用意しました。コピーしてLINEで送信してください。':'応募前の相談文を用意しました。質問があれば文章に追記してからコピーしてください。';
$('#ensenLineMessage').value=lineText(js,mode);
$('#ensenLineFeedback').textContent='';
$('#ensenLineDialog').showModal();
}

function setupDetailLineButtons(){
const apply=$('#detailApply');
if(!apply)return;
apply.textContent='この求人に応募したい';
apply.setAttribute('aria-label','この求人に応募したい');
if(!$('#detailConsult')){
const consult=document.createElement('button');
consult.type='button';
consult.id='detailConsult';
consult.className=apply.className;
consult.textContent='応募前に相談したい';
consult.style.cssText='background:#e8f3f3;color:#176a73;border:1px solid #a9cbce';
apply.parentNode.insertBefore(consult,apply);
consult.onclick=()=>state.activeJob&&line([state.activeJob],'consult');
}
}

function reset(){
state.selectedStations.clear();
state.onlyFavorites=false;
$('#searchForm').reset();
updateStationLabel();
state.page=1;
render();
}

async function load(){
if(!CFG.publicApiUrl){
render();
return;
}
try{
const response=await fetch(CFG.publicApiUrl,{redirect:'follow'});
if(!response.ok)throw Error('HTTP '+response.status);
const data=await response.json();
const rows=Array.isArray(data)?data:Array.isArray(data.jobs)?data.jobs:[];
state.jobs=rows.map(normalize).filter(j=>j.id&&j.title&&j.status==='公開中');
render();
}catch(err){
console.error('公開求人データの取得に失敗:',err);
notify('求人データを取得できませんでした。時間をおいてお試しください。');
render();
}
}

function bind(){
const open=id=>$(id).showModal();

$('#stationOpen').onclick=()=>open('#stationDialog');
$('#stationSearch').oninput=renderStations;

$('#stationDone').onclick=()=>{
$('#stationDialog').close();
state.page=1;
render();
};

$('#stationClear').onclick=()=>{
state.selectedStations.clear();
updateStationLabel();
renderStations();
};

$$('[data-close]').forEach(x=>x.onclick=()=>$('#'+x.dataset.close).close());

$('#advancedToggle').onclick=()=>{
const a=$('#advanced');
a.hidden=!a.hidden;
$('#advancedToggle').setAttribute('aria-expanded',String(!a.hidden));
$('#advancedToggle').textContent=a.hidden?'＋ 詳細条件を設定する':'− 詳細条件を閉じる';
};

$('#searchForm').onsubmit=e=>{
e.preventDefault();
state.page=1;
render();
$('#results').scrollIntoView({behavior:'smooth'});
};

$('#resetFilters').onclick=reset;

$('#loosenFilters').onclick=()=>{
reset();
$('#search').scrollIntoView({behavior:'smooth'});
};

$('#sort').onchange=render;

$('#mobileRefine').onclick=()=>{
$('#advanced').hidden=false;
$('#advancedToggle').setAttribute('aria-expanded','true');
$('#search').scrollIntoView({behavior:'smooth'});
};

$('#bulkLine').onclick=()=>line(state.jobs.filter(j=>favorites.has(j.id)));

$('#detailFavorite').onclick=()=>{
if(state.activeJob){
toggleFavorite(state.activeJob.id);
$('#detailFavorite').textContent=favorites.has(state.activeJob.id)?'♥ 保存済み':'♡ 保存';
}
};

setupDetailLineButtons();

$('#detailApply').onclick=()=>state.activeJob&&line([state.activeJob],'apply');

$('#detailShare').onclick=async()=>{
if(!state.activeJob)return;
const url=location.origin+location.pathname+'?job='+encodeURIComponent(state.activeJob.id);
if(navigator.share){
try{
await navigator.share({title:state.activeJob.title,url});
}catch{}
}else{
try{
await navigator.clipboard.writeText(url);
notify('求人URLをコピーしました');
}catch{
window.prompt('求人URL',url);
}
}
};

document.addEventListener('click',e=>{

// ギャラリー切り替え
const g=e.target.closest('[data-gallery-index],[data-gallery-step]');
if(g&&state.activeJob){
const j=state.activeJob;
const photos=j.photos.length?j.photos:[categoryImage(j.occupation)];
const current=Number($('#ensenMainPhoto')?.dataset.index||0);
const i=g.hasAttribute('data-gallery-index')
?Number(g.dataset.galleryIndex)
:(current+Number(g.dataset.galleryStep)+photos.length)%photos.length;

const img=$('#ensenMainPhoto');
if(img){
img.src=photos[i];
img.dataset.index=String(i);
img.alt=j.title+'の写真'+(i+1);
}

const count=$('#ensenPhotoCount');
if(count)count.textContent=(i+1)+' / '+photos.length;

$$('[data-gallery-index]').forEach(b=>{
b.style.borderColor=Number(b.dataset.galleryIndex)===i?'#278591':'transparent';
});
return;
}

const target=e.target.closest('[data-fav],[data-detail],[data-page],[data-remove],[data-line]');
if(!target)return;

if(target.dataset.fav)toggleFavorite(target.dataset.fav);
if(target.dataset.detail)detail(target.dataset.detail);

if(target.dataset.page){
state.page=Number(target.dataset.page);
render();
$('#results').scrollIntoView({behavior:'smooth'});
}

if(target.dataset.line)line([]);

if(target.dataset.remove){
const t=target.dataset.remove;
state.selectedStations.delete(t);
$$('.tag-filter').filter(x=>x.value===t).forEach(x=>x.checked=false);
if(val('#occupation')===t)$('#occupation').value='';
if(val('#employment')===t)$('#employment').value='';
if(t.startsWith('徒歩'))$('#walk').value='';
if(t==='お気に入りのみ')state.onlyFavorites=false;
updateStationLabel();
renderStations();
render();
}
});

window.addEventListener('scroll',()=>{
$('#mobileRefine').hidden=!(
window.scrollY>$('#results').offsetTop-180&&
window.scrollY<$('.diagnosis-section').offsetTop
);
},{passive:true});
}

initFilters();
bind();
load().then(()=>{
const id=new URLSearchParams(location.search).get('job');
if(id)detail(id);
});

})();
