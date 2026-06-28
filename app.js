// ============================================================
// BILAN INVESTISSEMENTS — PWA Vanilla JS
// ============================================================

const CIBLES = {
  "Ramify (AV - ETF)":     { cible: 35, couleur: "#4F46E5", groupe: "Croissance" },
  "PEA - ETF DCAM":        { cible: 10, couleur: "#7C3AED", groupe: "Croissance" },
  "PEA - FDJ United":      { cible: 3,  couleur: "#A855F7", groupe: "Croissance" },
  "PEA - TotalEnergies":   { cible: 5,  couleur: "#9333EA", groupe: "Croissance" },
  "PEA - Rubis":           { cible: 3,  couleur: "#C084FC", groupe: "Croissance" },
  "Livret A":              { cible: 20, couleur: "#0891B2", groupe: "Sécurité"   },
  "LEP":                   { cible: 12, couleur: "#06B6D4", groupe: "Sécurité"   },
  "Bricks (crowdfunding)": { cible: 8,  couleur: "#F59E0B", groupe: "Alternatif" },
  "Bitstack (BTC)":        { cible: 2,  couleur: "#F97316", groupe: "Alternatif" },
  "Previs Option":         { cible: 2,  couleur: "#EF4444", groupe: "Alternatif" },
};

const TOLERANCE = 3;
const GROUPES_COULEURS = { Croissance: "#4F46E5", Sécurité: "#0891B2", Alternatif: "#F59E0B" };
const GROUPES = { Croissance: [], Sécurité: [], Alternatif: [] };
Object.entries(CIBLES).forEach(([k, v]) => GROUPES[v.groupe].push(k));

// ── State ──────────────────────────────────────────────────
let state = {
  vue: "saisie",
  valeurs: Object.fromEntries(Object.keys(CIBLES).map(k => [k, ""])),
  historique: [],
  moisLabel: moisCourant(),
  toast: null,
};

function moisCourant() {
  const d = new Date();
  return `${d.toLocaleString("fr-FR", { month: "long" })} ${d.getFullYear()}`;
}

// ── Storage ────────────────────────────────────────────────
function load() {
  try {
    const raw = localStorage.getItem("bilan_invest_pwa");
    if (raw) {
      const saved = JSON.parse(raw);
      state.valeurs = { ...state.valeurs, ...saved.valeurs };
      state.historique = saved.historique || [];
    }
  } catch {}
}

function save() {
  try {
    localStorage.setItem("bilan_invest_pwa", JSON.stringify({
      valeurs: state.valeurs,
      historique: state.historique,
    }));
  } catch {}
}

// ── Calculs ────────────────────────────────────────────────
function total() {
  return Object.values(state.valeurs).reduce((s, v) => s + (parseFloat(v) || 0), 0);
}

function alloc(k) {
  const t = total();
  return t > 0 ? ((parseFloat(state.valeurs[k]) || 0) / t) * 100 : 0;
}

function alertes() {
  return Object.keys(CIBLES).filter(k => {
    const ecart = Math.abs(alloc(k) - CIBLES[k].cible);
    return ecart > TOLERANCE && (parseFloat(state.valeurs[k]) || 0) > 0;
  });
}

function totalGroupe(g) {
  return GROUPES[g].reduce((s, k) => s + (parseFloat(state.valeurs[k]) || 0), 0);
}

function pctGroupe(g) {
  const t = total();
  return t > 0 ? (totalGroupe(g) / t) * 100 : 0;
}

// ── Toast ──────────────────────────────────────────────────
function showToast(msg) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

// ── Render ─────────────────────────────────────────────────
function render() {
  const root = document.getElementById("root");
  root.innerHTML = `
    ${renderHeader()}
    <div style="max-width:500px;margin:0 auto;padding:16px 14px 100px;">
      ${state.vue === "saisie"    ? renderSaisie()     : ""}
      ${state.vue === "bilan"     ? renderBilan()      : ""}
      ${state.vue === "historique"? renderHistorique() : ""}
    </div>
    ${renderNav()}
  `;
  bindEvents();
}

// ── Header ─────────────────────────────────────────────────
function renderHeader() {
  return `
  <div class="safe-top" style="background:linear-gradient(135deg,#1E1B4B 0%,#312E81 100%);padding:20px 18px 16px;position:sticky;top:0;z-index:100;border-bottom:1px solid #312E81;">
    <div style="max-width:500px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:20px;">📊</span>
          <h1 style="font-size:18px;font-weight:800;color:#C7D2FE;letter-spacing:-0.3px;">Bilan Invest</h1>
        </div>
        <p style="font-size:11px;color:#818CF8;margin-top:2px;">Suivi mensuel de votre patrimoine</p>
      </div>
      <div style="font-size:12px;font-weight:700;color:#4F46E5;background:#1E1B4B;padding:6px 12px;border-radius:20px;border:1px solid #312E81;">
        ${total() > 0 ? formatEur(total()) : "—"}
      </div>
    </div>
  </div>`;
}

