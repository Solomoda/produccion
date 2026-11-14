"use strict";
/* Solo Moda · Producción Diomar */
const SUPA_URL = "https://mjmstkclxhthescrbvqi.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qbXN0a2NseGh0aGVzY3JidnFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2NTI3ODksImV4cCI6MjExMDIyODc4OX0.ZE2WYn8sEZqnE3saF6EKxT8vaBxnIZzZnx_KTtk-SVE";
const sb = supabase.createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });

/* ---------- utilidades ---------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const m = (n) => (n < 0 ? "-$ " : "$ ") + Math.round(Math.abs(n || 0)).toLocaleString("es-CO");
const q = (n) => Math.round(n || 0).toLocaleString("es-CO");
const num = (v) => { if (typeof v === "number") return v; const x = parseFloat(String(v ?? "").replace(/\./g, "").replace(",", ".")); return isNaN(x) ? 0 : x; };
const hoyISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const fecha = (iso) => { if (!iso) return ""; const [a, b, c] = String(iso).slice(0, 10).split("-"); return `${c}/${b}/${a}`; };
const onlyRef = (s) => String(s || "").replace(/\D/g, "");
function toast(t) { const e = $("#toast"); e.textContent = t; e.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (e.hidden = true), 3200); }
async function must(p) { const r = await p; if (r.error) throw r.error; return r.data; }

const TIPO_NOV = {
  pendiente_confeccion: "Pendiente confección", pendiente_lavanderia: "Pendiente lavandería", muestra: "Muestra",
  cobro_confeccion: "Cobro a confección", cobro_lavanderia: "Cobro a lavandería", perdida: "Perdida", falto: "Faltó", sobro: "Llegó de más",
};
const TIPO_PAGO = { taller: "Taller (confección)", lavanderia: "Lavandería", insumos: "Insumos / facturas", abono: "Abono a Diomar", cobro_taller: "Cobro a taller", otro: "Otro" };
const TIPO_DOC = {
  ficha: "Ficha técnica", despacho: "Orden de despacho", remision_pendientes: "Remisión de pendientes", remision_muestras: "Remisión de muestras",
  remision_cobro: "Remisión de cobro", pago: "Comprobante de pago", nomina_talleres: "Nómina de talleres", factura_tela: "Factura de tela", cierre: "Cierre del mes", otro: "Otro documento",
};
const IC = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9.5v5M18 9.5v5"/></svg>',
  box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/></svg>',
  search: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  dots: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
};

/* ---------- estado ---------- */
const S = {
  session: null, perfil: null, view: "inicio", ref: null, filtro: "revisar", buscar: "", menu: false,
  cfg: { iva: 0.19, corte: "2026-09-01", tol: 50, saldoIni: 0 },
  refs: [], novedades: [], despachos: [], archivos: [], cierres: [], pagos: [], cobrosMq: {}, perfiles: [], telas: [], compras: [],
  subida: [], detalle: null, pagoFiltro: "todos", cajaDesp: null, recovery: false,
};
const esAdmin = () => S.perfil?.rol === "admin";
const esOficina = () => ["admin", "oficina"].includes(S.perfil?.rol);

/* ---------- cálculos por referencia ---------- */
function calc(r) {
  const c = S.cfg;
  r.expl = num(r.pend_confeccion) + num(r.pend_lavanderia) + num(r.muestras) + num(r.cobro_confeccion) + num(r.cobro_lavanderia) + num(r.perdidas);
  r.pend = num(r.pend_confeccion) + num(r.pend_lavanderia);
  r.faltan = r.cortadas ? r.cortadas - r.llegaron - r.expl : 0;
  r.mando = num(r.mando_despachos) || num(r.cobradas);
  r.costo = num(r.maquila) + num(r.tela_sin_iva) * (1 + c.iva);
  r.ivaTotal = num(r.iva_maquila) + num(r.tela_sin_iva) * c.iva;
  r.costoReal = r.costo * (1 + num(r.margen));
  r.margenVenta = r.precio_venta && r.costoReal ? 1 - r.costoReal / r.precio_venta : null;
  r.anterior = !r.fecha || r.fecha < c.corte;
  const iss = [];
  if (!r.anterior) {
    if (r.faltan < 0) iss.push(`Llegaron ${q(-r.faltan)} más de las cortadas`);
    if (r.cerrada && r.faltan > 0) iss.push(`Faltan ${q(r.faltan)} prendas sin explicar`);
    if (r.cerrada && num(r.mando_despachos) > r.llegaron + r.expl) iss.push(`Diomar dice que mandó ${q(r.mando_despachos)} y llegaron ${q(r.llegaron)}`);
    if (num(r.cobradas) > r.llegaron) iss.push(`Cobra ${q(r.cobradas - r.llegaron)} prendas más de las que llegaron`);
    const dp = num(r.cobrado) - num(r.maquila) * num(r.cobradas);
    if (num(r.cobradas) && dp > c.tol * num(r.cobradas)) iss.push(`Cobra ${m(dp)} más que la ficha`);
    if (r.cerrada && r.cortadas && !num(r.n_pagos_lavanderia) && r.lavanderia) iss.push("Sin factura de lavandería registrada");
    if (r.cerrada && r.cortadas && !num(r.n_pagos_confeccion)) iss.push("Sin pago de confección registrado");
    if (num(r.avisos_abiertos)) iss.push(`${q(r.avisos_abiertos)} aviso(s) abiertos en novedades`);
  }
  r.issues = iss;
  if (r.anterior) r.estado = r.pend > 0 ? "PENDIENTE" : "ANTERIOR";
  else if (iss.length) r.estado = "REVISAR";
  else if (!r.cerrada && r.faltan > 0) r.estado = "EN CAMINO";
  else if (r.pend > 0) r.estado = "PENDIENTE";
  else r.estado = "COMPLETA";
  return r;
}
const PILL = { REVISAR: "p-bad", "EN CAMINO": "p-warn", PENDIENTE: "p-info", COMPLETA: "p-ok", ANTERIOR: "p-grey" };
const pill = (e) => `<span class="pill ${PILL[e] || "p-grey"}">${e}</span>`;

/* ---------- carga de datos ---------- */
async function cargar() {
  const [cfg, refs, nov, desp, arch, cie, pag, cob, tel, comp] = await Promise.all([
    must(sb.from("config").select("*")),
    must(sb.from("v_referencias").select("*").limit(5000)),
    must(sb.from("novedades").select("*").order("creado_en", { ascending: false }).limit(3000)),
    must(sb.from("despachos").select("*, despacho_items(*)").order("creado_en", { ascending: false }).limit(300)),
    must(sb.from("archivos").select("id,nombre,tipo,estado,resumen,error,creado_en,resultado").order("creado_en", { ascending: false }).limit(60)),
    must(sb.from("cierres").select("*").order("mq")),
    must(sb.from("pagos").select("*, pago_items(*)").order("fecha", { ascending: false }).limit(3000)),
    must(sb.from("cobros").select("mq,total,cantidad").limit(10000)),
    must(sb.from("telas").select("*").order("nombre")),
    must(sb.from("compras_tela").select("*").order("fecha", { ascending: false })),
  ]);
  for (const c of cfg) {
    if (c.clave === "iva") S.cfg.iva = num(c.valor);
    if (c.clave === "fecha_corte") S.cfg.corte = c.valor;
    if (c.clave === "tolerancia_precio") S.cfg.tol = num(c.valor);
    if (c.clave === "saldo_inicial") S.cfg.saldoIni = num(c.valor.valor);
  }
  S.refs = refs.map((r) => calc({ ...r, cortadas: num(r.cortadas), llegaron: num(r.llegaron) }));
  S.novedades = nov; S.despachos = desp; S.archivos = arch; S.cierres = cie; S.pagos = pag; S.telas = tel; S.compras = comp;
  S.cobrosMq = {};
  for (const c of cob) { const k = c.mq; S.cobrosMq[k] = S.cobrosMq[k] || { total: 0, und: 0 }; S.cobrosMq[k].total += num(c.total); S.cobrosMq[k].und += num(c.cantidad); }
  if (S.ref) S.ref = S.refs.find((r) => r.ref === S.ref.ref) || S.ref;
}
async function recargar() { await cargar(); render(); }
const getRef = (ref) => S.refs.find((r) => r.ref === ref);

/* ---------- vistas ---------- */
function bar(r) { const p = r.cortadas ? Math.min(100, Math.round((r.llegaron / r.cortadas) * 100)) : 0; return `<div class="bar ${r.estado === "REVISAR" ? "b" : r.estado === "EN CAMINO" ? "w" : ""}"><i style="width:${p}%"></i></div>`; }
function item(r) {
  const nota = r.issues[0] || (r.estado === "EN CAMINO" ? `Faltan ${q(Math.max(0, r.faltan))} por llegar` : r.estado === "PENDIENTE" ? `${q(r.pend)} pendientes` : r.estado === "ANTERIOR" ? "Antes del corte" : "Todo en orden");
  return `<button class="item" data-ref="${esc(r.ref)}"><div class="row1"><span class="ref">${esc(r.ref)}</span>${pill(r.estado)}</div>
  <div class="desc">${esc(r.descripcion || "Sin ficha")} · ${esc(r.marca || "")}</div>${r.cortadas ? bar(r) : ""}
  <div class="row1 small"><span class="muted">Llegaron <b style="color:var(--fg)">${q(r.llegaron)}</b>${r.cortadas ? " de " + q(r.cortadas) : ""}</span><span class="muted" style="text-align:right">${esc(nota)}</span></div></button>`;
}

function vLogin() {
  if (S.recovery) {
    return `<div class="login"><form class="card" id="f-pass"><img src="logo.png" alt="Solo Moda"><h1 style="text-align:center">Cree su contraseña</h1><p class="small muted" style="text-align:center">Es su primera vez o le dieron una contraseña temporal. Escoja una propia.</p>
    <label class="lb">Contraseña nueva (mínimo 8 caracteres)<input id="p1" class="inp" type="password" autocomplete="new-password" minlength="8" required></label>
    <label class="lb">Repita la contraseña<input id="p2" class="inp" type="password" autocomplete="new-password" minlength="8" required></label>
    <button class="btn" type="submit">Guardar y entrar</button></form></div>`;
  }
  return `<div class="login"><form class="card" id="f-login"><img src="logo.png" alt="Solo Moda"><h1 style="text-align:center">Producción</h1>
  <label class="lb">Correo<input id="u" class="inp" type="email" autocomplete="username" required></label>
  <label class="lb">Contraseña<input id="p" class="inp" type="password" autocomplete="current-password" required></label>
  <button class="btn" type="submit">Entrar</button>
  <button class="link small" type="button" id="olvide">Olvidé mi contraseña</button></form></div>`;
}

