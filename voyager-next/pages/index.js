import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// AI HELPER – calls /api/ai (server-side route) which calls Gemini securely.
// ─────────────────────────────────────────────────────────────────────────────
async function callAI(prompt) {
  // Detector inteligente de procedencia de entorno de ejecución (Web vs APK Móvil)
  let endpoint = "/api/ai";
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.protocol === "file:")) {
    endpoint = "[https://voyager-next-chi.vercel.app/api/ai](https://voyager-next-chi.vercel.app/api/ai)";
  }

  const res = await fetch(endpoint, {
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
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",cursor:"pointer"}} onClick={()=>sO(x=>!x)}>
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
// BASE APPLICATION CONTAINER
// ─────────────────────────────────────────────────────────────────────────────
function VoyagerApp(){
  const[dark,sDark]=useState(false);
  const[trips,sTrips]=useState([]);
  const[screen,sScreen]=useState("landing");
  const T=dark?DARK:LIGHT;

  useEffect(() => {
    try{const s=localStorage.getItem("voyager_v1");if(s){const t=JSON.parse(s);sTrips(t);if(t.length>0)sScreen("home");}}catch(e){console.error(e);}
  },[]);

  useEffect(() => {
    try{localStorage.setItem("voyager_v1",JSON.stringify(trips));}catch(e){console.error(e);}
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

// ─────────────────────────────────────────────────────────────────────────────
// SAFE EXPORT - FOR NEXT.JS BUILD COMPLIANCE
// ─────────────────────────────────────────────────────────────────────────────
export default dynamic(() => Promise.resolve(VoyagerApp), {
  ssr: false,
});
