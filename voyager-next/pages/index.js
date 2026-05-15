import { useState, useEffect, useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// AI HELPER – calls /api/ai (server-side route) which calls Gemini securely.
// ─────────────────────────────────────────────────────────────────────────────
async function callAI(prompt) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.text || "";
}

const LIGHT = {
  bg:         "#F5F0E8",
  bgCard:     "#FFFFFF",
  bgMuted:    "#EDE8DF",
  bgNav:      "#1C1917",   
  ink:        "#1C1917",
  inkMuted:   "#78716C",
  inkLight:   "#B0A89E",
  border:     "#E5DDD4",
  gold:       "#B45309",
  goldBg:     "#FEF3C7",
  red:        "#991B1B",
  green:      "#166534",
  overlay:    "rgba(20,18,16,.55)",
  sheet:      "#FFFFFF",
  tabBorder:  "#E5DDD4",
  calBg:      "#F0EBE3",
  calCell:    "#FFFFFF",
  calEmpty:   "#EDE8DF",
  calBorder:  "#E5DDD4",
  calText:    "#1C1917",
  calDow:     "#EDE8DF",
  calDowText: "#78716C",
};

const DARK = {
  bg:         "#0C0A09",
  bgCard:     "#1A1714",
  bgMuted:    "#242020",
  bgNav:      "#0C0A09",
  ink:        "#F5F0E8",
  inkMuted:   "#A8A29E",
  inkLight:   "#57534E",
  border:     "#2C2826",
  gold:       "#D97706",
  goldBg:     "#1C1200",
  red:        "#DC2626",
  green:      "#16A34A",
  overlay:    "rgba(0,0,0,.80)",
  sheet:      "#1A1714",
  tabBorder:  "#2C2826",
  calBg:      "#0C0A09",
  calCell:    "#1A1714",
  calEmpty:   "#0F0D0C",
  calBorder:  "#2C2826",
  calText:    "#F5F0E8",
  calDow:     "#1A1714",
  calDowText: "#78716C",
};

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
                "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const PAL    = ["#B45309","#7C3AED","#0D9488","#DC2626","#2563EB",
                "#D97706","#059669","#9333EA","#C2410C","#0369A1","#BE185D","#4D7C0F"];
const TI     = { avión:"✈", tren:"🚆", bus:"🚌", coche:"🚗", barco:"🚢", otro:"🗺" };

const WEATHER_HINTS = {
  colombia:   ["🌧","🌦","🌞","☀","☀","🌦","🌧","🌧","🌧","🌧","🌦","🌧"],
  japón:      ["❄","❄","🌸","🌸","🌿","🌧","🌧","⛅","🍂","🍂","🌥","❄"],
  italia:     ["🌥","🌥","🌤","☀","☀","☀","🔥","🔥","☀","🌤","🌥","🌥"],
  tailandia:  ["☀","☀","☀","🌡","🌧","🌧","🌧","🌧","🌧","🌧","☀","☀"],
  marruecos:  ["🌥","🌤","☀","☀","☀","🔥","🔥","🔥","☀","☀","🌤","🌥"],
  grecia:     ["🌥","🌤","☀","☀","☀","🔥","🔥","🔥","☀","🌤","🌥","🌥"],
  portugal:   ["🌧","🌧","🌤","☀","☀","☀","☀","☀","☀","🌤","🌧","🌧"],
  perú:       ["☀","☀","☀","🌤","🌧","🌧","🌧","🌧","🌧","🌤","☀","☀"],
  china:      ["🌤","🌤","🌤","🌤","🌧","🌧","🔥","🔥","🌤","🌤","🌥","❄"],
  default:    ["🌤","🌤","🌤","☀","☀","☀","🌞","🌞","🌤","🌤","🌥","🌥"],
};

function getWeather(dest, month) {
  const key = dest?.toLowerCase().split(" ")[0];
  const arr = WEATHER_HINTS[key] || WEATHER_HINTS.default;
  return arr[month] || "🌤";
}

const dim   = (y,m) => new Date(y,m+1,0).getDate();
const fdow  = (y,m) => { 
  const d = new Date(y,m,1).getDay(); 
  return d === 0 ? 6 : d - 1; 
};
const mkiso = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const fmt   = s => { if(!s) return "?"; const [y,m,d]=s.split("-"); return `${+d} ${MONTHS[+m-1]?.slice(0,3)} ${y}`; };
const isoDay= (s,y,m) => { if(!s) return null; const [sy,sm,sd]=s.split("-"); return +sy===y&&+sm===(m+1)?+sd:null; };

const WORLD = ["Bogotá","Medellín","Cartagena","Cali","Santa Marta","San Andrés","Barranquilla","Pereira","Manizales","Popayán","Leticia","Villa de Leyva","Salento",
"Ciudad de México","Cancún","Guadalajara","Oaxaca","Playa del Carmen","Tulum","San Cristóbal de las Casas","Mérida","Puerto Vallarta","Los Cabos","Guanajuato","San Miguel de Allende",
"Buenos Aires","Córdoba","Mendoza","Bariloche","Ushuaia","Salta","Puerto Iguazú","Mar del Plata",
"Lima","Cusco","Machu Picchu","Arequipa","Trujillo","Puno","Iquitos","Huaraz","Paracas","Nazca",
"Santiago","Valparaíso","San Pedro de Atacama","Torres del Paine","Puerto Natales","Puerto Montt","Viña del Mar",
"São Paulo","Río de Janeiro","Salvador","Florianópolis","Foz do Iguaçu","Fortaleza","Manaus","Recife","Belém","Bonito",
"La Habana","Trinidad","Varadero","Viñales","Santiago de Cuba",
"San José","Monteverde","Manuel Antonio","Tamarindo","Arenal","Tortuguero",
"Ciudad de Panamá","Bocas del Toro","Boquete","San Blas",
"Quito","Galápagos","Cuenca","Baños","Montañita","Mindo",
"La Paz","Salar de Uyuni","Sucre","Potosí","Rurrenabaque",
"Montevideo","Punta del Este","Colonia del Sacramento",
"Nueva York","Los Ángeles","Miami","San Francisco","Chicago","Las Vegas","Nueva Orleans","Hawái","Boston","Seattle","Washington DC","Nashville","Orlando","San Diego","Austin","Denver","New Orleans","Yellowstone","Gran Cañón","Monument Valley",
"Toronto","Vancouver","Montreal","Quebec","Calgary","Ottawa","Banff","Jasper","Victoria",
"Madrid","Barcelona","Sevilla","Granada","Valencia","San Sebastián","Málaga","Bilbao","Toledo","Salamanca","Santiago de Compostela","Mallorca","Ibiza","Tenerife","Gran Canaria","Lanzarote","Cádiz","Zaragoza","Pamplona","Burgos",
"París","Niza","Lyon","Marsella","Burdeos","Estrasburgo","Montpellier","Avignon","Mont Saint-Michel","Biarritz","Annecy","Chamonix","Carcasona","Bretaña","Normandía",
"Roma","Florencia","Venecia","Milán","Nápoles","Palermo","Cinque Terre","Amalfi","Sicilia","Cerdeña","Turín","Bolonia","Pisa","Siena","Capri","Puglia","Toscana","Umbría","Pompeya",
"Lisboa","Oporto","Sintra","Algarve","Madeira","Azores","Évora","Braga","Coimbra","Setúbal","Alentejo",
"Ámsterdam","Rotterdam","La Haya","Brujas","Gante","Bruselas","Lieja","Amberes","Delft","Utrecht",
"Berlín","Múnich","Hamburgo","Colonia","Heidelberg","Frankfurt","Stuttgart","Dresde","Nuremberg","Rothenburg","Freiburg","Baviera","Selva Negra","Lago Constanza",
"Viena","Salzburgo","Innsbruck","Graz","Hallstatt","Wachau","Tirol",
"Praga","Brno","Český Krumlov","Karlovy Vary","Pilsen",
"Budapest","Eger","Pécs","Lago Balatón","Debrecen",
"Varsovia","Cracovia","Gdansk","Wroclaw","Poznań","Łódź","Zakopane","Auschwitz",
"Londres","Edimburgo","Liverpool","Manchester","Bath","Oxford","Cambridge","York","Brighton","Cardiff","Cotswolds","Lake District","Highlands","Cornualles",
"Dublín","Galway","Killarney","Cork","Limerick","Cliffs of Moher","Ring of Kerry",
"Estocolmo","Gotemburgo","Malmö","Uppsala","Kiruna","Laponia sueca",
"Oslo","Bergen","Flam","Tromsø","Lofoten","Ålesund","Auroras Boreales",
"Helsinki","Rovaniemi","Tampere","Turku","Laponia finlandesa",
"Copenhague","Aarhus","Odense","Legoland",
"Zúrich","Ginebra","Berna","Interlaken","Lucerna","Zermatt","Lugano","Montreux","St. Moritz","Lausana","Jungfrau","Glacier Express",
"Atenas","Santorini","Mykonos","Creta","Rodas","Tesalónica","Meteoras","Corfú","Zante","Milos","Naxos","Paros","Lesbos",
"Reikiavik","Círculo Polar Ártico","Snæfellsnes","Akureyri","Jökulsárlón",
"Dubrovnik","Split","Hvar","Pula","Zagreb","Kotor","Rovinj","Šibenik","Zadar","Plitvice",
"Liubliana","Lago Bled","Piran","Škocjan",
"Bratislava","Košice","Altos Tatras",
"Bucarest","Braşov","Sibiu","Cluj-Napoca","Sinaia","Delta del Danubio",
"Sofía","Plovdiv","Varna","Sozopol","Monasterio de Rila",
"Tallin","Riga","Vilna","Curlandia",
"Belgrado","Novi Sad","Niš",
"Sarajevo","Mostar","Banja Luka",
"Skopie","Ohrid","Bitola",
"Tirana","Berat","Gjirokastra","Riviera albanesa",
"Tokio","Osaka","Kioto","Hiroshima","Nara","Hakone","Nikko","Sapporo","Okinawa","Nagano","Kamakura","Yokohama","Kanazawa","Matsumoto","Nagasaki","Beppu","Fukuoka","Kobe",
"Bangkok","Chiang Mai","Phuket","Krabi","Koh Samui","Koh Phi Phi","Ayutthaya","Pai","Koh Lanta","Kanchanaburi","Koh Tao","Sukhothai","Koh Chang",
"Bali","Yogyakarta","Jakarta","Lombok","Raja Ampat","Komodo","Flores","Ubud","Seminyak","Gili","Bromo","Borobudur","Toraja","Banda Neira",
"Hanói","Ho Chi Minh","Hội An","Đà Lạt","Hạ Long","Huế","Nha Trang","Sapa","Phú Quốc","Mú Cang Chải",
"Singapur",
"Kuala Lumpur","Penang","Langkawi","Borneo","Kota Kinabalu","Cameron Highlands","Malaca",
"Manila","Palawan","Bohol","Boracay","Siargao","Cebu","Intramuros","Batanes",
"Pekín","Shanghái","Xi'an","Guilin","Chengdu","Hong Kong","Macao","Zhangjiajie","Lijiang","Yangshuo","Suzhou","Hangzhou","Chongqing","Lhasa","Huangshan","Jiuzhaigou",
"Seúl","Busan","Jeju","Gyeongju","Incheon","Suwon","Jeonju",
"Bombay","Nueva Delhi","Agra","Jaipur","Goa","Kerala","Varanasi","Hampi","Udaipur","Jodhpur","Chennai","Kolkata","Rishikesh","Dharamsala","Amritsar","Andamán","Coorg","Mysuru","Ladakh",
"Katmandú","Pokhara","Annapurna","Chitwan","Lumbini","Bhaktapur","Mustang",
"Colombo","Kandy","Sigiriya","Galle","Ella","Dambulla","Mirissa","Nuwara Eliya",
"Dubái","Abu Dabi","Sharjah","Ras Al Khaimah","Fujairah",
"Estambul","Capadocia","Éfeso","Antalya","Bodrum","Pamukkale","Trabzon","Konya","Ankara","Kas","Fethiye","Alanya","Safranbolu","Mardin","Göbekli Tepe",
"Amán","Petra","Wadi Rum","Áqaba","Jerash","Mar Muerto",
"Tel Aviv","Jerusalén","Mar Muerto","Nazaret","Haifa","Eilat","Negev","Mar de Galilea",
"Marrakech","Fez","Chefchaouen","Casablanca","Essaouira","Merzouga","Rabat","Tánger","Agadir","Ouarzazate","Zagora","Dades","Aït Benhaddou",
"El Cairo","Luxor","Asuán","Sharm el-Sheij","Hurghada","Alejandría","Abu Simbel","Dahab","Siwa","Valle de los Reyes",
"Nairobi","Maasai Mara","Amboseli","Zanzíbar","Kilimanjaro","Serengeti","Ngorongoro","Mombasa","Lamu","Samburu","Lake Nakuru","Diani",
"Ciudad del Cabo","Johannesburgo","Kruger","Garden Route","Durban","Stellenbosch","Hermanus","Oudtshoorn","Drakensberg","Sun City",
"Túnez","Djerba","Tozeur","Sidi Bou Saïd","Hammamet","Matmata","Kairouan","Sbeitla",
"Addis Abeba","Lalibela","Aksúm","Simien","Valle del Omo",
"Acra","Cape Coast","Mole","Kumasi",
"Dakar","Saint-Louis","Casamance","Lago Rosa",
"Kigali","Gorillas de montaña","Akagera","Nyungwe",
"Kampala","Bwindi","Lago Victoria","Murchison Falls",
"Windhoek","Sossusvlei","Etosha","Swakopmund","Fish River Canyon","Skeleton Coast",
"Victoria Falls","Chobe","Parque Hwange","Gran Zimbabue",
"Sídney","Melbourne","Brisbane","Cairns","Uluru","Perth","Gold Coast","Darwin","Adelaide","Hobart","Byron Bay","Whitsundays","Gran Barrera de Coral","Blue Mountains","Tasmania","Phillip Island",
"Auckland","Queenstown","Rotorua","Milford Sound","Wellington","Christchurch","Wanaka","Bay of Islands","Abel Tasman","Franz Josef","Mount Cook",
"Fiyi","Tahití","Bora Bora","Moorea","Samoa","Tonga","Vanuatu","Nueva Caledonia","Islas Cook",
"Colombia","México","Argentina","Perú","Chile","Brasil","Cuba","Costa Rica","Panamá","Ecuador","Bolivia","Paraguay","Uruguay","Venezuela","Honduras","Guatemala","El Salvador","Nicaragua","República Dominicana","Jamaica","Trinidad y Tobago","Barbados","Bahamas","Curazao","Aruba",
"Japón","Tailandia","Indonesia","Vietnam","Singapur","Malasia","Filipinas","China","Corea del Sur","India","Nepal","Sri Lanka","Emiratos Árabes","Turquía","Jordania","Israel","Myanmar","Camboya","Laos","Bután","Maldivas","Bangladesh","Pakistán","Kazajistán","Uzbekistán","Georgia","Armenia","Azerbaiyán",
"España","Francia","Italia","Portugal","Grecia","Alemania","Austria","Suiza","Países Bajos","Bélgica","Reino Unido","Irlanda","Suecia","Noruega","Finlandia","Dinamarca","República Checa","Polonia","Hungría","Croacia","Eslovenia","Eslovaquia","Rumanía","Bulgaria","Serbia","Montenegro","Albania","Kosovo","Macedonia del Norte","Bosnia","Malta","Chipre","Estonia","Letonia","Lituania","Islandia","Andorra","Mónaco","Liechtenstein","Luxemburgo",
"Marruecos","Egipto","Kenia","Sudáfrica","Túnez","Tanzania","Etiopía","Ghana","Senegal","Mozambique","Namibia","Zimbabue","Rwanda","Uganda","Mauritius","Seychelles","Madagascar","Zanzíbar","Cabo Verde",
"Australia","Nueva Zelanda","Fiyi","Polinesia Francesa",
"Estados Unidos","Canadá","Puerto Rico",
];

