import { useState, useEffect } from "react";

const SB_URL = "https://bipqtqezntzcmxwiaqdz.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcHF0cWV6bnR6Y214d2lhcWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzk5MTAsImV4cCI6MjA5NTY1NTkxMH0.OmScmhwC-qOHf1tW81UxHgk0OHpSJvz5NCpktzMa81M";
const ADMIN_EMAIL = "admin@clickfix.fr";
const ADMIN_PASS = "Clickfix2025!";

const sb = {
  async get(table) {
    const r = await fetch(SB_URL + "/rest/v1/" + table + "?select=*&order=created_at.desc", {
      headers: { "apikey": SB_KEY }
    });
    return r.json();
  },
  async patch(table, id, data) {
    await fetch(SB_URL + "/rest/v1/" + table + "?id=eq." + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "apikey": SB_KEY },
      body: JSON.stringify(data)
    });
  },
  async dispatch() {
    await fetch(SB_URL + "/rest/v1/rpc/dispatch_leads", {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SB_KEY },
      body: JSON.stringify({})
    });
  }
};

export default function App() {
  const [auth, setAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [tab, setTab] = useState("dashboard");
  const [profiles, setProfiles] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [selLead, setSelLead] = useState(null);  const [selLead, setSelLead] = useState(null);
  function notify(msg, type) {
    setToast({ msg, type: type || "ok" });
    setTimeout(() => setToast(null), 3500);
  }

  function login() {
    if (email === ADMIN_EMAIL && pass === ADMIN_PASS) {
      setAuth(true);
      loadData();
    } else {
      notify("Identifiants incorrects", "err");
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const p = await sb.get("profiles");
      const l = await sb.get("leads");
      setProfiles(Array.isArray(p) ? p : []);
      setLeads(Array.isArray(l) ? l : []);
    } catch(e) {
      notify("Erreur: " + e.message, "err");
    }
    setLoading(false);
  }

  async function toggleBlock(p) {
    const s = p.statut_paiement === "bloque" ? "actif" : "bloque";
    await sb.patch("profiles", p.id, { statut_paiement: s });
    setProfiles(prev => prev.map(x => x.id === p.id ? {...x, statut_paiement: s} : x));
    notify(s === "bloque" ? "Bloque" : "Debloque");
  }

  async function assignLead(leadId, proId) {
    await sb.patch("leads", leadId, { assigned_to: proId, statut: "confirme" });
    setLeads(prev => prev.map(l => l.id === leadId ? {...l, assigned_to: proId, statut: "confirme"} : l));
    notify("RDV assigne");
  }

  async function runDispatch() {
    setLoading(true);
    const unas=leads.filter(l=>!l.assigned_to&&l.statut==="en attente");
    if(unas.length===0){notify("Aucun lead a dispatcher","err");setLoading(false);return;}
    let count=0;
    for(const lead of unas){
      const travaux=(lead.travaux||"").toLowerCase();
      const creneaux=JSON.parse(lead.creneaux||"[]");
      const nbArtisans=parseInt((lead.nb_artisans||"3"))||3;
      const matching=pros.filter(p=>{
        if(p.statut_paiement==="bloque")return false;
        if((p.rdv_restants||0)<=0)return false;
        if(!p.specialites||p.specialites.length===0)return true;
        return p.specialites.some(s=>travaux.includes(s.toLowerCase().split(" ")[0]));
      });
      const avail=matching.length>0?matching:pros.filter(p=>p.statut_paiement!=="bloque"&&(p.rdv_restants||0)>0);
      const toSend=avail.slice(0,Math.min(nbArtisans,avail.length));
      for(let i=0;i<toSend.length;i++){
        const pro=toSend[i];
        const creneau=creneaux[i%Math.max(creneaux.length,1)]||{label:"Sur RDV"};
        await sb.patch("leads",lead.id,{assigned_to:pro.id,statut:"dispatche",heure:creneau.label});
        await sb.patch("profiles",pro.id,{rdv_restants:Math.max(0,(pro.rdv_restants||1)-1)});
        count++;
      }
    }
    await loadData();
    notify(count+" RDV dispatche(s)");
    setLoading(false);
  }

  const pros = profiles.filter(p => p.role === "pro");
  const parts = profiles.filter(p => p.role === "part");
  const unassigned = leads.filter(l => !l.assigned_to);
  const impayes = pros.filter(p => p.statut_paiement === "impaye" || p.statut_paiement === "expire");

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #07090f; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 99px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    select option { background: #1a1a2e; color: #fff; }
  `;

  const card = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, marginBottom: 12 };
  const btn = { padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: 13 };
  const inp = { background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, fontFamily: "Outfit,sans-serif", width: "100%", outline: "none" };

  if (!auth) return (
    <div style={{ minHeight: "100vh", background: "#07090f", fontFamily: "Outfit,sans-serif", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{css}</style>
      {toast && <div style={{ position: "fixed", top: 16, right: 16, background: toast.type === "err" ? "#c0392b" : "#27ae60", color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 700, zIndex: 9999 }}>{toast.msg}</div>}
      <div style={{ ...card, maxWidth: 400, width: "100%", padding: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 6 }}>click<span style={{ color: "#FF6F00" }}>&</span>fix</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 28, fontSize: 13 }}>Panneau Administrateur</p>
        <div style={{ marginBottom: 14 }}>
          <input style={inp} type="email" placeholder="Email admin" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <input style={inp} type="password" placeholder="Mot de passe" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && login()} />
        </div>
        <button style={{ ...btn, width: "100%", background: "linear-gradient(135deg,#FF6F00,#FBC005)", color: "#fff", padding: "13px", fontSize: 15 }} onClick={login}>
          Connexion
        </button>
      </div>
    </div>
  );

  const TABS = [
    { id: "dashboard", label: "Dashboard" },
    { id: "artisans",  label: "Artisans (" + pros.length + ")" },
    { id: "leads",     label: "Leads (" + leads.length + ")" },
    { id: "impayes",   label: "Impayes (" + impayes.length + ")" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#07090f", fontFamily: "Outfit,sans-serif", color: "#fff" }}>
      <style>{css}</style>
      {toast && <div style={{ position: "fixed", top: 16, right: 16, background: toast.type === "err" ? "#c0392b" : "#27ae60", color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 700, zIndex: 9999 }}>{toast.msg}</div>}
      {loading && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9998 }}><div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.1)", borderTop: "3px solid #FF6F00", borderRadius: "50%", animation: "spin .8s linear infinite" }} /></div>}

      <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>click<span style={{ color: "#FF6F00" }}>&</span>fix ADMIN</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...btn, background: "rgba(56,189,248,0.1)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.3)" }} onClick={loadData}>Actualiser</button>
          <button style={{ ...btn, background: "rgba(255,111,0,0.1)", color: "#FF6F00", border: "1px solid rgba(255,111,0,0.3)" }} onClick={runDispatch}>Dispatcher</button>
          <button style={{ ...btn, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }} onClick={() => setAuth(false)}>Deconnexion</button>
        </div>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 65px)" }}>
        <div style={{ width: 200, background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.05)", padding: "16px 10px" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px", background: tab === t.id ? "rgba(255,111,0,0.12)" : "transparent", border: "none", borderRadius: 10, color: tab === t.id ? "#FF6F00" : "rgba(255,255,255,0.4)", fontFamily: "Outfit,sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 4 }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, padding: 28, overflow: "auto" }}>

          {tab === "dashboard" && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 20 }}>Vue d ensemble</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                {[
                  ["Artisans", pros.length, "#FF6F00"],
                  ["Particuliers", parts.length, "#38bdf8"],
                  ["Leads total", leads.length, "#22c55e"],
                  ["Non assignes", unassigned.length, "#FBC005"],
                  ["Impayes", impayes.length, "#ef4444"],
                  ["Confirmes", leads.filter(l => l.statut === "confirme").length, "#22c55e"],
                  ["En attente", leads.filter(l => l.statut === "en attente").length, "#FBC005"],
                  ["Bloques", pros.filter(p => p.statut_paiement === "bloque").length, "#a855f7"],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ ...card, marginBottom: 0 }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color }}>{val}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
              {unassigned.length > 0 && (
                <div style={{ background: "rgba(251,192,5,0.07)", border: "1px solid rgba(251,192,5,0.25)", borderRadius: 14, padding: "16px 20px", marginBottom: 16 }}>
                  <div style={{ color: "#FBC005", fontWeight: 800, marginBottom: 8 }}>{unassigned.length} lead(s) non assigne(s)</div>
                  <button style={{ ...btn, background: "rgba(255,111,0,0.15)", color: "#FF6F00", border: "1px solid rgba(255,111,0,0.3)" }} onClick={runDispatch}>Lancer le dispatching</button>
                </div>
              )}
              {impayes.length > 0 && (
                <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 14, padding: "16px 20px" }}>
                  <div style={{ color: "#ef4444", fontWeight: 800, marginBottom: 8 }}>{impayes.length} artisan(s) avec paiement en attente</div>
                  <button style={{ ...btn, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }} onClick={() => setTab("impayes")}>Voir les impayes</button>
                </div>
              )}
            </div>
          )}

          {tab === "artisans" && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 20 }}>Artisans ({pros.length})</h2>
              {pros.length === 0
                ? <div style={{ ...card, textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>Aucun artisan</div>
                : pros.map(p => (
                  <div key={p.id} style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>{p.prenom} {p.nom}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 }}>{p.email} · {p.entreprise}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Tel: {p.tel} · SIRET: {p.siret}</div>
                        {p.specialites && p.specialites.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                            {p.specialites.map(s => <span key={s} style={{ fontSize: 11, background: "rgba(255,111,0,0.1)", color: "#FF6F00", border: "1px solid rgba(255,111,0,0.2)", borderRadius: 6, padding: "2px 8px" }}>{s}</span>)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 99, background: p.statut_paiement === "bloque" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)", color: p.statut_paiement === "bloque" ? "#ef4444" : "#22c55e" }}>
                          {p.statut_paiement === "bloque" ? "Bloque" : "Actif"}
                        </span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>RDV: {p.rdv_restants || 0}/{p.rdv_total || 0}</span>
                        <button style={{ ...btn, background: p.statut_paiement === "bloque" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: p.statut_paiement === "bloque" ? "#22c55e" : "#ef4444", border: "1px solid " + (p.statut_paiement === "bloque" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)") }} onClick={() => toggleBlock(p)}>
                          {p.statut_paiement === "bloque" ? "Debloquer" : "Bloquer"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {tab === "leads" && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 20 }}>Leads ({leads.length})</h2>
              {leads.length === 0
                ? <div style={{ ...card, textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>Aucun lead</div>
                : leads.map(l => (
                  <div key={l.id} style={{...card,cursor:"pointer"}} onClick={()=>setSelLead(l)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15 }}>{l.client_nom}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 }}>Tel: {l.client_tel} · Email: {l.client_email}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Adresse: {l.adresse}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Travaux: {l.travaux} · Budget: {l.budget}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>{new Date(l.created_at).toLocaleDateString("fr-FR")}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 99, background: l.assigned_to ? "rgba(34,197,94,0.15)" : "rgba(251,192,5,0.15)", color: l.assigned_to ? "#22c55e" : "#FBC005" }}>
                          {l.assigned_to ? "Assigne" : "En attente"}
                        </span>
                        {!l.assigned_to && pros.filter(p => p.statut_paiement !== "bloque" && (p.rdv_restants || 0) > 0).length > 0 && (
                          <select onChange={e => e.target.value && assignLead(l.id, e.target.value)} style={{ ...inp, width: "auto", fontSize: 12, padding: "6px 10px" }} defaultValue="">
                            <option value="">Assigner a...</option>
                            {pros.filter(p => p.statut_paiement !== "bloque" && (p.rdv_restants || 0) > 0).map(p => (
                              <option key={p.id} value={p.id}>{p.prenom} {p.nom} ({p.rdv_restants} RDV)</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
          {selLead && <div style={{position:"fixed",top:0,right:0,width:400,height:"100vh",background:"#0d0f1a",borderLeft:"1px solid rgba(255,255,255,0.08)",zIndex:9999,overflow:"auto",padding:24}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}><h3 style={{color:"#fff",margin:0}}>Detail du lead</h3><button onClick={()=>setSelLead(null)} style={{background:"transparent",border:"none",color:"#fff",fontSize:20,cursor:"pointer"}}>x</button></div></div>}
          {tab === "impayes" && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 20 }}>Impayes ({impayes.length})</h2>
              {impayes.length === 0
                ? <div style={{ ...card, textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>Aucun impaye</div>
                : impayes.map(p => (
                  <div key={p.id} style={{ ...card, border: "1px solid rgba(239,68,68,0.3)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>{p.prenom} {p.nom}</div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 }}>{p.email} · {p.entreprise}</div>
                        <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4, fontWeight: 700 }}>Statut: {p.statut_paiement}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <a href={"mailto:" + p.email + "?subject=Rappel paiement Click&fix"} style={{ ...btn, background: "rgba(56,189,248,0.1)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.3)", textDecoration: "none" }}>Relancer</a>
                        <button style={{ ...btn, background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }} onClick={() => toggleBlock(p)}>Bloquer</button>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