// ── Nav ────────────────────────────────────────────────────
function renderNav() {
  const tabs = [
    { id: "saisie",     icon: "✏️", label: "Saisie"     },
    { id: "bilan",      icon: "📈", label: "Bilan"      },
    { id: "historique", icon: "📅", label: "Historique" },
  ];
  return `
  <nav class="safe-bottom" style="position:fixed;bottom:0;left:0;right:0;background:#0F0F1A;border-top:1px solid #1E1B4B;display:flex;z-index:100;">
    ${tabs.map(t => `
    <button data-nav="${t.id}" style="flex:1;padding:10px 4px 8px;border:none;background:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:3px;">
      <span style="font-size:20px;line-height:1;">${t.icon}</span>
      <span style="font-size:10px;font-weight:${state.vue===t.id?"700":"500"};color:${state.vue===t.id?"#818CF8":"#374151"};">${t.label}</span>
      ${state.vue===t.id?`<div style="width:20px;height:2px;background:#6366F1;border-radius:1px;"></div>`:""}
    </button>`).join("")}
  </nav>`;
}

// ── Vue Saisie ─────────────────────────────────────────────
function renderSaisie() {
  return `
  <div class="fade-in">
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;">
      <input id="mois-input" value="${state.moisLabel}"
        style="flex:1;background:#161627;border:1px solid #312E81;border-radius:10px;padding:10px 14px;color:#C7D2FE;font-size:14px;font-weight:600;"
      />
    </div>

    ${Object.keys(GROUPES).map(g => `
    <div style="margin-bottom:18px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <div style="width:3px;height:14px;border-radius:2px;background:${GROUPES_COULEURS[g]};"></div>
        <span style="font-size:10px;font-weight:800;letter-spacing:.1em;color:${GROUPES_COULEURS[g]};text-transform:uppercase;">${g}</span>
        <span style="font-size:10px;color:#374151;margin-left:auto;">Cible ${GROUPES[g].reduce((s,k)=>s+CIBLES[k].cible,0)}%</span>
      </div>
      <div style="background:#161627;border-radius:12px;overflow:hidden;border:1px solid #1E1B4B;">
        ${GROUPES[g].map((k, i) => `
        <div style="display:flex;align-items:center;padding:13px 14px;${i < GROUPES[g].length-1?"border-bottom:1px solid #1E1B4B;":""}gap:10px;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:500;color:#CBD5E1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${k}</div>
            <div style="font-size:10px;color:#374151;margin-top:1px;">Cible : ${CIBLES[k].cible}%</div>
          </div>
          <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;">
            <input type="number" inputmode="decimal" data-key="${k}" value="${state.valeurs[k]}" placeholder="0"
              style="width:88px;background:#0F0F1A;border:1px solid #312E81;border-radius:8px;padding:8px 10px;color:#E2E8F0;font-size:14px;font-weight:600;text-align:right;"
            />
            <span style="font-size:11px;color:#374151;">€</span>
          </div>
        </div>`).join("")}
      </div>
    </div>`).join("")}

    <button id="btn-valider" style="width:100%;padding:15px;border-radius:12px;border:none;background:${total()>0?"linear-gradient(135deg,#4F46E5,#7C3AED)":"#1E1B4B"};color:${total()>0?"#fff":"#374151"};font-size:15px;font-weight:700;cursor:${total()>0?"pointer":"not-allowed"};letter-spacing:.02em;margin-top:4px;">
      Générer le bilan →
    </button>
  </div>`;
}