const TEMPLATES = [
  {id:"col",label:"Semana en Colombia",   dest:"Colombia", emoji:"🇨🇴",cities:[{name:"Bogotá",      emoji:"🏙",days:3,color:"#B45309"},{name:"Medellín",   emoji:"🌺",days:2,color:"#7C3AED"},{name:"Cartagena",  emoji:"🏖",days:3,color:"#0D9488"}]},
  {id:"jap",label:"Ruta Japón 10 días",   dest:"Japón",    emoji:"🇯🇵",cities:[{name:"Tokio",       emoji:"🗼",days:4,color:"#DC2626"},{name:"Kioto",       emoji:"⛩",days:3,color:"#7C3AED"},{name:"Osaka",       emoji:"🏯",days:3,color:"#2563EB"}]},
  {id:"ita",label:"Italia 12 días",       dest:"Italia",   emoji:"🇮🇹",cities:[{name:"Roma",        emoji:"🏛",days:4,color:"#DC2626"},{name:"Florencia",   emoji:"🎨",days:3,color:"#D97706"},{name:"Venecia",     emoji:"🚤",days:2,color:"#2563EB"},{name:"Milán",     emoji:"🛍",days:3,color:"#7C3AED"}]},
  {id:"tai",label:"Tailandia 2 semanas",  dest:"Tailandia",emoji:"🇹🇭",cities:[{name:"Bangkok",    emoji:"🛕",days:4,color:"#D97706"},{name:"Chiang Mai",  emoji:"🐘",days:3,color:"#059669"},{name:"Krabi",       emoji:"🏝",days:4,color:"#0D9488"},{name:"Koh Samui", emoji:"🌴",days:3,color:"#2563EB"}]},
  {id:"mar",label:"Marruecos 10 días",    dest:"Marruecos",emoji:"🇲🇦",cities:[{name:"Marrakech",  emoji:"🕌",days:3,color:"#B45309"},{name:"Fez",         emoji:"🏺",days:3,color:"#7C3AED"},{name:"Chefchaouen", emoji:"💙",days:2,color:"#2563EB"},{name:"Casablanca",emoji:"🌊",days:2,color:"#0D9488"}]},
  {id:"per",label:"Perú & Machu Picchu", dest:"Perú",     emoji:"🇵🇪",cities:[{name:"Lima",        emoji:"🦁",days:2,color:"#DC2626"},{name:"Cusco",       emoji:"🏔",days:4,color:"#D97706"},{name:"Machu Picchu",emoji:"🗿",days:2,color:"#059669"},{name:"Puno",      emoji:"🚣",days:2,color:"#0D9488"}]},
  {id:"gre",label:"Islas griegas",        dest:"Grecia",   emoji:"🇬🇷",cities:[{name:"Atenas",      emoji:"🏛",days:3,color:"#2563EB"},{name:"Santorini",   emoji:"⛵",days:4,color:"#7C3AED"},{name:"Mykonos",     emoji:"🌅",days:3,color:"#0D9488"}]},
  {id:"por",label:"Portugal 8 días",      dest:"Portugal", emoji:"🇵🇹",cities:[{name:"Lisboa",      emoji:"🚋",days:3,color:"#DC2626"},{name:"Sintra",      emoji:"🏰",days:1,color:"#D97706"},{name:"Oporto",      emoji:"🍷",days:3,color:"#B45309"},{name:"Algarve",   emoji:"🏖",days:1,color:"#059669"}]},
];

const CSS = `@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
*{box-sizing:border-box}::-webkit-scrollbar{width:0}`;