function vInicio() {
  const act = S.refs.filter((r) => !r.anterior);
  const rev = act.filter((r) => r.estado === "REVISAR"), cam = act.filter((r) => r.estado === "EN CAMINO");
  const pendQ = S.refs.reduce((a, r) => a + r.pend, 0);
  const saldo = saldoActual();
  const ult = S.archivos.filter((a) => a.estado !== "descartado").slice(0, 4);
  const nombre = (S.perfil?.nombre || "").split(" ")[0];
  return `<div><p class="muted small">${new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}</p><h1>Hola${nombre ? ", " + esc(nombre) : ""}</h1></div>
  <div class="acts"><button class="act main" data-go="subir">${IC.up}Subir archivos</button><button class="act" data-go="caja">${IC.box}Llegó una caja</button><button class="act" data-go="nov">${IC.pen}Anotar novedad</button></div>
  <div class="kpis"><button class="kpi bad" data-go="refs" data-f="REVISAR"><b>${rev.length}</b><span>Referencias para revisar</span></button>
  <button class="kpi warn" data-go="refs" data-f="EN CAMINO"><b>${cam.length}</b><span>En camino desde Cúcuta</span></button>
  <button class="kpi" data-go="pend"><b>${q(pendQ)}</b><span>Prendas pendientes</span></button>
  <button class="kpi ${saldo < 0 ? "ok" : ""}" data-go="cuenta"><b style="font-size:19px">${m(Math.abs(saldo))}</b><span>${saldo < 0 ? "Saldo a favor de Solo Moda" : "Se le debe a Diomar"}</span></button></div>
  ${ult.length ? `<div class="card sect"><div class="spread"><h2>Lo último que se subió</h2><button class="link small" data-go="subir">Ver todo</button></div>${ult.map(archLinea).join("")}</div>` : ""}
  <div class="sect"><div class="spread"><h2>Para revisar</h2><button class="link small" data-go="refs" data-f="REVISAR">Ver todas</button></div>
  <div class="list">${rev.length ? rev.slice(0, 6).map(item).join("") : '<div class="card empty">Nada para revisar.</div>'}</div></div>`;
}
function archLinea(a) {
  const est = { leyendo: ["Leyendo…", "p-warn"], subido: ["Subido", "p-grey"], por_confirmar: ["Por confirmar", "p-warn"], guardado: ["Guardado", "p-ok"], error: ["Error", "p-bad"], por_completar: ["Por completar", "p-info"] }[a.estado] || [a.estado, "p-grey"];
  const av = a.resultado?.avisos?.length ? `<div class="small" style="color:var(--bad)">${a.resultado.avisos.map(esc).join("<br>")}</div>` : "";
  return `<div class="file-row" style="display:grid;gap:4px"><div class="spread"><span class="nm"><b>${esc(TIPO_DOC[a.tipo] || "Archivo")}</b> · ${esc(a.nombre)}</span><span class="pill ${est[1]}">${est[0]}</span></div>
  ${a.resumen ? `<div class="small muted">${esc(a.resumen)}</div>` : ""}${a.error ? `<div class="small" style="color:var(--bad)">${esc(a.error)}</div>` : ""}${av}
  ${a.estado === "por_confirmar" || a.estado === "error" ? `<div class="row"><button class="btn sm" data-revisar-arch="${a.id}">${a.estado === "error" ? "Reintentar" : "Revisar y guardar"}</button><button class="btn sm sec" data-descartar="${a.id}">Descartar</button></div>` : ""}
  ${a.estado === "guardado" && esAdmin() ? (S.confirmarDeshacer === a.id ? `<div class="alert"><b>¿Deshacer este archivo?</b> Se borra todo lo que agregó (fichas, pendientes, despachos, pagos o cobros).<div class="row" style="margin-top:8px"><button class="btn sm" data-deshacer="${a.id}">Sí, deshacer</button><button class="btn sm sec" data-act="no-deshacer">No</button></div></div>` : `<div class="row"><button class="btn sm sec" data-pre-deshacer="${a.id}">Deshacer</button></div>`) : ""}</div>`;
}

function vRefs() {
  const b = S.buscar.trim().toUpperCase();
  const base = S.refs;
  const fil = { revisar: (r) => r.estado === "REVISAR", REVISAR: (r) => r.estado === "REVISAR", "EN CAMINO": (r) => r.estado === "EN CAMINO", PENDIENTE: (r) => r.estado === "PENDIENTE", COMPLETA: (r) => r.estado === "COMPLETA", todas: (r) => !r.anterior, anteriores: (r) => r.anterior }[S.filtro] || (() => true);
  let l = base.filter((r) => (b ? true : fil(r)) && (!b || r.ref.includes(b) || (r.descripcion || "").toUpperCase().includes(b)));
  l.sort((a, z) => (z.fecha || "").localeCompare(a.fecha || "") || a.ref.localeCompare(z.ref));
  const c = (k) => base.filter(fil === k ? fil : ({ REVISAR: (r) => r.estado === "REVISAR", "EN CAMINO": (r) => r.estado === "EN CAMINO", PENDIENTE: (r) => r.estado === "PENDIENTE", COMPLETA: (r) => r.estado === "COMPLETA", todas: (r) => !r.anterior, anteriores: (r) => r.anterior }[k])).length;
  const f = S.filtro === "revisar" ? "REVISAR" : S.filtro;
  return `<h1>Referencias</h1>
  <label class="search">${IC.search}<input id="buscar" placeholder="Buscar referencia o prenda" value="${esc(S.buscar)}" inputmode="search" autocomplete="off"></label>
  <div class="chips">${[["REVISAR", "Revisar"], ["EN CAMINO", "En camino"], ["PENDIENTE", "Con pendientes"], ["COMPLETA", "Completas"], ["todas", "Todas"], ["anteriores", "Antes del corte"]].map(([k, t]) => `<button class="chip" data-f="${k}" aria-pressed="${f === k}">${t} ${c(k)}</button>`).join("")}</div>
  <div class="list">${l.length ? l.slice(0, 150).map(item).join("") : '<div class="card empty">No hay referencias con ese filtro.</div>'}</div>`;
}

function stepper(k, l) { return `<div class="f ed"><span>${l}</span><div class="step"><button data-st="${k}" data-d="-1" aria-label="Restar">−</button><b>${q(S.ref[TIPO_CAMPO[k]])}</b><button data-st="${k}" data-d="1" aria-label="Sumar">+</button></div></div>`; }
const TIPO_CAMPO = { pendiente_confeccion: "pend_confeccion", pendiente_lavanderia: "pend_lavanderia", muestra: "muestras", cobro_confeccion: "cobro_confeccion", cobro_lavanderia: "cobro_lavanderia", perdida: "perdidas" };

