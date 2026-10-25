(() => {
  const config = window.WEDCONNECT_SUPABASE_CONFIG;
  const createClient = window.supabase && window.supabase.createClient;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const authScreen = $("#auth-screen");
  const authForm = $("#auth-form");
  const authStatus = $("#auth-status");
  const authButton = $("#auth-submit");
  const mfaStep = $("#mfa-step");
  const enrollStep = $("#enroll-step");
  const codeInput = $("#admin-code");
  const shell = $("#admin-shell");
  const pageNames = { overview:"Übersicht", reviews:"Fotografenprüfung", verifications:"Gewerbliche Verifizierung", users:"Nutzerverwaltung", support:"Support-Inbox", partners:"Partner & Angebote", audit:"Protokoll" };
  const pageAccess = { overview:["owner","moderator","support","finance","read_only"],reviews:["owner","moderator","read_only"],verifications:["owner","moderator","read_only"],users:["owner","moderator","support","read_only"],support:["owner","moderator","support","read_only"],partners:["owner","finance","read_only"],audit:["owner","moderator","finance","read_only"] };
  let supabase;
  let currentUser;
  let accessLevel = null;
  let mfaFactorId = null;
  let mfaChallengeId = null;
  let pendingEnrollFactorId = null;
  let activeSupportId = null;
  let refreshTimer;
  let idleTimer;
  let sessionStartedAt = 0;
  let lastActivityAt = 0;
  let recoverySession = false;
  let reviewToSkipOnce = null;
  let openNextReviewOnce = false;
  const MAX_SESSION_MS = 8 * 60 * 60 * 1000;
  const IDLE_MS = 30 * 60 * 1000;

  function status(node, message, state = "info") {
    node.textContent = message || "";
    node.dataset.state = state;
  }
  function esc(value) { return String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[char])); }
  function date(value) { if (!value) return "–"; return new Intl.DateTimeFormat("de-AT", { dateStyle:"medium", timeStyle:"short", timeZone:"Europe/Vienna" }).format(new Date(value)); }
  function relative(value) {
    const hours = Math.max(0, (Date.now() - new Date(value).getTime()) / 3600000);
    return hours < 1 ? "unter 1 Stunde" : `${Math.floor(hours)} Std.`;
  }
  function card(title, subtitle, badge, actions = "") {
    const article = document.createElement("article"); article.className = "work-card";
    const head = document.createElement("div"); head.className = "work-card-head";
    const copy = document.createElement("div");
    const h = document.createElement("h3"); h.textContent = title; copy.append(h);
    const p = document.createElement("p"); p.textContent = subtitle; copy.append(p); head.append(copy);
    if (badge) { const b = document.createElement("span"); b.className = "badge"; b.textContent = badge.label; b.dataset.tone = badge.tone || ""; head.append(b); }
    article.append(head);
    if (actions) { const act = document.createElement("div"); act.className = "work-actions"; act.innerHTML = actions; article.append(act); }
    return article;
  }
  function empty(node, message) { node.replaceChildren(); const p = document.createElement("p"); p.className="empty-state"; p.textContent=message; node.append(p); }
  async function rpc(name, args = {}) {
    const { data, error } = await supabase.rpc(name, args);
    if (error) throw error;
    return data;
  }
  function applyAccess() {
    $$(".nav-item[data-page]").forEach(item=>{item.hidden=!pageAccess[item.dataset.page]?.includes(accessLevel);});
    const active=$("#admin-nav .nav-item.active");
    if(active?.hidden)navigate("overview");
    const canManageFinance=["owner","finance"].includes(accessLevel);
    $("#partner-create").hidden=!canManageFinance;
    $("#campaign-create").hidden=!canManageFinance;
    $("#audit-export").hidden=!["owner","moderator","finance"].includes(accessLevel);
  }
  function randomRecoveryCode() {
    const bytes=new Uint8Array(10);crypto.getRandomValues(bytes);
    return [...bytes].map(byte=>byte.toString(16).padStart(2,"0")).join("").toUpperCase();
  }
  async function sha256Hex(value) {
    const bytes=new TextEncoder().encode(value);
    const digest=await crypto.subtle.digest("SHA-256",bytes);
    return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,"0")).join("");
  }
  function setLoginMode(mode) {
    mfaStep.hidden = mode !== "challenge";
    enrollStep.hidden = mode !== "enroll";
    $("#backup-codes-step").hidden = mode !== "backup-codes";
    $("#admin-email").disabled = mode !== "login";
    $("#admin-password").disabled = mode !== "login";
    $("#admin-password").required = mode === "login";
    codeInput.required = mode === "challenge" || mode === "enroll";
    $("#recovery-step").hidden = true;
    $("#recovery-code").required = false;
    authButton.textContent = mode === "challenge" ? "Code bestätigen" : mode === "enroll" ? "2FA aktivieren" : mode === "backup-codes" ? "Codes gespeichert · weiter" : "Anmelden";
    authForm.dataset.mode = mode;
  }
  async function verifyMfa() {
    if (authForm.dataset.mode === "backup-codes") {
      if (!$("#backup-saved").checked) throw new Error("Bitte bestätige, dass du die Codes offline gespeichert hast.");
      return finishLogin();
    }
    if (authForm.dataset.mode === "challenge" && !$("#recovery-step").hidden) {
      const raw = $("#recovery-code").value.trim().replace(/\s+/g, "").toUpperCase();
      if (!raw) throw new Error("Gib einen Wiederherstellungscode ein.");
      await rpc("admin_redeem_recovery_code", { p_code_hash:await sha256Hex(raw) });
      recoverySession = true;
      $("#recovery-code").value = "";
      return finishLogin();
    }
    const code = codeInput.value.trim();
    if (!/^\d{6}$/.test(code)) throw new Error("Bitte gib den sechsstelligen Authenticator-Code ein.");
    if (pendingEnrollFactorId) {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({ factorId:pendingEnrollFactorId, code });
      if (error) throw error;
      pendingEnrollFactorId = null;
      if (!data) throw new Error("Die Zwei-Faktor-Anmeldung konnte nicht bestätigt werden.");
      await rpc("admin_open_session");
      const recoveryCodes=Array.from({length:10},randomRecoveryCode);
      await rpc("admin_store_recovery_codes",{p_code_hashes:await Promise.all(recoveryCodes.map(sha256Hex))});
      $("#backup-codes").textContent=recoveryCodes.map((value,index)=>`${String(index+1).padStart(2,"0")}  ${value}`).join("\n");
      $("#backup-saved").checked=false;
      setLoginMode("backup-codes");
      status(authStatus,"Diese Codes werden nur jetzt angezeigt. Bewahre sie offline auf.","success");
      return;
    } else {
      if (!mfaFactorId || !mfaChallengeId) throw new Error("Die Zwei-Faktor-Prüfung muss neu gestartet werden.");
      const { error } = await supabase.auth.mfa.verify({ factorId:mfaFactorId, challengeId:mfaChallengeId, code });
      if (error) throw error;
    }
    codeInput.value = "";
    await finishLogin();
  }
  async function beginMfa() {
    const { data:aal, error:aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalError) throw aalError;
    if (aal.currentLevel === "aal2") return finishLogin();
    const { data:factors, error:factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) throw factorsError;
    const verified = (factors.totp || []).find(item => item.status === "verified");
    if (verified) {
      mfaFactorId = verified.id;
      const { data:challenge, error } = await supabase.auth.mfa.challenge({ factorId:verified.id });
      if (error) throw error;
      mfaChallengeId = challenge.id;
      setLoginMode("challenge");
      status(authStatus, "Gib den aktuellen Code aus deiner Authenticator-App ein.");
      codeInput.focus();
      return;
    }
    const { data:enrollment, error } = await supabase.auth.mfa.enroll({ factorType:"totp", friendlyName:"WedConnect Admin" });
    if (error) throw error;
    pendingEnrollFactorId = enrollment.id;
    $("#mfa-qr").src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(enrollment.totp.qr_code)}`;
    $("#mfa-secret").textContent = `Manueller Schlüssel: ${enrollment.totp.secret}`;
    setLoginMode("enroll");
    status(authStatus, "Für dieses Konto ist noch kein Authenticator eingerichtet.");
    codeInput.focus();
  }
  async function finishLogin() {
    const { data:{user}, error } = await supabase.auth.getUser();
    if (error || !user) throw error || new Error("Anmeldung fehlgeschlagen.");
    currentUser = user;
    if(recoverySession){await rpc("admin_touch_session");recoverySession=false;}else await rpc("admin_open_session");
    accessLevel=await rpc("admin_my_access_level");
    applyAccess();
    sessionStartedAt = Date.now();
    lastActivityAt = Date.now();
    authScreen.hidden = true;
    shell.hidden = false;
    $("#admin-email-label").textContent = user.email || "Admin";
    setLoginMode("login");
    resetIdleTimer();
    await loadOverview();
    startRefresh();
  }
  async function signOut(message = "") {
    clearTimeout(refreshTimer); clearTimeout(idleTimer);
    if (supabase) await supabase.auth.signOut({ scope:"local" });
    shell.hidden = true; authScreen.hidden = false;
    authForm.reset(); setLoginMode("login");
    if (message) status(authStatus, message, "error");
  }
  function resetIdleTimer() {
    lastActivityAt=Date.now();
    clearTimeout(idleTimer);
    if (Date.now() - sessionStartedAt >= MAX_SESSION_MS) { signOut("Deine Admin-Sitzung ist abgelaufen. Bitte melde dich erneut an."); return; }
    idleTimer = setTimeout(() => signOut("Deine Sitzung wurde wegen Inaktivität beendet."), IDLE_MS);
  }
  function startRefresh() {
    clearInterval(refreshTimer);
    refreshTimer = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - sessionStartedAt >= MAX_SESSION_MS) { await signOut("Deine Admin-Sitzung ist abgelaufen. Bitte melde dich erneut an."); return; }
      const page = $("#admin-nav .active")?.dataset.page || "overview";
      try { if(Date.now()-lastActivityAt<5*60*1000) await rpc("admin_touch_session"); if (page === "overview") await loadOverview(); } catch (_) { await signOut("Deine Sitzung ist abgelaufen. Bitte melde dich erneut an."); }
    }, 5 * 60 * 1000);
  }

  async function loadOverview() {
    status($("#page-status"), "Lade Übersicht …");
    try {
      const data = await rpc("admin_overview", { p_period_days:Number($("#period").value || 7) });
      const counts = data.counts || {};
      const tasks = [
        ["reviews","Fotografenprüfungen",counts.pending_reviews || 0,counts.oldest_review_at],
        ["verifications","Verifizierungen",counts.pending_verifications || 0,counts.oldest_verification_at],
        ["support","Support-Anfragen",counts.open_support || 0,counts.oldest_support_at]
      ];
      const list = $("#task-list"); list.replaceChildren();
      tasks.forEach(([page,label,count,oldest]) => {
        const a=document.createElement("a");a.className="task-item";a.href="#";a.dataset.openPage=page;
        const strong=document.createElement("strong");strong.textContent=String(count);
        const span=document.createElement("span");span.textContent=oldest?`${label} · ältester Fall ${relative(oldest)}`:label;
        a.append(strong,span);list.append(a);$( `[data-count="${page}"]`).textContent=String(count);
      });
      const labels={couples:"Hochzeitspaare",photographers:"Fotograf:innen",complete_couples:"Profile vollständig · Paare",complete_photographers:"Profile vollständig · Fotograf:innen",new_users:"Neue Nutzer:innen",approved_photographers:"Freigegebene Fotograf:innen",verified_photographers:"Gewerblich verifiziert",matches:"Matches gesamt",recent_matches:"Matches im Zeitraum",recent_messages:"Nachrichten im Zeitraum"};
      const stats=$("#stat-grid");stats.replaceChildren();
      Object.entries(labels).forEach(([key,label])=>{const div=document.createElement("article");div.className="stat-card";const l=document.createElement("span");l.textContent=label;const n=document.createElement("strong");n.textContent=Number(data.stats?.[key]||0).toLocaleString("de-AT");div.append(l,n);stats.append(div);});
      for(const [key,title]of [["couples_by_region","Paare nach Bundesland"],["photographers_by_region","Fotograf:innen nach Bundesland"]]){const groups=data.stats?.[key]||[];const div=document.createElement("article");div.className="stat-card region-stat";const label=document.createElement("span");label.textContent=title;div.append(label);const detail=document.createElement("small");detail.textContent=groups.length?groups.map(item=>`${item.region||"Ohne Angabe"}: ${Number(item.count).toLocaleString("de-AT")}`).join(" · "):"Noch keine Einträge";div.append(detail);stats.append(div);}
      const funnels=$("#funnel-grid");funnels.replaceChildren();
      for (const [role,title] of [["couple","Hochzeitspaare"],["photographer","Fotograf:innen"]]) {
        const steps=data.funnels?.[role]||[];const section=document.createElement("article");section.className="funnel-card";const h=document.createElement("h3");h.textContent=title;section.append(h);
        steps.forEach((step,index)=>{const row=document.createElement("div");row.className="funnel-row";const name=document.createElement("span");name.textContent=step.label;const value=document.createElement("strong");const count=Number(step.count||0);const prev=index===0?count:Number(steps[index-1]?.count||0);const pct=index===0?100:prev?Math.round(count/prev*100):0;value.textContent=`${count.toLocaleString("de-AT")} · ${pct}%`;const bar=document.createElement("div");bar.className="funnel-bar";const fill=document.createElement("i");fill.style.width=`${prev?Math.min(100,count/prev*100):0}%`;bar.append(fill);row.append(name,value,bar);section.append(row);});funnels.append(section);
      }
      status($("#page-status"), "Aktualisiert " + new Intl.DateTimeFormat("de-AT", {timeStyle:"short",timeZone:"Europe/Vienna"}).format(new Date()), "success");
    } catch (error) { status($("#page-status"), error.message || "Übersicht konnte nicht geladen werden.", "error"); }
  }
  async function loadReviews() {
    const target=$("#review-list");status($("#page-status"),"Lade Prüfungen …");
    try {
      const rows=await rpc("admin_review_queue",{p_include_all:$("#review-filter").value==="all"});target.replaceChildren();
      if (!rows?.length) return empty(target,"Keine offenen Prüfungen.");
      let nextReviewArticle=null;
      rows.forEach(item=>{
        const ageHours=(Date.now()-new Date(item.submitted_at||item.created_at).getTime())/3600000;
        const tone=ageHours>36?"red":ageHours>24?"yellow":"";
        const action=`<button class="button button-secondary" data-review-detail="${esc(item.id)}">Prüfansicht öffnen</button>${["owner","moderator"].includes(accessLevel)?`<button class="button button-secondary" data-review="${esc(item.id)}" data-decision="request_changes">Änderung erbitten</button><button class="button button-primary" data-review="${esc(item.id)}" data-decision="approve">Freigeben</button><button class="button button-secondary danger" data-review="${esc(item.id)}" data-decision="reject">Ablehnen</button>`:""}`;
        const node=card(item.first_name||"Fotograf:in",`${item.region||"Region offen"} · eingereicht ${date(item.submitted_at)} · vollständig ${item.profile_status==="complete"?"ja":"nein"}`,{label:`Wartet ${relative(item.submitted_at||item.created_at)}`,tone},action);
        node.dataset.userId=item.id;node.dataset.firstName=item.first_name||"";
        const checks=document.createElement("div");checks.className="review-checks";
        for(const [key,label] of [["website_reachable","Website erreichbar und sicher"],["website_photography","Hochzeitsfotografie"],["website_imprint","Impressum vorhanden"],["website_identity","Name passt"],["instagram_public","Instagram öffentlich"],["instagram_active","Aktiv in letzten 6 Monaten"],["instagram_own_work","Eigene Arbeit"],["instagram_identity","Name passt"],["profile_photos_own","Profilfotos eigene Arbeit"],["intro_appropriate","Text angemessen"]]){const wrap=document.createElement("label");wrap.className="review-check";const text=document.createElement("span");text.textContent=label;const select=document.createElement("select");select.dataset.check=key;select.disabled=!["owner","moderator"].includes(accessLevel);for(const [value,labelText] of [["unclear","Unklar"],["yes","Ja"],["no","Nein"]]){const option=document.createElement("option");option.value=value;option.textContent=labelText;select.append(option);}select.value=item.checklist?.[key]||"unclear";wrap.append(text,select);checks.append(wrap);const note=document.createElement("textarea");note.className="review-check-note";note.dataset.checkNote=key;note.placeholder="Notiz (optional)";note.value=item.check_notes?.[key]||"";note.disabled=! ["owner","moderator"].includes(accessLevel);checks.append(note);}
        node.append(checks);
        for(const [label,url] of [["Website",item.website_url],["Instagram",item.instagram_url]])if(url){const link=document.createElement("a");link.className="link review-link";link.href=url;link.target="_blank";link.rel="noopener noreferrer";link.referrerPolicy="no-referrer";link.textContent=`${label} öffnen · Fremde Seite, Vorsicht`;node.append(link);}
        target.append(node);if(item.id!==reviewToSkipOnce&&!nextReviewArticle)nextReviewArticle=node;
      });
      if(openNextReviewOnce){reviewToSkipOnce=null;openNextReviewOnce=false;if(nextReviewArticle){nextReviewArticle.scrollIntoView({behavior:"smooth",block:"center"});openReviewDetail(nextReviewArticle.dataset.userId,nextReviewArticle);}}
    } catch(error){empty(target,error.message||"Prüfungen konnten nicht geladen werden.");}
  }
  async function loadVerifications(){const target=$("#verification-list");try{const rows=await rpc("admin_verification_queue");target.replaceChildren();if(!rows?.length)return empty(target,"Keine offenen Verifizierungen.");rows.forEach(item=>{const node=card(item.first_name||"Fotograf:in",`${item.company_name||"Registername offen"} · UID ${item.uid_number||"–"} · Firmenbuch ${item.company_number||"–"} · ${item.region||""}`,{label:date(item.submitted_at),tone:"yellow"},`<button class="button button-primary" data-verification="${esc(item.id)}" data-decision="grant">Siegel erteilen</button><button class="button button-secondary danger" data-verification="${esc(item.id)}" data-decision="reject">Ablehnen</button><button class="button button-secondary danger" data-verification="${esc(item.id)}" data-decision="revoke">Siegel entziehen</button>`);const warnings=[];if(item.uid_duplicate)warnings.push("UID kommt bei einem weiteren Konto vor.");if(item.company_duplicate)warnings.push("Firmenbuchnummer kommt bei einem weiteren Konto vor.");if(warnings.length){const warning=document.createElement("p");warning.className="status error";warning.textContent=warnings.join(" ");node.append(warning);}const checks=document.createElement("div");checks.className="review-checks";const items=[["uid_valid","UID in VIES gültig"],["uid_name_address_match","UID-Name und Adresse stimmen"],["company_found","Firmenbucheintrag gefunden"],["company_name_match","Firmenwortlaut stimmt"],["company_active_austria","Eintrag aktiv, Sitz Österreich"],["website_register_match","Impressum stimmt mit Register überein"]];for(const [key,label]of items){const wrap=document.createElement("label");wrap.className="review-check";const span=document.createElement("span");span.textContent=label;const select=document.createElement("select");select.dataset.verificationCheck=key;for(const [value,text]of [["unclear","Unklar"],["yes","Ja"],["no","Nein"],["na","Nicht angegeben"]]){const option=document.createElement("option");option.value=value;option.textContent=text;select.append(option);}wrap.append(span,select);checks.append(wrap);}node.append(checks);for(const [label,url]of [["Website",item.website_url],["Instagram",item.instagram_url]])if(url){const link=document.createElement("a");link.className="link review-link";link.href=url;link.target="_blank";link.rel="noopener noreferrer";link.referrerPolicy="no-referrer";link.textContent=`${label} öffnen · Fremde Seite, Vorsicht`;node.append(link);}target.append(node);});}catch(e){empty(target,e.message||"Verifizierungen konnten nicht geladen werden.");}}
  async function loadUsers() {
    const target = $("#user-list");
    try {
      const testValue = $("#user-test").value;
      const rows = await rpc("admin_users_search", {
        p_query:$("#user-search").value.trim(),p_role:$("#user-role").value||null,
        p_status:$("#user-status").value||null,p_test_only:testValue===""?null:testValue==="true"
      });
      target.replaceChildren();
      if (!rows?.length) return empty(target,"Keine passenden Konten.");
      rows.forEach(item => {
        const label = item.status==="suspended"?"Gesperrt":item.status==="paused"?"Pausiert":item.profile_status==="complete"?"Profil vollständig":"Profil unvollständig";
        const canModerate = ["owner","moderator"].includes(accessLevel);
        const actions = [];
        if (canModerate) {
          actions.push(`<button class="button button-secondary" data-user-action="warn" data-user-id="${esc(item.id)}">Verwarnen</button>`);
          actions.push(`<button class="button button-secondary" data-user-action="suspend" data-user-id="${esc(item.id)}">7 Tage sperren</button>`);
          actions.push(`<button class="button button-secondary" data-user-action="permanent_suspend" data-user-id="${esc(item.id)}">Dauerhaft sperren</button>`);
          actions.push(`<button class="button button-secondary" data-user-action="unsuspend" data-user-id="${esc(item.id)}">Entsperren</button>`);
          if (item.role==="photographer") actions.push(`<button class="button button-secondary" data-user-action="pause" data-user-id="${esc(item.id)}">Pausieren</button>`);
          actions.push(`<button class="button button-secondary" data-user-action="role_reset" data-user-id="${esc(item.id)}">Rolle zurücksetzen</button>`);
        }
        if (accessLevel==="owner") {
          actions.push(`<button class="button button-secondary danger" data-user-action="delete" data-user-id="${esc(item.id)}">Konto löschen</button>`);
          actions.push(`<button class="button button-secondary" data-user-action="test_toggle" data-user-id="${esc(item.id)}" data-test="${item.is_test}">${item.is_test?"Als echtes Konto markieren":"Als Testkonto markieren"}</button>`);
        }
        const details = `${item.role==="photographer"?"Fotograf:in":item.role==="couple"?"Hochzeitspaar":"Rolle offen"} · ${item.region||"Region offen"} · registriert ${date(item.created_at)} · letzte Aktivität ${date(item.last_activity)} · Likes ${item.likes_given} gegeben / ${item.likes_received} erhalten · Matches ${item.matches} · Nachrichten ${item.messages_count} · Verwarnungen ${item.warnings_count}${item.role==="photographer"?` · Freigabe ${item.photographer_review_status||"–"} · Verifizierung ${item.verification_status||"–"}`:""}`;
        target.append(card(`${item.display_name||item.email||item.id}${item.is_test?" · TESTKONTO":""}`,details,{label,tone:item.status==="suspended"?"red":""},actions.join("")));
      });
    } catch (error) { empty(target,error.message||"Nutzer konnten nicht geladen werden."); }
  }
  async function loadSupport(){const target=$("#support-list");try{const rows=await rpc("admin_support_list",{p_query:$("#support-search").value.trim()});target.replaceChildren();if(!rows?.length)empty(target,"Keine offenen Support-Anfragen.");else rows.forEach(item=>{const button=document.createElement("button");button.type="button";button.className="support-thread"+(item.id===activeSupportId?" active":"");button.dataset.supportId=item.id;const title=document.createElement("strong");title.textContent=item.subject||"Support-Anfrage";const info=document.createElement("small");info.textContent=`${item.category} · ${date(item.updated_at)} · ${relative(item.created_at)}`;if((Date.now()-new Date(item.created_at).getTime())/3600000>48)button.dataset.overdue="true";button.append(title,info);target.append(button);});if(activeSupportId)await loadSupportDetail(activeSupportId);}catch(e){empty(target,e.message||"Support konnte nicht geladen werden.");}}
  async function loadSupportDetail(id){activeSupportId=id;const box=$("#support-detail");try{const data=await rpc("admin_support_detail",{p_thread_id:id});box.replaceChildren();const h=document.createElement("h2");h.textContent=data.thread.subject||"Support-Anfrage";const meta=document.createElement("p");meta.className="muted";meta.textContent=`${data.thread.category} · ${date(data.thread.created_at)} · Konto ${data.thread.user_id}`;box.append(h,meta);(data.messages||[]).forEach(message=>{const div=document.createElement("div");div.className="support-message";const who=document.createElement("small");who.textContent=message.sender_type==="operator"?"WEDCONNECT SUPPORT":(message.user_name||"NUTZER:IN").toUpperCase();const body=document.createElement("div");body.textContent=message.body;div.append(who,body);box.append(div);});const form=document.createElement("form");form.className="reply-form";form.dataset.supportReply=id;const area=document.createElement("textarea");area.required=true;area.maxLength=2000;area.placeholder="Antwort an die Person …";const send=document.createElement("button");send.className="button button-primary";send.textContent="Antwort senden";form.append(area,send);const select=document.createElement("select");select.dataset.supportStatus=id;select.dataset.current=data.thread.admin_status;for(const [value,label]of [["open","Offen"],["in_progress","In Arbeit"],["resolved","Erledigt"]]){const option=document.createElement("option");option.value=value;option.textContent=label;option.selected=data.thread.admin_status===value;select.append(option);}const statusWrap=document.createElement("label");statusWrap.className="mono";statusWrap.textContent="Bearbeitungsstatus ";statusWrap.append(select);box.append(statusWrap,form);}catch(e){empty(box,e.message||"Anfrage konnte nicht geladen werden.");}}
  async function loadPartners(){const target=$("#partner-list");try{const rows=await rpc("admin_partner_list");target.replaceChildren();if(!rows?.length)empty(target,"Noch keine Partner angelegt.");rows.forEach(p=>{target.append(card(p.name,`ID ${p.id} · ${p.category||"Kategorie offen"} · ${p.region||"Österreich"} · Provision ${p.commission_rate??0}% auf ${p.commission_basis||"Umsatz"} · ${p.contact_email||"keine Kontaktadresse"}`,{label:p.status||"Aktiv",tone:p.status==="active"?"green":""},`<button class="button button-secondary" data-partner-edit="${esc(p.id)}">Bearbeiten</button><button class="button button-secondary" data-partner-status="${esc(p.id)}" data-status="${p.status==="active"?"paused":"active"}">${p.status==="active"?"Pausieren":"Aktivieren"}</button>`));});}catch(e){empty(target,e.message||"Partner konnten nicht geladen werden.");}
    const campaigns=$("#campaign-list");try{const rows=await rpc("admin_campaign_list");campaigns.replaceChildren();if(!rows?.length)empty(campaigns,"Noch keine Kampagnen angelegt.");rows.forEach(c=>campaigns.append(card(c.title,`${c.partner_name} · Zielgruppe ${c.target_role||"beide"} · ${date(c.starts_at)} bis ${date(c.ends_at)} · ${c.impressions||0} Aufrufe · ${c.clicks||0} Klicks · ${c.redemptions||0} Einlösungen`,{label:c.status,tone:c.status==="active"?"green":""},`<button class="button button-secondary" data-issue-code="${esc(c.id)}">Code ausgeben</button><button class="button button-secondary" data-campaign-edit="${esc(c.id)}">Bearbeiten</button><button class="button button-secondary" data-campaign-status="${esc(c.id)}" data-status="${c.status==="active"?"paused":"active"}">${c.status==="active"?"Pausieren":"Aktivieren"}</button>`)));}catch(e){empty(campaigns,e.message||"Kampagnen konnten nicht geladen werden.");}await loadRedemptions();}
  async function loadRedemptions(){const target=$("#redemption-list");try{const rows=await rpc("admin_redemption_list");target.replaceChildren();if(!rows?.length)return empty(target,"Noch keine Partnercodes ausgegeben.");rows.forEach(item=>{let actions="";if(item.status==="issued")actions+=`<button class="button button-secondary" data-redemption="${esc(item.id)}" data-next="reported" data-amount="${esc(item.confirmed_amount||"")}">Einlösung melden</button>`;if(item.status==="reported")actions+=`<button class="button button-primary" data-redemption="${esc(item.id)}" data-next="confirmed" data-amount="${esc(item.confirmed_amount||"")}">Umsatz bestätigen</button>`;if(item.status==="confirmed")actions+=`<button class="button button-secondary" data-redemption="${esc(item.id)}" data-next="settled" data-amount="${esc(item.confirmed_amount||"")}">Abrechnen</button>`;if(item.status==="settled")actions+=`<button class="button button-primary" data-redemption="${esc(item.id)}" data-next="paid" data-amount="${esc(item.confirmed_amount||"")}">Als bezahlt markieren</button>`;if(!["paid","reversed"].includes(item.status))actions+=`<button class="button button-secondary danger" data-redemption="${esc(item.id)}" data-next="reversed" data-amount="${esc(item.confirmed_amount||"")}">Stornieren</button>`;const amount=item.confirmed_amount==null?"noch offen":`${Number(item.confirmed_amount).toLocaleString("de-AT",{style:"currency",currency:"EUR"})} · Provision ${Number(item.commission_amount||0).toLocaleString("de-AT",{style:"currency",currency:"EUR"})}`;target.append(card(`${item.partner_name} · ${item.campaign_title}`,`Status ${item.status} · ${date(item.created_at)} · Konto ${item.user_id||"nicht zugeordnet"} · ${amount} · Satz ${item.commission_rate}%`,{label:item.status,tone:item.status==="paid"?"green":item.status==="reversed"?"red":"yellow"},actions));});}catch(e){empty(target,e.message||"Einlösungen konnten nicht geladen werden.");}}
  async function loadAudit(){const target=$("#audit-list");try{const rows=await rpc("admin_audit_list",{p_action:$("#audit-filter").value||null,p_target_user_id:$("#audit-account").value.trim()||null,p_from:$("#audit-period").value||null});target.replaceChildren();if(!rows?.length)return empty(target,"Keine Protokolleinträge für diese Auswahl.");rows.forEach(r=>target.append(card(r.action,`${date(r.created_at)} · Konto ${r.target_user_id||"–"} · ${r.reason||"Keine Begründung"}`,null,`<span class="mono">${esc(JSON.stringify(r.new_value||{}))}</span>`)));}catch(e){empty(target,e.message||"Protokoll konnte nicht geladen werden.");}}
  function downloadAuditCsv(rows){const fields=["id","admin_id","action","target_user_id","reason","old_value","new_value","created_at"];const quote=value=>`"${String(value??"").replace(/"/g,'""')}"`;const body=[fields.map(quote).join(","),...rows.map(row=>fields.map(field=>quote(typeof row[field]==="object"?JSON.stringify(row[field]):row[field])).join(","))].join("\r\n");const url=URL.createObjectURL(new Blob(["\ufeff",body],{type:"text/csv;charset=utf-8"}));const link=document.createElement("a");link.href=url;link.download=`wedconnect-admin-protokoll-${new Date().toISOString().slice(0,10)}.csv`;document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);}
  const loaders={overview:loadOverview,reviews:loadReviews,verifications:loadVerifications,users:loadUsers,support:loadSupport,partners:loadPartners,audit:loadAudit};
  function navigate(page){if(!pageNames[page])return;$$(".nav-item").forEach(button=>button.classList.toggle("active",button.dataset.page===page));$$(".admin-page").forEach(section=>section.hidden=section.id!==`page-${page}`);$("#page-title").textContent=pageNames[page];$("#page-eyebrow").textContent=page==="overview"?"PLATTFORMSTATUS":pageNames[page].toUpperCase();loaders[page]?.();history.replaceState(null,"",`#${page}`);}
  async function requireFreshAuth(password,code){
    const {data,error}=await supabase.auth.signInWithPassword({email:currentUser.email,password});
    if(error||!data?.user)throw new Error("Passwort konnte nicht bestätigt werden. Bitte prüfe deine Eingabe.");
    currentUser=data.user;
    const {data:factors,error:factorError}=await supabase.auth.mfa.listFactors();
    if(factorError)throw new Error("Zwei-Faktor-Prüfung konnte nicht gestartet werden.");
    const factor=(factors.totp||[]).find(item=>item.status==="verified");
    if(!factor)throw new Error("Für das Admin-Konto ist kein bestätigter Authenticator eingerichtet.");
    const {error:verifyError}=await supabase.auth.mfa.challengeAndVerify({factorId:factor.id,code});
    if(verifyError)throw new Error("Der Authenticator-Code ist ungültig. Bitte melde dich erneut an.");
    await rpc("admin_open_session");
    await rpc("admin_mark_reauthenticated");
  }
  async function askAction({title,copy,submit,extra,requireReauth=false}){
    const dialog=$("#action-dialog"),form=$("#action-form");$("#dialog-title").textContent=title;$("#dialog-copy").textContent=copy||"";$("#action-reason").value="";$("#action-extra").replaceChildren();if(extra)$("#action-extra").append(extra);
    if(requireReauth){const wrap=document.createElement("div");wrap.className="reauth-fields";const passwordLabel=document.createElement("label");passwordLabel.textContent="Admin-Passwort erneut eingeben";const password=document.createElement("input");password.type="password";password.autocomplete="current-password";password.required=true;password.minLength=14;passwordLabel.append(password);const codeLabel=document.createElement("label");codeLabel.textContent="Authenticator-Code";const code=document.createElement("input");code.inputMode="numeric";code.pattern="[0-9]{6}";code.maxLength=6;code.required=true;code.autocomplete="one-time-code";codeLabel.append(code);wrap.append(passwordLabel,codeLabel);$("#action-extra").append(wrap);}
    dialog.showModal();return new Promise(resolve=>{form.onsubmit=async event=>{event.preventDefault();if(!form.reportValidity())return;const reason=$("#action-reason").value.trim();const button=$("#dialog-confirm");button.disabled=true;try{if(requireReauth){const fields=$$(".reauth-fields input",form);await requireFreshAuth(fields[0].value,fields[1].value);}const value=await submit(reason);dialog.close();resolve(value);}catch(error){$("#dialog-copy").textContent=error.message||"Aktion fehlgeschlagen.";}finally{button.disabled=false;};};form.onclose=null;dialog.onclose=()=>resolve(null);});
  }
  function buttonAction(event){const b=event.target.closest("button[data-review]");if(b){const article=b.closest(".work-card"),checks={},notes={};$$("[data-check]",article).forEach(i=>checks[i.dataset.check]=i.value);$$("[data-check-note]",article).forEach(i=>notes[i.dataset.checkNote]=i.value.trim());const missing=Object.entries(checks).filter(([,v])=>v!=="yes");askAction({title:b.dataset.decision==="approve"?"Freigabe bestätigen":b.dataset.decision==="reject"?"Prüfung ablehnen":"Änderung anfordern",copy:b.dataset.decision==="approve"&&missing.length?"Für die Freigabe müssen alle Prüfpunkte bestätigt sein.":"Die Entscheidung wird protokolliert.",submit:reason=>{if(b.dataset.decision==="approve"&&missing.length)throw new Error("Bitte bestätige jeden Prüfpunkt mit Ja, bevor du freigibst.");return rpc("admin_review_decide",{p_user_id:b.dataset.review,p_decision:b.dataset.decision,p_reason:reason,p_checklist:checks,p_notes:notes});}}).then(v=>{if(v){reviewToSkipOnce=b.dataset.review;openNextReviewOnce=true;loadReviews();loadOverview();}});return;}
    const v=b?.closest("button[data-verification]");if(v){const article=v.closest(".work-card"),results={};$$("[data-verification-check]",article).forEach(i=>results[i.dataset.verificationCheck]=i.value);askAction({title:v.dataset.decision==="grant"?"Siegel erteilen":v.dataset.decision==="revoke"?"Siegel entziehen":"Verifizierung ablehnen",copy:"Mindestens eine Nummer muss vollständig bestätigt sein. Widersprüche und doppelte Nummern verhindern die Erteilung.",submit:reason=>rpc("admin_verification_decide",{p_user_id:v.dataset.verification,p_decision:v.dataset.decision,p_reason:reason,p_results:results})}).then(x=>{if(x){loadVerifications();loadOverview();}});return;}
    const u=event.target.closest("button[data-user-action]");if(u){const action=u.dataset.userAction;if(action==="test_toggle"){askAction({title:u.dataset.test==="true"?"Testkennzeichnung entfernen":"Als Testkonto markieren",copy:"Testkonten werden aus den Plattformkennzahlen ausgeschlossen.",submit:reason=>rpc("admin_test_account_set",{p_user_id:u.dataset.userId,p_is_test:u.dataset.test!=="true",p_reason:reason})}).then(x=>{if(x){loadUsers();loadOverview();}});return;}if(action==="role_reset"){askAction({title:"Rolle zurücksetzen",copy:"Dabei werden Profil, Fotos, Likes, Matches, Gespräche und Rollen-Verifizierungen gelöscht. Das Konto bleibt bestehen und kann neu eingerichtet werden.",requireReauth:true,submit:async reason=>{const {data,error}=await supabase.functions.invoke("admin-delete-account",{body:{action:"role_reset",user_id:u.dataset.userId,reason}});if(error||data?.error)throw new Error("Rolle konnte nicht zurückgesetzt werden. Prüfe, ob die Admin-Funktion deployed ist.");return true;}}).then(x=>{if(x){loadUsers();loadOverview();}});return;}if(action==="delete"){const confirmation=document.createElement("label");confirmation.textContent="Tippe zur Bestätigung KONTO LÖSCHEN";const input=document.createElement("input");input.required=true;input.autocomplete="off";input.dataset.deleteConfirmation="true";input.addEventListener("input",()=>{input.setCustomValidity(input.value==="KONTO LÖSCHEN"?"":"Gib exakt KONTO LÖSCHEN ein.");});confirmation.append(input);askAction({title:"Konto endgültig löschen",copy:"Alle Profildaten, Fotos, Likes, Matches und Nachrichten werden dauerhaft entfernt.",extra:confirmation,requireReauth:true,submit:async reason=>{const word=$("[data-delete-confirmation]").value;if(word!=="KONTO LÖSCHEN")throw new Error("Gib exakt KONTO LÖSCHEN ein.");const {data,error}=await supabase.functions.invoke("admin-delete-account",{body:{action:"delete",user_id:u.dataset.userId,reason,confirmation:word}});if(error||data?.error)throw new Error("Konto konnte nicht gelöscht werden. Prüfe, ob die Admin-Funktion deployed ist.");return true;}}).then(x=>{if(x){loadUsers();loadOverview();}});return;}askAction({title:({warn:"Verwarnung senden",suspend:"Konto befristet sperren",permanent_suspend:"Konto dauerhaft sperren",unsuspend:"Konto entsperren",pause:"Fotografenprofil pausieren"})[action],copy:"Der Grund wird protokolliert und der betroffenen Person im Dashboard angezeigt.",requireReauth:action==="permanent_suspend",submit:reason=>rpc("admin_user_action",{p_user_id:u.dataset.userId,p_action:action,p_reason:reason,p_until:action==="suspend"?new Date(Date.now()+7*86400000).toISOString():null})}).then(x=>{if(x){loadUsers();loadOverview();}});return;}
    const ps=event.target.closest("button[data-partner-status]");if(ps){askAction({title:ps.dataset.status==="paused"?"Partner pausieren":"Partner aktivieren",copy:"Die Änderung wird protokolliert.",submit:reason=>rpc("admin_partner_status",{p_partner_id:ps.dataset.partnerStatus,p_status:ps.dataset.status,p_reason:reason})}).then(value=>{if(value)loadPartners();});return;}
    const cs=event.target.closest("button[data-campaign-status]");if(cs){askAction({title:cs.dataset.status==="paused"?"Kampagne pausieren":"Kampagne aktivieren",copy:"Die Änderung wird protokolliert.",submit:reason=>rpc("admin_campaign_status",{p_campaign_id:cs.dataset.campaignStatus,p_status:cs.dataset.status,p_reason:reason})}).then(value=>{if(value)loadPartners();});return;}
    const issue=event.target.closest("button[data-issue-code]");if(issue){issuePartnerCode(issue.dataset.issueCode);return;}
    const redemption=event.target.closest("button[data-redemption]");if(redemption){updateRedemption(redemption);return;}
    const editPartner=event.target.closest("button[data-partner-edit]");if(editPartner){editPartnerForm(editPartner.dataset.partnerEdit);return;}
    const editCampaign=event.target.closest("button[data-campaign-edit]");if(editCampaign){editCampaignForm(editCampaign.dataset.campaignEdit);return;}
    const reviewDetail=event.target.closest("button[data-review-detail]");if(reviewDetail){openReviewDetail(reviewDetail.dataset.reviewDetail,reviewDetail.closest(".work-card"));}
  }
  async function openReviewDetail(userId,article){
    const existing=article.querySelector(".review-detail");if(existing){existing.remove();return;}
    const panel=document.createElement("div");panel.className="review-detail";const loading=document.createElement("p");loading.className="muted";loading.textContent="Lade Profil und Fotos …";panel.append(loading);article.append(panel);
    try{
      const data=await rpc("admin_review_detail",{p_user_id:userId});const profile=data.profile||{};panel.replaceChildren();
      const text=document.createElement("p");text.className="review-bio";text.textContent=profile.experience||"Keine Profilbeschreibung vorhanden.";panel.append(text);
      const facts=document.createElement("dl");facts.className="review-facts";
      for(const [label,value] of [["Region",profile.region],["Stile",(profile.styles||[]).join(", ")||profile.visual_style],["Einsatzgebiet",(profile.regions||[]).join(", ")||profile.coverage_scope],["Erfahrung",profile.experience_years?`${profile.experience_years} Jahre`:profile.experience]]){const row=document.createElement("div");const dt=document.createElement("dt");dt.textContent=label;const dd=document.createElement("dd");dd.textContent=String(value||"–");row.append(dt,dd);facts.append(row);}panel.append(facts);
      const gallery=document.createElement("div");gallery.className="review-gallery";for(const photo of data.photos||[]){const path=photo.display_path||photo.object_path;if(!path)continue;const {data:signed,error}=await supabase.storage.from("wedconnect-profile-photos").createSignedUrl(path,300);if(error||!signed?.signedUrl)continue;const figure=document.createElement("figure");const image=document.createElement("img");image.src=signed.signedUrl;image.alt=`Profilfoto ${photo.photo_type||"Fotograf:in"}`;image.loading="lazy";image.tabIndex=0;image.addEventListener("click",()=>window.open(signed.signedUrl,"_blank","noopener,noreferrer"));const caption=document.createElement("figcaption");caption.textContent=photo.photo_type||"Portfoliofoto";figure.append(image,caption);gallery.append(figure);}if(!gallery.childElementCount){const p=document.createElement("p");p.className="muted";p.textContent="Keine Profilfotos verfügbar.";gallery.append(p);}panel.append(gallery);
      const note=document.createElement("p");note.className="muted";note.textContent="Fotos öffnen in einem neuen Tab. Fremde Website- und Instagram-Links werden separat geprüft.";panel.append(note);
    }catch(error){panel.textContent=error.message||"Die Prüfansicht konnte nicht geladen werden.";}
  }
  async function editPartnerForm(id=null){const name=prompt("Partnername");if(!name?.trim())return;const category=prompt("Kategorie", "Hochzeitsplanung");const email=prompt("Kontakt-E-Mail (optional)","")||"";const region=prompt("Region", "Österreich");const rate=Number(prompt("Provision in Prozent", "10")||0);const basis=prompt("Berechnungsbasis", "bestätigter Nettoumsatz");const reason=prompt("Begründung für die Änderung");if(!reason?.trim())return;try{await rpc("admin_partner_save",{p_partner:{id,name:name.trim(),category,contact_email:email,region,commission_rate:rate,commission_basis:basis},p_reason:reason.trim()});loadPartners();}catch(e){status($("#page-status"),e.message,"error");}}
  async function editCampaignForm(id=null){const partnerId=prompt("Partner-ID (siehe Partnerverwaltung)");if(!partnerId)return;const title=prompt("Kampagnentitel");if(!title?.trim())return;const target=prompt("Zielgruppe: couple, photographer oder beide", "both");const offer=prompt("Angebot / Vorteil");const starts=prompt("Startdatum (JJJJ-MM-TT)",new Date().toISOString().slice(0,10));const ends=prompt("Enddatum (JJJJ-MM-TT)");const frequency=Number(prompt("Max. Einblendungen je Nutzer:in im Zeitraum", "3")||3);const reason=prompt("Begründung für die Kampagne");if(!reason?.trim())return;try{await rpc("admin_campaign_save",{p_campaign:{id,partner_id:partnerId,title,offer,target_role:target==="both"?null:target,starts_at:starts,ends_at:ends,max_frequency:frequency},p_reason:reason.trim()});loadPartners();}catch(e){status($("#page-status"),e.message,"error");}}
  async function issuePartnerCode(campaignId){const raw=`WC-${crypto.randomUUID().replace(/-/g,"").toUpperCase()}`;const userId=prompt("Konto-ID zuordnen (optional; leer lassen, wenn noch keine Zuordnung erfolgt ist)")||null;try{await rpc("admin_issue_redemption_code",{p_campaign_id:campaignId,p_code_hash:await sha256Hex(raw),p_user_id:userId});alert(`Dieser Code wird nur jetzt angezeigt. Bitte sicher an die richtige Person weitergeben:\n\n${raw}`);await loadRedemptions();await loadPartners();}catch(e){status($("#page-status"),e.message||"Code konnte nicht ausgegeben werden.","error");}}
  async function updateRedemption(button){const next=button.dataset.next;let amount=button.dataset.amount?Number(button.dataset.amount):null;if(next==="reported"||next==="confirmed"){const raw=prompt(next==="reported"?"Gemeldeter Kaufbetrag in Euro (optional)":"Bestätigter provisionsfähiger Umsatz in Euro",amount==null?"":String(amount));if(raw===null)return;amount=raw.trim()===""?null:Number(raw.replace(",","."));if(raw.trim()!==""&&(!Number.isFinite(amount)||amount<0)){status($("#page-status"),"Bitte gib einen gültigen Betrag ein.","error");return;}}askAction({title:next==="reversed"?"Einlösung stornieren":next==="confirmed"?"Umsatz bestätigen":next==="paid"?"Provision als bezahlt markieren":"Abrechnungsstatus ändern",copy:"Status, Betrag und Provision werden protokolliert.",submit:reason=>rpc("admin_redemption_update",{p_redemption_id:button.dataset.redemption,p_status:next,p_amount:amount,p_reason:reason})}).then(result=>{if(result){loadRedemptions();loadPartners();}});}

  if (!config?.url || !config?.publishableKey || !createClient) { status(authStatus,"Die Supabase-Verbindung ist nicht verfügbar.","error");return; }
  supabase=createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  authForm.addEventListener("submit",async event=>{event.preventDefault();authButton.disabled=true;try{
    if(authForm.dataset.mode==="challenge"||authForm.dataset.mode==="enroll"||authForm.dataset.mode==="backup-codes"){await verifyMfa();return;}
    const email=$("#admin-email").value.trim();const password=$("#admin-password").value;
    const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;
    try{await rpc("admin_preflight");}catch(_){await signOut("Dieses Konto ist nicht für die Administration freigeschaltet.");return;}
    await beginMfa();
  }catch(error){status(authStatus,error.message||"Anmeldung fehlgeschlagen.","error");}finally{authButton.disabled=false;}});
  $("#admin-nav").addEventListener("click",event=>{const item=event.target.closest("[data-page]");if(item)navigate(item.dataset.page);});
  $("#refresh").addEventListener("click",()=>loaders[$("#admin-nav .active")?.dataset.page||"overview"]?.());
  $("#period").addEventListener("change",loadOverview);
  $("#review-filter").addEventListener("change",loadReviews);
  $("#user-role").addEventListener("change",loadUsers);$("#user-status").addEventListener("change",loadUsers);$("#user-test").addEventListener("change",loadUsers);
  let searchTimer;$("#user-search").addEventListener("input",()=>{clearTimeout(searchTimer);searchTimer=setTimeout(loadUsers,250);});
  let supportSearchTimer;$("#support-search").addEventListener("input",()=>{clearTimeout(supportSearchTimer);supportSearchTimer=setTimeout(loadSupport,250);});
  $("#admin-app").addEventListener("click",event=>{const jump=event.target.closest("[data-open-page]");if(jump){event.preventDefault();navigate(jump.dataset.openPage);return;}buttonAction(event);const thread=event.target.closest("[data-support-id]");if(thread){loadSupportDetail(thread.dataset.supportId);$$(".support-thread").forEach(x=>x.classList.toggle("active",x===thread));}});
  $("#admin-app").addEventListener("change",async event=>{const select=event.target.closest("[data-support-status]");if(select){const next=select.value;select.value=select.dataset.current;askAction({title:next==="resolved"?"Anfrage erledigen":"Supportstatus ändern",copy:"Der Vorgang wird im Protokoll festgehalten.",submit:reason=>rpc("admin_support_set_status",{p_thread_id:select.dataset.supportStatus,p_status:next,p_reason:reason})}).then(result=>{if(result){select.dataset.current=next;loadSupport();}});}});
  $("#admin-app").addEventListener("submit",async event=>{const form=event.target.closest("[data-support-reply]");if(!form)return;event.preventDefault();const body=$("textarea",form).value.trim();if(!body)return;try{await rpc("admin_support_reply",{p_thread_id:form.dataset.supportReply,p_body:body});await loadSupportDetail(form.dataset.supportReply);await loadSupport();}catch(e){status($("#page-status"),e.message,"error");}});
  $("#partner-create").addEventListener("click",()=>editPartnerForm());
  $("#campaign-create").addEventListener("click",()=>editCampaignForm());
  $("#sign-out").addEventListener("click",()=>signOut());
  $("#audit-filter").addEventListener("change",loadAudit);$("#audit-account").addEventListener("change",loadAudit);$("#audit-period").addEventListener("change",loadAudit);
  $("#audit-export").addEventListener("click",()=>askAction({title:"Protokoll exportieren",copy:"Das Passwort und der Authenticator-Code werden erneut geprüft. Der Export wird selbst protokolliert.",requireReauth:true,submit:async()=>{const rows=await rpc("admin_audit_export",{p_action:$("#audit-filter").value||null,p_target_user_id:$("#audit-account").value.trim()||null,p_from:$("#audit-period").value||null});downloadAuditCsv(rows||[]);return true;}}).then(result=>{if(result)loadAudit();}));
  ["pointerdown","keydown","touchstart","wheel"].forEach(type=>document.addEventListener(type,()=>{if(!shell.hidden)resetIdleTimer();},{passive:true}));
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&!shell.hidden){if(Date.now()-lastActivityAt>=IDLE_MS)signOut("Deine Sitzung wurde wegen Inaktivität beendet.");else resetIdleTimer();}});
  $("#use-recovery").addEventListener("click",()=>{$("#recovery-step").hidden=false;$("#recovery-code").required=true;codeInput.required=false;$("#recovery-code").focus();});
  supabase.auth.getSession().then(async({data,error})=>{if(error||!data.session)return;try{await rpc("admin_preflight");const {data:aal}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();if(aal.currentLevel!=="aal2"){try{await rpc("admin_touch_session");recoverySession=true;await finishLogin();return;}catch(_){}}await beginMfa();}catch(e){await signOut(e.message||"Admin-Anmeldung erforderlich.");}});
  window.addEventListener("hashchange",()=>{const page=location.hash.slice(1);if(!shell.hidden&&pageNames[page])navigate(page);});
  if(location.hash.length>1){};
})();