const Spin = ({c="#B45309"}) => <span style={{display:"inline-block",width:13,height:13,border:`2px solid ${c}28`,borderTop:`2px solid ${c}`,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>;
const Handle = ({T}) => <div style={{display:"flex",justifyContent:"center",padding:"9px 0 3px",flexShrink:0,background:T.sheet}}><div style={{width:34,height:4,borderRadius:2,background:T.border}}/></div>;

function Sheet({onClose,children,T,zi=200}){
  return(
    <div style={{position:"fixed",inset:0,background:T.overlay,zIndex:zi,display:"flex",alignItems:"flex-end",backdropFilter:"blur(8px)"}} onClick={onClose}>
      <div style={{width:"100%",maxHeight:"94vh",background:T.sheet,borderRadius:"20px 20px 0 0",display:"flex",flexDirection:"column",boxShadow:"0 -8px 60px rgba(0,0,0,.3)",overflow:"hidden",animation:"fadeUp .2s ease"}} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function SheetHead({title,sub,icon,col,onBack,onClose,T}){
  return(
    <div style={{background:col||T.bgNav,padding:"14px 16px",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        {onBack?<button onClick={e=>{e.stopPropagation();onBack();}} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:20,height:30,padding:"0 12px 0 8px",color:"white",cursor:"pointer",fontWeight:700,fontSize:11,display:"flex",alignItems:"center",gap:4,fontFamily:"inherit"}}><span style={{fontSize:15}}>←</span>Atrás</button>:<div/>}
        <button onClick={e=>{e.stopPropagation();onClose();}} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:"50%",width:30,height:30,color:"white",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      </div>
      {icon&&<div style={{fontSize:22,marginBottom:3}}>{icon}</div>}
      <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:19,fontWeight:900,color:"white"}}>{title}</div>
      {sub&&<div style={{fontSize:11,color:"rgba(255,255,255,.6)",marginTop:2}}>{sub}</div>}
    </div>
  );
}

function Expand({label,sub,desc,col,T}){
  const[o,sO]=useState(false);
  return(
    <div style={{borderBottom:`1px solid ${T.border}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",cursor:"pointer"}    } onClick={()=>sO(x=>!x)}>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:T.ink}}>{label}</div>{sub&&<div style={{fontSize:11,color:col||T.gold,marginTop:2,fontWeight:600}}>{sub}</div>}</div>
        <span style={{fontSize:14,color:T.inkLight,marginLeft:8,display:"inline-block",transform:o?"rotate(90deg)":"none",transition:"transform .18s"}}>›</span>
      </div>
      {o&&<div style={{background:T.bgMuted,borderRadius:8,padding:"11px 13px",marginBottom:10,fontSize:13,color:T.inkMuted,lineHeight:1.65}}>{desc}</div>}
    </div>
  );
}

function WorldSearch({value,onChange,T}){
  const[sugg,setSugg]=useState([]);
  const[open,setOpen]=useState(false);
  useEffect(()=>{
    if(!value.trim()){setSugg([]);setOpen(false);return;}
    const q=value.toLowerCase();
    setSugg(WORLD.filter(d=>d.toLowerCase().includes(q)).slice(0,7));
    setOpen(true);
  },[value]);
  return(
    <div style={{position:"relative"}}>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder="Escribe un país o ciudad…"
        onFocus={()=>sugg.length>0&&setOpen(true)} onBlur={()=>setTimeout(()=>setOpen(false),150)}
        style={{width:"100%",background:T.bgCard,border:`1.5px solid ${T.border}`,borderRadius:12,padding:"13px 16px",fontSize:15,color:T.ink,fontFamily:"inherit",outline:"none",boxSizing:"border-box",transition:"border-color .15s"}}/>
      {value&&<button onClick={()=>{onChange("");setSugg([]);}} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:T.inkLight,cursor:"pointer",fontSize:16}}>✕</button>}
      {open&&sugg.length>0&&(
        <div style={{position:"absolute",left:0,right:0,top:"calc(100% + 4px)",background:T.bgCard,borderRadius:12,overflow:"hidden",border:`1px solid ${T.border}`,zIndex:50,boxShadow:`0 8px 24px rgba(0,0,0,.12)`,animation:"fadeUp .15s ease"}}>
          {sugg.map((s,i)=>(
            <button key={i} onMouseDown={()=>{onChange(s);setOpen(false);}}
              style={{width:"100%",padding:"11px 16px",background:"transparent",border:"none",borderBottom:i<sugg.length-1?`1px solid ${T.border}`:"none",color:T.ink,textAlign:"left",cursor:"pointer",fontFamily:"inherit",fontSize:13,display:"flex",alignItems:"center",gap:8}}
              onMouseEnter={e=>e.currentTarget.style.background=T.bgMuted}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              🔍 {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAP VIEW (Fixed initialisation and leak crashers)
// ─────────────────────────────────────────────────────────────────────────────
function MapView({cities,T,onClose}){
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const [status, setStatus] = useState("Cargando mapa…");
  const [coords, setCoords] = useState(null); 

  useEffect(()=>{
    let cancelled = false;
    async function geocodeAll(){
      const results = [];
      for(const c of cities){
        if(cancelled) return;
        try{
          const q = encodeURIComponent(`${c.name}${c.country?", "+c.country:""}`);
          const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
            {headers:{"Accept-Language":"es","User-Agent":"VoyagerAI/1.0"}});
          const j = await r.json();
          if(j[0]) results.push({lat:+j[0].lat, lon:+j[0].lon, city:c});
          await new Promise(res=>setTimeout(res,350)); 
        }catch(e){console.error(e);}
      }
      if(!cancelled) {
        setCoords(results);
        if(results.length === 0) setStatus("No se pudieron geolocalizar los destinos.");
      }
    }
    geocodeAll();
    return ()=>{cancelled=true;};
  },[cities]);

  useEffect(()=>{
    if(!coords || coords.length===0 || !mapRef.current) return;
    if(mapInst.current) return; 

    if(!document.getElementById("leaflet-css")){
      const link = document.createElement("link");
      link.id="leaflet-css"; link.rel="stylesheet";
      link.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }

    if(window.L){
      initMap();
    } else {
      const s = document.createElement("script");
      s.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      s.onload = initMap;
      document.head.appendChild(s);
    }

    function initMap(){
      if(!mapRef.current) return;
      const L = window.L;
      const center = [coords[0].lat, coords[0].lon];
      const map = L.map(mapRef.current,{zoomControl:true,scrollWheelZoom:true}).setView(center,5);
      mapInst.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
        attribution:"© OpenStreetMap contributors", maxZoom:19
      }).addTo(map);

      const latlngs = coords.map(c=>[c.lat,c.lon]);
      if(latlngs.length>1){
        L.polyline(latlngs,{color:"#B45309",weight:3,opacity:.75,dashArray:"8,6"}).addTo(map);
      }

      coords.forEach(({lat,lon,city},i)=>{
        const color = city.color||"#B45309";
        const icon = L.divIcon({
          html:`<div style="background:${color};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,.4);border:2.5px solid white;">${city.emoji||"📍"}</div>`,
          iconSize:[32,32], iconAnchor:[16,16], className:""
        });
        const marker = L.marker([lat,lon],{icon}).addTo(map);
        marker.bindPopup(`
          <div style="font-family:'DM Sans',sans-serif;min-width:160px;padding:4px">
            <div style="font-size:15px;font-weight:700;margin-bottom:3px">${city.emoji} ${city.name}</div>
            <div style="font-size:11px;color:#78716C">${fmt(city.from)} → ${fmt(city.to)} · ${city.nights||0} noches</div>
            ${city.hotel?.name?`<div style="font-size:11px;margin-top:4px">🏨 ${city.hotel.name}</div>`:""}
          </div>
        `);
        if(i===0) marker.openPopup();
      });

      if(coords.length>1){
        map.fitBounds(latlngs, {padding:[24,24]});
      }
      setStatus(null);
    }
  },[coords]);

  useEffect(()=>()=>{
    if(mapInst.current){
      mapInst.current.remove();
      mapInst.current=null;
    }
  },[]);

  return(
    <Sheet onClose={onClose} T={T} zi={250}>
      <Handle T={T}/>
      <SheetHead title="Mapa del viaje" sub={cities.map(c=>c.emoji+" "+c.name).join(" → ")} icon="🗺" T={T} onClose={onClose}/>
      <div style={{position:"relative",flex:1,minHeight:320}}>
        {status&&(
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:10,color:T.inkMuted,background:T.bgMuted,zIndex:1}}>
            <Spin c={T.gold}/><div style={{fontSize:13}}>{status}</div>
          </div>
        )}
        <div ref={mapRef} style={{width:"100%",height:"100%",minHeight:320}}/>
      </div>
      <div style={{background:T.sheet,borderTop:`1px solid ${T.border}`,padding:"10px 16px 20px",overflowX:"auto",flexShrink:0}}>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"nowrap"}}>
          {cities.map((c,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
              <div style={{background:`${c.color}18`,border:`1px solid ${c.color}55`,borderRadius:20,padding:"3px 9px",display:"flex",alignItems:"center",gap:4,cursor:"pointer"}} onClick={()=>{
                if(coords&&mapInst.current){
                  const m=coords.find(x=>x.city.name===c.name);
                  if(m)mapInst.current.flyTo([m.lat,m.lon],10,{animate:true,duration:1.2});
                }
              }}>
                <span style={{fontSize:11}}>{c.emoji}</span>
                <span style={{fontSize:10,color:T.ink,fontWeight:700}}>{c.name}</span>
              </div>
              {i<cities.length-1&&<span style={{color:T.inkLight,fontSize:12}}>→</span>}
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF EXPORT
// ─────────────────────────────────────────────────────────────────────────────
function ExportPDF({trip,T,onClose}){
  const [generating,setGenerating] = useState(false);
  const [done,setDone] = useState(false);

  const generate = async () => {
    setGenerating(true);
    try{
      if(!window.jspdf){
        await new Promise((res,rej)=>{
          const s=document.createElement("script");
          s.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          s.onload=res; s.onerror=rej;
          document.head.appendChild(s);
        });
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});

      const W = 210; const margin = 16;
      let y = 0;

      const header = (text, sub, color="#1A1714") => {
        doc.setFillColor(color);
        doc.rect(0, y, W, 28, "F");
        doc.setTextColor(255,255,255);
        doc.setFontSize(20); doc.setFont("helvetica","bold");
        doc.text(text, margin, y+13);
        if(sub){ doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.text(sub, margin, y+21); }
        y += 32;
      };

      const label = (txt) => {
        doc.setFontSize(8); doc.setFont("helvetica","bold");
        doc.setTextColor(120,113,108);
        doc.text(txt.toUpperCase(), margin, y); y += 5;
      };

      const body = (txt, indent=0) => {
        if(!txt) return;
        doc.setFontSize(10); doc.setFont("helvetica","normal");
        doc.setTextColor(28,25,23);
        const lines = doc.splitTextToSize(txt, W - margin*2 - indent);
        lines.forEach(line => {
          if(y > 270){ doc.addPage(); y = margin; }
          doc.text(line, margin+indent, y); y += 5;
        });
        y += 2;
      };

      const divider = () => {
        doc.setDrawColor(229,221,212); doc.setLineWidth(0.3);
        doc.line(margin, y, W-margin, y); y += 4;
      };

      const checkPage = (need=30) => {
        if(y + need > 280){ doc.addPage(); y = margin; }
      };

      doc.setFillColor(26,23,20);
      doc.rect(0,0,W,297,"F");
      doc.setFillColor(180,83,9);
      doc.rect(0,120,W,4,"F");
      doc.setTextColor(255,255,255);
      doc.setFontSize(36); doc.setFont("helvetica","bold");
      doc.text("VOYAGER", margin, 80);
      doc.setFontSize(12); doc.setFont("helvetica","normal");
      doc.setTextColor(180,83,9);
      doc.text("✦  AI TRAVEL PLANNER", margin, 92);
      doc.setTextColor(255,255,255);
      doc.setFontSize(28); doc.setFont("helvetica","bold");
      doc.text(trip.dest||trip.name, margin, 145);
      doc.setFontSize(11); doc.setFont("helvetica","normal");
      doc.setTextColor(168,162,158);
      const totalNights = trip.cities.reduce((s,c)=>s+(c.nights||0),0);
      doc.text(`${MONTHS[trip.month]} ${trip.year}  ·  ${totalNights} noches  ·  ${trip.cities.length} destinos`, margin, 158);

      let cx = margin;
      trip.cities.forEach(c=>{
        doc.setDrawColor(255,255,255);
        doc.setTextColor(255,255,255);
        doc.setFontSize(9);
        const w = doc.getTextWidth(`${c.emoji} ${c.name}`) + 8;
        doc.roundedRect(cx, 170, w, 8, 2, 2, "S");
        doc.text(`${c.emoji} ${c.name}`, cx+4, 175.5);
        cx += w + 4;
        if(cx > W-margin){ cx=margin; }
      });

      doc.setTextColor(120,113,108);
      doc.setFontSize(8);
      doc.text(`Generado por Voyager AI  ·  ${new Date().toLocaleDateString("es-ES")}`, margin, 285);

      doc.addPage(); y = margin;

      header("Resumen del viaje", `${trip.name}  ·  ${totalNights} noches`);
      trip.cities.forEach((c)=>{
        checkPage(20);
        const rgb = hexToRgb(c.color||"#B45309");
        doc.setFillColor(rgb[0], rgb[1], rgb[2]);
        doc.roundedRect(margin, y, W-margin*2, 16, 3, 3, "F");
        doc.setTextColor(28,25,23); doc.setFontSize(11); doc.setFont("helvetica","bold");
        doc.text(`${c.emoji}  ${c.name}`, margin+7, y+6.5);
        doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor(120,113,108);
        doc.text(`${fmt(c.from)} → ${fmt(c.to)}  ·  ${c.nights||0} noches`, margin+7, y+12);
        y += 20;
      });

      if(trip.budget?.total){
        y += 4; divider();
        label("Presupuesto total");
        body(`€${trip.budget.total}`);
        if(trip.budget.items?.length>0){
          const spent = trip.budget.items.reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
          body(`Gastado: €${spent.toFixed(0)} / Disponible: €${(parseFloat(trip.budget.total)-spent).toFixed(0)}`);
        }
      }

      if(trip.traslados?.length>0){
        y += 4; divider();
        label("Traslados");
        trip.traslados.forEach(t=>{
          const icon = {avión:"✈",tren:"▶",bus:"■",coche:"●",barco:"◆",otro:"○"}[t.type]||"○";
          body(`${icon}  ${t.from} → ${t.to}${t.date?" · "+t.date:""}${t.cost?"  €"+t.cost:""}`);
        });
      }

      for(const c of trip.cities){
        doc.addPage(); y = margin;
        header(`${c.emoji}  ${c.name}`, `${fmt(c.from)} → ${fmt(c.to)}  ·  ${c.nights||0} noches`, c.color||"#1A1714");

        if(c.desc){ label("Sobre este destino"); body(c.desc); divider(); }

        if(c.attractions?.length>0){
          label("Atracciones principales");
          c.attractions.forEach(a=>{ body(`• ${a.name}${a.price?"  ("+a.price+")":""}`, 2); if(a.desc) body(a.desc,6); });
          divider();
        }

        if(c.food?.length>0){
          checkPage(30);
          label("Gastronomía local");
          c.food.forEach(f=>{ body(`• ${f.name}`, 2); if(f.desc) body(f.desc,6); });
          divider();
        }

        if(c.hotel?.name){
          checkPage(25);
          label("Alojamiento");
          body(`🏨  ${c.hotel.name}`);
          if(c.hotel.addr) body(`📍  ${c.hotel.addr}`);
          if(c.hotel.cost) body(`💶  ${c.hotel.cost}`);
          if(c.hotel.notes) body(c.hotel.notes);
          divider();
        }

        if(c.notes){ checkPage(20); label("Notas"); body(c.notes); }
      }

      if(trip.notes){
        doc.addPage(); y = margin;
        header("Notas generales", trip.name);
        body(trip.notes);
      }

      doc.save(`${trip.name.replace(/\s+/g,"-")}.pdf`);
      setDone(true);
    }catch(e){
      console.error("PDF error",e);
      alert("Error al generar el PDF. Inténtalo de nuevo.");
    }
    setGenerating(false);
  };

  return(
    <Sheet onClose={onClose} T={T} zi={250}>
      <Handle T={T}/>
      <SheetHead title="Exportar PDF" sub={trip.name} icon="📄" T={T} onClose={onClose}/>
      <div style={{flex:1,padding:"20px 20px 40px",display:"flex",flexDirection:"column",gap:14,overflowY:"auto",background:T.sheet}}>
        <div style={{background:T.bgMuted,borderRadius:12,padding:16}}>
          <div style={{fontSize:10,color:T.inkMuted,letterSpacing:2,marginBottom:12,fontWeight:700}}>CONTENIDO DEL PDF</div>
          {["📋 Portada con destino y fechas","📅 Resumen de ruta y presupuesto","📍 Página por cada ciudad con info IA","🍽 Gastronomía de cada destino","🏨 Hoteles y notas","✈ Traslados y notas generales"].map((l,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:T.gold,flexShrink:0}}/>
              <div style={{fontSize:13,color:T.ink}}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {trip.cities.map((c,i)=>(
            <div key={i} style={{background:`${c.color}18`,border:`1px solid ${c.color}55`,borderRadius:20,padding:"3px 10px",display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontSize:12}}>{c.emoji}</span>
              <span style={{fontSize:11,color:T.ink,fontWeight:600}}>{c.name}</span>
            </div>
          ))}
        </div>

        {done?(
          <div style={{background:`${T.green}15`,border:`1px solid ${T.green}`,borderRadius:12,padding:14,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>✅</span>
            <div><div style={{fontSize:14,fontWeight:700,color:T.green}}>PDF descargado</div><div style={{fontSize:12,color:T.inkMuted,marginTop:2}}>Comprueba tu carpeta de descargas</div></div>
          </div>
        ):(
          <button onClick={generate} disabled={generating}
            style={{marginTop:"auto",background:generating?"#ccc":T.bgNav,border:"none",borderRadius:14,padding:"15px",color:"white",fontWeight:700,fontSize:14,cursor:generating?"default":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:generating?"none":`0 4px 20px rgba(0,0,0,.3)`}}>
            {generating?<><Spin c="white"/> Generando PDF…</>:<>📄 Descargar PDF</>}
          </button>
        )}
      </div>
    </Sheet>
  );
}

function hexToRgb(hex){
  const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r?[parseInt(r[1],16),parseInt(r[2],16),parseInt(r[3],16)]:[26,23,20];
}

// ─────────────────────────────────────────────────────────────────────────────
// FLIGHT ALERTS
// ─────────────────────────────────────────────────────────────────────────────
function FlightAlertsSheet({trip,T,onClose}){
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(true);

  useEffect(() => {
    const k = localStorage.getItem("avstack_key");
    if(k) {
      setApiKey(k);
      setShowKeyInput(false);
    }
  }, []);

  const flightNums = (trip.traslados||[])
    .map(t=>{
      const m = (t.notes||"").match(/\b([A-Z]{2,3}\d{3,4})\b/i);
      return m?{num:m[1].toUpperCase(),from:t.from,to:t.to,date:t.date}:null;
    }).filter(Boolean);

  const checkFlights = async () => {
    if(!apiKey||flightNums.length===0) return;
    setLoading(true);
    const results = [];
    for(const f of flightNums){
      try{
        const url = `https://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${f.num}&limit=1`;
        const r = await fetch(url);
        const j = await r.json();
        const fl = j.data?.[0];
        if(fl){
          results.push({
            num: f.num,
            from: f.from, to: f.to,
            status: fl.flight_status,
            dep: fl.departure?.scheduled,
            depDelay: fl.departure?.delay,
            arr: fl.arrival?.scheduled,
            arrDelay: fl.arrival?.delay,
            airline: fl.airline?.name,
          });
        }
      }catch(e){console.error(e);}
    }
    setFlights(results);
    setLoading(false);
  };

  const saveKey = () => {
    localStorage.setItem("avstack_key", apiKey);
    setShowKeyInput(false);
    checkFlights();
  };

  const statusColor = s => s==="active"?T.green:s==="landed"?T.gold:s==="cancelled"?T.red:T.inkMuted;
  const statusLabel = s => ({active:"EN VUELO",landed:"ATERRIZADO",cancelled:"CANCELADO",scheduled:"PROGRAMADO",diverted:"DESVIADO"}[s]||s?.toUpperCase()||"—");

  return(
    <Sheet onClose={onClose} T={T} zi={250}>
      <Handle T={T}/>
      <SheetHead title="Alertas de vuelo" sub={trip.name} icon="✈" T={T} onClose={onClose}/>
      <div style={{flex:1,overflowY:"auto",padding:"16px 16px 36px",background:T.sheet}}>

        {showKeyInput?(
          <div style={{background:T.bgMuted,borderRadius:12,padding:16,marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:T.ink,marginBottom:4}}>Configurar AviationStack</div>
            <div style={{fontSize:12,color:T.inkMuted,marginBottom:12,lineHeight:1.6}}>
              Para consultar el estado de vuelos en tiempo real, necesitas una clave gratuita de AviationStack.<br/>
              Regístrate en <strong style={{color:T.gold}}>aviationstack.com</strong> y pega tu clave aquí:
            </div>
            <input value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="tu_clave_api_aquí"
              style={{width:"100%",background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",fontSize:13,color:T.ink,fontFamily:"inherit",outline:"none",marginBottom:8,boxSizing:"border-box"}}/>
            <button onClick={saveKey} style={{width:"100%",background:T.gold,border:"none",borderRadius:8,padding:"11px",color:"white",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Guardar y consultar</button>
          </div>
        ):(
          <button onClick={()=>setShowKeyInput(true)} style={{background:"none",border:"none",color:T.inkMuted,fontSize:12,cursor:"pointer",fontFamily:"inherit",marginBottom:12,display:"block",textDecoration:"underline"}}>✎ Cambiar clave API</button>
        )}

        {flightNums.length===0?(
          <div style={{textAlign:"center",padding:"20px 0",color:T.inkMuted}}>
            <div style={{fontSize:32,marginBottom:8}}>✈</div>
            <div style={{fontSize:13,lineHeight:1.65}}>
              Para detectar vuelos automáticamente, añade el número de vuelo en las notas de cada traslado.<br/>
              <span style={{color:T.gold}}>Ejemplo: "IB3451" o "VY1234"</span>
            </div>
          </div>
        ):(
          <>
            <div style={{fontSize:10,color:T.inkMuted,letterSpacing:2,marginBottom:10,fontWeight:700}}>VUELOS DETECTADOS</div>
            {flightNums.map((f,i)=>(
              <div key={i} style={{background:T.bgMuted,borderRadius:12,padding:14,marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{background:T.bgNav,borderRadius:8,padding:"6px 12px",color:T.gold,fontWeight:800,fontSize:14,letterSpacing:1}}>{f.num}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.ink}}>{f.from} → {f.to}</div>
                    {f.date&&<div style={{fontSize:11,color:T.inkMuted,marginTop:2}}>{f.date}</div>}
                  </div>
                </div>
                {flights.find(x=>x.num===f.num)&&(()=>    {
                  const fl = flights.find(x=>x.num===f.num);
                  return(
                    <div style={{marginTop:10,borderTop:`1px solid ${T.border}`,paddingTop:8}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:statusColor(fl.status)}}/>
                        <div style={{fontSize:11,fontWeight:700,color:statusColor(fl.status)}}>{statusLabel(fl.status)}</div>
                        {fl.airline&&<div style={{fontSize:11,color:T.inkMuted,marginLeft:"auto"}}>{fl.airline}</div>}
                      </div>
                      {fl.dep&&<div style={{fontSize:11,color:T.inkMuted}}>Salida: {new Date(fl.dep).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}{fl.depDelay>0?<span style={{color:T.red}}> (+{fl.depDelay} min)</span>:null}</div>}
                      {fl.arr&&<div style={{fontSize:11,color:T.inkMuted}}>Llegada: {new Date(fl.arr).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}{fl.arrDelay>0?<span style={{color:T.red}}> (+{fl.arrDelay} min)</span>:null}</div>}
                    </div>
                  );
                })()}
              </div>
            ))}
            <button onClick={checkFlights} disabled={loading||!apiKey}
              style={{width:"100%",background:apiKey&&!loading?T.bgNav:"#ccc",border:"none",borderRadius:12,padding:"12px",color:"white",fontWeight:700,fontSize:13,cursor:apiKey&&!loading?"pointer":"default",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:4}}>
              {loading?<><Spin c="white"/>Consultando…</>:<>🔄 Actualizar estado</>}
            </button>
          </>
        )}
      </div>
    </Sheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARE / FIREBASE SYNC
// ─────────────────────────────────────────────────────────────────────────────
function ShareSheet({trip,onClose,onImportTrip,T}){
  const [mode, setMode] = useState("share"); 
  const [shareCode, setShareCode] = useState(trip.shareCode||"");
  const [importCode, setImportCode] = useState("");
  const [fbUrl, setFbUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [showFbSetup, setShowFbSetup] = useState(true);

  useEffect(() => {
    const url = localStorage.getItem("fb_url");
    if(url) {
      setFbUrl(url);
      setShowFbSetup(false);
    }
  }, []);

  const saveFb = () => {
    const url = fbUrl.trim().replace(/\/$/, "");
    localStorage.setItem("fb_url", url);
    setShowFbSetup(false);
    setMsg("✅ Firebase configurado");
  };

  const pushTrip = async () => {
    const url = localStorage.getItem("fb_url");
    if(!url){ setShowFbSetup(true); return; }
    setLoading(true); setMsg("");
    try{
      const code = shareCode || Math.random().toString(36).slice(2,8).toUpperCase();
      const r = await fetch(`${url}/trips/${code}.json`, {
        method:"PUT",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({...trip, shareCode:code, sharedAt:new Date().toISOString()})
      });
      if(r.ok){
        setShareCode(code);
        setMsg("✅ Viaje publicado. Comparte el código con tu compañero.");
      } else { setMsg("❌ Error al publicar. Verifica tu URL de Firebase."); }
    }catch(e){ setMsg("❌ Error de red. Revisa la URL de Firebase."); }
    setLoading(false);
  };

  const pullTrip = async () => {
    const url = localStorage.getItem("fb_url");
    if(!url){ setShowFbSetup(true); return; }
    if(!importCode.trim()){ setMsg("Introduce un código de viaje."); return; }
    setLoading(true); setMsg("");
    try{
      const r = await fetch(`${url}/trips/${importCode.trim().toUpperCase()}.json`);
      const j = await r.json();
      if(j && j.name){
        onImportTrip({...j, id:Date.now()});
        setMsg("✅ Viaje importado correctamente.");
      } else { setMsg("❌ Código no encontrado."); }
    }catch(e){ setMsg("❌ Error al importar."); }
    setLoading(false);
  };

  return(
    <Sheet onClose={onClose} T={T} zi={250}>
      <Handle T={T}/>
      <SheetHead title="Compartir viaje" sub={trip.name} icon="🔗" T={T} onClose={onClose}/>
      <div style={{flex:1,overflowY:"auto",padding:"16px 16px 36px",background:T.sheet}}>

        {showFbSetup?(
          <div style={{background:T.bgMuted,borderRadius:12,padding:16,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:T.ink,marginBottom:6}}>Conectar Firebase (gratis)</div>
            <div style={{fontSize:12,color:T.inkMuted,marginBottom:12,lineHeight:1.7}}>
              1. Crea un proyecto en Firebase -> Realtime Database.<br/>
              2. Reglas de seguridad: pon read: true, write: true.<br/>
              3. Copia la URL de la base de datos:
            </div>
            <input value={fbUrl} onChange={e=>setFbUrl(e.target.value)} placeholder="https://tu-proyecto.firebaseio.com"
              style={{width:"100%",background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",fontSize:13,color:T.ink,fontFamily:"inherit",outline:"none",marginBottom:8,boxSizing:"border-box"}}/>
            <button onClick={saveFb} style={{width:"100%",background:T.gold,border:"none",borderRadius:8,padding:"11px",color:"white",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Guardar</button>
          </div>
        ):(
          <button onClick={()=>setShowFbSetup(true)} style={{background:"none",border:"none",color:T.inkMuted,fontSize:12,cursor:"pointer",fontFamily:"inherit",marginBottom:12,display:"block",textDecoration:"underline"}}>✎ Cambiar configuración Firebase</button>
        )}

        <div style={{display:"flex",gap:0,marginBottom:16,background:T.bgMuted,borderRadius:10,padding:3}}>
          {[["share","📤 Publicar"],["import","📥 Importar"]].map(([k,l])=>(
            <button key={k} onClick={()=>setMode(k)} style={{flex:1,padding:"9px",background:mode===k?T.bgCard:"transparent",border:"none",borderRadius:8,color:mode===k?T.ink:T.inkMuted,fontWeight:mode===k?700:500,fontSize:13,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>{l}</button>
          ))}
        </div>

        {mode==="share"&&<>
          <div style={{fontSize:12,color:T.inkMuted,lineHeight:1.65,marginBottom:14}}>
            Publica tu viaje en la nube y comparte el código de 6 dígitos.
          </div>
          {shareCode&&(
            <div style={{background:`${T.gold}15`,border:`1px solid ${T.gold}`,borderRadius:12,padding:16,marginBottom:14,textAlign:"center"}}>
              <div style={{fontSize:11,color:T.inkMuted,letterSpacing:2,marginBottom:4,fontWeight:700}}>CÓDIGO DE VIAJE</div>
              <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:36,fontWeight:900,color:T.gold,letterSpacing:6}}>{shareCode}</div>
              <button onClick={()=>navigator.clipboard.writeText(shareCode)} style={{background:"none",border:"none",color:T.inkMuted,fontSize:12,cursor:"pointer",marginTop:4,fontFamily:"inherit"}}>📋 Copiar código</button>
            </div>
          )}
          <button onClick={pushTrip} disabled={loading}
            style={{width:"100%",background:loading?"#ccc":T.bgNav,border:"none",borderRadius:12,padding:"13px",color:"white",fontWeight:700,fontSize:14,cursor:loading?"default":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {loading?<><Spin c="white"/>Publicando…</>:<>📤 {shareCode?"Actualizar":"Publicar"} viaje</>}
          </button>
        </>}

        {mode==="import"&&<>
          <div style={{fontSize:12,color:T.inkMuted,lineHeight:1.65,marginBottom:14}}>
            Introduce el código de 6 dígitos compartido para importar el itinerario.
          </div>
          <input value={importCode} onChange={e=>setImportCode(e.target.value.toUpperCase())}
            placeholder="ABC123" maxLength={6}
            style={{width:"100%",background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"13px 14px",fontSize:22,letterSpacing:6,fontWeight:700,color:T.ink,fontFamily:"'Playfair Display',Georgia,serif",outline:"none",textAlign:"center",marginBottom:10,boxSizing:"border-box"}}/>
          <button onClick={pullTrip} disabled={loading||importCode.length!==6}
            style={{width:"100%",background:loading||importCode.length!==6?"#ccc":T.gold,border:"none",borderRadius:12,padding:"13px",color:"white",fontWeight:700,fontSize:14,cursor:loading||importCode.length!==6?"default":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            {loading?<><Spin c="white"/>Importando…</>:<>📥 Importar viaje</>}
          </button>
        </>}

        {msg&&<div style={{marginTop:12,padding:"10px 14px",background:`${msg.startsWith("✅")?T.green:T.red}18`,borderRadius:8,fontSize:13,color:msg.startsWith("✅")?T.green:T.red,fontWeight:600}}>{msg}</div>}
      </div>
    </Sheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CITY SHEET
// ─────────────────────────────────────────────────────────────────────────────
function CitySheet({city,onClose,onBack,onUpdate,T}){
  const[tab,sT]=useState("info");
  const[loading,sL]=useState(false);
  const[d,sD]=useState({desc:city.desc||"",attractions:city.attractions||[],food:city.food||[],hotel:city.hotel||{name:"",addr:"",cost:"",notes:""},transport:city.transport||"",notes:city.notes||""});

  useEffect(()=>{
    if(!city.desc&&!city.attractions?.length){
      sL(true);
      callAI(`Información turística de ${city.name}${city.country?", "+city.country:""}.
JSON exacto (sin ningún texto adicional):
{"desc":"2-3 frases del destino","attractions":[{"name":"emoji+nombre","price":"precio €","desc":"2 frases"}],"food":[{"name":"emoji+nombre del plato","desc":"descripción y dónde probarlo, 2 frases"}],"transport":"cómo llegar y moverse (2 frases)"}
Devuelve 4-5 atracciones y EXACTAMENTE 4 platos típicos locales con emojis de comida.`)
      .then(t=>{try{const p=JSON.parse(t);const u={...d,...p};sD(u);onUpdate({...city,...u});}catch(e){console.error(e);}sL(false);})
      .catch(()=>sL(false));
    }
  }, [city.id]); // Fixed dependencies to clear strict linters

  const upd=(k,v)=>{const nd={...d,[k]:v};sD(nd);onUpdate({...city,...nd});};
  const col=city.color||"#B45309";
  const weather=getWeather(city.country,city.from?+city.from.split("-")[1]-1:0);
  const TABS=[["info","◎ Info"],["hotel","🏨 Hotel"],["food","🍽 Comida"],["notas","✐ Notas"]];

  return(
    <Sheet onClose={onClose} T={T} zi={300}>
      <Handle T={T}/>
      <div style={{background:`linear-gradient(135deg,${col},${col}88)`,padding:"14px 16px 18px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          {onBack?<button onClick={e=>{e.stopPropagation();onBack();}} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:20,height:30,padding:"0 12px 0 8px",color:"white",cursor:"pointer",fontWeight:700,fontSize:11,display:"flex",alignItems:"center",gap:4,fontFamily:"inherit"}}><span style={{fontSize:15}}>←</span>Atrás</button>:<div/>}
          <button onClick={e=>{e.stopPropagation();onClose();}} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:"50%",width:30,height:30,color:"white",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:28,marginBottom:4}}>{city.emoji||"📍"}</div>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,fontWeight:900,color:"white"}}>{city.name}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.7)",marginTop:2}}>{fmt(city.from)} → {fmt(city.to)} · {city.nights||0} noches</div>
          </div>
          <div style={{background:"rgba(255,255,255,.18)",borderRadius:12,padding:"8px 12px",textAlign:"center"}}>
            <div style={{fontSize:22}}>{weather}</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,.7)",marginTop:2,fontWeight:700}}>CLIMA</div>
          </div>
        </div>
      </div>
      <div style={{display:"flex",borderBottom:`1px solid ${T.tabBorder}`,flexShrink:0,background:T.sheet}}>
        {TABS.map(([k,l])=><button key={k} style={{flex:1,padding:"10px 4px",background:"none",border:"none",borderBottom:tab===k?`2.5px solid ${col}`:"2.5px solid transparent",fontSize:11,cursor:"pointer",color:tab===k?col:T.inkMuted,fontWeight:tab===k?700:500,fontFamily:"inherit",transition:"color .15s"}} onClick={()=>sT(k)}>{l}</button>)}
      </div>
      <div style={{overflowY:"auto",padding:"16px 16px 36px",flex:1,background:T.sheet}}>
        {loading&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,padding:"36px 0",color:T.inkMuted}}><Spin c={col}/><div style={{fontSize:13}}>✦ Generando con IA…</div></div>}
        {!loading&&tab==="info"&&<>
          <div style={{fontSize:10,color:T.inkMuted,letterSpacing:2,marginBottom:8,fontWeight:700}}>DESCRIPCIÓN</div>
          <textarea value={d.desc} onChange={e=>upd("desc",e.target.value)} placeholder="Describe este destino…"
            style={{width:"100%",background:T.bgMuted,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 11px",fontSize:13,fontFamily:"inherit",resize:"none",outline:"none",lineHeight:1.65,color:T.ink,minHeight:65,marginBottom:14,boxSizing:"border-box"}}/>
          <div style={{fontSize:10,color:T.inkMuted,letterSpacing:2,marginBottom:8,fontWeight:700}}>ATRACCIONES</div>
          {(d.attractions||[]).map((a,i)=><Expand key={i} label={a.name} sub={a.price} desc={a.desc} col={col} T={T}/>)}
          {d.transport&&<><div style={{fontSize:10,color:T.inkMuted,letterSpacing:2,margin:"14px 0 8px",fontWeight:700}}>TRANSPORTE</div><div style={{background:T.bgMuted,borderRadius:8,padding:"11px 13px",fontSize:13,color:T.inkMuted,lineHeight:1.65}}>{d.transport}</div></>}
        </>}
        {!loading&&tab==="hotel"&&<>
          <div style={{background:T.bgMuted,borderRadius:12,padding:14,borderLeft:`4px solid ${col}`,marginBottom:12}}>
            <input value={d.hotel?.name||""} onChange={e=>upd("hotel",{...d.hotel,name:e.target.value})} placeholder="Nombre del hotel"
              style={{width:"100%",background:"transparent",border:"none",outline:"none",fontSize:14,fontWeight:700,color:T.ink,fontFamily:"inherit",marginBottom:5,borderBottom:`1px dashed ${T.border}`,paddingBottom:3}}/>
            <input value={d.hotel?.addr||""} onChange={e=>upd("hotel",{...d.hotel,addr:e.target.value})} placeholder="Dirección o zona"
              style={{width:"100%",background:"transparent",border:"none",outline:"none",fontSize:12,color:T.inkMuted,fontFamily:"inherit",marginBottom:5,borderBottom:`1px dashed ${T.border}`,paddingBottom:3}}/>
            <input value={d.hotel?.cost||""} onChange={e=>upd("hotel",{...d.hotel,cost:e.target.value})} placeholder="Coste total"
              style={{width:"100%",background:"transparent",border:"none",outline:"none",fontSize:13,fontWeight:700,color:T.green,fontFamily:"inherit"}}/>
          </div>
          <textarea value={d.hotel?.notes||""} onChange={e=>upd("hotel",{...d.hotel,notes:e.target.value})} placeholder="Reserva, check-in, notas…"
            style={{width:"100%",background:T.bgMuted,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 11px",fontSize:13,fontFamily:"inherit",resize:"none",outline:"none",lineHeight:1.65,color:T.ink,minHeight:75,boxSizing:"border-box"}}/>
        </>}
        {!loading&&tab==="food"&&<>
          <div style={{fontSize:10,color:T.inkMuted,letterSpacing:2,marginBottom:8,fontWeight:700}}>GASTRONOMÍA LOCAL</div>
          {(d.food||[]).length===0&&<div style={{color:T.inkMuted,fontSize:13,padding:"20px 0",textAlign:"center"}}>Cierra y vuelve a abrir para regenerar.</div>}
          {(d.food||[]).map((f,i)=><Expand key={i} label={f.name} desc={f.desc} col={col} T={T}/>)}
        </>}
        {!loading&&tab==="notas"&&<textarea value={d.notes||""} onChange={e=>upd("notes",e.target.value)} placeholder="Ideas, horarios, confirmaciones…"
          style={{width:"100%",minHeight:200,background:T.bgMuted,border:`1px solid ${T.border}`,borderRadius:12,padding:13,fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none",lineHeight:1.7,color:T.ink,boxSizing:"border-box"}}/>}
      </div>
    </Sheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECONDARY SHEETS
// ─────────────────────────────────────────────────────────────────────────────
function HotelsSheet({trip,onUpdateTrip,onClose,T}){
  return(<Sheet onClose={onClose} T={T} zi={200}><Handle T={T}/>
    <SheetHead title="Hoteles" sub={trip.name} icon="🏨" T={T} onClose={onClose}/>
    <div style={{overflowY:"auto",flex:1,padding:"16px 16px 36px",background:T.sheet}}>
      {trip.cities.map((city,i)=>(
        <div key={i} style={{background:T.bgMuted,borderRadius:12,padding:14,marginBottom:12,borderLeft:`4px solid ${city.color}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{fontSize:18}}>{city.emoji}</span>
            <div style={{fontSize:14,fontWeight:700,color:T.ink}}>{city.name}</div>
            <div style={{fontSize:11,color:T.inkMuted,marginLeft:"auto"}}>{fmt(city.from)} – {fmt(city.to)}</div>
          </div>
          {["name","addr","cost"].map(f=>(
            <input key={f} value={city.hotel?.[f]||""} onChange={e=>{const c={...city,hotel:{...city.hotel,[f]:e.target.value}};onUpdateTrip({...trip,cities:trip.cities.map(x=>x.id===city.id?c:x)});}}
              placeholder={f==="name"?"Nombre del hotel":f==="addr"?"Dirección":"Coste total"}
              style={{width:"100%",background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 11px",fontSize:13,color:f==="cost"?T.green:T.ink,fontWeight:f==="cost"?700:400,fontFamily:"inherit",outline:"none",marginBottom:f==="cost"?0:6,boxSizing:"border-box"}}/>
          ))}
        </div>
      ))}
    </div>
  </Sheet>);
}

function BudgetSheet({trip,onUpdateTrip,onClose,T}){
  const bgt=trip.budget||{total:"",items:[]};
  const items = bgt.items || [];
  const total = bgt.total || "";
  
  const[ni,sNi]=useState({label:"",amount:"",cat:"hotel"});
  const cats={hotel:"🏨",food:"🍽",transport:"🚆",activity:"⭐",seguro:"🛡",visa:"📋",otro:"📌"};
  
  const save=(its,tot)=>onUpdateTrip({...trip,budget:{total:tot,items:its}});
  const spent=items.reduce((s,x)=>s+(parseFloat(x.amount)||0),0);
  const totalN=parseFloat(total)||0;
  const pct=totalN?Math.min(100,Math.round(spent/totalN*100)):0;
  
  const add=()=>{if(!ni.label||!ni.amount)return;const u=[...items,{...ni,id:Date.now()}];save(u,total);sNi({label:"",amount:"",cat:"hotel"});};
  return(<Sheet onClose={onClose} T={T} zi={200}><Handle T={T}/>
    <SheetHead title="Presupuesto" sub={trip.name} icon="◈" T={T} onClose={onClose}/>
    <div style={{overflowY:"auto",flex:1,padding:"16px 16px 36px",background:T.sheet}}>
      <div style={{background:T.bgMuted,borderRadius:12,padding:14,marginBottom:16}}>
        <div style={{fontSize:10,color:T.inkMuted,letterSpacing:2,marginBottom:6,fontWeight:700}}>TOTAL</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18,fontWeight:700,color:T.gold}}>€</span><input value={total} onChange={e=>{save(items,e.target.value);}} placeholder="0" style={{background:"transparent",border:"none",outline:"none",fontSize:26,fontWeight:800,color:T.ink,fontFamily:"'Playfair Display',Georgia,serif",width:"100%"}}/></div>
        {totalN>0&&<><div style={{height:4,background:T.border,borderRadius:2,marginTop:10,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:pct>90?T.red:T.gold,borderRadius:2,transition:"width .5s"}}/></div><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.inkMuted,marginTop:5}}><span>Gastado: <strong style={{color:pct>90?T.red:T.green}}>€{spent.toFixed(0)}</strong></span><span>Disponible: <strong style={{color:T.ink}}>€{(totalN-spent).toFixed(0)}</strong></span></div></>}
      </div>
      {items.map(item=>(
        <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
          <span style={{fontSize:16}}>{cats[item.cat]||"📌"}</span>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:T.ink}}>{item.label}</div><div style={{fontSize:10,color:T.inkMuted,textTransform:"capitalize"}}>{item.cat}</div></div>
          <div style={{fontSize:13,fontWeight:700,color:T.gold}}>€{item.amount}</div>
          <button onClick={()=>{const u=items.filter(x=>x.id!==item.id);save(u,total);}} style={{background:"none",border:"none",color:T.inkLight,cursor:"pointer",fontSize:14}}>⌫</button>
        </div>
      ))}
      <div style={{marginTop:14,background:T.bgMuted,borderRadius:12,padding:14}}>
        <input value={ni.label} onChange={e=>sNi(p=>({...p,label:e.target.value}))} placeholder="Descripción"
          style={{width:"100%",background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 11px",fontSize:13,color:T.ink,fontFamily:"inherit",outline:"none",marginBottom:8,boxSizing:"border-box"}}/>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <input value={ni.amount} onChange={e=>sNi(p=>({...p,amount:e.target.value}))} placeholder="€" type="number"
            style={{flex:1,background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 11px",fontSize:13,color:T.ink,fontFamily:"inherit",outline:"none"}}/>
          <select value={ni.cat} onChange={e=>sNi(p=>({...p,cat:e.target.value}))}
            style={{flex:1,background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"8px 11px",fontSize:13,color:T.ink,fontFamily:"inherit",outline:"none"}}>
            {Object.keys(cats).map(c=><option key={c} value={c}>{cats[c]} {c}</option>)}
          </select>
        </div>
        <button onClick={add} style={{width:"100%",background:T.green,border:"none",borderRadius:8,padding:"10px",color:"white",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>+ Añadir gasto</button>
      </div>
    </div>
  </Sheet>);
}

function TrasladosSheet({trip,onUpdateTrip,onClose,T}){
  const trs=trip.traslados||[];
  const defaultDate = trip.cities?.[0]?.from || "";
  const[ni,sNi]=useState({from:"",to:"",date:defaultDate,type:"avión",cost:"",notes:""});

  const add=()=>{
    if(!ni.from||!ni.to) return;
    onUpdateTrip({...trip, traslados:[...trs,{...ni,id:Date.now()}]});
    sNi({from:"",to:"",date:defaultDate,type:"avión",cost:"",notes:""});
  };

  const fmtTrasladoDate = iso => {
    if(!iso) return "";
    try {
      const [y,m,d] = iso.split("-");
      return `${+d} ${MONTHS[+m-1]?.slice(0,3)} ${y}`;
    } catch { return iso; }
  };

  const inputStyle = {background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 11px",fontSize:13,color:T.ink,fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box"};

  return(<Sheet onClose={onClose} T={T} zi={200}><Handle T={T}/>
    <SheetHead title="Traslados" sub={trip.name} icon="✈" T={T} onClose={onClose}/>
    <div style={{overflowY:"auto",flex:1,padding:"16px 16px 36px",background:T.sheet}}>

      {trs.length===0&&(
        <div style={{textAlign:"center",padding:"24px 0",color:T.inkMuted}}>
          <div style={{fontSize:36,marginBottom:8}}>✈</div>
          <div style={{fontSize:13,lineHeight:1.65}}>Sin traslados. Los que añadas aparecerán en el calendario automáticamente.</div>
        </div>
      )}

      {trs.map(t=>(
        <div key={t.id} style={{background:T.bgMuted,borderRadius:12,padding:13,marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:24,flexShrink:0,lineHeight:1}}>{TI[t.type]||"🗺"}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:T.ink}}>{t.from} → {t.to}</div>
              <div style={{display:"flex",gap:8,marginTop:3,flexWrap:"wrap"}}>
                {t.date&&<span style={{fontSize:11,color:T.inkMuted}}>📅 {fmtTrasladoDate(t.date)}</span>}
                {t.cost&&<span style={{fontSize:11,color:T.gold,fontWeight:700}}>€{t.cost}</span>}
                {t.notes&&<span style={{fontSize:11,color:T.inkMuted}}>{t.notes}</span>}
              </div>
            </div>
            <button onClick={()=>onUpdateTrip({...trip,traslados:trs.filter(x=>x.id!==t.id)})}
              style={{background:`${T.red}15`,border:`1px solid ${T.red}30`,borderRadius:8,width:30,height:30,color:T.red,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>⌫</button>
          </div>
          {t.date&&(
            <div style={{marginTop:8,background:`${T.gold}12`,borderRadius:8,padding:"5px 10px",display:"inline-flex",alignItems:"center",gap:5,border:`1px solid ${T.gold}30`}}>
              <span style={{fontSize:10}}>📅</span>
              <span style={{fontSize:10,color:T.gold,fontWeight:700}}>Marcado en el calendario · día {+t.date.split("-")[2]}</span>
            </div>
          )}
        </div>
      ))}

      <div style={{background:T.bgMuted,borderRadius:12,padding:14,marginTop:8}}>
        <div style={{fontSize:10,color:T.inkMuted,letterSpacing:2,marginBottom:12,fontWeight:700}}>NUEVO TRASLADO</div>

        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
          <input value={ni.from} onChange={e=>sNi(p=>({...p,from:e.target.value}))} placeholder="Origen"
            style={{...inputStyle,flex:1}}/>
          <span style={{color:T.gold,fontSize:16,fontWeight:700,flexShrink:0}}>→</span>
          <input value={ni.to} onChange={e=>sNi(p=>({...p,to:e.target.value}))} placeholder="Destino"
            style={{...inputStyle,flex:1}}/>
        </div>

        <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap"}}>
          {Object.entries(TI).map(([k,icon])=>(
            <button key={k} onClick={()=>sNi(p=>({...p,type:k}))}
              style={{padding:"5px 10px",borderRadius:20,border:`1.5px solid ${ni.type===k?T.gold:T.border}`,background:ni.type===k?T.gold:"transparent",color:ni.type===k?"white":T.inkMuted,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4,transition:"all .14s"}}>
              {icon} {k}
            </button>
          ))}
        </div>

        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,color:T.inkMuted,letterSpacing:1.5,marginBottom:4,fontWeight:600}}>FECHA DEL TRASLADO</div>
          <input
            type="date"
            value={ni.date}
            onChange={e=>sNi(p=>({...p,date:e.target.value}))}
            min={trip.cities?.[0]?.from||""}
            max={trip.cities?.[trip.cities.length-1]?.to||""}
            style={{...inputStyle,colorScheme:T === DARK ? "dark" : "light"}}/>
        </div>

        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <input value={ni.cost} onChange={e=>sNi(p=>({...p,cost:e.target.value}))} placeholder="€ Coste"
            type="number" style={{...inputStyle,flex:1}}/>
          <input value={ni.notes} onChange={e=>sNi(p=>({...p,notes:e.target.value}))} placeholder="Notas (nº vuelo, hora…)"
            style={{...inputStyle,flex:2}}/>
        </div>

        <button onClick={add} disabled={!ni.from||!ni.to}
          style={{width:"100%",background:ni.from&&ni.to?T.gold:"#ccc",border:"none",borderRadius:10,padding:"12px",color:"white",fontWeight:700,fontSize:13,cursor:ni.from&&ni.to?"pointer":"default",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          {TI[ni.type]||"✈"} Añadir traslado{ni.date?` · ${fmtTrasladoDate(ni.date)}`:""}
        </button>
      </div>
    </div>
  </Sheet>);
}

function NotasSheet({trip,onUpdateTrip,onClose,T}){
  return(<Sheet onClose={onClose} T={T} zi={200}><Handle T={T}/>
    <SheetHead title="Notas del viaje" sub={trip.name} icon="✐" T={T} onClose={onClose}/>
    <div style={{flex:1,padding:"16px 16px 36px",display:"flex",flexDirection:"column",background:T.sheet}}>
      <textarea value={trip.notes||""} onChange={e=>onUpdateTrip({...trip,notes:e.target.value})}
        placeholder="Documentos, vacunas, seguros, contactos de emergencia, visados, moneda local, frases útiles…"
        style={{flex:1,minHeight:280,background:T.bgMuted,border:`1px solid ${T.border}`,borderRadius:12,padding:14,fontSize:13,fontFamily:"inherit",resize:"none",outline:"none",lineHeight:1.75,color:T.ink,boxSizing:"border-box"}}/>
    </div>
  </Sheet>);
}

// ─────────────────────────────────────────────────────────────────────────────
// DATE PICKER
// ─────────────────────────────────────────────────────────────────────────────
function DatePicker({title,sub,T,onBack,onNext}){
  const now=new Date();
  const[year,sY]=useState(now.getFullYear());
  const[month,sM]=useState(now.getMonth());
  return(
    <div style={{position:"fixed",inset:0,background:T.bg,display:"flex",flexDirection:"column",zIndex:500}}>
      <div style={{background:T.bgNav,padding:"14px 18px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <button onClick={onBack} style={{background:"rgba(255,255,255,.12)",border:"none",borderRadius:"50%",width:36,height:36,color:"white",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
        <div><div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:17,fontWeight:900,color:"white"}}>{title}</div><div style={{fontSize:10,color:T.gold,letterSpacing:2,fontWeight:700}}>{sub}</div></div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"24px 22px 32px"}}>
        <div style={{fontSize:11,color:T.inkMuted,letterSpacing:2,fontWeight:700,marginBottom:12}}>AÑO</div>
        <div style={{display:"flex",gap:8,marginBottom:28}}>
          {[now.getFullYear(),now.getFullYear()+1,now.getFullYear()+2].map(y=>(
            <button key={y} onClick={()=>sY(y)} style={{flex:1,padding:"12px 0",borderRadius:12,border:`1.5px solid ${year===y?T.gold:T.border}`,background:year===y?T.gold:T.bgCard,color:year===y?"white":T.ink,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>{y}</button>
          ))}
        </div>
        <div style={{fontSize:11,color:T.inkMuted,letterSpacing:2,fontWeight:700,marginBottom:12}}>MES</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {MONTHS.map((m,i)=>(
            <button key={i} onClick={()=>sM(i)} style={{padding:"12px 4px",borderRadius:10,textAlign:"center",border:`1.5px solid ${month===i?T.gold:T.border}`,background:month===i?T.gold:T.bgCard,color:month===i?"white":T.inkMuted,fontSize:11,fontWeight:month===i?700:500,cursor:"pointer",fontFamily:"inherit",transition:"all .14s"}}>{m.slice(0,3).toUpperCase()}</button>
          ))}
        </div>
      </div>
      <div style={{padding:"12px 22px 28px",flexShrink:0,borderTop:`1px solid ${T.border}`,background:T.bg}}>
        <button onClick={()=>onNext(year,month)} style={{width:"100%",background:T.gold,border:"none",borderRadius:14,padding:"15px",color:"white",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 6px 24px ${T.gold}40`}}>Continuar →</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DAY PICKER CALENDAR (Safe immutable props handler)
// ─────────────────────────────────────────────────────────────────────────────
function DayPickerCal({year,month,cities,asgn,sAsgn,activeCity,sAC,T,onBack,onConfirm,allowAddCity,dest}){
  const numDays=dim(year,month);const fd=fdow(year,month);
  const[showAdd,sShowAdd]=useState(false);
  const[newName,sNewName]=useState("");
  const[newEmoji,sNewEmoji]=useState("📍");
  const EMOJIS=["📍","🏙","🏖","🏔","🌺","⛩","🏛","🎨","🚤","🛕","🐘","🕌","🗼","🏯","⛵","🌴","🏝","🚋","🍷","🌊","🏺","💙","🦁","🗿","🚣","🌅","🎭","🌆","🎪","🌿"];

  const cityOfDay=useCallback(day=>{
    const sorted=[...cities].sort((a,b)=>(asgn[a.name]?.from||99)-(asgn[b.name]?.from||99));
    return sorted.find(c=>{const r=asgn[c.name];return r&&day>=r.from&&day<=r.to;})||null;
  },[cities,asgn]);

  const tap=day=>{
    if(!activeCity)return;
    sAsgn(a=>{
      const cur=a[activeCity.name];
      if(!cur)return{...a,[activeCity.name]:{from:day,to:day}};
      if(day>=cur.from&&day<=cur.to){
        if(cur.from===cur.to){const cp={...a};delete cp[activeCity.name];return cp;}
        return{...a,[activeCity.name]:{from:day,to:day}};
      }
      if(day<cur.from)return{...a,[activeCity.name]:{from:day,to:cur.to}};
      return{...a,[activeCity.name]:{from:cur.from,to:day}};
    });
  };

  const addCity=()=>{
    if(!newName.trim())return;
    const c={id: Date.now(), name:newName,emoji:newEmoji,color:PAL[cities.length%PAL.length],country:dest,days:3};
    sAC(c);sShowAdd(false);sNewName("");
  };

  const cBg=T.calBg,cCell=T.calCell,cEmpty=T.calEmpty,cText=T.calText,cDow=T.calDow;

  return(
    <div style={{position:"fixed",inset:0,background:cBg,display:"flex",flexDirection:"column",zIndex:500,fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{background:T.bgNav,padding:"11px 16px 8px",flexShrink:0,display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:"50%",width:36,height:36,color:"white",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
        <div style={{flex:1}}><div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,fontWeight:900,color:"white"}}>{MONTHS[month]} {year}</div><div style={{fontSize:9,color:T.gold,letterSpacing:2,fontWeight:700}}>TOCA PARA ASIGNAR DÍAS</div></div>
        {allowAddCity&&<button onClick={()=>sShowAdd(true)} style={{background:T.gold,border:"none",borderRadius:20,height:30,padding:"0 12px",color:"white",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Ciudad</button>}
      </div>
      <div style={{padding:"6px 12px 4px",flexShrink:0,background:T.bgNav}}>
        <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:2}}>
          {cities.map((c,i)=>{
            const active=activeCity?.name===c.name;const r=asgn[c.name];
            return(
              <button key={i} onClick={()=>sAC(active?null:c)}
                style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:20,border:`1.5px solid ${active?c.color:"rgba(255,255,255,.15)"}`,background:active?`${c.color}35`:"transparent",color:"white",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0,transition:"all .14s",fontSize:11}}>
                <span>{c.emoji}</span><span style={{fontWeight:active?700:500}}>{c.name}</span>
                {r&&<span style={{fontSize:9,color:c.color,fontWeight:700,marginLeft:2}}>{r.from}–{r.to}</span>}
                {active&&r&&<button onMouseDown={e=>{e.stopPropagation();sAsgn(a=>{const cp={...a};delete cp[c.name];return cp;});}} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:"50%",width:14,height:14,color:"white",cursor:"pointer",fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",marginLeft:2,flexShrink:0}}>✕</button>}
              </button>
            );
          })}
        </div>
        {activeCity&&<div style={{fontSize:9,color:activeCity.color,marginTop:3,fontWeight:600,paddingLeft:2}}>Tocando días de {activeCity.name} · toca de nuevo para quitar</div>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,flexShrink:0,marginBottom:1}}>
        {["L","M","X","J","V","S","D"].map(d=><div key={d} style={{background:cDow,color:T.calDowText,textAlign:"center",padding:"5px 0",fontSize:9,fontWeight:700,letterSpacing:1.5}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,flex:1,minHeight:0}}>
        {Array(fd).fill(null).map((_,i)=><div key={`e${i}`} style={{background:cEmpty}}/>)}
        {Array(numDays).fill(null).map((_,i)=>{
          const day=i+1;const owner=cityOfDay(day);
          const isAC=owner&&activeCity&&owner.name===activeCity.name;
          const today=new Date();const todayF=today.getFullYear()===year&&today.getMonth()===month&&today.getDate()===day;
          return(
            <div key={day} onClick={()=>tap(day)}
              style={{background:owner?`${owner.color}${isAC?"40":"22"}`:cEmpty,borderTop:`2px solid ${owner?owner.color:todayF?T.gold:T.calBorder}`,padding:"4px 3px",cursor:activeCity?"pointer":"default",display:"flex",flexDirection:"column",minHeight:0,transition:"background .1s"}}
              onMouseEnter={e=>{if(activeCity)e.currentTarget.style.background=owner?`${owner.color}55`:T.bgMuted;}}
              onMouseLeave={e=>{e.currentTarget.style.background=owner?`${owner.color}${isAC?"40":"22"}`:cEmpty;}}>
              <div style={{fontSize:10,fontWeight:700,color:todayF?T.gold:cText,lineHeight:1}}>{day}</div>
              {owner&&<div style={{fontSize:6,color:owner.color,fontWeight:700,lineHeight:1.2,marginTop:1,overflow:"hidden",whiteSpace:"nowrap"}}>{owner.emoji}</div>}
            </div>
          );
        })}
      </div>
      <div style={{padding:"10px 16px 22px",flexShrink:0,borderTop:`1px solid ${T.border}`,background:cBg}}>
        <button onClick={onConfirm} style={{width:"100%",background:T.gold,border:"none",borderRadius:14,padding:"14px",color:"white",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 6px 24px ${T.gold}50`}}>✓ Crear calendario</button>
      </div>
      {showAdd&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>sShowAdd(false)}>
          <div style={{background:T.sheet,borderRadius:20,padding:22,width:"100%",maxWidth:340,boxShadow:"0 16px 50px rgba(0,0,0,.4)"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,fontWeight:700,color:T.ink,marginBottom:14}}>Añadir ciudad</div>
            <input value={newName} onChange={e=>sNewName(e.target.value)} placeholder="Nombre de la ciudad"
              style={{width:"100%",background:T.bgMuted,border:`1px solid ${T.border}`,borderRadius:10,padding:"11px 14px",fontSize:14,color:T.ink,fontFamily:"inherit",outline:"none",marginBottom:12,boxSizing:"border-box"}}/>
            <div style={{fontSize:10,color:T.inkMuted,marginBottom:8,letterSpacing:1,fontWeight:700}}>EMOJI</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:16}}>
              {EMOJIS.map(e=><button key={e} onMouseDown={()=>sNewEmoji(e)} style={{fontSize:18,background:newEmoji===e?T.goldBg:"transparent",border:`1px solid ${newEmoji===e?T.gold:T.border}`,borderRadius:8,width:36,height:36,cursor:"pointer"}}>{e}</button>)}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>sShowAdd(false)} style={{flex:1,background:T.bgMuted,border:"none",borderRadius:10,padding:"11px",color:T.inkMuted,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Cancelar</button>
              <button onClick={addCity} style={{flex:2,background:T.gold,border:"none",borderRadius:10,padding:"11px",color:"white",fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Añadir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETUP WIZARD
// ─────────────────────────────────────────────────────────────────────────────
function SetupWizard({T,onCancel,onDone}){
  const[step,sStep]=useState(0);
  const[dest,sDest]=useState("");
  const[pendingTpl,sPT]=useState(null);
  const[year,sYear]=useState(new Date().getFullYear());
  const[month,sMonth]=useState(new Date().getMonth());
  const[loading,sLoading]=useState(false);
  const[error,sError]=useState("");
  const[aiCities,sAI]=useState([]);
  const[selected,sSel]=useState([]);
  const[cities,sCities]=useState([]);
  const[asgn,sAsgn]=useState({});
  const[activeCity,sAC]=useState(null);

  const numDays=dim(year,month);

  const afterDate=(y,m)=>{
    sYear(y);sMonth(m);
    if(pendingTpl){
      const cs=pendingTpl.cities.map((c,i)=>({...c,id: Date.now()+i, color:c.color||PAL[i%PAL.length],country:pendingTpl.dest}));
      sCities(cs);let cur=1;const a={};
      cs.forEach(c=>{const d=Math.min(c.days||4,dim(y,m)-cur+1);if(d>0){a[c.name]={from:cur,to:Math.min(cur+d-1,dim(y,m))};cur+=d;}});
      sAsgn(a);sAC(cs[0]||null);sStep(3);
    } else { sStep(2); }
  };

  const getSugg=useCallback(async()=>{
    if(!dest.trim())return;
    sLoading(true);sError("");
    try{
      const t=await callAI(`Destino: ${dest}. Mes: ${MONTHS[month]} ${year}.
Sugiere 5-8 ciudades ordenadas GEOGRÁFICAMENTE para minimizar desplazamientos.
Solo JSON:[{"name":"Ciudad","emoji":"emoji","desc":"2 frases","days":4,"order":1}]
"order" = orden lógico de visita, "days" = días recomendados.`);
      const parsed=JSON.parse(t);
      sAI(parsed.sort((a,b)=>(a.order||0)-(b.order||0)));
    }catch(e){sError("Error de IA. Inténtalo.");}
    sLoading(false);
  },[dest,month,year]);

  useEffect(()=>{if(step===2)getSugg();},[step, getSugg]);

  const toggleCity=c=>sSel(s=>s.find(x=>x.name===c.name)?s.filter(x=>x.name!==c.name):[...s,{...c,id: Date.now(), color:PAL[s.length%PAL.length],country:dest}]);

  const buildDays=()=>{
    const cs=[...selected];sCities(cs);let cur=1;const a={};
    cs.forEach(c=>{const d=Math.min(c.days||4,numDays-cur+1);if(d>0){a[c.name]={from:cur,to:Math.min(cur+d-1,numDays)};cur+=d;}});
    sAsgn(a);sAC(cs[0]||null);sStep(3);
  };

  const confirm=()=>{
    const cs=cities.map((c,i)=>{
      const r=asgn[c.name]||{from:1,to:1};
      return{id:Date.now()+i,name:c.name,emoji:c.emoji,color:c.color||PAL[i%PAL.length],country:dest||pendingTpl?.dest||"",
        from:mkiso(year,month,r.from),to:mkiso(year,month,r.to),nights:r.to-r.from+1,
        desc:"",attractions:[],food:[],hotel:{name:"",addr:"",cost:"",notes:""},transport:"",notes:""};
    });
    onDone({dest:dest||pendingTpl?.dest||"",year,month,cities:cs});
  };

  if(step===0)return(
    <div style={{position:"fixed",inset:0,background:T.bg,display:"flex",flexDirection:"column",zIndex:500,overflowY:"auto"}}>
      <div style={{background:T.bgNav,padding:"14px 18px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <button onClick={onCancel} style={{background:"rgba(255,255,255,.12)",border:"none",borderRadius:"50%",width:36,height:36,color:"white",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
        <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:900,color:"white"}}>Nuevo viaje</div>
      </div>
      <div style={{padding:"20px 20px 8px"}}>
        <div style={{fontSize:11,color:T.inkMuted,letterSpacing:2,fontWeight:700,marginBottom:10}}>DESTINO LIBRE</div>
        <WorldSearch value={dest} onChange={sDest} T={T}/>
        {dest&&<button onClick={()=>{sPT(null);sStep(1);}} style={{width:"100%",marginTop:10,background:T.gold,border:"none",borderRadius:12,padding:"13px",color:"white",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",boxShadow:`0 4px 20px ${T.gold}40`}}>
          Continuar con "{dest}" →
        </button>}
      </div>
      <div style={{padding:"16px 20px 40px"}}>
        <div style={{fontSize:11,color:T.inkMuted,letterSpacing:2,fontWeight:700,marginBottom:14}}>✦ PLANTILLAS</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {TEMPLATES.map((tpl,i)=>(
            <button key={i} onClick={()=>{sDest(tpl.dest);sPT(tpl);sStep(1);}}
              style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 12px",cursor:"pointer",textAlign:"left",fontFamily:"inherit",transition:"all .15s",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.gold;e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow=`0 4px 16px ${T.gold}25`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.05)";}}>
              <div style={{fontSize:20,marginBottom:5}}>{tpl.emoji}</div>
              <div style={{fontSize:12,fontWeight:700,color:T.ink,lineHeight:1.3,marginBottom:5}}>{tpl.label}</div>
              <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                {tpl.cities.map((c,j)=><span key={j} style={{fontSize:9,color:T.inkMuted,background:T.bgMuted,borderRadius:6,padding:"1px 5px"}}>{c.emoji} {c.name}</span>)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if(step===1)return <DatePicker title={pendingTpl?pendingTpl.label:dest} sub={pendingTpl?"ELIGE AÑO Y MES":"ELIGE FECHA"} T={T} onBack={()=>sStep(0)} onNext={afterDate}/>;

  if(step===2)return(
    <div style={{position:"fixed",inset:0,background:T.bg,display:"flex",flexDirection:"column",zIndex:500}}>
      <div style={{background:T.bgNav,padding:"14px 18px 10px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <button onClick={()=>sStep(1)} style={{background:"rgba(255,255,255,.12)",border:"none",borderRadius:"50%",width:36,height:36,color:"white",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
        <div style={{flex:1}}><div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,fontWeight:900,color:"white"}}>{dest} · {MONTHS[month]} {year}</div><div style={{fontSize:9,color:T.gold,letterSpacing:2,fontWeight:700}}>✦ RUTA OPTIMIZADA GEOGRÁFICAMENTE</div></div>
        <div style={{fontSize:12,color:T.gold,fontWeight:700}}>{selected.length}</div>
      </div>
      <div style={{overflowY:"auto",flex:1,padding:"12px 16px 16px",background:T.bg}}>
        {loading&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:"40px 0",color:T.inkMuted}}><Spin c={T.gold}/><div style={{fontSize:13}}>✦ Optimizando ruta…</div></div>}
        {!loading&&error&&<div style={{color:T.red,fontSize:12,padding:"12px",background:`${T.red}15`,borderRadius:8,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>{error}<button onClick={getSugg} style={{color:T.gold,background:"none",border:"none",cursor:"pointer",fontWeight:700,fontSize:12,marginLeft:"auto"}}>Reintentar</button></div>}
        {!loading&&aiCities.map((c,i)=>{const isSel=selected.find(x=>x.name===c.name);const idx=selected.findIndex(x=>x.name===c.name);const col=isSel?PAL[idx%PAL.length]:null;return(
          <div key={i} onClick={()=>toggleCity(c)} style={{background:isSel?`${col}12`:T.bgCard,borderRadius:14,padding:14,marginBottom:8,cursor:"pointer",border:`1.5px solid ${isSel?col:T.border}`,transition:"all .15s",boxShadow:"0 1px 4px rgba(0,0,0,.04)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:20,height:20,borderRadius:"50%",background:T.bgMuted,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:T.inkMuted,flexShrink:0}}>{i+1}</div>
              <span style={{fontSize:20}}>{c.emoji}</span>
              <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:T.ink}}>{c.name}</div><div style={{fontSize:11,color:T.inkMuted,marginTop:1}}>{c.days} días · {getWeather(dest,month)} {MONTHS[month]}</div></div>
              <div style={{width:26,height:26,borderRadius:"50%",border:`2px solid ${isSel?col:T.border}`,background:isSel?col:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:12,fontWeight:700,flexShrink:0}}>{isSel?idx+1:""}</div>
            </div>
            <div style={{fontSize:12,color:T.inkMuted,lineHeight:1.55,marginTop:6}}>{c.desc}</div>
          </div>
        );})}
      </div>
      <div style={{padding:"10px 16px 22px",flexShrink:0,borderTop:`1px solid ${T.border}`,background:T.bg}}>
        <button onClick={buildDays} disabled={selected.length===0} style={{width:"100%",background:selected.length?T.gold:"#ccc",border:"none",borderRadius:14,padding:"14px",color:"white",fontWeight:700,fontSize:14,cursor:selected.length?"pointer":"default",fontFamily:"inherit"}}>
          Asignar días → ({selected.length} ciudades)
        </button>
      </div>
    </div>
  );

  if(step===3)return(
    <DayPickerCal year={year} month={month} cities={cities} asgn={asgn} sAsgn={sAsgn}
      activeCity={activeCity} sAC={sAC} T={T}
      onBack={()=>pendingTpl?sStep(1):sStep(2)} onConfirm={confirm}
      allowAddCity dest={dest||pendingTpl?.dest||""}/>
  );
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function HomeScreen({trips,dark,setDark,onNewTrip,onUpdateTrip,onDeleteTrip,onAddTrip,T}){
  const now=new Date();
  const[calYear,sCY]=useState(now.getFullYear());
  const[calMonth,sCM]=useState(now.getMonth());
  const[activeTripId,sATI]=useState(null);
  const[selCity,sSC]=useState(null);
  const[sheet,sSht]=useState(null);
  const[showTP,sShowTP]=useState(false);
  const[showEdit,sShowEdit]=useState(false);
  const[showMap,sShowMap]=useState(false);
  const[showPDF,sShowPDF]=useState(false);
  const[showFlights,sShowFlights]=useState(false);
  const[showShare,sShowShare]=useState(false);

  useEffect(()=>{if(trips.length>0&&!activeTripId)sATI(trips[0].id);if(trips.length===0)sATI(null);},[trips, activeTripId]);
  useEffect(()=>{const t=trips.find(x=>x.id===activeTripId);if(t){sCY(t.year);sCM(t.month);}},[activeTripId, trips]);

  const activeTrip=trips.find(x=>x.id===activeTripId)||null;
  const allCities=activeTrip?activeTrip.cities:[];
  const traslados=activeTrip?.traslados||[];

  const changeMonth=dir=>sCM(m=>{const nm=m+dir;if(nm<0){sCY(y=>y-1);return 11;}if(nm>11){sCY(y=>y+1);return 0;}return nm;});

  const citiesOfDay=useCallback(day=>{
    const d=mkiso(calYear,calMonth,day);
    return allCities.filter(c=>c.from&&c.to&&d>=c.from&&d<=c.to);
  },[allCities,calYear,calMonth]);

  const trasladoOfDay=useCallback(day=>{
    const d=mkiso(calYear,calMonth,day);

    const byDate=traslados.find(t=>t.date===d);
    if(byDate) return byDate;

    const dep=allCities.find(c=>c.to===d);
    const arr=allCities.find(c=>c.from===d);
    if(dep&&arr){
      const linked=traslados.find(t=>{
        const tf=t.from.toLowerCase(); const tt=t.to.toLowerCase();
        const df=dep.name.toLowerCase(); const da=arr.name.toLowerCase();
        return tf.includes(df)||df.includes(tf)||tt.includes(da)||da.includes(tt);
      });
      return linked||{type:"avión",synthetic:true};
    }

    const legacyMatch=traslados.find(t=>{
      if(!t.date) return false;
      const parts=t.date.split(/[.\-\/]/);
      if(parts.length===2){
        const td=+parts[0]; const tm=+parts[1];
        return td===day && tm===(calMonth+1);
      }
      if(parts.length===3){
        const td=+parts[0]; const tm=+parts[1];
        return td===day && tm===(calMonth+1);
      }
      return false;
    });
    return legacyMatch||null;
  },[traslados,allCities,calMonth,calYear]);

  const isToday=day=>{const t=new Date();return t.getFullYear()===calYear&&t.getMonth()===calMonth&&t.getDate()===day;};
  const fd=fdow(calYear,calMonth);const numDays=dim(calYear,calMonth);
  const weather=activeTrip?getWeather(activeTrip.dest,calMonth):null;
  const CARDS=[
    {id:"hotels",   icon:"🏨", label:"Hoteles"},
    {id:"budget",   icon:"◈",  label:"Presupuesto"},
    {id:"traslados",icon:"✈", label:"Traslados"},
    {id:"notas",   icon:"✐",  label:"Notas"},
    {id:"map",     icon:"🗺",  label:"Mapa"},
    {id:"pdf",     icon:"📄",  label:"PDF"},
    {id:"flights", icon:"⚡",  label:"Vuelos"},
    {id:"share",   icon:"🔗",  label:"Compartir"},
  ];

  const cBg=T.calBg, cEmpty=T.calEmpty, cDow=T.calDow;

  return(
    <div style={{position:"fixed",inset:0,background:cBg,display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:"'DM Sans',system-ui,sans-serif"}}>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 14px 0",flexShrink:0,background:T.bgNav}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:20,fontWeight:900,color:"white",letterSpacing:-.5}}>Voyager</span>
          {trips.length>0&&(
            <button onClick={()=>sShowTP(s=>!s)} style={{display:"flex",alignItems:"center",gap:4,background:"rgba(255,255,255,.1)",border:"none",borderRadius:20,height:26,padding:"0 10px",color:"rgba(255,255,255,.75)",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>
              {activeTrip?activeTrip.dest:"—"}<span style={{fontSize:7,opacity:.6,transform:showTP?"rotate(180deg)":"none",transition:"transform .2s",display:"inline-block"}}>▼</span>
            </button>
          )}
        </div>
        <div style={{display:"flex",gap:5}}>
          {activeTrip&&<button onClick={()=>sShowEdit(true)} style={{background:"rgba(255,255,255,.09)",border:"none",borderRadius:20,height:30,padding:"0 10px",color:"rgba(255,255,255,.7)",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>✎ Editar</button>}
          <button onClick={onNewTrip} style={{background:T.gold,border:"none",borderRadius:20,height:30,padding:"0 12px",color:"white",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:3}}>
            <span style={{fontSize:14,lineHeight:1}}>+</span>Nuevo
          </button>
          <button onClick={()=>setDark(d=>!d)} style={{background:"rgba(255,255,255,.09)",border:"none",borderRadius:"50%",width:30,height:30,color:"white",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{dark?"☀️":"🌙"}</button>
        </div>
      </div>

      {showTP&&(
        <div style={{position:"absolute",top:50,left:14,right:14,background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:14,zIndex:100,overflow:"hidden",boxShadow:`0 8px 32px rgba(0,0,0,.2)`,animation:"fadeUp .15s ease"}}>
          {trips.map((t,i)=>(
            <button key={t.id} onClick={()=>{sATI(t.id);sShowTP(false);}} style={{width:"100%",padding:"11px 14px",background:t.id===activeTripId?T.bgMuted:"transparent",border:"none",borderBottom:i<trips.length-1?`1px solid ${T.border}`:"none",color:T.ink,textAlign:"left",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{t.name}</div><div style={{fontSize:10,color:T.inkMuted,marginTop:1}}>{MONTHS[t.month]} {t.year} · {t.cities.length} ciudades</div></div>
              <div style={{display:"flex",gap:2}}>{t.cities.slice(0,4).map((c,j)=><span key={j} style={{fontSize:13}}>{c.emoji}</span>)}</div>
              {t.id===activeTripId&&<span style={{color:T.gold}}>✓</span>}
            </button>
          ))}
          <button onClick={()=>{onDeleteTrip&&onDeleteTrip(activeTripId);sShowTP(false);}} style={{width:"100%",padding:"9px 14px",background:"transparent",border:"none",borderTop:`1px solid ${T.border}`,color:T.red,textAlign:"left",cursor:"pointer",fontFamily:"inherit",fontSize:12}}>Eliminar viaje activo</button>
        </div>
      )}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 14px 3px",flexShrink:0,background:T.bgNav}}>
        <button onClick={()=>changeMonth(-1)} style={{background:"rgba(255,255,255,.09)",border:"none",borderRadius:"50%",width:28,height:28,color:"white",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
        <div style={{textAlign:"center",display:"flex",alignItems:"center",gap:8}}>
          <div>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:17,fontWeight:900,color:"white",lineHeight:1}}>{MONTHS[calMonth]}</div>
            <div style={{fontSize:9,color:T.gold,letterSpacing:2,fontWeight:700}}>{calYear}</div>
          </div>
          {weather&&<span title="Clima estimado del mes">{weather}</span>}
        </div>
        <button onClick={()=>changeMonth(1)} style={{background:"rgba(255,255,255,.09)",border:"none",borderRadius:"50%",width:28,height:28,color:"white",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
      </div>

      {allCities.length>0&&(
        <div style={{display:"flex",gap:5,padding:"0 12px 3px",overflowX:"auto",flexShrink:0,background:T.bgNav}}>
          {allCities.map((c,i)=>(
            <div key={i} onClick={()=>sSC(c)} style={{display:"flex",alignItems:"center",gap:3,background:`${c.color}22`,border:`1px solid ${c.color}55`,borderRadius:20,padding:"2px 8px",whiteSpace:"nowrap",flexShrink:0,cursor:"pointer"}}>
              <span style={{fontSize:10}}>{c.emoji}</span><span style={{fontSize:8,color:"white",fontWeight:700,letterSpacing:.5}}>{c.name}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,flexShrink:0,marginBottom:1}}>
        {["L","M","X","J","V","S","D"].map(d=><div key={d} style={{background:cDow,color:T.calDowText,textAlign:"center",padding:"4px 0",fontSize:9,fontWeight:700,letterSpacing:1.5}}>{d}</div>)}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,flex:1,minHeight:0}}>
        {Array(fd).fill(null).map((_,i)=><div key={`e${i}`} style={{background:cEmpty}}/>)}
        {Array(numDays).fill(null).map((_,i)=>{
          const day=i+1;
          const owners=citiesOfDay(day);
          const traslado=trasladoOfDay(day);
          const todayMark=isToday(day);
          const borderCol=owners[0]?.color||(traslado?T.gold:todayMark?T.gold:T.calBorder);

          const isTrasladoDay = !!traslado;
          const d_iso = mkiso(calYear,calMonth,day);
          const departureCity = allCities.find(c=>c.to===d_iso);   
          const arrivalCity   = allCities.find(c=>c.from===d_iso); 

          const tFrom = traslado ? (departureCity || allCities.find(c=>c.name.toLowerCase().includes((traslado.from||"").toLowerCase().slice(0,5)))) : null;
          const tTo   = traslado ? (arrivalCity   || allCities.find(c=>c.name.toLowerCase().includes((traslado.to||"").toLowerCase().slice(0,5)))) : null;

          const showSplit = owners.length>=2 ||
            (isTrasladoDay && (arrivalCity || (traslado&&!traslado.synthetic&&traslado.to)));

          const topCity    = owners[0] || tFrom || null;
          const bottomCity = owners[1] || arrivalCity || null;
          const bottomLabel = bottomCity ? `${bottomCity.emoji} ${bottomCity.name}` : (traslado?.to||"");
          const bottomColor = bottomCity?.color || T.gold;

          return(
            <div key={day}
              style={{borderTop:`2px solid ${borderCol}`,cursor:(owners.length||isTrasladoDay)?"pointer":"default",display:"flex",flexDirection:"column",minHeight:0,overflow:"hidden",transition:"opacity .1s"}}
              onMouseEnter={e=>{if(owners.length||isTrasladoDay)e.currentTarget.style.opacity=".78";}}
              onMouseLeave={e=>{e.currentTarget.style.opacity="1";}}>

              {!showSplit && owners.length===0 && !isTrasladoDay && (
                <div style={{flex:1,background:cEmpty,padding:"4px 3px",display:"flex",flexDirection:"column"}}>
                  <div style={{fontSize:9,fontWeight:700,color:T.calText,opacity:.3,lineHeight:1}}>{day}</div>
                </div>
              )}

              {!showSplit && owners.length===1 && (
                <div onClick={()=>sSC(owners[0])} style={{flex:1,background:`${owners[0].color}28`,padding:"4px 3px",display:"flex",flexDirection:"column"}}>
                  <div style={{fontSize:9,fontWeight:700,color:todayMark?T.gold:T.calText,lineHeight:1,flexShrink:0}}>{day}</div>
                  <div style={{fontSize:"clamp(5px,1.1vw,7px)",color:owners[0].color,fontWeight:700,lineHeight:1.2,marginTop:2,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>{owners[0].emoji} {owners[0].name}</div>
                  {isTrasladoDay&&!arrivalCity&&(
                    <div style={{fontSize:9,textAlign:"center",marginTop:"auto",lineHeight:1,opacity:.8}}>{TI[traslado.type]||"✈"}</div>
                  )}
                </div>
              )}

              {showSplit && (
                <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
                  <div
                    onClick={e=>{e.stopPropagation();if(topCity)sSC(topCity);}}
                    style={{flex:1,background:topCity?`${topCity.color}30`:`${T.gold}18`,padding:"3px 3px 1px",display:"flex",flexDirection:"column",justifyContent:"space-between",borderBottom:`1px solid rgba(128,128,128,.2)`}}>
                    <div style={{fontSize:8,fontWeight:700,color:T.calText,lineHeight:1,opacity:.9}}>{day}</div>
                    <div style={{fontSize:"clamp(4px,.9vw,7px)",color:topCity?.color||T.gold,fontWeight:700,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
                      {topCity ? `${topCity.emoji} ${topCity.name}` : (traslado?.from||"")}
                    </div>
                  </div>

                  <div style={{textAlign:"center",fontSize:"clamp(7px,1.8vw,11px)",background:"rgba(0,0,0,.35)",lineHeight:"14px",flexShrink:0,color:"white"}}>
                    {TI[traslado?.type]||"✈"}
                  </div>

                  <div
                    onClick={e=>{e.stopPropagation();if(bottomCity)sSC(bottomCity);}}
                    style={{flex:1,background:bottomCity?`${bottomCity.color}30`:`${T.gold}18`,padding:"1px 3px",display:"flex",alignItems:"center"}}>
                    <div style={{fontSize:"clamp(4px,.9vw,7px)",color:bottomColor,fontWeight:700,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
                      {bottomLabel}
                    </div>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {activeTrip&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,padding:"6px 12px 10px",flexShrink:0,background:T.bgNav}}>
          {CARDS.map(card=>(
            <button key={card.id} onClick={()=>{
              if(card.id==="map")      sShowMap(true);
              else if(card.id==="pdf") sShowPDF(true);
              else if(card.id==="flights") sShowFlights(true);
              else if(card.id==="share")   sShowShare(true);
              else sSht(card.id);
            }}
              style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"9px 4px 7px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",fontFamily:"inherit",transition:"background .14s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.15)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.07)"}>
              <span style={{fontSize:17,lineHeight:1}}>{card.icon}</span>
              <span style={{fontSize:8,color:"rgba(255,255,255,.55)",fontWeight:700,letterSpacing:.5,textTransform:"uppercase"}}>{card.label}</span>
            </button>
          ))}
        </div>
      )}

      {trips.length===0&&<div style={{position:"absolute",bottom:40,left:0,right:0,textAlign:"center",pointerEvents:"none"}}><div style={{fontSize:13,color:T.inkMuted}}>Pulsa <strong style={{color:T.gold}}>+ Nuevo</strong> para crear tu primer viaje</div></div>}

      {showMap&&activeTrip&&<MapView cities={allCities} T={T} onClose={()=>sShowMap(false)}/>}
      {showPDF&&activeTrip&&<ExportPDF trip={activeTrip} T={T} onClose={()=>sShowPDF(false)}/>}
      {showFlights&&activeTrip&&<FlightAlertsSheet trip={activeTrip} T={T} onClose={()=>sShowFlights(false)}/>}
      {showShare&&activeTrip&&<ShareSheet trip={activeTrip} T={T} onClose={()=>sShowShare(false)} onImportTrip={t=>{onAddTrip&&onAddTrip({...t,id:Date.now()});sShowShare(false);}}/>}
      {showEdit&&activeTrip&&(()=>    {
        const initAsgn={};
        activeTrip.cities.forEach(c=>{const f=isoDay(c.from,activeTrip.year,activeTrip.month);const t2=isoDay(c.to,activeTrip.year,activeTrip.month);if(f&&t2)initAsgn[c.name]={from:f,to:t2};});
        const[editCities,setEC]=useState(activeTrip.cities.map(c=>({...c})));
        const[editAsgn,setEA]=useState(initAsgn);
        const[editAC,setEAC]=useState(activeTrip.cities[0]||null);
        return(
          <div style={{position:"fixed",inset:0,zIndex:200}}>
            <DayPickerCal year={activeTrip.year} month={activeTrip.month}
              cities={editCities} asgn={editAsgn} sAsgn={setEA}
              activeCity={editAC} sAC={setEAC} T={T}
              onBack={()=>sShowEdit(false)}
              onConfirm={()=>{
                const updated=editCities.map(c=>{const r=editAsgn[c.name];if(!r)return c;return{...c,from:mkiso(activeTrip.year,activeTrip.month,r.from),to:mkiso(activeTrip.year,activeTrip.month,r.to),nights:r.to-r.from+1};});
                onUpdateTrip({...activeTrip,cities:updated});sShowEdit(false);
              }}
              allowAddCity={false} dest={activeTrip.dest}/>
          </div>
        );
      })()}
      {selCity&&activeTrip&&<CitySheet city={selCity} onClose={()=>sSC(null)} onBack={()=>sSC(null)} onUpdate={upd=>{const updatedCities=activeTrip.cities.map(c=>c.id===upd.id?upd:c);onUpdateTrip({...activeTrip,cities: updatedCities});sSC(upd);}} T={T}/>}
      {sheet       ==="hotels"&&activeTrip&&<HotelsSheet trip={activeTrip} onUpdateTrip={t=>onUpdateTrip(t)} onClose={()=>sSht(null)} T={T}/>}
      {sheet==="budget"&&activeTrip&&<BudgetSheet trip={activeTrip} onUpdateTrip={t=>onUpdateTrip(t)} onClose={()=>sSht(null)} T={T}/>}
      {sheet==="traslados"&&activeTrip&&<TrasladosSheet trip={activeTrip} onUpdateTrip={t=>onUpdateTrip(t)} onClose={()=>sSht(null)} T={T}/>}
      {sheet==="notas"&&activeTrip&&<NotasSheet trip={activeTrip} onUpdateTrip={t=>onUpdateTrip(t)} onClose={()=>sSht(null)} T={T}/>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export default function VoyagerApp(){
  const[dark,sDark]=useState(false);
  const[trips,sTrips]=useState([]);
  const[screen,sScreen]=useState("landing");
  const T=dark?DARK:LIGHT;

  useEffect(()=>{
    try{const s=localStorage.getItem("voyager_v1");if(s){const t=JSON.parse(s);sTrips(t);if(t.length>0)sScreen("home");}}catch(e){console.error(e);}
  },[]);
  useEffect(()=>{
    if(trips.length > 0) {
      try{localStorage.setItem("voyager_v1",JSON.stringify(trips));}catch(e){console.error(e);}
    }
  },[trips]);

  const addTrip=t=>{sTrips(p=>[...p,t]);sScreen("home");};
  const updTrip=t=>sTrips(p=>p.map(x=>x.id===t.id?t:x));
  const delTrip=id=>{sTrips(p=>{const n=p.filter(x=>x.id!==id);if(n.length===0)sScreen("landing");return n;});};

  return(
    <>
      <style>{CSS+`input,select,textarea{color-scheme:${dark?"dark":"light"}}`}</style>
      
      {screen==="landing" && (
        <div style={{position:"fixed",inset:0,background:T.bgNav,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
          <div style={{position:"absolute",width:380,height:380,borderRadius:"50%",background:`radial-gradient(circle,${T.gold}14,transparent 65%)`,pointerEvents:"none"}}/>
          <div style={{textAlign:"center",position:"relative",zIndex:1,padding:"0 40px"}}>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"clamp(52px,16vw,88px)",fontWeight:900,color:"white",letterSpacing:-4,lineHeight:1,marginBottom:4}}>voyager</div>
            <div style={{fontSize:10,color:T.gold,letterSpacing:5,fontWeight:700,marginBottom:48}}>✦ AI TRAVEL PLANNER</div>
            <button onClick={()=>sScreen("setup")}
              style={{background:T.gold,border:"none",borderRadius:16,padding:"15px 34px",color:"white",fontWeight:700,fontSize:16,cursor:"pointer",fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:10,boxShadow:`0 8px 32px ${T.gold}50`,transition:"transform .18s"}}
              onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"}
              onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
              <span style={{fontSize:20}}>+</span> nuevo itinerario
            </button>
            <div style={{marginTop:36}}>
              <button onClick={()=>sDark(d=>!d)} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:"50%",width:36,height:36,color:"rgba(255,255,255,.7)",fontSize:16,cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
                {dark?"☀️":"🌙"}
              </button>
            </div>
          </div>
        </div>
      )}

      {screen==="setup" && (
        <SetupWizard T={T} onCancel={()=>sScreen(trips.length?"home":"landing")}
          onDone={({dest,year,month,cities})=>addTrip({id:Date.now(),name:`Viaje a ${dest}`,dest,year,month,cities,budget:{total:"",items:[]},traslados:[],notes:""})}/>
      )}

      {screen==="home" && (
        <HomeScreen trips={trips} dark={dark} setDark={sDark} onNewTrip={()=>sScreen("setup")} onUpdateTrip={updTrip} onDeleteTrip={delTrip} onAddTrip={addTrip} T={T}/>
      )}
    </>
  );
}