function vRef() {
  const r = S.ref; const d = S.detalle || {};
  const cobroDif = num(r.cobrado) - num(r.maquila) * num(r.cobradas);
  return `<button class="back" data-go="refs">‹ Referencias</button>
  <div class="head-ref"><div class="spread"><span class="r">${esc(r.ref)}</span>${pill(r.estado)}</div>
  <span class="muted">${esc(r.descripcion || "Sin ficha")} · ${esc(r.marca)} · ${esc(r.tela)}${r.oc ? " · OC " + esc(r.oc) : ""}${r.fecha ? " · " + fecha(r.fecha) : ""}</span></div>
  ${r.issues.length ? `<div class="alert"><b>Qué revisar</b><br>${r.issues.map(esc).join("<br>")}</div>` : r.estado === "EN CAMINO" ? `<div class="alert w">Faltan ${q(r.faltan)} por llegar. No es error hasta que marque que ya llegó todo.</div>` : r.estado === "PENDIENTE" ? `<div class="alert i">${q(r.pend)} prendas pendientes con Diomar.</div>` : r.estado === "ANTERIOR" ? `<div class="alert i">Referencia de antes del ${fecha(S.cfg.corte)}: se da por cerrada.</div>` : `<div class="alert o">Todo cuadra.</div>`}
  <div class="card sect"><h3>Producción</h3>
   <div class="grid2"><div class="f"><span>Cortadas (ficha)</span><b>${q(r.cortadas)}</b></div><div class="f"><span>Diomar dice que mandó</span><b>${q(r.mando)}</b></div>
   <div class="f ed"><span>Llegaron ✎</span><input id="lleg" type="number" inputmode="numeric" value="${r.llegaron}"></div><div class="f"><span>Faltan sin explicar</span><b style="color:${r.faltan > 0 ? "var(--bad)" : r.faltan < 0 ? "var(--warn)" : "var(--ok)"}">${q(r.faltan)}</b></div></div>
   <div class="toggle"><div><b>¿Ya llegó todo?</b><div class="small muted">Márquelo cuando llegue la última caja de esta referencia.</div></div><button class="sw" role="switch" aria-checked="${!!r.cerrada}" data-sw="cerrada" aria-label="Ya llegó todo"></button></div></div>
  <div class="card sect"><h3>Lo que no llegó ✎</h3><div class="grid2">${stepper("pendiente_confeccion", "Pendiente confección")}${stepper("pendiente_lavanderia", "Pendiente lavandería")}${stepper("muestra", "Muestras")}${stepper("cobro_confeccion", "Cobro a confección")}${stepper("cobro_lavanderia", "Cobro a lavandería")}${stepper("perdida", "Perdidas")}</div></div>
  <div class="card sect"><h3>Lo que cobra Diomar</h3><div class="grid2"><div class="f"><span>Prendas cobradas</span><b>${q(r.cobradas)}</b></div><div class="f"><span>Valor cobrado</span><b>${m(r.cobrado)}</b></div>
   <div class="f"><span>Según la ficha</span><b>${m(num(r.maquila) * num(r.cobradas))}</b></div><div class="f"><span>Diferencia</span><b style="color:${cobroDif > S.cfg.tol * num(r.cobradas) ? "var(--bad)" : "var(--fg)"}">${m(cobroDif)}</b></div></div>
   <p class="small muted">Lavandería: ${esc(r.lavanderia || "–")} ${esc(r.doc_lavanderia || "")} · Cierre ${esc(r.mq || "–")} · Pagado a lavandería ${m(r.pagado_lavanderia)}</p></div>
  <div class="card sect"><h3>Costo y precio</h3>
   ${num(r.n_fichas) > 1 ? `<p class="small muted">Promedio de ${q(r.n_fichas)} fichas según las prendas cortadas de cada una.</p>` : ""}
   <div class="grid2"><div class="f"><span>Maquila x prenda</span><b>${m(r.maquila)}</b></div><div class="f"><span>Tela x prenda (con IVA)</span><b>${m(num(r.tela_sin_iva) * (1 + S.cfg.iva))}</b></div>
   <div class="f"><span>IVA x prenda</span><b>${m(r.ivaTotal)}</b></div><div class="f"><span>Costo ficha</span><b>${m(r.costo)}</b></div></div>
   <div class="chips">${[0, 0.03, 0.05, 0.1, 0.15].map((p) => `<button class="chip" data-mg="${p}" aria-pressed="${Math.abs(num(r.margen) - p) < 0.0001}">${p ? "+" + Math.round(p * 100) + "%" : "Neto"}</button>`).join("")}</div>
   <div class="grid2"><div class="f"><span>Costo real (${num(r.margen) ? "+" + Math.round(num(r.margen) * 100) + "%" : "neto"})</span><b>${m(r.costoReal)}</b></div><div class="f ed"><span>Precio de venta ✎</span><input id="precio" type="number" inputmode="numeric" value="${r.precio_venta || ""}"></div></div>
   <div class="f" style="background:${r.margenVenta >= 0.5 ? "var(--ok-soft)" : r.margenVenta > 0 ? "var(--warn-soft)" : "var(--soft)"}"><span>Margen sobre el precio de venta</span><b class="big">${r.margenVenta != null ? Math.round(r.margenVenta * 100) + "%" : "–"}</b><span>${r.margenVenta != null ? "El precio es " + (r.precio_venta / r.costoReal).toFixed(2).replace(".", ",") + " veces el costo" : "Escriba el precio de venta"}</span></div></div>
  <div class="card sect"><h3>Notas ✎</h3><textarea id="notas" rows="3" placeholder="Ej: Diomar confirma que las 3 que faltan llegan en la próxima caja">${esc(r.notas)}</textarea><button class="btn sec sm" data-act="guardar-notas">Guardar nota</button></div>
  <div class="card sect"><h3>Historial</h3>${d.cargando ? '<span class="spin"></span>' : detalleHist(d)}</div>`;
}
function detalleHist(d) {
  const rows = [];
  for (const f of d.fichas || []) rows.push([f.creado_en, `Ficha: ${q(f.cortadas)} cortadas, maquila ${m(f.maquila)}${f.descripcion ? " (" + esc(f.descripcion) + ")" : ""}`]);
  for (const l of d.llegadas || []) rows.push([l.fecha, `${l.cantidad >= 0 ? "Llegaron" : "Corrección"} ${q(l.cantidad)}${l.nota ? " · " + esc(l.nota) : ""}`]);
  for (const n of d.novedades || []) rows.push([n.fecha, `${TIPO_NOV[n.tipo]}: ${q(n.cantidad)}${n.abierta ? "" : " (resuelta)"}${n.nota ? " · " + esc(n.nota) : ""}`]);
  for (const c of d.cobros || []) rows.push([c.fecha, `Cobro ${esc(c.mq)}: ${q(c.cantidad)} × ${m(c.valor_unit)} = ${m(c.total)}`]);
  for (const i of d.despachos || []) rows.push([i.despachos?.fecha, `${esc(i.despachos?.documento || "Despacho")}: Diomar dice ${q(i.cantidad)}`]);
  for (const p of d.pagos || []) rows.push([p.pagos?.fecha, `Pago ${esc(TIPO_PAGO[p.pagos?.tipo] || "")} ${esc(p.pagos?.beneficiario || "")}${num(p.total) ? ": " + m(p.total) : ""}`]);
  rows.sort((a, b) => String(b[0] || "").localeCompare(String(a[0] || "")));
  if (!rows.length) return '<p class="muted small">Sin movimientos.</p>';
  return `<div class="tbl"><table><tbody>${rows.slice(0, 60).map((x) => `<tr><td class="small muted" style="white-space:nowrap">${fecha(String(x[0] || "").slice(0, 10))}</td><td class="small">${x[1]}</td></tr>`).join("")}</tbody></table></div>`;
}
async function cargarDetalle(ref) {
  S.detalle = { cargando: true }; render();
  const [fichas, llegadas, novedades, cobros, despachos, pagos] = await Promise.all([
    must(sb.from("fichas").select("*").eq("ref", ref)),
    must(sb.from("llegadas").select("*").eq("ref", ref)),
    must(sb.from("novedades").select("*").eq("ref", ref)),
    must(sb.from("cobros").select("*").eq("ref", ref)),
    must(sb.from("despacho_items").select("cantidad, despachos(documento,fecha,tipo)").eq("ref", ref)),
    must(sb.from("pago_items").select("total, concepto, pagos(fecha,tipo,beneficiario)").eq("ref", ref)),
  ]);
  if (S.ref?.ref !== ref) return;
  S.detalle = { fichas, llegadas, novedades, cobros, despachos, pagos }; render();
}

