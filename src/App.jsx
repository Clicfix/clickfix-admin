import { useState } from "react";
const A="admin@clickfix.fr",B="Clickfix2025!";
const U="https://bipqtqezntzcmxwiaqdz.supabase.co";
const K="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcHF0cWV6bnR6Y214d2lhcWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzk5MTAsImV4cCI6MjA5NTY1NTkxMH0.OmScmhwC-qOHf1tW81UxHgk0OHpSJvz5NCpktzMa81M";
async function api(t,m,d){const r=await fetch(U+"/rest/v1/"+t+(m==="GET"?"?select=*&order=created_at.desc":""),{method:m||"GET",headers:{"Content-Type":"application/json","apikey":K},body:d?JSON.stringify(d):undefined});return r.json();}
export default function App(){
const [auth,setAuth]=useState(false);
const [email,setEmail]=useState("");
const [pass,setPass]=useState("");
const [tab,setTab]=useState("dash");
const [pros,setPros]=useState([]);
const [leads,setLeads]=useState([]);
const [msg,setMsg]=useState(null);
function notify(m){setMsg(m);setTimeout(()=>setMsg(null),3000);}
async function load(){
  const p=await api("profiles");
  const l=await api("leads");
  setPros(Array.isArray(p)?p.filter(x=>x.role==="pro"):[]);
  setLeads(Array.isArray(l)?l:[]);
}
function login(){if(email===A&&pass===B){setAuth(true);load();}else notify("Identifiants incorrects");}
async function block(p){
  const s=p.statut_paiement==="bloque"?"actif":"bloque";
  await fetch(U+"/rest/v1/profiles?id=eq."+p.id,{method:"PATCH",headers:{"Content-Type":"application/json","apikey":K},body:JSON.stringify({statut_paiement:s})});
  setPros(prev=>prev.map(x=>x.id===p.id?{...x,statut_paiement:s}:x));
  notify(s==="bloque"?"Bloque":"Debloque");
}
const imp=pros.filter(p=>p.statut_paiement==="impaye"||p.statut_paiement==="expire");
const unas=leads.filter(l=>!l.assigned_to);
const s={bg:{minHeight:"100vh",background:"#07090f",fontFamily:"sans-serif",color:"#fff"},card:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:18,marginBottom:10},btn:{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:13},inp:{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,padding:"10px 12px",color:"#fff",fontSize:14,width:"100%",outline:"none"}};
if(!auth)return(
<div style={{...s.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
{msg&&<div style={{position:"fixed",top:16,right:16,background:"#c0392b",color:"#fff",padding:"10px 18px",borderRadius:8,fontWeight:700}}>{msg}</div>}
<div style={{...s.card,maxWidth:380,width:"100%",padding:36}}>
<h1 style={{fontSize:26,fontWeight:900,marginBottom:6}}>click<span style={{color:"#FF6F00"}}>&</span>fix ADMIN</h1>
<p style={{color:"rgba(255,255,255,0.4)",marginBottom:24,fontSize:13}}>Panneau Administrateur</p>
<input style={{...s.inp,marginBottom:12}} type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
<input style={{...s.inp,marginBottom:18}} type="password" placeholder="Mot de passe" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}/>
<button style={{...s.btn,width:"100%",background:"linear-gradient(135deg,#FF6F00,#FBC005)",color:"#fff",padding:12,fontSize:15}} onClick={login}>Connexion</button>
</div>
</div>
);
return(
<div style={s.bg}>
{msg&&<div style={{position:"fixed",top:16,right:16,background:"#27ae60",color:"#fff",padding:"10px 18px",borderRadius:8,fontWeight:700,zIndex:9999}}>{msg}</div>}
<div style={{background:"rgba(255,255,255,0.03)",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"14px 24px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<div style={{fontSize:18,fontWeight:900}}>click<span style={{color:"#FF6F00"}}>&</span>fix ADMIN</div>
<div style={{display:"flex",gap:8}}>
<button style={{...s.btn,background:"rgba(56,189,248,0.1)",color:"#38bdf8",border:"1px solid rgba(56,189,248,0.3)"}} onClick={load}>Actualiser</button>
<button style={{...s.btn,background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.4)",border:"1px solid rgba(255,255,255,0.1)"}} onClick={()=>setAuth(false)}>Deconnexion</button>
</div>
</div>
<div style={{display:"flex",minHeight:"calc(100vh - 57px)"}}>
<div style={{width:180,background:"rgba(255,255,255,0.02)",borderRight:"1px solid rgba(255,255,255,0.05)",padding:"12px 8px"}}>
{[["dash","Dashboard"],["artisans","Artisans ("+pros.length+")"],["leads","Leads ("+leads.length+")"],["imp","Impayes ("+imp.length+")"]].map(([id,label])=>(
<button key={id} onClick={()=>setTab(id)} style={{display:"block",width:"100%",textAlign:"left",padding:"9px 12px",background:tab===id?"rgba(255,111,0,0.12)":"transparent",border:"none",borderRadius:8,color:tab===id?"#FF6F00":"rgba(255,255,255,0.4)",fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:3}}>{label}</button>
))}
</div>
<div style={{flex:1,padding:24,overflow:"auto"}}>
{tab==="dash"&&(
<div>
<h2 style={{fontSize:20,fontWeight:900,marginBottom:18}}>Vue d ensemble</h2>
<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
{[["Artisans",pros.length,"#FF6F00"],["Leads",leads.length,"#22c55e"],["Non assignes",unas.length,"#FBC005"],["Impayes",imp.length,"#ef4444"]].map(([l,v,c])=>(
<div key={l} style={{...s.card,marginBottom:0}}><div style={{fontSize:24,fontWeight:900,color:c}}>{v}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:3}}>{l}</div></div>
))}
</div>
{unas.length>0&&<div style={{background:"rgba(251,192,5,0.07)",border:"1px solid rgba(251,192,5,0.25)",borderRadius:12,padding:"14px 18px",marginBottom:14}}><div style={{color:"#FBC005",fontWeight:800}}>{unas.length} lead(s) non assigne(s) — lancez le dispatching</div></div>}
{imp.length>0&&<div style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:12,padding:"14px 18px"}}><div style={{color:"#ef4444",fontWeight:800}}>{imp.length} artisan(s) avec paiement en attente</div></div>}
</div>
)}
{tab==="artisans"&&(
<div>
<h2 style={{fontSize:20,fontWeight:900,marginBottom:18}}>Artisans ({pros.length})</h2>
{pros.length===0?<div style={{...s.card,textAlign:"center",padding:36,color:"rgba(255,255,255,0.3)"}}>Aucun artisan</div>:pros.map(p=>(
<div key={p.id} style={s.card}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
<div>
<div style={{fontWeight:800,fontSize:15}}>{p.prenom} {p.nom}</div>
<div style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginTop:3}}>{p.email} · {p.entreprise}</div>
<div style={{color:"rgba(255,255,255,0.4)",fontSize:12}}>RDV: {p.rdv_restants||0}/{p.rdv_total||0} · Statut: {p.statut_paiement||"actif"}</div>
</div>
<button style={{...s.btn,background:p.statut_paiement==="bloque"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)",color:p.statut_paiement==="bloque"?"#22c55e":"#ef4444",border:"1px solid "+(p.statut_paiement==="bloque"?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)")}} onClick={()=>block(p)}>{p.statut_paiement==="bloque"?"Debloquer":"Bloquer"}</button>
</div>
</div>
))}
</div>
)}
{tab==="leads"&&(
<div>
<h2 style={{fontSize:20,fontWeight:900,marginBottom:18}}>Leads ({leads.length})</h2>
{leads.length===0?<div style={{...s.card,textAlign:"center",padding:36,color:"rgba(255,255,255,0.3)"}}>Aucun lead</div>:leads.map(l=>(
<div key={l.id} style={s.card}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
<div>
<div style={{fontWeight:800,fontSize:15}}>{l.client_nom}</div>
<div style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginTop:3}}>Tel: {l.client_tel} · {l.travaux}</div>
<div style={{color:"rgba(255,255,255,0.4)",fontSize:12}}>Budget: {l.budget} · {l.adresse}</div>
</div>
<span style={{fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:99,background:l.assigned_to?"rgba(34,197,94,0.15)":"rgba(251,192,5,0.15)",color:l.assigned_to?"#22c55e":"#FBC005"}}>{l.assigned_to?"Assigne":"En attente"}</span>
</div>
</div>
))}
</div>
)}
{tab==="imp"&&(
<div>
<h2 style={{fontSize:20,fontWeight:900,marginBottom:18}}>Impayes ({imp.length})</h2>
{imp.length===0?<div style={{...s.card,textAlign:"center",padding:36,color:"rgba(255,255,255,0.3)"}}>Aucun impaye</div>:imp.map(p=>(
<div key={p.id} style={{...s.card,border:"1px solid rgba(239,68,68,0.3)"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
<div>
<div style={{fontWeight:800,fontSize:15}}>{p.prenom} {p.nom}</div>
<div style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginTop:3}}>{p.email}</div>
<div style={{color:"#ef4444",fontSize:12,fontWeight:700}}>Statut: {p.statut_paiement}</div>
</div>
<div style={{display:"flex",gap:8}}>
<a href={"mailto:"+p.email} style={{...s.btn,background:"rgba(56,189,248,0.1)",color:"#38bdf8",border:"1px solid rgba(56,189,248,0.3)",textDecoration:"none"}}>Relancer</a>
<button style={{...s.btn,background:"rgba(239,68,68,0.1)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.3)"}} onClick={()=>block(p)}>Bloquer</button>
</div>
</div>
</div>
))}
</div>
)}
</div>
</div>
</div>
);
}
