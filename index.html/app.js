const crops = {
  carrot:{name:"แครอท",emoji:"🥕",seed:10,grow:15000,sell:24},
  corn:{name:"ข้าวโพด",emoji:"🌽",seed:15,grow:25000,sell:36},
  tomato:{name:"มะเขือเทศ",emoji:"🍅",seed:20,grow:35000,sell:50},
  pumpkin:{name:"ฟักทอง",emoji:"🎃",seed:30,grow:50000,sell:75}
};
const decors = {
  tree:{name:"ต้นไม้",emoji:"🌳",price:45},
  flower:{name:"แปลงดอกไม้",emoji:"🌷",price:35},
  fence:{name:"รั้วไม้",emoji:"🪵",price:60},
  well:{name:"บ่อน้ำ",emoji:"🪣",price:90},
  barn:{name:"โรงนา",emoji:"🏠",price:150},
  tractor:{name:"รถแทรกเตอร์",emoji:"🚜",price:220}
};

const initial = {
  money:100, day:1, plots:Array(9).fill(null), inventory:{},
  selectedSeed:null, selectedDecor:null, lastDay:Date.now()
};
let state = JSON.parse(localStorage.getItem("farmSave") || "null") || structuredClone(initial);
let deferredPrompt = null;

function save(){ localStorage.setItem("farmSave",JSON.stringify(state)); }
function fmt(ms){ if(ms<=0)return "พร้อมเก็บ!"; let s=Math.ceil(ms/1000); let m=Math.floor(s/60); s%=60; return `${m}:${String(s).padStart(2,"0")}`; }
function showMessage(t){document.getElementById("message").textContent=t; clearTimeout(showMessage.t); showMessage.t=setTimeout(()=>document.getElementById("message").textContent="แตะแปลงเพื่อปลูกผัก",2500)}

function render(){
  document.getElementById("money").textContent=state.money;
  document.getElementById("dayText").textContent=`วันที่ ${state.day} • ฟาร์มของฉัน`;
  let empty=0,ready=0;
  const farm=document.getElementById("farm"); farm.innerHTML="";
  state.plots.forEach((p,i)=>{
    const el=document.createElement("div");
    if(!p){empty++;el.className="plot empty";el.innerHTML="<div class='crop'>➕</div><div class='name'>ปลูก</div>";el.onclick=()=>openPlot(i)}
    else if(p.type==="decor"){el.className="plot decor";el.innerHTML=`<div class="crop">${p.emoji}</div><div class="name">${p.name}</div>`;el.onclick=()=>removeDecor(i)}
    else{
      const done=Date.now()-p.plantedAt>=p.grow;
      if(done)ready++;
      el.className="plot "+(done?"ready":"growing");
      el.innerHTML=`<div class="crop">${p.emoji}</div><div class="name">${p.name}</div><div class="timer">${done?"✨ แตะเพื่อเก็บ":fmt(p.grow-(Date.now()-p.plantedAt))}</div>`;
      el.onclick=()=>done?harvest(i):showMessage(`${p.name} กำลังโต เหลือ ${fmt(p.grow-(Date.now()-p.plantedAt))}`);
    }
    farm.appendChild(el);
  });
  document.getElementById("emptyCount").textContent=empty;
  document.getElementById("readyCount").textContent=ready;
  renderSeeds(); renderDecors();
}
function renderSeeds(){
 const box=document.getElementById("seedShop"); box.innerHTML="";
 Object.entries(crops).forEach(([id,c])=>{
  const n=state.inventory[id]||0;
  const el=document.createElement("div"); el.className="card";
  el.innerHTML=`<div class="emoji">${c.emoji}</div><h3>${c.name}</h3><p>เมล็ด ${c.seed} 💰 • โต ${Math.round(c.grow/1000)} วินาที • ขาย ${c.sell} 💰</p><p>มี ${n} เมล็ด</p><button class="buy">ซื้อเมล็ด ${c.seed} 💰</button>`;
  el.querySelector("button").onclick=()=>buySeed(id); box.appendChild(el);
 });
}
function renderDecors(){
 const box=document.getElementById("decorShop"); box.innerHTML="";
 Object.entries(decors).forEach(([id,d])=>{
  const el=document.createElement("div");el.className="card";
  el.innerHTML=`<div class="emoji">${d.emoji}</div><h3>${d.name}</h3><p>${d.price} 💰</p><button class="buy">ซื้อและวาง</button>`;
  el.querySelector("button").onclick=()=>buyDecor(id);box.appendChild(el);
 });
}
function buySeed(id){let c=crops[id];if(state.money<c.seed){showMessage("เงินไม่พอ 💸");return}state.money-=c.seed;state.inventory[id]=(state.inventory[id]||0)+1;save();render();showMessage(`ซื้อเมล็ด${c.name}แล้ว 🌱`)}
function buyDecor(id){let d=decors[id];if(state.money<d.price){showMessage("เงินไม่พอ 💸");return}state.money-=d.price;state.selectedDecor=id;showMessage(`ซื้อ ${d.name} แล้ว! แตะแปลงว่างเพื่อวาง`);save()}
function openPlot(i){
 if(state.selectedDecor){let d=decors[state.selectedDecor];state.plots[i]={type:"decor",name:d.name,emoji:d.emoji};state.selectedDecor=null;save();render();showMessage("วางของตกแต่งแล้ว 🏡");return}
 document.getElementById("modalTitle").textContent="🌱 เลือกเมล็ดพันธุ์";
 const content=document.getElementById("modalContent");content.innerHTML="";
 Object.entries(crops).forEach(([id,c])=>{
  const n=state.inventory[id]||0;const b=document.createElement("button");b.className="action";b.disabled=n<=0;b.textContent=`${c.emoji} ${c.name} (${n})`;
  b.onclick=()=>plant(i,id);content.appendChild(b);
 });
 document.getElementById("modal").classList.remove("hidden");
}
function plant(i,id){if(!state.inventory[id])return;state.inventory[id]--;let c=crops[id];state.plots[i]={type:"crop",id,name:c.name,emoji:c.emoji,grow:c.grow,plantedAt:Date.now()};closeModal();save();render();showMessage(`ปลูก${c.name}แล้ว 🌱`)}
function harvest(i){let p=state.plots[i],c=crops[p.id];state.money+=c.sell;state.plots[i]=null;save();render();showMessage(`เก็บ${c.name} ได้ +${c.sell} 💰`)}
function removeDecor(i){if(state.selectedDecor){openPlot(i);return}showMessage("นี่คือของตกแต่ง แตะร้านเพื่อซื้อชิ้นใหม่")}
function closeModal(){document.getElementById("modal").classList.add("hidden")}
document.getElementById("closeModal").onclick=closeModal;
document.getElementById("modal").onclick=e=>{if(e.target.id==="modal")closeModal()};

setInterval(()=>{render()},1000);

// วันใหม่ทุก 3 นาทีสำหรับเดโม
setInterval(()=>{if(Date.now()-state.lastDay>=180000){state.day++;state.lastDay=Date.now();save();render();}},5000);

window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;document.getElementById("installBtn").classList.remove("hidden")});
document.getElementById("installBtn").onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;document.getElementById("installBtn").classList.add("hidden")};

if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(console.error))}
render();