/* ---------- subir ---------- */
function vSubir() {
  const pend = S.archivos.filter((a) => ["por_confirmar", "error", "leyendo", "subido"].includes(a.estado));
  const hechos = S.archivos.filter((a) => ["guardado", "por_completar"].includes(a.estado)).slice(0, 15);
  if (S.revisando) return vRevisar();
  return `<h1>Subir archivos</h1>
  <label class="drop" id="drop" for="arch">${IC.doc}<b>Toque para escoger los archivos</b><span class="muted small">PDF o fotos. Puede escoger muchos a la vez: fichas técnicas, órdenes de despacho, remisiones, nóminas de talleres, comprobantes de pago, facturas de tela o el cierre del mes.</span><input id="arch" type="file" multiple accept="application/pdf,image/*" hidden></label>
  ${S.subida.length ? `<div class="card sect"><h3>Subiendo</h3>${S.subida.map((s) => `<div class="file-row"><span class="nm">${esc(s.nombre)}</span><span class="small ${s.err ? "" : "muted"}" style="${s.err ? "color:var(--bad)" : ""}">${s.err ? esc(s.err) : s.listo ? "Leído ✓" : '<span class="spin"></span> ' + esc(s.paso)}</span></div>`).join("")}</div>` : ""}
  ${pend.length ? `<div class="card sect"><h3>Por confirmar</h3>${pend.map(archLinea).join("")}</div>` : ""}
  ${hechos.length ? `<div class="card sect"><h3>Ya guardados</h3>${hechos.map(archLinea).join("")}</div>` : ""}
  ${esOficina() ? '<button class="btn sec" data-go="pago-manual">Registrar un pago sin comprobante</button>' : ""}`;
}
async function subirArchivos(files) {
  const lista = [...files].filter((f) => /pdf|image/.test(f.type) || /\.pdf$/i.test(f.name));
  if (!lista.length) { toast("Solo se aceptan PDF o fotos."); return; }
  S.subida = lista.map((f) => ({ nombre: f.name, paso: "Subiendo…" })); render();
  for (let i = 0; i < lista.length; i++) {
    const f = lista[i], s = S.subida[i];
    try {
      const ruta = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}-${f.name.replace(/[^\w.\-]+/g, "_")}`;
      const up = await sb.storage.from("archivos").upload(ruta, f, { contentType: f.type || "application/pdf" });
      if (up.error) throw up.error;
      const a = await must(sb.from("archivos").insert({ nombre: f.name, ruta, estado: "subido", subido_por: S.session.user.id }).select("id").single());
      s.paso = "Claude está leyendo…"; render();
      const { data, error } = await sb.functions.invoke("leer-archivo", { body: { archivo_id: a.id } });
      if (error) { let msg = error.message; try { msg = (await error.context.json()).error || msg; } catch (_) {} throw new Error(msg); }
      if (data?.error) throw new Error(data.error);
      s.listo = true;
    } catch (e) { s.err = e.message || "No se pudo leer"; }
    render();
  }
  await cargar();
  S.subida = S.subida.filter((s) => s.err);
  const primero = S.archivos.find((a) => a.estado === "por_confirmar");
  if (primero) abrirRevision(primero.id); else render();
}
function abrirRevision(id) {
  const a = S.archivos.find((x) => x.id === id); if (!a) return;
  if (a.estado === "error") { reintentar(a); return; }
  S.revisando = JSON.parse(JSON.stringify(a)); S.view = "subir"; render(); window.scrollTo(0, 0);
}
async function reintentar(a) {
  toast("Leyendo otra vez…");
  const { data, error } = await sb.functions.invoke("leer-archivo", { body: { archivo_id: a.id } });
  await cargar();
  if (error || data?.error) { toast("No se pudo leer: " + (data?.error || error.message)); render(); return; }
  abrirRevision(a.id);
}
const inp = (path, val, t = "text", w = "") => `<input class="inp" data-path="${path}" type="${t}" ${t === "number" ? 'step="any" inputmode="decimal"' : ""} value="${esc(val ?? "")}" style="${w}">`;
function vRevisar() {
  const a = S.revisando, r = a.resultado || {}, t = a.tipo;
  let cuerpo = "";
  if (t === "ficha") {
    cuerpo = (r.fichas || []).map((f, i) => {
      const ex = getRef(onlyRef(f.referencia));
      return `<div class="card sect"><div class="spread"><h2>Ref ${esc(f.referencia)}</h2>${ex ? pill(ex.estado) : '<span class="pill p-info">NUEVA</span>'}</div>
      <p class="small muted">${esc(f.descripcion)} · ${esc(f.marca)} · ${esc(f.tela)} · OC ${esc(f.orden_corte)} · ${esc(f.mq)}</p>
      <div class="grid2">
       <label class="lb">Cortadas${inp(`fichas.${i}.cantidad_cortada`, f.cantidad_cortada, "number")}</label>
       <label class="lb">Promedio (m)${inp(`fichas.${i}.promedio`, f.promedio, "number")}</label>
       <label class="lb">Maquila con IVA x prenda${inp(`fichas.${i}.maquila`, f.maquila, "number")}</label>
       <label class="lb">IVA de la maquila${inp(`fichas.${i}.iva_maquila`, f.iva_maquila, "number")}</label>
       <label class="lb">Precio tela sin IVA${inp(`fichas.${i}.precio_tela`, f.precio_tela, "number")}</label>
       <label class="lb">Despachadas${inp(`fichas.${i}.cantidad_despachada`, f.cantidad_despachada, "number")}</label></div>
      ${[["pendientes_confeccion", "pendientes en confección"], ["pendientes_lavanderia", "pendientes en lavandería"], ["muestras", "muestras"], ["cobros_confeccion", "cobros a confección"], ["cobros_lavanderia", "cobros a lavandería"], ["perdidas", "perdidas"]].filter(([k]) => num(f[k])).map(([k, l]) => `<div class="small">Se anotarán <b>${q(f[k])}</b> ${l}.</div>`).join("")}
      ${ex && ex.cortadas && ex.n_fichas ? `<div class="small muted">Ya existe una ficha de esta referencia. Si es la misma, se actualiza.</div>` : ""}</div>`;
    }).join("");
  } else if (["despacho", "remision_pendientes", "remision_muestras", "remision_cobro"].includes(t)) {
    const d = r.despacho || { items: [] };
    cuerpo = `<div class="card sect"><div class="grid2"><label class="lb">Documento${inp("despacho.documento", d.documento)}</label><label class="lb">Fecha${inp("despacho.fecha", d.fecha, "date")}</label></div>
    <div class="tbl"><table><thead><tr><th>Ref</th><th>Prenda</th><th class="n">Cantidad</th></tr></thead><tbody>${(d.items || []).map((it, i) => `<tr><td><input data-path="despacho.items.${i}.referencia" value="${esc(it.referencia)}" style="width:86px;text-align:left"></td><td class="small">${esc(it.descripcion)}${getRef(onlyRef(it.referencia)) ? "" : ' <span class="pill p-info">sin ficha</span>'}</td><td class="n"><input data-path="despacho.items.${i}.cantidad" type="number" value="${it.cantidad}"></td></tr>`).join("")}</tbody></table></div>
    <p class="small">Total: <b>${q((d.items || []).reduce((s, x) => s + num(x.cantidad), 0))}</b> prendas.</p>
    <p class="small muted">${t === "despacho" ? "Queda EN CAMINO: cuando lleguen las cajas se confirman en «Llegó una caja»." : t === "remision_pendientes" ? "Son prendas pendientes que manda Diomar: se descuentan de los pendientes y quedan para confirmar su llegada." : t === "remision_muestras" ? "Se anotan como muestras en cada referencia." : "Se guarda como remisión de cobro para revisarla en el cierre."}</p></div>`;
  } else if (t === "pago") {
    cuerpo = (r.pagos || []).map((p, i) => `<div class="card sect"><div class="grid2"><label class="lb">Fecha${inp(`pagos.${i}.fecha`, p.fecha, "date")}</label><label class="lb">Valor${inp(`pagos.${i}.valor`, p.valor, "number")}</label>
    <label class="lb">A quién${inp(`pagos.${i}.beneficiario`, p.beneficiario)}</label><label class="lb">Tipo<select class="inp" data-path="pagos.${i}.tipo">${Object.entries(TIPO_PAGO).map(([k, v]) => `<option value="${k}" ${p.tipo === k ? "selected" : ""}>${v}</option>`).join("")}</select></label></div>
    <label class="lb">Referencias${inp(`pagos.${i}.referencias`, (p.referencias || []).join(" "))}</label><p class="small muted">${esc(p.detalle)} ${esc(p.documento)}</p></div>`).join("") + mqSelect();
  } else if (t === "nomina_talleres") {
    const tot = (r.nomina || []).reduce((s, x) => s + num(x.total), 0);
    cuerpo = `<div class="card sect"><div class="tbl"><table><thead><tr><th>Taller</th><th>Ref</th><th>Concepto</th><th class="n">Cant.</th><th class="n">Precio</th><th class="n">Total</th></tr></thead><tbody>${(r.nomina || []).map((x, i) => `<tr><td class="small">${esc(x.beneficiario)}</td><td><input data-path="nomina.${i}.referencia" value="${esc(x.referencia)}" style="width:80px;text-align:left"></td><td class="small">${esc(x.concepto)}</td><td class="n">${q(x.cantidad)}</td><td class="n">${m(x.precio)}</td><td class="n">${m(x.total)}</td></tr>`).join("")}</tbody></table></div>
    <p class="small">Total: <b>${m(tot)}</b>. Se guarda un pago por taller con el detalle por referencia.</p></div>` + mqSelect();
  } else if (t === "factura_tela") {
    cuerpo = (r.telas || []).map((x, i) => `<div class="card sect"><div class="grid2"><label class="lb">Tela${inp(`telas.${i}.tela`, x.tela)}</label><label class="lb">Metros${inp(`telas.${i}.metros`, x.metros, "number")}</label><label class="lb">Precio x m sin IVA${inp(`telas.${i}.precio_m`, x.precio_m, "number")}</label><label class="lb">Fecha${inp(`telas.${i}.fecha`, x.fecha, "date")}</label></div><p class="small muted">${esc(x.proveedor)} · ${esc(x.factura)}</p></div>`).join("");
  } else if (t === "cierre") {
    const c = r.cierre || { cobros: [] }, suma = (c.cobros || []).reduce((s, x) => s + num(x.total), 0);
    cuerpo = `<div class="card sect"><div class="grid2"><label class="lb">Cierre${inp("cierre.mq", c.mq)}</label><label class="lb">Total que dice Diomar${inp("cierre.total_dice", c.total_dice, "number")}</label></div>
    <p class="small">${q((c.cobros || []).length)} líneas que suman <b>${m(suma)}</b>. ${Math.abs(suma - num(c.total_dice)) > 1000 ? `<span style="color:var(--bad)">No coincide con el total de Diomar: diferencia ${m(num(c.total_dice) - suma)}.</span>` : "Coincide con el total de Diomar."}</p>
    ${S.cierres.find((x) => x.mq === c.mq) ? '<p class="small" style="color:var(--bad)">Ese cierre ya existe. Si guarda, se agregan sus cobros otra vez: bórrelo antes desde Cuenta si quiere reemplazarlo.</p>' : ""}</div>`;
  } else {
    cuerpo = `<div class="card"><p>No reconocí este documento. Puede descartarlo o dejarlo como «por completar» para revisarlo luego.</p></div>`;
  }
  return `<button class="back" data-act="cerrar-rev">‹ Volver</button>
  <h1>${esc(TIPO_DOC[t] || "Documento")}</h1><p class="muted small">${esc(a.nombre)}</p>
  ${r.resumen ? `<div class="alert i">${esc(r.resumen)}</div>` : ""}
  ${r.avisos?.length ? `<div class="alert"><b>Ojo en el documento</b><br>${r.avisos.map(esc).join("<br>")}</div>` : ""}
  ${cuerpo}
  <div class="row"><button class="btn" data-act="guardar-arch" style="flex:2">Confirmar y guardar</button><button class="btn sec" data-act="descartar-arch" style="flex:1">Descartar</button></div>`;
}
function mqSelect() {
  const sig = siguienteMq();
  return `<div class="card sect"><label class="lb">¿En qué cierre cuenta este pago?<input class="inp" data-path="_mq" value="${esc(S.revisando._mq ?? sig)}"></label>
  <div class="toggle"><div><b>Cuenta como abono a Diomar</b><div class="small muted">Apáguelo si este pago ya está registrado por otro comprobante.</div></div><button class="sw" role="switch" aria-checked="${S.revisando._cuenta !== false}" data-sw="_cuenta"></button></div></div>`;
}
function siguienteMq() {
  const mqs = S.cierres.map((c) => c.mq).sort(); const ult = mqs[mqs.length - 1] || "MQ028";
  return "MQ0" + String(parseInt(ult.replace(/\D/g, ""), 10) + 1).padStart(2, "0");
}
function setPath(obj, path, val) { const k = path.split("."); let o = obj; for (let i = 0; i < k.length - 1; i++) o = o[k[i]]; o[k[k.length - 1]] = val; }

async function guardarArchivo() {
  const a = S.revisando, r = a.resultado || {}, t = a.tipo, uid = S.session.user.id, aid = a.id;
  const yaHay = async (tabla) => (await must(sb.from(tabla).select("id").eq("archivo_id", aid).limit(1))).length > 0;
  if (t === "ficha") {
    for (const f of r.fichas || []) {
      const ref = onlyRef(f.referencia); if (!ref) continue;
      const ex = getRef(ref);
      const base = { ref, marca: f.marca || ex?.marca || "", descripcion: ex?.descripcion || f.descripcion || "", tela: f.tela || ex?.tela || "", oc: f.orden_corte || ex?.oc || "" };
      if (!ex) await must(sb.from("referencias").insert({ ...base, fecha: f.fecha_despacho || hoyISO(), cerrada: false }));
      else await must(sb.from("referencias").update({ marca: base.marca, tela: base.tela, oc: base.oc, fecha: ex.fecha || f.fecha_despacho || hoyISO(), actualizado_por: uid }).eq("ref", ref));
      const row = { ref, descripcion: f.descripcion, cortadas: Math.round(num(f.cantidad_cortada)), promedio: num(f.promedio), precio_tela: num(f.precio_tela), maquila: num(f.maquila), iva_maquila: num(f.iva_maquila), confeccion: num(f.confeccion), lavanderia: f.lavanderia, doc_lavanderia: f.doc_lavanderia, mq: f.mq, despachadas: Math.round(num(f.cantidad_despachada)), valor_total: num(f.valor_total_maquila), fecha_despacho: f.fecha_despacho || null, observaciones: f.observaciones, archivo_id: aid };
      const existentes = await must(sb.from("fichas").select("id,descripcion").eq("ref", ref));
      const delMismoArchivo = (r.fichas || []).filter((x) => onlyRef(x.referencia) === ref).length;
      let prev = existentes.find((x) => (x.descripcion || "") === (f.descripcion || ""));
      if (!prev && existentes.length === 1 && delMismoArchivo === 1) prev = existentes[0];
      if (prev) await must(sb.from("fichas").update(row).eq("id", prev.id)); else await must(sb.from("fichas").insert(row));
      if (!(await yaHay("novedades"))) {
        const novs = [["pendientes_confeccion", "pendiente_confeccion"], ["pendientes_lavanderia", "pendiente_lavanderia"], ["muestras", "muestra"], ["cobros_confeccion", "cobro_confeccion"], ["cobros_lavanderia", "cobro_lavanderia"], ["perdidas", "perdida"]]
          .filter(([k]) => num(f[k])).map(([k, tipo]) => ({ ref, tipo, cantidad: Math.round(num(f[k])), abierta: tipo.startsWith("pendiente"), nota: "Según la ficha " + a.nombre, archivo_id: aid, creado_por: uid }));
        if (novs.length) await must(sb.from("novedades").insert(novs));
      }
    }
  } else if (["despacho", "remision_pendientes", "remision_muestras", "remision_cobro"].includes(t)) {
    const d = r.despacho || { items: [] };
    const items = (d.items || []).map((it) => ({ ref: onlyRef(it.referencia), descripcion: it.descripcion || "", cantidad: Math.round(num(it.cantidad)), valor_unit: num(it.valor_unit) || null })).filter((x) => x.ref && x.cantidad);
    if (t === "remision_muestras") {
      await must(sb.from("novedades").insert(items.map((x) => ({ ref: x.ref, tipo: "muestra", cantidad: x.cantidad, abierta: false, nota: d.documento, archivo_id: aid, creado_por: uid }))));
    } else {
      const tipo = { despacho: "despacho", remision_pendientes: "pendientes", remision_cobro: "cobro" }[t];
      const dp = await must(sb.from("despachos").insert({ documento: d.documento || a.nombre, fecha: d.fecha || hoyISO(), tipo, cerrado: tipo === "cobro", archivo_id: aid, creado_por: uid }).select("id").single());
      if (items.length) await must(sb.from("despacho_items").insert(items.map((x) => ({ ...x, despacho_id: dp.id }))));
      for (const x of items) if (!getRef(x.ref)) await sb.from("referencias").insert({ ref: x.ref, descripcion: x.descripcion, fecha: d.fecha || hoyISO() });
    }
  } else if (t === "pago") {
    for (const p of r.pagos || []) {
      const pg = await must(sb.from("pagos").insert({ fecha: p.fecha || hoyISO(), mq: a._mq ?? siguienteMq(), tipo: p.tipo, beneficiario: p.beneficiario, valor: num(p.valor), documento: p.documento, detalle: p.detalle, cuenta_saldo: a._cuenta !== false, archivo_id: aid, creado_por: uid }).select("id").single());
      const refs = String(Array.isArray(p.referencias) ? p.referencias.join(" ") : p.referencias || "").match(/\d{6}/g) || [];
      if (refs.length) await must(sb.from("pago_items").insert(refs.map((x) => ({ pago_id: pg.id, ref: x, concepto: p.tipo === "lavanderia" ? "lavanderia" : p.tipo === "taller" ? "confeccion" : "otro", total: p.tipo === "lavanderia" ? num(p.valor) / refs.length : 0 }))));
    }
  } else if (t === "nomina_talleres") {
    const porTaller = {};
    for (const x of r.nomina || []) (porTaller[x.beneficiario] = porTaller[x.beneficiario] || []).push(x);
    for (const [ben, xs] of Object.entries(porTaller)) {
      const total = xs.reduce((s, x) => s + num(x.total), 0);
      const pg = await must(sb.from("pagos").insert({ fecha: hoyISO(), mq: a._mq ?? siguienteMq(), tipo: "taller", beneficiario: ben, valor: total, documento: a.nombre, detalle: "Nómina de talleres", cuenta_saldo: a._cuenta !== false, archivo_id: aid, creado_por: uid }).select("id").single());
      await must(sb.from("pago_items").insert(xs.filter((x) => onlyRef(x.referencia)).map((x) => ({ pago_id: pg.id, ref: onlyRef(x.referencia), concepto: x.concepto, cantidad: num(x.cantidad), precio: num(x.precio), total: num(x.total) }))));
    }
  } else if (t === "factura_tela") {
    for (const x of r.telas || []) {
      const nombre = String(x.tela || "").toUpperCase().trim(); if (!nombre) continue;
      if (!S.telas.find((tl) => tl.nombre === nombre)) await sb.from("telas").insert({ nombre, proveedor: x.proveedor || "" });
      await must(sb.from("compras_tela").insert({ fecha: x.fecha || hoyISO(), tela: nombre, metros: num(x.metros), precio_m: num(x.precio_m), proveedor: x.proveedor, factura: x.factura, archivo_id: aid }));
    }
  } else if (t === "cierre") {
    const c = r.cierre || { cobros: [] };
    await must(sb.from("cierres").upsert({ mq: c.mq, fecha: hoyISO(), total_dice: num(c.total_dice), saldo_dice: num(c.saldo_dice) || null, archivo_id: aid }));
    const rows = (c.cobros || []).map((x) => ({ mq: c.mq, fecha: x.fecha || null, oc: x.oc, ref: onlyRef(x.referencia) || null, descripcion: x.descripcion, doc_lavanderia: x.doc_lavanderia, cantidad: num(x.cantidad), valor_unit: num(x.valor_unit), total: num(x.total), archivo_id: aid }));
    for (let i = 0; i < rows.length; i += 200) await must(sb.from("cobros").insert(rows.slice(i, i + 200)));
  }
  await must(sb.from("archivos").update({ estado: t === "otro" ? "por_completar" : "guardado", resultado: r }).eq("id", aid));
}

/* ---------- llegó una caja ---------- */
function vCaja() {
  const abiertos = S.despachos.filter((d) => !d.cerrado && d.tipo !== "cobro");
  const d = S.cajaDesp;
  if (d) {
    return `<button class="back" data-act="caja-volver">‹ Volver</button><h1>${esc(d.documento)}</h1><p class="muted small">${fecha(d.fecha)} · Escriba lo que contó de cada referencia. Si llegó todo lo que dice Diomar, toque «Llegó completo».</p>
    <div class="card"><div class="tbl"><table><thead><tr><th>Ref</th><th class="n">Diomar dice</th><th class="n">Ya llegaron</th><th class="n">Contó ahora</th></tr></thead><tbody>
    ${d.despacho_items.map((it, i) => { const ya = llegadoDesp(d.id, it.ref); return `<tr><td><b>${esc(it.ref)}</b><div class="small muted">${esc(getRef(it.ref)?.descripcion || it.descripcion || "")}</div></td><td class="n">${q(it.cantidad)}</td><td class="n">${q(ya)}</td><td class="n"><input id="cj-${i}" type="number" inputmode="numeric" placeholder="0"></td></tr>`; }).join("")}
    </tbody></table></div></div>
    <div class="row"><button class="btn" data-act="caja-guardar" style="flex:1">Guardar lo contado</button><button class="btn sec" data-act="caja-completo" style="flex:1">Llegó completo</button></div>
    ${esOficina() ? '<button class="btn sec" data-act="cerrar-desp">Ya llegaron todas las cajas de esta orden</button>' : ""}`;
  }
  return `<h1>Llegó una caja</h1>
  ${abiertos.length ? `<div class="sect"><h3 class="muted small" style="text-transform:uppercase;letter-spacing:.07em">Órdenes en camino</h3><div class="list">${abiertos.map((x) => `<button class="item" data-desp="${x.id}"><div class="row1"><span class="ref" style="font-size:15px">${esc(x.documento)}</span><span class="pill ${x.tipo === "pendientes" ? "p-info" : "p-warn"}">${x.tipo === "pendientes" ? "PENDIENTES" : "EN CAMINO"}</span></div><div class="desc">${fecha(x.fecha)} · ${x.despacho_items.length} referencias · ${q(x.despacho_items.reduce((s, i) => s + i.cantidad, 0))} prendas</div></button>`).join("")}</div></div>` : '<div class="card empty">No hay órdenes de despacho en camino. Si llegó algo sin orden, regístrelo abajo.</div>'}
  <div class="card sect"><h3>Llegó algo sin orden de despacho</h3>
  <label class="lb">Referencia<input id="cref" class="inp" list="refs-dl" inputmode="numeric" autocomplete="off"></label><datalist id="refs-dl">${S.refs.filter((r) => !r.anterior || r.pend).map((r) => `<option value="${r.ref}">${esc(r.descripcion)}</option>`).join("")}</datalist>
  <label class="lb">¿Cuántas contó? (si es una corrección puede ser negativo)<input id="ccant" class="inp" type="number" inputmode="numeric"></label>
  <label class="lb">Nota (opcional)<input id="cnota" class="inp" placeholder="Ej: corrección de conteo, caja sin relación"></label>
  <button class="btn" data-act="caja-libre">Guardar</button></div>`;
}
function llegadoDesp(did, ref) { return (S.llegadasDesp?.[did] || []).filter((l) => l.ref === ref).reduce((s, l) => s + l.cantidad, 0); }
async function abrirDesp(id) {
  S.cajaDesp = S.despachos.find((d) => d.id === id);
  S.llegadasDesp = S.llegadasDesp || {};
  S.llegadasDesp[id] = await must(sb.from("llegadas").select("ref,cantidad").eq("despacho_id", id));
  render(); window.scrollTo(0, 0);
}
async function guardarCaja(completo) {
  const d = S.cajaDesp, uid = S.session.user.id, rows = [], novs = [];
  d.despacho_items.forEach((it, i) => {
    const ya = llegadoDesp(d.id, it.ref);
    const v = completo ? Math.max(0, it.cantidad - ya) : num($("#cj-" + i)?.value);
    if (v) rows.push({ ref: it.ref, cantidad: v, despacho_id: d.id, fecha: hoyISO(), nota: d.documento, registrado_por: uid });
    if (d.tipo === "pendientes" && v) novs.push({ ref: it.ref, tipo: "pendiente_confeccion", cantidad: -v, abierta: true, nota: "Llegaron con " + d.documento, creado_por: uid });
  });
  if (!rows.length) { toast("Escriba al menos una cantidad."); return; }
  await must(sb.from("llegadas").insert(rows));
  if (novs.length) await must(sb.from("novedades").insert(novs));
  for (const it of d.despacho_items) {
    const tot = llegadoDesp(d.id, it.ref) + rows.filter((r) => r.ref === it.ref).reduce((s, r) => s + r.cantidad, 0);
    if (tot > it.cantidad) await must(sb.from("novedades").insert({ ref: it.ref, tipo: "sobro", cantidad: tot - it.cantidad, abierta: true, nota: `${d.documento}: Diomar dice ${it.cantidad}, han llegado ${tot}`, creado_por: uid }));
  }
  toast(`Guardado: ${q(rows.reduce((s, r) => s + r.cantidad, 0))} prendas.`);
  S.cajaDesp = null; await recargar();
}
async function cerrarDesp() {
  const d = S.cajaDesp, uid = S.session.user.id;
  await abrirDesp(d.id);
  const faltas = d.despacho_items.map((it) => ({ it, falta: it.cantidad - llegadoDesp(d.id, it.ref) })).filter((x) => x.falta > 0);
  if (faltas.length) await must(sb.from("novedades").insert(faltas.map((x) => ({ ref: x.it.ref, tipo: "falto", cantidad: x.falta, abierta: true, nota: `${d.documento}: Diomar dice ${x.it.cantidad}, llegaron ${x.it.cantidad - x.falta}`, creado_por: uid }))));
  await must(sb.from("despachos").update({ cerrado: true }).eq("id", d.id));
  toast(faltas.length ? `Orden cerrada. Faltaron prendas en ${faltas.length} referencia(s): quedaron en Pendientes.` : "Orden cerrada: llegó todo.");
  S.cajaDesp = null; await recargar();
}

/* ---------- novedades / pendientes ---------- */
function vNov() {
  return `<button class="back" data-go="inicio">‹ Inicio</button><h1>Anotar novedad</h1><div class="card sect">
  <label class="lb">Referencia<input id="nref" class="inp" list="refs-dl2" inputmode="numeric" autocomplete="off"></label><datalist id="refs-dl2">${S.refs.map((r) => `<option value="${r.ref}">${esc(r.descripcion)}</option>`).join("")}</datalist>
  <span class="small muted">¿Qué pasó?</span><div class="chips wrap" id="n-tipos">${Object.entries(TIPO_NOV).map(([k, v], i) => `<button class="chip" data-nt="${k}" aria-pressed="${i === 0}">${v}</button>`).join("")}</div>
  <label class="lb">Cantidad<input id="ncant" class="inp" type="number" value="1"></label>
  <label class="lb">Nota<textarea id="nnota" rows="2" placeholder="Ej: llegaron 116, el despacho dice 117"></textarea></label>
  <button class="btn" data-act="guardar-nov">Guardar</button></div>`;
}
function vPend() {
  const abiertas = S.novedades.filter((n) => n.abierta);
  const porRef = {};
  for (const n of abiertas) { const k = n.ref; (porRef[k] = porRef[k] || []).push(n); }
  const grupos = Object.entries(porRef).map(([ref, ns]) => ({ ref, ns, tot: ns.filter((n) => n.tipo.startsWith("pendiente")).reduce((s, n) => s + n.cantidad, 0), avisos: ns.filter((n) => !n.tipo.startsWith("pendiente")) })).filter((g) => g.tot !== 0 || g.avisos.length);
  grupos.sort((a, b) => b.avisos.length - a.avisos.length || b.tot - a.tot);
  const despAb = S.despachos.filter((d) => !d.cerrado && d.tipo !== "cobro");
  return `<h1>Pendientes</h1>
  ${despAb.length ? `<div class="card sect"><h3>Órdenes en camino (${despAb.length})</h3>${despAb.slice(0, 8).map((d) => `<div class="file-row"><span class="nm">${esc(d.documento)} · ${fecha(d.fecha)}</span><button class="btn sm sec" data-desp="${d.id}">Abrir</button></div>`).join("")}</div>` : ""}
  <p class="muted small">${q(grupos.reduce((s, g) => s + Math.max(0, g.tot), 0))} prendas pendientes y ${q(grupos.reduce((s, g) => s + g.avisos.length, 0))} avisos abiertos, en ${grupos.length} referencias.</p>
  <div class="list">${grupos.slice(0, 120).map((g) => { const r = getRef(g.ref); return `<div class="card sect" style="gap:6px"><div class="spread"><button class="link" data-ref="${esc(g.ref)}" style="font-family:var(--f-head);font-size:16px;color:var(--fg)">${esc(g.ref)} ›</button>${g.tot ? `<span class="pill p-info">${q(g.tot)} pendientes</span>` : ""}</div>
  <div class="small muted">${esc(r?.descripcion || "")}</div>
  ${g.ns.map((n) => `<div class="spread small"><span>${esc(TIPO_NOV[n.tipo])} ${q(n.cantidad)}${n.nota ? " · " + esc(n.nota) : ""}</span><button class="btn sm sec" data-resolver="${n.id}">Resuelta</button></div>`).join("")}</div>`; }).join("") || '<div class="card empty">No hay pendientes.</div>'}</div>`;
}

/* ---------- cuenta ---------- */
function saldoActual() {
  const cob = Object.values(S.cobrosMq).reduce((s, c) => s + c.total, 0);
  const pag = S.pagos.filter((p) => p.cuenta_saldo).reduce((s, p) => s + num(p.valor), 0);
  return S.cfg.saldoIni + cob - pag;
}
function vCuenta() {
  const saldo = saldoActual();
  const mqs = [...new Set([...S.cierres.map((c) => c.mq), ...Object.keys(S.cobrosMq), ...S.pagos.filter((p) => p.cuenta_saldo).map((p) => p.mq)])].filter(Boolean).sort();
  let acum = S.cfg.saldoIni;
  const filas = mqs.map((mq) => { const c = S.cierres.find((x) => x.mq === mq) || {}; const cob = S.cobrosMq[mq]?.total || 0; const pag = S.pagos.filter((p) => p.cuenta_saldo && p.mq === mq).reduce((s, p) => s + num(p.valor), 0); acum += cob - pag; return { mq, c, cob, pag, acum }; });
  const ult = filas[filas.length - 1];
  const tipos = ["todos", ...Object.keys(TIPO_PAGO)];
  const pagos = S.pagos.filter((p) => S.pagoFiltro === "todos" || p.tipo === S.pagoFiltro);
  return `<h1>Cuenta con Diomar</h1>
  <div class="card" style="display:grid;gap:4px"><span class="muted small">Saldo hoy</span><span class="big" style="color:${saldo < 0 ? "var(--ok)" : "var(--bad)"}">${m(Math.abs(saldo))}</span><span class="small">${saldo < 0 ? "a favor de Solo Moda" : "se le debe a Diomar"}</span>
  ${ult?.c?.saldo_dice != null ? `<span class="small muted">Al cierre ${esc(ult.mq)} Diomar dice ${m(Math.abs(ult.c.saldo_dice))}. Diferencia: <b style="color:${Math.abs(ult.c.saldo_dice - ult.acum) > 1000 ? "var(--bad)" : "var(--ok)"}">${m(Math.abs(ult.c.saldo_dice - ult.acum))}</b></span>` : ""}</div>
  <div class="card sect"><h3>Cierres</h3><div class="tbl"><table><thead><tr><th>Cierre</th><th class="n">Cobró</th><th class="n">Pagado</th><th class="n">Saldo</th></tr></thead><tbody>
  <tr><td>Agosto</td><td class="n">–</td><td class="n">–</td><td class="n">${m(S.cfg.saldoIni)}</td></tr>
  ${filas.map((f) => `<tr><td><b>${esc(f.mq)}</b>${f.c.total_dice && Math.abs(f.c.total_dice - f.cob) > 1000 ? ' <span class="pill p-bad">revisar</span>' : ""}</td><td class="n">${m(f.cob)}</td><td class="n">${m(f.pag)}</td><td class="n">${m(f.acum)}</td></tr>`).join("")}</tbody></table></div>
  ${filas.filter((f) => f.c.total_dice && Math.abs(f.c.total_dice - f.cob) > 1000).map((f) => `<div class="alert"><b>${esc(f.mq)}:</b> Diomar dice ${m(f.c.total_dice)} y sus líneas suman ${m(f.cob)}. Diferencia ${m(f.c.total_dice - f.cob)}.</div>`).join("")}
  ${S.cierres.filter((c) => c.notas).map((c) => `<p class="small muted"><b>${esc(c.mq)}:</b> ${esc(c.notas)}</p>`).join("")}
  ${esOficina() ? '<button class="btn sec" data-go="subir">Subir cierre del mes</button>' : ""}</div>
  <div class="card sect"><div class="spread"><h3>Pagos y abonos</h3>${esOficina() ? '<button class="btn sm" data-go="pago-manual">+ Registrar pago</button>' : ""}</div>
  <div class="chips">${tipos.map((t) => `<button class="chip" data-pf="${t}" aria-pressed="${S.pagoFiltro === t}">${t === "todos" ? "Todos" : TIPO_PAGO[t]}</button>`).join("")}</div>
  <p class="small muted">${q(pagos.length)} pagos · ${m(pagos.filter((p) => p.cuenta_saldo).reduce((s, p) => s + num(p.valor), 0))} cuentan para el saldo.</p>
  <div class="tbl"><table><thead><tr><th>Fecha</th><th>A quién</th><th class="n">Valor</th></tr></thead><tbody>${pagos.slice(0, 120).map((p) => `<tr><td class="small" style="white-space:nowrap">${fecha(p.fecha)}<div class="muted">${esc(p.mq || "")}</div></td><td class="small">${esc(p.beneficiario)}<div class="muted">${esc(TIPO_PAGO[p.tipo])}${p.pago_items?.length ? " · " + p.pago_items.length + " ref." : ""}${p.cuenta_saldo ? "" : " · no suma al saldo"}</div></td><td class="n">${m(p.valor)}</td></tr>`).join("")}</tbody></table></div></div>`;
}
function vPagoManual() {
  return `<button class="back" data-go="cuenta">‹ Cuenta</button><h1>Registrar pago</h1><div class="card sect">
  <div class="grid2"><label class="lb">Fecha<input id="pm-fecha" class="inp" type="date" value="${hoyISO()}"></label><label class="lb">Valor<input id="pm-valor" class="inp" type="number" inputmode="numeric"></label></div>
  <label class="lb">A quién<input id="pm-ben" class="inp"></label>
  <label class="lb">Tipo<select id="pm-tipo" class="inp">${Object.entries(TIPO_PAGO).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select></label>
  <label class="lb">Referencias (opcional, separadas por espacio)<input id="pm-refs" class="inp" inputmode="numeric"></label>
  <label class="lb">Cierre<input id="pm-mq" class="inp" value="${siguienteMq()}"></label>
  <label class="lb">Detalle<input id="pm-det" class="inp"></label>
  <button class="btn" data-act="guardar-pago">Guardar pago</button></div>`;
}

/* ---------- usuarios y telas ---------- */
function claveTemporal() { const a = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"; let r = ""; const v = crypto.getRandomValues(new Uint32Array(10)); for (const x of v) r += a[x % a.length]; return r; }
function vUsuarios() {
  const nueva = S.claveMostrada;
  return `<button class="back" data-go="inicio">‹ Inicio</button><h1>Usuarios</h1>
  ${nueva ? `<div class="alert o"><b>Listo.</b> Mándele esto a ${esc(nueva.nombre)} por WhatsApp:<br><br>Entre a https://solomoda.github.io/produccion/<br>Correo: ${esc(nueva.email)}<br>Contraseña temporal: <b style="font-size:17px;letter-spacing:.05em">${esc(nueva.clave)}</b><br><br>La primera vez la app le pide escoger su propia contraseña.</div><button class="btn sec" data-act="copiar-clave">Copiar mensaje</button>` : ""}
  <div class="card sect"><h3>Dar acceso a alguien</h3>
  <label class="lb">Nombre<input id="us-nom" class="inp"></label><label class="lb">Correo<input id="us-mail" class="inp" type="email" autocomplete="off"></label>
  <label class="lb">Acceso<select id="us-rol" class="inp"><option value="almacen">Almacén: registra cajas y novedades</option><option value="oficina">Oficina: además sube archivos, pagos y cierres</option><option value="admin">Administrador: todo, incluso usuarios</option></select></label>
  <button class="btn" data-act="invitar">Crear acceso</button><p class="small muted">Se crea una contraseña temporal para que se la mande por WhatsApp. No se envían correos.</p></div>
  <div class="card sect"><h3>Personas con acceso</h3>${S.perfiles.map((p) => `<div class="file-row" style="flex-wrap:wrap"><span class="nm" style="flex:1 1 160px"><b>${esc(p.nombre)}</b><br><span class="small muted">${esc(p.email)}</span></span>
  <select class="inp" data-rol="${p.id}" style="width:auto">${["admin", "oficina", "almacen"].map((r) => `<option value="${r}" ${p.rol === r ? "selected" : ""}>${{ admin: "Admin", oficina: "Oficina", almacen: "Almacén" }[r]}</option>`).join("")}</select>
  <button class="btn sm sec" data-clave="${p.id}">Contraseña nueva</button>
  ${p.id !== S.session.user.id ? `<button class="btn sm sec" data-activo="${p.id}">${p.activo ? "Quitar acceso" : "Dar acceso"}</button>` : ""}</div>`).join("")}</div>`;
}
function vTelas() {
  const cons = {};
  for (const r of S.refs) if (r.tela && r.cortadas && !r.anterior) cons[r.tela] = (cons[r.tela] || 0) + r.cortadas * num(r.promedio);
  return `<button class="back" data-go="inicio">‹ Inicio</button><h1>Telas</h1><p class="small muted">Inventario al ${fecha(S.cfg.corte)} + compras − lo que se gastó en las fichas desde esa fecha.</p>
  <div class="card"><div class="tbl"><table><thead><tr><th>Tela</th><th class="n">Inicial</th><th class="n">Compras</th><th class="n">Gastado</th><th class="n">Saldo (m)</th></tr></thead><tbody>
  ${S.telas.map((t) => { const comp = S.compras.filter((c) => c.tela === t.nombre).reduce((s, c) => s + num(c.metros), 0); const g = cons[t.nombre] || 0; const sal = num(t.inventario_inicial) + comp - g; return `<tr><td>${esc(t.nombre)}</td><td class="n">${esOficina() ? `<input data-tela="${esc(t.nombre)}" type="number" value="${num(t.inventario_inicial) || ""}" placeholder="0">` : q(t.inventario_inicial)}</td><td class="n">${q(comp)}</td><td class="n">${q(g)}</td><td class="n" style="color:${sal < 0 ? "var(--bad)" : "var(--fg)"}">${q(sal)}</td></tr>`; }).join("")}
  </tbody></table></div></div>`;
}

/* ---------- render ---------- */
function render() {
  const app = $("#app");
  if (!S.session || S.recovery) { app.innerHTML = vLogin(); return; }
  const V = { inicio: vInicio, refs: vRefs, ref: vRef, subir: vSubir, caja: vCaja, nov: vNov, pend: vPend, cuenta: vCuenta, "pago-manual": vPagoManual, usuarios: vUsuarios, telas: vTelas }[S.view] || vInicio;
  const cur = S.view === "ref" ? "refs" : ["caja", "nov", "usuarios", "telas"].includes(S.view) ? "inicio" : S.view === "pago-manual" ? "cuenta" : S.view;
  const foco = document.activeElement?.id, pos = document.activeElement?.selectionStart;
  app.innerHTML = `<header class="top"><img src="logo.png" alt="Solo Moda"><div class="who"><span><b>Producción Diomar</b><br>${esc(S.perfil?.nombre || "")}</span><button class="menu-btn" data-act="menu" aria-label="Más opciones">${IC.dots}</button></div></header>
  ${S.menu ? `<div class="menu"><button data-go="telas">Telas</button>${esAdmin() ? '<button data-go="usuarios">Usuarios</button>' : ""}<button data-act="instalar">Agregar a la pantalla de inicio</button><button data-act="salir">Salir</button></div>` : ""}
  <main>${V()}</main>
  <nav class="nav" aria-label="Secciones"><div>
   <button data-go="inicio" ${cur === "inicio" ? 'aria-current="page"' : ""}>${IC.home}Inicio</button>
   <button data-go="refs" ${cur === "refs" ? 'aria-current="page"' : ""}>${IC.list}Referencias</button>
   <button class="plus" data-go="subir" ${cur === "subir" ? 'aria-current="page"' : ""}>${IC.up}Subir</button>
   <button data-go="pend" ${cur === "pend" ? 'aria-current="page"' : ""}>${IC.clock}Pendientes</button>
   <button data-go="cuenta" ${cur === "cuenta" ? 'aria-current="page"' : ""}>${IC.cash}Cuenta</button></div></nav>`;
  if (foco === "buscar") { const b = $("#buscar"); b.focus(); try { b.setSelectionRange(pos, pos); } catch (_) {} }
  const dr = $("#drop");
  if (dr) { dr.ondragover = (e) => { e.preventDefault(); dr.classList.add("over"); }; dr.ondragleave = () => dr.classList.remove("over"); dr.ondrop = (e) => { e.preventDefault(); dr.classList.remove("over"); subirArchivos(e.dataTransfer.files); }; }
}
function go(v) { S.view = v; S.menu = false; if (v !== "subir") S.revisando = null; if (v !== "caja") S.cajaDesp = null; render(); window.scrollTo(0, 0); }

/* ---------- eventos ---------- */
document.addEventListener("click", async (e) => {
  const t = e.target.closest("button,[data-ref]"); if (!t) { if (S.menu) { S.menu = false; render(); } return; }
  try {
    if (t.dataset.ref) { S.ref = getRef(t.dataset.ref); if (!S.ref) return; go("ref"); cargarDetalle(S.ref.ref); return; }
    if (t.dataset.f && !t.dataset.go) { S.filtro = t.dataset.f; render(); return; }
    if (t.dataset.pf) { S.pagoFiltro = t.dataset.pf; render(); return; }
    if (t.dataset.nt) { document.querySelectorAll("[data-nt]").forEach((c) => c.setAttribute("aria-pressed", c === t)); return; }
    if (t.dataset.desp) { S.view = "caja"; await abrirDesp(t.dataset.desp); return; }
    if (t.dataset.preDeshacer) { S.confirmarDeshacer = t.dataset.preDeshacer; render(); return; }
    if (t.dataset.deshacer) {
      t.disabled = true; const id = t.dataset.deshacer;
      for (const tabla of ["novedades", "fichas", "despachos", "pagos", "compras_tela", "cobros"]) await must(sb.from(tabla).delete().eq("archivo_id", id));
      const arch = S.archivos.find((x) => x.id === id);
      if (arch?.tipo === "cierre") await must(sb.from("cierres").delete().eq("archivo_id", id));
      await must(sb.from("archivos").update({ estado: "descartado" }).eq("id", id));
      S.confirmarDeshacer = null; toast("Archivo deshecho."); await recargar(); return;
    }
    if (t.dataset.descartar) { t.disabled = true; await must(sb.from("archivos").update({ estado: "descartado" }).eq("id", t.dataset.descartar)); toast("Descartado."); await recargar(); return; }
    if (t.dataset.revisarArch) { abrirRevision(t.dataset.revisarArch); return; }
    if (t.dataset.resolver) { t.disabled = true; await must(sb.from("novedades").update({ abierta: false }).eq("id", t.dataset.resolver)); toast("Marcada como resuelta."); await recargar(); return; }
    if (t.dataset.clave) {
      const p = S.perfiles.find((x) => x.id === t.dataset.clave), clave = claveTemporal(); t.disabled = true;
      const { data, error } = await sb.functions.invoke("usuarios", { body: { accion: "clave", id: p.id, password: clave } });
      if (error || data?.error) { let msg = data?.error || error.message; try { msg = (await error.context.json()).error || msg; } catch (_) {} toast("No se pudo: " + msg); t.disabled = false; return; }
      S.claveMostrada = { nombre: p.nombre, email: p.email, clave }; render(); window.scrollTo(0, 0); return;
    }
    if (t.dataset.activo) { const p = S.perfiles.find((x) => x.id === t.dataset.activo); await must(sb.from("perfiles").update({ activo: !p.activo }).eq("id", p.id)); await cargarPerfiles(); render(); return; }
    if (t.dataset.mg != null) { const v = +t.dataset.mg; await must(sb.from("referencias").update({ margen: v, actualizado_por: S.session.user.id, actualizado_en: new Date().toISOString() }).eq("ref", S.ref.ref)); S.ref.margen = v; calc(S.ref); render(); toast("Porcentaje guardado en esta referencia."); return; }
    if (t.dataset.st) {
      const tipo = t.dataset.st, d = +t.dataset.d, campo = TIPO_CAMPO[tipo];
      if (d < 0 && num(S.ref[campo]) <= 0) return;
      t.disabled = true;
      await must(sb.from("novedades").insert({ ref: S.ref.ref, tipo, cantidad: d, abierta: tipo.startsWith("pendiente"), nota: d > 0 ? "Ajuste manual" : "Ajuste manual (resta)", creado_por: S.session.user.id }));
      S.ref[campo] = num(S.ref[campo]) + d; calc(S.ref); render(); cargar().then(() => { if (S.view === "ref") cargarDetalle(S.ref.ref); });
      return;
    }
    if (t.dataset.sw) {
      if (S.view === "subir" && S.revisando) { S.revisando[t.dataset.sw] = S.revisando[t.dataset.sw] === false; render(); return; }
      const v = !S.ref.cerrada; await must(sb.from("referencias").update({ cerrada: v, actualizado_por: S.session.user.id }).eq("ref", S.ref.ref)); S.ref.cerrada = v; calc(S.ref); render(); return;
    }
    const g = t.dataset.go;
    if (g) { if (t.dataset.f) S.filtro = t.dataset.f; if (g === "usuarios") { S.claveMostrada = null; await cargarPerfiles(); } go(g); return; }
    const a = t.dataset.act; if (!a) return;
    if (a === "menu") { S.menu = !S.menu; render(); return; }
    if (a === "no-deshacer") { S.confirmarDeshacer = null; render(); return; }
    if (a === "salir") { await sb.auth.signOut(); location.reload(); return; }
    if (a === "instalar") { S.menu = false; render(); toast("En el celular: menú del navegador → «Agregar a pantalla de inicio»."); return; }
    t.disabled = true;
    if (a === "cerrar-rev") { S.revisando = null; render(); return; }
    if (a === "guardar-arch") { await guardarArchivo(); toast("Guardado."); S.revisando = null; await cargar(); const sig = S.archivos.find((x) => x.estado === "por_confirmar"); if (sig) abrirRevision(sig.id); else render(); return; }
    if (a === "descartar-arch") { await must(sb.from("archivos").update({ estado: "descartado" }).eq("id", S.revisando.id)); S.revisando = null; await recargar(); return; }
    if (a === "guardar-notas") { await must(sb.from("referencias").update({ notas: $("#notas").value, actualizado_por: S.session.user.id }).eq("ref", S.ref.ref)); S.ref.notas = $("#notas").value; toast("Nota guardada."); t.disabled = false; return; }
    if (a === "caja-volver") { S.cajaDesp = null; render(); return; }
    if (a === "caja-guardar") { await guardarCaja(false); return; }
    if (a === "caja-completo") { await guardarCaja(true); return; }
    if (a === "cerrar-desp") { await cerrarDesp(); return; }
    if (a === "caja-libre") {
      const ref = onlyRef($("#cref").value), c = Math.round(num($("#ccant").value));
      if (ref.length < 5 || !c) { toast("Escriba la referencia y la cantidad."); t.disabled = false; return; }
      if (!getRef(ref)) await sb.from("referencias").insert({ ref, fecha: hoyISO() });
      await must(sb.from("llegadas").insert({ ref, cantidad: c, fecha: hoyISO(), nota: $("#cnota").value || "Sin orden de despacho", registrado_por: S.session.user.id }));
      toast(`Guardado: ${c} prendas en ${ref}.`); await recargar(); return;
    }
    if (a === "guardar-nov") {
      const ref = onlyRef($("#nref").value), c = Math.round(num($("#ncant").value)), tipo = document.querySelector("#n-tipos [aria-pressed=true]")?.dataset.nt;
      if (ref.length < 5 || !c) { toast("Escriba la referencia y la cantidad."); t.disabled = false; return; }
      if (!getRef(ref)) await sb.from("referencias").insert({ ref, fecha: hoyISO() });
      await must(sb.from("novedades").insert({ ref, tipo, cantidad: c, abierta: ["pendiente_confeccion", "pendiente_lavanderia", "falto", "sobro"].includes(tipo), nota: $("#nnota").value, creado_por: S.session.user.id }));
      toast("Novedad guardada."); await cargar(); go("pend"); return;
    }
    if (a === "guardar-pago") {
      const valor = num($("#pm-valor").value); if (!valor) { toast("Escriba el valor."); t.disabled = false; return; }
      const tipo = $("#pm-tipo").value, refs = $("#pm-refs").value.match(/\d{6}/g) || [];
      const pg = await must(sb.from("pagos").insert({ fecha: $("#pm-fecha").value, mq: $("#pm-mq").value, tipo, beneficiario: $("#pm-ben").value, valor, detalle: $("#pm-det").value, cuenta_saldo: true, creado_por: S.session.user.id }).select("id").single());
      if (refs.length) await must(sb.from("pago_items").insert(refs.map((x) => ({ pago_id: pg.id, ref: x, concepto: tipo === "lavanderia" ? "lavanderia" : tipo === "taller" ? "confeccion" : "otro", total: tipo === "lavanderia" ? valor / refs.length : 0 }))));
      toast("Pago guardado."); await cargar(); go("cuenta"); return;
    }
    if (a === "invitar") {
      const clave = claveTemporal();
      const body = { accion: "crear", nombre: $("#us-nom").value.trim(), email: $("#us-mail").value.trim(), rol: $("#us-rol").value, password: clave };
      const { data, error } = await sb.functions.invoke("usuarios", { body });
      if (error || data?.error) { let msg = data?.error || error.message; try { msg = (await error.context.json()).error || msg; } catch (_) {} toast("No se pudo: " + msg); t.disabled = false; return; }
      S.claveMostrada = { nombre: body.nombre || body.email, email: body.email.toLowerCase(), clave }; await cargarPerfiles(); render(); window.scrollTo(0, 0); return;
    }
    if (a === "copiar-clave") {
      const c = S.claveMostrada; const txt = `Entre a https://solomoda.github.io/produccion/\nCorreo: ${c.email}\nContraseña temporal: ${c.clave}\nLa primera vez la app le pide escoger su propia contraseña.`;
      try { await navigator.clipboard.writeText(txt); toast("Copiado. Péguelo en WhatsApp."); } catch (_) { toast("No se pudo copiar: escríbalo a mano."); }
      t.disabled = false; return;
    }
  } catch (err) { console.error(err); toast("Error: " + (err.message || err)); t.disabled = false; }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "buscar") { S.buscar = e.target.value; render(); }
  if (e.target.dataset.path && S.revisando) { const v = e.target.type === "number" ? num(e.target.value) : e.target.value; if (e.target.dataset.path === "_mq") S.revisando._mq = v; else setPath(S.revisando.resultado, e.target.dataset.path, v); }
});
document.addEventListener("change", async (e) => {
  try {
    if (e.target.id === "arch" && e.target.files.length) { subirArchivos(e.target.files); return; }
    if (e.target.dataset.path && S.revisando) { const v = e.target.value; setPath(S.revisando.resultado, e.target.dataset.path, e.target.type === "number" ? num(v) : v); return; }
    if (e.target.id === "lleg") {
      const nuevo = Math.round(num(e.target.value)), dif = nuevo - S.ref.llegaron; if (!dif) return;
      await must(sb.from("llegadas").insert({ ref: S.ref.ref, cantidad: dif, fecha: hoyISO(), nota: "Corrección manual del total", registrado_por: S.session.user.id }));
      S.ref.llegaron = nuevo; calc(S.ref); render(); toast(`Corregido: ${dif > 0 ? "+" : ""}${dif}`); cargarDetalle(S.ref.ref); return;
    }
    if (e.target.id === "precio") { const v = num(e.target.value) || null; await must(sb.from("referencias").update({ precio_venta: v, actualizado_por: S.session.user.id }).eq("ref", S.ref.ref)); S.ref.precio_venta = v; calc(S.ref); render(); toast("Precio guardado."); return; }
    if (e.target.dataset.rol) { await must(sb.from("perfiles").update({ rol: e.target.value }).eq("id", e.target.dataset.rol)); toast("Acceso cambiado."); await cargarPerfiles(); return; }
    if (e.target.dataset.tela) { await must(sb.from("telas").update({ inventario_inicial: num(e.target.value) }).eq("nombre", e.target.dataset.tela)); S.telas.find((t) => t.nombre === e.target.dataset.tela).inventario_inicial = num(e.target.value); render(); return; }
  } catch (err) { toast("Error: " + (err.message || err)); }
});
document.addEventListener("submit", async (e) => {
  e.preventDefault();
  const b = e.target.querySelector("button[type=submit]"); if (b) b.disabled = true;
  try {
    if (e.target.id === "f-login") {
      const { error } = await sb.auth.signInWithPassword({ email: $("#u").value.trim(), password: $("#p").value });
      if (error) throw new Error("Correo o contraseña incorrectos.");
    }
    if (e.target.id === "f-pass") {
      if ($("#p1").value !== $("#p2").value) throw new Error("Las contraseñas no coinciden.");
      const { error } = await sb.auth.updateUser({ password: $("#p1").value, data: { cambiar_clave: false } });
      if (error) throw error;
      S.recovery = false; S.claveCambiada = true; history.replaceState(null, "", location.pathname); await iniciar();
    }
  } catch (err) { toast(err.message); if (b) b.disabled = false; }
});
document.addEventListener("click", (e) => {
  if (e.target.id !== "olvide") return;
  toast("Pídale a Sebastián o a Jessica una contraseña temporal nueva (menú ⋯ → Usuarios).");
});