// ── Vue Bilan ──────────────────────────────────────────────
function renderBilan() {
  const t = total();
  if (t === 0) return `
    <div class="fade-in" style="text-align:center;padding:60px 20px;color:#374151;">
      <div style="font-size:40px;margin-bottom:12px;">📋</div>
      <p style="font-size:14px;">Saisissez vos valeurs dans l'onglet Saisie<br/>pour voir le bilan.</p>
    </div>`;

  const als = alertes();

  return `
  <div class="fade-in">
    <!-- Groupes -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">
      ${Object.keys(GROUPES).map(g => `
      <div style="background:#161627;border-radius:10px;padding:12px 10px;border:1px solid ${GROUPES_COULEURS[g]}33;">
        <div style="font-size:9px;font-weight:800;color:${GROUPES_COULEURS[g]};letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px;">${g}</div>
        <div style="font-size:19px;font-weight:800;color:#E2E8F0;">${pctGroupe(g).toFixed(1)}%</div>
        <div style="font-size:10px;color:#374151;">${formatEur(totalGroupe(g))}</div>
      </div>`).join("")}
    </div>

    <!-- Alertes -->
    ${als.length > 0 ? `
    <div style="background:#1C1410;border:1px solid #92400E;border-radius:12px;padding:14px;margin-bottom:14px;">
      <div style="font-size:12px;font-weight:700;color:#F59E0B;margin-bottom:10px;">⚠️ Rééquilibrages suggérés</div>
      ${als.map(k => {
        const a = alloc(k);
        const ecart = a - CIBLES[k].cible;
        const montantCible = (CIBLES[k].cible / 100) * t;
        const diff = Math.abs((parseFloat(state.valeurs[k])||0) - montantCible);
        return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #292524;">
          <div>
            <div style="font-size:12px;font-weight:500;color:#CBD5E1;">${k}</div>
            <div style="font-size:11px;font-weight:700;color:${ecart>0?"#F87171":"#34D399"};">
              ${ecart>0?"▲":"▼"} ${Math.abs(ecart).toFixed(1)}%
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px;color:#6B7280;">${ecart>0?"Réduire":"Renforcer"}</div>
            <div style="font-size:13px;font-weight:700;color:#F59E0B;">${formatEur(diff)}</div>
          </div>
        </div>`;
      }).join("")}
    </div>` : `
    <div style="background:#0D1F1A;border:1px solid #065F46;border-radius:12px;padding:12px 14px;margin-bottom:14px;font-size:13px;color:#34D399;font-weight:600;">
      ✅ Allocation équilibrée — aucun rééquilibrage nécessaire.
    </div>`}

    <!-- Détail -->
    <div style="background:#161627;border-radius:12px;overflow:hidden;border:1px solid #1E1B4B;margin-bottom:14px;">
      <div style="display:grid;grid-template-columns:1fr 60px 55px 55px;gap:4px;padding:9px 12px;border-bottom:1px solid #1E1B4B;">
        ${["Placement","Actuel","Cible","Écart"].map((h,i) => `<span style="font-size:9px;font-weight:700;color:#374151;text-transform:uppercase;text-align:${i>0?"right":"left"};">${h}</span>`).join("")}
      </div>
      ${Object.entries(CIBLES).map(([k, meta]) => {
        const a = alloc(k);
        const ecart = a - meta.cible;
        const hasVal = (parseFloat(state.valeurs[k])||0) > 0;
        const ok = Math.abs(ecart) <= TOLERANCE;
        return `
        <div style="display:grid;grid-template-columns:1fr 60px 55px 55px;gap:4px;padding:10px 12px;border-bottom:1px solid #1E1B4B;opacity:${hasVal?1:0.35};align-items:center;">
          <div>
            <div style="font-size:12px;font-weight:500;color:#CBD5E1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${k}</div>
            <div style="height:3px;border-radius:2px;background:#1E1B4B;margin-top:4px;width:80%;">
              <div style="height:100%;border-radius:2px;background:${meta.couleur};width:${Math.min(a/(meta.cible*1.5)*100,100)}%;transition:width .4s;"></div>
            </div>
          </div>
          <span style="font-size:12px;font-weight:600;color:#E2E8F0;text-align:right;">${a.toFixed(1)}%</span>
          <span style="font-size:12px;color:#475569;text-align:right;">${meta.cible}%</span>
          <span style="font-size:12px;font-weight:700;text-align:right;color:${ok?"#34D399":ecart>0?"#F87171":"#60A5FA"};">
            ${ecart>0?"+":""}${ecart.toFixed(1)}%
          </span>
        </div>`;
      }).join("")}
    </div>
    <div style="font-size:10px;color:#374151;text-align:center;">Tolérance ±${TOLERANCE}% par rapport à la cible</div>
  </div>`;
}

// ── Vue Historique ─────────────────────────────────────────
function renderHistorique() {
  if (state.historique.length === 0) return `
    <div class="fade-in" style="text-align:center;padding:60px 20px;color:#374151;">
      <div style="font-size:40px;margin-bottom:12px;">📅</div>
      <p style="font-size:14px;">Aucun bilan enregistré.<br/>Commencez par saisir vos valeurs du mois.</p>
    </div>`;

  return `
  <div class="fade-in">
    <!-- Mini graphe evolution -->
    ${state.historique.length > 1 ? renderMiniGraph() : ""}

    ${state.historique.map((e, i) => {
      const prev = state.historique[i+1];
      const diff = prev ? e.total - prev.total : null;
      return `
      <div style="background:#161627;border-radius:12px;padding:14px;margin-bottom:10px;border:1px solid #1E1B4B;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <div>
            <div style="font-size:14px;font-weight:700;color:#C7D2FE;text-transform:capitalize;">${e.mois}</div>
            ${diff !== null ? `<div style="font-size:11px;font-weight:600;color:${diff>=0?"#34D399":"#F87171"};margin-top:2px;">
              ${diff>=0?"▲":"▼"} ${formatEur(Math.abs(diff))} vs mois préc.
            </div>` : `<div style="font-size:11px;color:#374151;">Premier bilan</div>`}
          </div>
          <div style="font-size:20px;font-weight:800;color:#E2E8F0;">${formatEur(e.total)}</div>
        </div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;">
          ${Object.keys(GROUPES).map(g => {
            const pct = GROUPES[g].reduce((s,k) => s + (e.allocations[k]||0), 0);
            return `<span style="font-size:10px;padding:3px 8px;border-radius:20px;background:${GROUPES_COULEURS[g]}22;color:${GROUPES_COULEURS[g]};font-weight:600;">${g} ${pct.toFixed(0)}%</span>`;
          }).join("")}
        </div>
      </div>`;
    }).join("")}
  </div>`;
}

function renderMiniGraph() {
  const sorted = [...state.historique].reverse();
  const vals = sorted.map(e => e.total);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const W = 340, H = 60, PAD = 10;
  const pts = vals.map((v, i) => {
    const x = PAD + (i / (vals.length - 1)) * (W - PAD*2);
    const y = H - PAD - ((v - min) / range) * (H - PAD*2);
    return `${x},${y}`;
  });
  return `
  <div style="background:#161627;border-radius:12px;padding:14px;margin-bottom:14px;border:1px solid #1E1B4B;">
    <div style="font-size:11px;font-weight:700;color:#6366F1;margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em;">Évolution du patrimoine</div>
    <svg width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible;">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4F46E5" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#4F46E5" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <polygon points="${pts.join(" ")} ${W-PAD},${H} ${PAD},${H}" fill="url(#grad)"/>
      <polyline points="${pts.join(" ")}" fill="none" stroke="#6366F1" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      ${pts.map((p, i) => {
        const [x, y] = p.split(",");
        return `<circle cx="${x}" cy="${y}" r="3" fill="${i===pts.length-1?"#818CF8":"#4F46E5"}"/>`;
      }).join("")}
    </svg>
    <div style="display:flex;justify-content:space-between;margin-top:4px;">
      <span style="font-size:10px;color:#374151;">${sorted[0].mois}</span>
      <span style="font-size:10px;color:#374151;">${sorted[sorted.length-1].mois}</span>
    </div>
  </div>`;
}

// ── Events ─────────────────────────────────────────────────
function bindEvents() {
  // Nav
  document.querySelectorAll("[data-nav]").forEach(btn => {
    btn.addEventListener("click", () => { state.vue = btn.dataset.nav; render(); });
  });

  // Inputs valeurs
  document.querySelectorAll("[data-key]").forEach(input => {
    input.addEventListener("input", e => {
      state.valeurs[input.dataset.key] = e.target.value;
      // Mise à jour du total dans le header sans re-render complet
      const badge = document.querySelector("[data-total]");
      if (badge) badge.textContent = total() > 0 ? formatEur(total()) : "—";
    });
    input.addEventListener("blur", () => render());
  });

  // Input mois
  const moisInput = document.getElementById("mois-input");
  if (moisInput) {
    moisInput.addEventListener("input", e => { state.moisLabel = e.target.value; });
  }

  // Bouton valider
  const btnValider = document.getElementById("btn-valider");
  if (btnValider) {
    btnValider.addEventListener("click", () => {
      if (total() === 0) return;
      const allocations = Object.fromEntries(Object.keys(CIBLES).map(k => [k, alloc(k)]));
      const entree = {
        mois: state.moisLabel,
        date: new Date().toISOString(),
        total: total(),
        valeurs: { ...state.valeurs },
        allocations,
      };
      state.historique = [entree, ...state.historique.slice(0, 11)];
      save();
      showToast("✅ Bilan enregistré !");
      state.vue = "bilan";
      render();
    });
  }
}

// ── Helpers ────────────────────────────────────────────────
function formatEur(n) {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";
}

// ── Init ───────────────────────────────────────────────────
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

load();
render();
