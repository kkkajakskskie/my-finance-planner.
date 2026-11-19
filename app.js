const KEY='my-budget-planner-v2';
const OLD_KEY='my-budget-planner-v1';
const base={
 income:21635,
 months:{'2026-11':{name:'Ноябрь',type:'A'},'2026-12':{name:'Декабрь',type:'B'},'2027-01':{name:'Январь',type:'A'},'2027-02':{name:'Февраль',type:'B'}},
 fixed:[['main','Основной перевод',12500,'регулярная сумма'],['transport','Транспорт',2232,'36 ₽ × 2 поездки × 31 день'],['mobile','Мобильная связь',850,''],['vpn','VPN',399,''],['food','Продукты',2200,'включая питание вне дома'],['market','Маркетплейсы',200,'']],
 env:{A:[['health','Здоровье',500],['reserve','Финансовая подушка',1000],['birthday','День рождения',800],['travel','Путешествия',954],['big','Крупные покупки',0]],B:[['health','Здоровье',500],['reserve','Финансовая подушка',1000],['birthday','День рождения',0],['travel','Путешествия',877],['big','Крупные покупки',877]]},
 checks:{},events:[],milestones:{}
};
const clone=x=>JSON.parse(JSON.stringify(x));
function load(){
 try{const fresh=JSON.parse(localStorage.getItem(KEY));if(fresh)return {...clone(base),...fresh}}
 catch(e){}
 try{const old=JSON.parse(localStorage.getItem(OLD_KEY));if(old){const migrated={...clone(base),...old};localStorage.setItem(KEY,JSON.stringify(migrated));return migrated}}
 catch(e){}
 return clone(base)
}
let d=load(),month=Object.keys(d.months)[0],opened=null;
const $=id=>document.getElementById(id),fmt=n=>Number(n||0).toLocaleString('ru-RU')+' ₽',mi=()=>d.months[month],checked=id=>!!d.checks[month+'_'+id];
function persist(){localStorage.setItem(KEY,JSON.stringify(d));render()}
function mark(id,val){d.checks[month+'_'+id]=val;d.events.unshift({month,id,val,date:new Date().toISOString()});d.events=d.events.slice(0,150);persist()}
function safeText(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function drawFixed(){
 const box=$('fixed');box.innerHTML='';
 d.fixed.forEach(([id,name,amount,detail])=>{
  const row=document.createElement('label');row.className='fixed-item'+(checked(id)?' done':'');
  const cb=document.createElement('input');cb.type='checkbox';cb.className='check';cb.checked=checked(id);cb.addEventListener('change',()=>mark(id,cb.checked));
  const copy=document.createElement('span');copy.className='item-copy';copy.innerHTML=`<span class="item-name">${safeText(name)}</span>${detail?`<small class="item-detail">${safeText(detail)}</small>`:''}`;
  const val=document.createElement('b');val.className='item-amount';val.textContent=fmt(amount);
  row.append(cb,copy,val);box.append(row)
 })
}
function drawEnvelopes(){
 const box=$('envelopes');box.innerHTML='';
 d.env[mi().type].forEach(([id,name,amount])=>{
  const b=document.createElement('button');b.type='button';b.className='envelope-card'+(checked(id)?' completed':'')+(amount===0?' zero':'');
  b.setAttribute('aria-label',`${name}, пополнение ${fmt(amount)}`);
  b.innerHTML=`<span class="envelope-art"><span class="envelope-label"><span>${safeText(name)}</span></span><i class="envelope-seal"></i></span><span class="envelope-caption"><strong>${safeText(name)}</strong><em>${fmt(amount)}</em></span>`;
  b.addEventListener('click',()=>openEnvelope(id));box.append(b)
 })
}
function openEnvelope(id){
 opened=id;const item=d.env[mi().type].find(x=>x[0]===id);if(!item)return;
 $('modalTitle').textContent=item[1];$('modalAmount').textContent=fmt(item[2]);$('modalCheck').checked=checked(id);$('envelopeModal').classList.add('show')
}
function closeEnvelope(){ $('envelopeModal').classList.remove('show');opened=null}
function render(){
 const months=$('months');months.innerHTML='';
 Object.entries(d.months).forEach(([key,m])=>{const b=document.createElement('button');b.className='pill'+(key===month?' active':'');b.textContent=m.name;b.addEventListener('click',()=>{month=key;render()});months.append(b)});
 $('income').textContent=fmt(d.income);$('monthKind').textContent='МЕСЯЦ '+mi().type;$('monthFoot').textContent=mi().name.toUpperCase()+' · '+mi().type;
 drawFixed();drawEnvelopes();
 const all=[...d.fixed,...d.env[mi().type]],total=all.reduce((s,x)=>s+x[2],0),done=all.filter(x=>checked(x[0])).reduce((s,x)=>s+x[2],0),pct=total?Math.round(done/total*100):0;
 $('done').textContent=fmt(done);$('percent').textContent=pct+'%';$('bar').style.width=pct+'%';
 const f=d.fixed.reduce((s,x)=>s+x[2],0),e=d.env[mi().type].reduce((s,x)=>s+x[2],0),rest=d.income-f-e;
 $('totals').innerHTML=[['Обязательные расходы и перевод',f],['Пополнение конвертов',e],['Всего распределено',f+e],[rest>=0?'Свободный остаток':'Не хватает',Math.abs(rest)]].map(([n,v])=>`<div class="total-row"><span>${safeText(n)}</span><b>${fmt(v)}</b></div>`).join('');
 drawMilestones();drawEvents();drawCalendar()
}
function drawMilestones(){
 const box=$('milestones');box.innerHTML='';
 [12500,25000,37500,50000,62500,75000,87500,100000].forEach((v,i)=>{
  const row=document.createElement('label');row.className='fixed-item'+(d.milestones[v]?' done':'');
  const cb=document.createElement('input');cb.type='checkbox';cb.className='check';cb.checked=!!d.milestones[v];cb.onchange=()=>{d.milestones[v]=cb.checked;persist()};
  const copy=document.createElement('span');copy.className='item-copy';copy.innerHTML=`<span class="item-name">${fmt(v)} — этап пройден</span><small class="item-detail">${['Первый шаг','Движение','Уже заметно','Половина пути','Держим курс','Ещё ближе','Почти там','Большая цель'][i]}</small>`;
  row.append(cb,copy);box.append(row)
 })
}
function drawEvents(){
 const box=$('events');box.innerHTML='';
 const all=[...d.fixed,...d.env.A,...d.env.B];
 d.events.slice(0,35).forEach(ev=>{const item=all.find(x=>x[0]===ev.id);const row=document.createElement('div');row.className='event-row';const left=document.createElement('span');left.textContent=`${d.months[ev.month]?.name||ev.month} · ${item?.[1]||ev.id} — ${ev.val?'отмечено':'отмена отметки'}`;const right=document.createElement('small');right.textContent=new Date(ev.date).toLocaleDateString('ru-RU');row.append(left,right);box.append(row)});
 if(!d.events.length)box.innerHTML='<p class="note-strip">Здесь появятся первые отметки.</p>'
}
function drawCalendar(){
 const now=new Date(),y=now.getFullYear(),m=now.getMonth(),first=(new Date(y,m,1).getDay()+6)%7,days=new Date(y,m+1,0).getDate();
 $('calMonth').textContent=now.toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
 const cal=$('cal');cal.innerHTML=['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map(x=>`<span class="weekday">${x}</span>`).join('');
 for(let i=0;i<first;i++)cal.innerHTML+='<span></span>';
 for(let i=1;i<=days;i++)cal.innerHTML+=`<span class="${i===now.getDate()?'today':''}">${i}</span>`;
 let target=new Date(y,m,25);if(now>=target)target=new Date(y,m+1,25);
 $('count').textContent=Math.max(0,Math.ceil((target-new Date(y,m,now.getDate()))/86400000))
}
document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
 document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===btn));
 ['distribution','goals','history','calendar'].forEach(id=>$(id).classList.toggle('hidden',id!==btn.dataset.page));
}));
$('editIncome').addEventListener('click',()=>{const value=prompt('Укажи ежемесячный доход в рублях',d.income);if(value!==null&&value.trim()!==''&&Number.isFinite(Number(value))&&Number(value)>=0){d.income=Math.round(Number(value));persist()}});
$('closeModal').onclick=closeEnvelope;$('modalDone').onclick=closeEnvelope;
$('envelopeModal').addEventListener('click',e=>{if(e.target===$('envelopeModal'))closeEnvelope()});
$('modalCheck').addEventListener('change',e=>{if(opened!==null)mark(opened,e.target.checked)});
$('export').addEventListener('click',()=>{
 const blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='my-finance-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(url)
});
$('import').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{const obj=JSON.parse(await file.text());if(!obj.fixed||!obj.env||!obj.checks)throw Error('invalid');
  if(confirm('Заменить текущие данные этой резервной копией?')){d={...clone(base),...obj};persist();alert('Резервная копия восстановлена.')}
 }catch(err){alert('Не удалось прочитать файл резервной копии.')}
 e.target.value=''
});
$('reset').addEventListener('click',()=>{if(confirm('Сбросить все отметки выбранного месяца?')){Object.keys(d.checks).filter(k=>k.startsWith(month+'_')).forEach(k=>delete d.checks[k]);persist()}});
render();