async function cargarPerfiles() { S.perfiles = await must(sb.from("perfiles").select("*").order("nombre")); }
async function iniciar() {
  const { data } = await sb.auth.getSession(); S.session = data.session;
  if (!S.session) { render(); return; }
  if (S.session.user?.user_metadata?.cambiar_clave && !S.claveCambiada) { S.recovery = true; render(); return; }
  try {
    S.perfil = (await must(sb.from("perfiles").select("*").eq("id", S.session.user.id).limit(1)))[0];
    if (!S.perfil || !S.perfil.activo) { $("#app").innerHTML = `<div class="login"><div class="card"><img src="logo.png" alt=""><p>Su usuario no tiene acceso. Pídale a un administrador que lo active.</p><button class="btn sec" data-act="salir">Salir</button></div></div>`; return; }
    await cargar(); render();
  } catch (e) { $("#app").innerHTML = `<div class="login"><div class="card"><p>No se pudieron cargar los datos: ${esc(e.message)}</p><button class="btn" onclick="location.reload()">Reintentar</button></div></div>`; }
}
sb.auth.onAuthStateChange((ev, session) => {
  if (ev === "PASSWORD_RECOVERY") { S.recovery = true; S.session = session; render(); return; }
  if (ev === "SIGNED_IN" && !S.perfil && !S.recovery) { if (/type=(invite|signup|recovery)/.test(location.hash)) { S.recovery = true; S.session = session; render(); return; } iniciar(); }
  if (ev === "SIGNED_OUT") { S.session = null; S.perfil = null; render(); }
});
if (/type=(invite|recovery)/.test(location.hash)) S.recovery = true;
if (/error_description=/.test(location.hash)) { history.replaceState(null, "", location.pathname); setTimeout(() => toast("Ese enlace ya no sirve. Pídale a un administrador una contraseña temporal."), 600); }
iniciar();
