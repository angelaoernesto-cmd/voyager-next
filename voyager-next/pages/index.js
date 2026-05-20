import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// AI HELPER – llama a /api/ai (ruta del servidor) que conecta con Gemini de forma segura.
// ─────────────────────────────────────────────────────────────────────────────
async function callAI(prompt) {
  // Detector dinámico de entorno (Web de Vercel vs APK de Android/Capacitor)
  let endpoint = "/api/ai";
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.protocol === "file:")) {
    endpoint = "https://voyager-next-chi.vercel.app/api/ai";
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

const WORLD = [
  "Bogotá","Medellín","Cartagena","Cali","Santa Marta","San Andrés","China","Pekín","Shanghái","Xi'an",
  "Hong Kong","España","Madrid","Barcelona","Ibiza","Francia","París","Italia","Roma","Florencia",
  "Venecia","Tailandia","Bangkok","Phuket","Japón","Tokio","Kioto","Noruega","Oslo","Stavanger"
];

const TEMPLATES = [
  {id:"col",label:"Semana en Colombia",   dest:"Colombia", emoji:"🇨🇴",cities:[{name:"Bogotá",      emoji:"🏙",days:3,color:"#B45309"},{name:"Medellín",   emoji:"🌺",days:2,color:"#7C3AED"},{name:"Cartagena",  emoji:"🏖",days:3,color:"#0D9488"}]},
  {id:"jap",label:"Ruta Japón 10 días",   dest:"Japón",    emoji:"🇯🇵",cities:[{name:"Tokio",       emoji:"🗼",days:4,color:"#DC2626"},{name:"Kioto",       emoji:"⛩",days:3,color:"#7C3AED"},{name:"Osaka",       emoji:"🏯",days:3,color:"#2563EB"}]},
  {id:"ita",label:"Italia 12 días",       dest:"Italia",   emoji:"🇮🇹",cities:[{name:"Roma",        emoji:"🏛",days:4,color:"#DC2626"},{name:"Florencia",   emoji:"🎨",days:3,color:"#D97706"},{name:"Venecia",     emoji:"🚤",days:2,color:"#2563EB"},{name:"Milán",     emoji:"🛍",days:3,color:"#7C3AED"}]},
  {id:"tai",label:"Tailandia 2 semanas",  dest:"Tailandia",emoji:"🇹🇭",cities:[{name:"Bangkok",    emoji:"🛕",days:4,color:"#D97706"},{name:"Chiang Mai",  emoji:"🐘",days:3,color:"#059669"},{name:"Krabi",       emoji:"🏝",days:4,color:"#0D9488"},{name:"Koh Samui", emoji:"🌴",days:3,color:"#2563EB"}]},
];

const CSS = `@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
*{box-sizing:border-box}::-webkit-scrollbar{width:0}`;

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
        style={{width:"100%",background:T.bgCard,border:`1.5px solid ${T.border}`,borderRadius:12,padding:"13px 16px",fontSize:15,color:T.ink,fontFamily:"inherit",outline:"none"}}/>
      {open&&sugg.length>0&&(
        <div style={{position:"absolute",left:0,right:0,top:"calc(100% + 4px)",background:T.bgCard,borderRadius:12,overflow:"hidden",border:`1px solid ${T.border}`,zIndex:50}}>
          {sugg.map((s,i)=>(
            <button key={i} onMouseDown={()=>{onChange(s);setOpen(false);}}
              style={{width:"100%",padding:"11px 16px",background:"transparent",border:"none",color:T.ink,textAlign:"left",cursor:"pointer"}}>
              🔍 {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WIZARD CONFIGURACIÓN (SETUP)
// ─────────────────────────────────────────────────────────────────────────────
function SetupWizard({onCancel,onDone,T}){
  const[step,sStep]=useState(1);
  const[dest,sDest]=useState("");
  const[year,sYear]=useState(new Date().getFullYear());
  const[month,sMonth]=useState(new Date().getMonth());
  const[loading,sLoading]=useState(false);
  const[error,sError]=useState("");
  const[aiCities,sAI]=useState(null);

  const getSugg = async () => {
    sLoading(true);
    sError("");
    try {
      const t = await callAI(`Destino: ${dest}. Mes: ${MONTHS[month]} ${year}.
Sugiere 5-8 ciudades ordenadas GEOGRÁFICAMENTE para minimizar desplazamientos.
Solo JSON:[{"name":"Ciudad","emoji":"emoji","desc":"2 frases","days":4,"order":1}]
"order" = orden lógico de visita, "days" = días recomendados.`);
      
      const textLimpio = t
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      const parsed = JSON.parse(textLimpio);
      
      // PARCHE DE SEGURIDAD PROTECTOR PARA EVITAR EXCEPCIONES DE CLIENTE
      if (Array.isArray(parsed)) {
        const listaOrdenada = parsed.sort((a, b) => {
          const orderA = typeof a.order === 'number' ? a.order : parseInt(a.order) || 0;
          const orderB = typeof b.order === 'number' ? b.order : parseInt(b.order) || 0;
          return orderA - orderB;
        });
        sAI(listaOrdenada);
        sStep(3);
      } else if (parsed && parsed.cities && Array.isArray(parsed.cities)) {
        sAI(parsed.cities);
        sStep(3);
      } else {
        throw new Error("Estructura JSON no reconocida.");
      }
    } catch(e) {
      console.error(e);
      sError("Error de IA. Revisa tu GEMINI_API_KEY en Vercel o reinténtalo.");
    } finally {
      sLoading(false);
    }
  };

  const handleFinalize = (selectedList) => {
    let currentDay = 1;
    const finalCities = selectedList.map((c, idx) => {
      const fromDay = currentDay;
      const toDay = currentDay + (c.days - 1);
      currentDay = toDay + 1; // El siguiente empieza al día siguiente
      return {
        id: idx + 1,
        name: c.name,
        emoji: c.emoji || "📍",
        desc: c.desc || "",
        days: c.days,
        from: mkiso(year, month, Math.min(fromDay, dim(year, month))),
        to: mkiso(year, month, Math.min(toDay, dim(year, month))),
        color: PAL[idx % PAL.length]
      };
    });
    onDone({ dest, year, month, cities: finalCities });
  };

  return (
    <div style={{position:"fixed",inset:0,background:T.bg,padding:20,display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",fontFamily:"inherit"}}>
      <div style={{width:"100%",maxWidth:400,background:T.bgCard,borderRadius:16,padding:24,border:`1px solid ${T.border}`,boxShadow:"0 4px 20px rgba(0,0,0,.05)"}}>
        
        {step === 1 && (
          <div>
            <h2 style={{fontFamily:"serif",fontSize:22,marginBottom:16,color:T.ink}}>¿A dónde viajas?</h2>
            <WorldSearch value={dest} onChange={sDest} T={T} />
            <div style={{display:"flex",justifyContent:"space-between",marginTop:24}}>
              <button onClick={onCancel} style={{background:"transparent",border:"none",color:T.inkMuted,cursor:"pointer"}}>Cancelar</button>
              <button onClick={() => dest.trim() && sStep(2)} disabled={!dest.trim()} style={{background:T.gold,color:"white",border:"none",borderRadius:8,padding:"10px 20px",fontWeight:700,opacity:dest.trim()?1:.5}}>Siguiente</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{fontFamily:"serif",fontSize:22,marginBottom:16,color:T.ink}}>¿Cuándo viajas?</h2>
            <div style={{display:"flex",gap:10,marginBottom:20}}>
              <select value={month} onChange={e => sMonth(+e.target.value)} style={{flex:1,padding:10,borderRadius:8,background:T.bg,color:T.ink,border:`1px solid ${T.border}`}}>
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select value={year} onChange={e => sYear(+e.target.value)} style={{padding:10,borderRadius:8,background:T.bg,color:T.ink,border:`1px solid ${T.border}`}}>
                {[2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {error && <div style={{color:T.red,fontSize:13,marginBottom:12}}>{error}</div>}
            <div style={{display:"flex",justifyContent:"space-between",marginTop:24}}>
              <button onClick={() => sStep(1)} style={{background:"transparent",border:"none",color:T.inkMuted}}>Atrás</button>
              <button onClick={getSugg} disabled={loading} style={{background:T.gold,color:"white",border:"none",borderRadius:8,padding:"10px 20px",fontWeight:700}}>
                {loading ? "Consultando IA..." : "Planificar con IA"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && aiCities && (
          <div>
            <h2 style={{fontFamily:"serif",fontSize:20,marginBottom:8,color:T.ink}}>Ruta propuesta</h2>
            <p style={{fontSize:12,color:T.inkMuted,marginBottom:16}}>Ajusta los días recomendados para cada destino:</p>
            <div style={{maxHeight:260,overflowY:"auto",marginBottom:20}}>
              {aiCities.map((c, i) => (
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                  <div style={{flex:1,marginRight:10}}>
                    <span style={{marginRight:6}}>{c.emoji}</span>
                    <strong style={{fontSize:14,color:T.ink}}>{c.name}</strong>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <button onClick={() => {
                      const copy = [...aiCities];
                      copy[i].days = Math.max(1, copy[i].days - 1);
                      sAI(copy);
                    }} style={{width:24,height:24,borderRadius:4,border:`1px solid ${T.border}`,background:T.bg,color:T.ink}}>-</button>
                    <span style={{fontSize:14,minWidth:16,textAlign:"center",color:T.ink}}>{c.days} d</span>
                    <button onClick={() => {
                      const copy = [...aiCities];
                      copy[i].days = copy[i].days + 1;
                      sAI(copy);
                    }} style={{width:24,height:24,borderRadius:4,border:`1px solid ${T.border}`,background:T.bg,color:T.ink}}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => handleFinalize(aiCities)} style={{width:"100%",background:T.gold,color:"white",border:"none",borderRadius:8,padding:"12px",fontWeight:700,cursor:"pointer"}}>
              Crear mi Calendario
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME SCREEN (CALENDARIO COMPLETO)
// ─────────────────────────────────────────────────────────────────────────────
function HomeScreen({trips,dark,setDark,onNewTrip,onUpdateTrip,onDeleteTrip,T}){
  const now = new Date();
  const[calYear,sCY] = useState(now.getFullYear());
  const[calMonth,sCM] = useState(now.getMonth());
  const[activeTripId,sATI] = useState(null);
  const[showDropdown,sShowDropdown] = useState(false);

  useEffect(() => { if(trips.length > 0 && !activeTripId) sATI(trips[0].id); }, [trips, activeTripId]);
  useEffect(() => { const t = trips.find(x => x.id === activeTripId); if(t) { sCY(t.year); sCM(t.month); } }, [activeTripId, trips]);

  const activeTrip = trips.find(x => x.id === activeTripId) || null;
  const allCities = activeTrip ? activeTrip.cities : [];

  const changeMonth = dir => sCM(m => {
    const nm = m + dir;
    if(nm < 0) { sCY(y => y - 1); return 11; }
    if(nm > 11) { sCY(y => y + 1); return 0; }
    return nm;
  });

  const citiesOfDay = useCallback(day => {
    const d = mkiso(calYear, calMonth, day);
    return allCities.filter(c => c.from && c.to && d >= c.from && d <= c.to);
  }, [allCities, calYear, calMonth]);

  const fd = fdow(calYear, calMonth);
  const numDays = dim(calYear, calMonth);

  return (
    <div style={{position:"fixed",inset:0,background:T.calBg,display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:"system-ui,sans-serif"}}>
      
      {/* Barra de navegación superior */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:T.bgNav,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{color:"white",fontWeight:900,fontSize:18,fontFamily:"serif"}}>Voyager</span>
          {trips.length > 0 && (
            <button onClick={() => sShowDropdown(!showDropdown)} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:12,padding:"4px 10px",color:"white",fontSize:12,cursor:"pointer"}}>
              {activeTrip ? activeTrip.dest : "Mis Viajes"} ▼
            </button>
          )}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onNewTrip} style={{background:T.gold,color:"white",border:"none",borderRadius:12,padding:"6px 14px",fontWeight:700,fontSize:12,cursor:"pointer"}}>+ Nuevo</button>
          <button onClick={() => setDark(d => !d)} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:"50%",width:28,height:28,color:"white",cursor:"pointer"}}>{dark?"☀️":"🌙"}</button>
        </div>
      </div>

      {showDropdown && (
        <div style={{position:"absolute",top:50,left:16,background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:12,zIndex:100,boxShadow:"0 4px 20px rgba(0,0,0,.15)",overflow:"hidden"}}>
          {trips.map(t => (
            <button key={t.id} onClick={() => { sATI(t.id); sShowDropdown(false); }} style={{display:"block",width:"100%",padding:"10px 16px",background:t.id===activeTripId?T.bgMuted:"transparent",border:"none",color:T.ink,textAlign:"left",cursor:"pointer",fontSize:13}}>
              ✈ {t.name} ({MONTHS[t.month]})
            </button>
          ))}
          <button onClick={() => { onDeleteTrip(activeTripId); sShowDropdown(false); }} style={{display:"block",width:"100%",padding:"8px 16px",background:"transparent",border:"none",borderTop:`1px solid ${T.border}`,color:T.red,textAlign:"left",fontSize:12,cursor:"pointer"}}>✕ Eliminar viaje activo</button>
        </div>
      )}

      {/* Selector de Meses */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 16px",background:T.bgNav,color:"white",flexShrink:0}}>
        <button onClick={() => changeMonth(-1)} style={{background:"transparent",border:"none",color:"white",fontSize:18,cursor:"pointer"}}>‹</button>
        <div style={{textAlign:"center"}}>
          <div style={{fontWeight:700,fontSize:15}}>{MONTHS[calMonth]}</div>
          <div style={{fontSize:10,color:T.gold,fontWeight:700}}>{calYear}</div>
        </div>
        <button onClick={() => changeMonth(1)} style={{background:"transparent",border:"none",color:"white",fontSize:18,cursor:"pointer"}}>›</button>
      </div>

      {/* Encabezados de días de la semana */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,background:T.border,flexShrink:0}}>
        {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(d => <div key={d} style={{background:T.calDow,color:T.calDowText,textAlign:"center",padding:"4px 0",fontSize:10,fontWeight:700}}>{d}</div>)}
      </div>

      {/* Cuadrícula del calendario */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,background:T.border,flex:1}}>
        {Array(fd).fill(null).map((_,i) => <div key={`e-${i}`} style={{background:T.calEmpty}} />)}
        {Array(numDays).fill(null).map((_,i) => {
          const day = i + 1;
          const currentCities = citiesOfDay(day);
          const hasCity = currentCities.length > 0;
          const mainColor = hasCity ? currentCities[0].color : "transparent";

          return (
            <div key={day} style={{background:T.calCell,borderTop:hasCity?`3px solid ${mainColor}`:"none",padding:4,display:"flex",flexDirection:"column",justifyContent:"space-between",overflow:"hidden"}}>
              <span style={{fontSize:10,fontWeight:700,color:T.calText}}>{day}</span>
              {hasCity && (
                <div style={{background:`${mainColor}15`,borderRadius:4,padding:"2px 4px",fontSize:9,fontWeight:700,color:mainColor,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {currentCities[0].emoji} {currentCities[0].name}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENEDOR PRINCIPAL DE LA APP
// ─────────────────────────────────────────────────────────────────────────────
function VoyagerApp(){
  const[dark,sDark] = useState(false);
  const[trips,sTrips] = useState([]);
  const[screen,sScreen] = useState("landing");
  const T = dark ? DARK : LIGHT;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("voyager_v1");
      if(saved) {
        const parsed = JSON.parse(saved);
        sTrips(parsed);
        if(parsed.length > 0) sScreen("home");
      }
    } catch(e) { console.error(e); }
  }, []);

  useEffect(() => {
    try { localStorage.setItem("voyager_v1", JSON.stringify(trips)); } catch(e) { console.error(e); }
  }, [trips]);

  const addTrip = t => { sTrips(p => [...p, t]); sScreen("home"); };
  const updTrip = t => sTrips(p => p.map(x => x.id === t.id ? t : x));
  const delTrip = id => sTrips(p => {
    const next = p.filter(x => x.id !== id);
    if(next.length === 0) sScreen("landing");
    return next;
  });

  return (
    <>
      <style>{CSS}</style>
      
      {screen === "landing" && (
        <div style={{position:"fixed",inset:0,background:T.bgNav,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>
          <div style={{textAlign:"center",padding:"0 20px"}}>
            <h1 style={{fontFamily:"serif",fontSize:56,fontWeight:900,color:"white",margin:0,letterSpacing:-2}}>voyager</h1>
            <p style={{fontSize:10,color:T.gold,letterSpacing:4,fontWeight:700,margin:"8px 0 40px"}}>✦ AI TRAVEL PLANNER</p>
            <button onClick={() => sScreen("setup")} style={{background:T.gold,color:"white",border:"none",borderRadius:12,padding:"14px 28px",fontWeight:700,fontSize:15,cursor:"pointer"}}>
              + Nuevo Itinerario
            </button>
            <div style={{marginTop:24}}>
              <button onClick={() => sDark(!dark)} style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:"50%",width:36,height:36,color:"white",cursor:"pointer"}}>
                {dark?"☀️":"🌙"}
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === "setup" && (
        <SetupWizard T={T} onCancel={() => sScreen(trips.length?"home":"landing")} onDone={addTrip} />
      )}

      {screen === "home" && (
        <HomeScreen trips={trips} dark={dark} setDark={sDark} onNewTrip={() => sScreen("setup")} onUpdateTrip={updTrip} onDeleteTrip={delTrip} T={T} />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTACIÓN EXCLUSIVA PARA EVITAR FALLOS DE SSR EN NEXT.JS (BUILD COMPLIANCE)
// ─────────────────────────────────────────────────────────────────────────────
export default dynamic(() => Promise.resolve(VoyagerApp), {
  ssr: false,
});
