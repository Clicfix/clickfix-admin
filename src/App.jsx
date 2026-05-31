import { useState, useEffect } from "react";

const SB_URL = "https://bipqtqezntzcmxwiaqdz.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcHF0cWV6bnR6Y214d2lhcWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzk5MTAsImV4cCI6MjA5NTY1NTkxMH0.OmScmhwC-qOHf1tW81UxHgk0OHpSJvz5NCpktzMa81M";
const ADMIN_EMAIL = "admin@clickfix.fr";
const ADMIN_PASS = "Clickfix2025!";

const sb = {
  async getProfiles() {
    const r = await fetch(SB_URL + "/rest/v1/profiles?select=*&order=created_at.desc", {
      headers: { "apikey": SB_KEY }
    });
    return r.json();
  },
  async getLeads() {
    const r = await fetch(SB_URL + "/rest/v1/leads?select=*&order=created_at.desc", {
      headers: { "apikey": SB_KEY }
    });
    return r.json();
  },
  async updateProfile(id, data) {
    await fetch(SB_URL + "/rest/v1/profiles?id=eq." + id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "apikey": SB_KEY },
      body: JSON.stringify(data)
    });
  },
  async updateLead(id, data) {
    await fetch(SB_URL + "/rest/v1/leads?id=eq." + id, {
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

  function notify(msg, type="ok") {
    setToast({msg, type});
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
      const [p, l] = await Promise.all([sb.getProfiles(), sb.getLeads()]);
      setProfiles(Array.isArray(p) ? p : []);
      setLeads(Array.isArray(l) ? l : []);
    } catch(e) {
      notify("Erreur chargement: " + e.message, "err");
    }
    setLoading(false);
  }

  async function toggleBlock(profile) {
    const newStatus = profile.statut_paiement === "bloque" ? "actif" : "bloque";
    await sb.updateProfile(profile.id, { statut_paiement: newStatus });
    setProfiles(prev => prev.map(p => p.id === profile.id ? {...p, statut_paiement: newStatus} : p));
    notify(newStatus === "bloque" ? "Artisan bloqué" : "Artisan débloqué");
  }

  async function assignLead(leadId, proId) {
    await sb.updateLead(leadId, { assigned_to: proId, statut: "confirme" });
    setLeads(prev => prev.map(l => l.id === leadId ? {...l, assigned_to: proId, statut: "confirme"} : l));
    notify("RDV assigné ✅");
  }

  async function runDispatch() {
    setLoading(true);
    await sb.dispatch();
    await loadData();
    notify("Dispatching effectué ✅");
    setLoading(false);
  }

  const pros = profiles.filter(p => p.role === "pro");
  const parts = profiles.filter(p => p.role === "part");
  const unassigned = leads.filter(l => !l.assigned_to);
  const impayes = pros.filter(p => p.statut_paiement === "impaye" || p.statut_paiement === "expire");
  const bloques = pros.filter(p => p.statut_paiement === "bloque");

  const S = {
    bg: { minHeight:"100vh", background:"#07090f", fontFamily:"'Outfit',sans-serif", color:"#fff" },
    card: { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:20, marginBottom:12 },
    btn: { padding:"8px 16px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:13 },
    inp: { background:"rgba(255,255,255,0.06)", border:"1.5px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:14, fontFamily:"'Outfit',sans-serif", width:"100%", outline:"none" },
  };

  if (!auth) return (
    <div style={{ ...S.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
      {toast && <div style={{ position:"fixed", top:16, right:16, background:toast.type==="err"?"#c0392b":"#27ae60", color:"#fff", padding:"12px 20px", borderRadius:10, fontWeight:700, zIndex:9999 }}>{toast.msg}</div>}
      <div style={{ ...S.card, maxWidth:400, width:"100%", padding:40 }}>
        <h1 style={{ fontSize:28, fontWeight:900, marginBottom:6 }}>⚙️ click<span style={{ color:"#FF6F00" }}>&</span>fix</h1>
        <p style={{ color:"rgba(255,255,255,0.4)", marginBottom:28, fontSize:13 }}>Panneau Administrateur</p>
        <div style={{ marginBottom:14 }}>
          <input style={S.inp} type="email" placeholder="Email admin" value={email} onChange={e=>setEmail(e.target.value)}/>
        </div>
        <div style={{ marginBottom:20 }}>
          <input style={S.inp} type="password" placeholder="Mot de passe" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}/>
        </div>
        <button style={{ ...S.btn, width:"100%", background:"linear-gradient(135deg,#FF6F00,#FBC005)", color:"#fff", padding:"13px", fontSize:15 }} onClick={login}>
          Connexion →
        </button>
      </div>
    </div>
  );

  const TABS = [
    { id:"dashboard", label:"📊 Dashboard" },
    { id:"artisans",  label:"👷 Artisans" },
    { id:"leads",     label:"📋 Leads" },
    { id:"impayes",   label:"💳 Impayés" + (impayes.length > 0 ? " 🔴" : "") },
  ];

  return (
    <div style={S.bg}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#333;border-radius:99px}`}</style>
      {toast && <div style={{ position:"fixed", top:16, right:16, background:toast.type==="err"?"#c0392b":"#27ae60", color:"#fff", padding:"12px 20px", borderRadius:10, fontWeight:700, zIndex:9999 }}>{toast.msg}</div>}
      {loading && <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9998 }}><div style={{ width:40, height:40, border:"3px solid rgba(255,255,255,0.1)", borderTop:"3px solid #FF6F00", borderRadius:"50%", animation:"spin .8s linear infinite" }}/></div>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ background:"rgba(255,255,255,0.03)", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"16px 28px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:20, fontWeight:900 }}>⚙️ click<span style={{ color:"#FF6F00" }}>&</span>fix <span style={{ fontSize:11, background:"rgba(255,111,0,0.15)", color:"#FF6F00", border:"1px solid rgba(255,111,0,0.3)", borderRadius:4, padding:"2px 6px", fontWeight:700 }}>ADMIN</span></div>
        <div style={{ display:"flex", gap:10 }}>
          <button style={{ ...S.btn, background:"rgba(56,189,248,0.1)", color:"#38bdf8", border:"1px solid rgba(56,189,248,0.3)" }} onClick={loadData}>🔄 Actualiser</button>
          <button style={{ ...S.btn, background:"rgba(255,111,0,0.1)", color:"#FF6F00", border:"1px solid rgba(255,111,0,0.3)" }} onClick={runDispatch}>⚡ Dispatcher</button>
          <button style={{ ...S.btn, background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.4)" }} onClick={()=>setAuth(false)}>Déconnexion</button>
        </div>
      </div>

      <div style={{ display:"flex", minHeight:"calc(100vh - 65px)" }}>
        {/* Sidebar */}
        <div style={{ width:220, background:"rgba(255,255,255,0.02)", borderRight:"1px solid rgba(255,255,255,0.05)", padding:"16px 10px" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ display:"block", width:"100%", textAlign:"left", padding:"10px 14px", background:tab===t.id?"rgba(255,111,0,0.12)":"transparent", border:"none", borderRadius:10, color:tab===t.id?"#FF6F00":"rgba(255,255,255,0.4)", fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:600, cursor:"pointer", marginBottom:4 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1, padding:28, overflow:"auto" }}>

          {/* DASHBOARD */}
          {tab === "dashboard" && (
            <div>
              <h2 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>Vue d'ensemble</h2>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:28 }}>
                {[
                  { label:"Artisans", val:pros.length, color:"#FF6F00", icon:"👷" },
                  { label:"Particuliers", val:parts.length, color:"#38bdf8", icon:"🏠" },
                  { label:"Leads total", val:leads.length, color:"#22c55e", icon:"📋" },
                  { label:"Non assignés", val:unassigned.length, color:"#FBC005", icon:"⏳" },
                  { label:"Impayés", val:impayes.length, color:"#ef4444", icon:"💳" },
                  { label:"Bloqués", val:bloques.length, color:"#a855f7", icon:"🚫" },
                  { label:"Leads confirmés", val:leads.filter(l=>l.statut==="confirme").length, color:"#22c55e", icon:"✅" },
                  { label:"En attente", val:leads.filter(l=>l.statut==="en attente").length, color:"#FBC005", icon:"⌛" },
                ].map(s => (
                  <div key={s.label} style={{ ...S.card, marginBottom:0 }}>
                    <div style={{ fontSize:26, fontWeight:900, color:s.color }}>{s.val}</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginTop:4 }}>{s.icon} {s.label}</div>
                  </div>
                ))}
              </div>

              {unassigned.length > 0 && (
                <div style={{ background:"rgba(251,192,5,0.07)", border:"1px solid rgba(251,192,5,0.25)", borderRadius:14, padding:"16px 20px", marginBottom:20 }}>
                  <div style={{ color:"#FBC005", fontWeight:800, marginBottom:8 }}>⚠️ {unassigned.length} lead(s) non assigné(s)</div>
                  <button style={{ ...S.btn, background:"rgba(255,111,0,0.15)", color:"#FF6F00", border:"1px solid rgba(255,111,0,0.3)" }} onClick={runDispatch}>⚡ Lancer le dispatching</button>
                </div>
              )}

              {impayes.length > 0 && (
                <div style={{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:14, padding:"16px 20px" }}>
                  <div style={{ color:"#ef4444", fontWeight:800, marginBottom:8 }}>🔴 {impayes.length} artisan(s) avec paiement en attente</div>
                  <button style={{ ...S.btn, background:"rgba(239,68,68,0.15)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.3)" }} onClick={()=>setTab("impayes")}>Voir les impayés →</button>
                </div>
              )}
            </div>
          )}

          {/* ARTISANS */}
          {tab === "artisans" && (
            <div>
              <h2 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>👷 Artisans ({pros.length})</h2>
              {pros.length === 0 ? (
                <div style={{ ...S.card, textAlign:"center", padding:40, color:"rgba(255,255,255,0.3)" }}>Aucun artisan inscrit</div>
              ) : pros.map(p => (
                <div key={p.id} style={{ ...S.card }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:16 }}>{p.prenom} {p.nom}</div>
                      <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12, marginTop:4 }}>{p.email} · {p.entreprise} · SIRET: {p.siret}</div>
                      <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12, marginTop:2 }}>📞 {p.tel}</div>
                      {p.specialites && p.specialites.length > 0 && (
                        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:8 }}>
                          {p.specialites.map(s => <span key={s} style={{ fontSize:11, background:"rgba(255,111,0,0.1)", color:"#FF6F00", border:"1px solid rgba(255,111,0,0.2)", borderRadius:6, padding:"2px 8px" }}>{s}</span>)}
                        </div>
                      )}
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
                      <span style={{ fontSize:12, fontWeight:700, padding:"4px 10px", borderRadius:99, background:p.statut_paiement==="bloque"?"rgba(239,68,68,0.15)":p.statut_paiement==="impaye"?"rgba(251,192,5,0.15)":"rgba(34,197,94,0.15)", color:p.statut_paiement==="bloque"?"#ef4444":p.statut_paiement==="impaye"?"#FBC005":"#22c55e" }}>
                        {p.statut_paiement==="bloque"?"🚫 Bloqué":p.statut_paiement==="impaye"?"⚠️ Impayé":"✅ Actif"}
                      </span>
                      {p.pack && <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>Pack: {p.pack} · {p.rdv_restants||0}/{p.rdv_total||0} RDV</span>}
                      <button style={{ ...S.btn, background:p.statut_paiement==="bloque"?"rgba(34,197,94,0.1)":"rgba(239,68,68,0.1)", color:p.statut_paiement==="bloque"?"#22c55e":"#ef4444", border:"1px solid "+(p.statut_paiement==="bloque"?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)") }} onClick={()=>toggleBlock(p)}>
                        {p.statut_paiement==="bloque"?"✅ Débloquer":"🚫 Bloquer"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LEADS */}
          {tab === "leads" && (
            <div>
              <h2 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>📋 Leads ({leads.length})</h2>
              {leads.length === 0 ? (
                <div style={{ ...S.card, textAlign:"center", padding:40, color:"rgba(255,255,255,0.3)" }}>Aucun lead</div>
              ) : leads.map(l => (
                <div key={l.id} style={{ ...S.card }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:15 }}>{l.client_nom}</div>
                      <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12, marginTop:4 }}>📞 {l.client_tel} · ✉️ {l.client_email}</div>
                      <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12, marginTop:2 }}>📍 {l.adresse} · 🔧 {l.travaux}</div>
                      <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12, marginTop:2 }}>💶 {l.budget} · 📐 {l.surface}</div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.2)", marginTop:4 }}>{new Date(l.created_at).toLocaleDateString("fr-FR")}</div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
                      <span style={{ fontSize:12, fontWeight:700, padding:"4px 10px", borderRadius:99, background:l.assigned_to?"rgba(34,197,94,0.15)":"rgba(251,192,5,0.15)", color:l.assigned_to?"#22c55e":"#FBC005" }}>
                        {l.assigned_to?"✅ Assigné":"⏳ En attente"}
                      </span>
                      {!l.assigned_to && pros.filter(p=>p.statut_paiement!=="bloque"&&(p.rdv_restants||0)>0).length > 0 && (
                        <select onChange={e=>e.target.value&&assignLead(l.id,e.target.value)} style={{ ...S.inp, width:"auto", fontSize:12, padding:"6px 10px" }} defaultValue="">
                          <option value="">Assigner à...</option>
                          {pros.filter(p=>p.statut_paiement!=="bloque"&&(p.rdv_restants||0)>0).map(p=>(
                            <option key={p.id} value={p.id}>{p.prenom} {p.nom} ({p.rdv_restants} RDV)</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* IMPAYES */}
          {tab === "impayes" && (
            <div>
              <h2 style={{ fontSize:22, fontWeight:900, marginBottom:20 }}>💳 Impayés ({impayes.length})</h2>
              {impayes.length === 0 ? (
                <div style={{ ...S.card, textAlign:"center", padding:40, color:"rgba(255,255,255,0.3)" }}>✅ Aucun impayé</div>
              ) : impayes.map(p => (
                <div key={p.id} style={{ ...S.card, border:"1px solid rgba(239,68,68,0.3)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:16 }}>{p.prenom} {p.nom}</div>
                      <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12, marginTop:4 }}>{p.email} · {p.entreprise}</div>
                      <div style={{ color:"#ef4444", fontSize:12, marginTop:4, fontWeight:700 }}>Statut: {p.statut_paiement}</div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <a href={"mailto:"+p.email+"?subject=Rappel paiement Click&fix&body=Bonjour "+p.prenom+", votre paiement est en attente."} style={{ ...S.btn, background:"rgba(56,189,248,0.1)", color:"#38bdf8", border:"1px solid rgba(56,189,248,0.3)", textDecoration:"none" }}>📧 Relancer</a>
                      <button style={{ ...S.btn, background:"rgba(239,68,68,0.1)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.3)" }} onClick={()=>toggleBlock(p)}>🚫 Bloquer</button>
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
