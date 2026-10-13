(() => {
  const config = window.WEDCONNECT_SUPABASE_CONFIG;
  const createClient = window.supabase && window.supabase.createClient;
  const loading = document.querySelector("#loading");
  const dashboard = document.querySelector("#dashboard");
  const errorState = document.querySelector("#error-state");
  const notice = document.querySelector("#notice");
  const profileDialog = document.querySelector("#profile-setup-dialog");
  const profileForm = document.querySelector("#profile-setup-form");
  const profileSelect = document.querySelector("#profile-role");
  const profileDialogStatus = document.querySelector("#profile-dialog-status");
  const profileSubmit = document.querySelector("#profile-dialog-submit");
  let supabase;
  let currentUser = null;
  let currentRole = "";

  function showError(message, title = "Dashboard konnte nicht geladen werden") {
    loading.classList.add("hidden");
    dashboard.classList.add("hidden");
    errorState.classList.remove("hidden");
    document.querySelector("#error-title").textContent = title;
    document.querySelector("#error-copy").textContent = message;
  }

  function showNotice(message) {
    notice.textContent = message;
    notice.classList.add("show");
  }

  const icons = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/></svg>',
    profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 21a7.5 7.5 0 0115 0"/></svg>',
    discover: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="7.3"/><path d="m16.2 16.2 4.5 4.5M10.8 7.5v6.6m-3.3-3.3h6.6"/></svg>',
    matches: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10M7 17h10M5 12h14"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/><circle cx="17" cy="12" r="2.5"/></svg>',
    messages: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 01-7.5 7.5H6l-3 2v-6a7.5 7.5 0 117 4"/></svg>'
  };

  function navItem(label, icon, active = false, disabled = false) {
    const state = active ? 'aria-current="page"' : disabled ? 'disabled aria-disabled="true"' : icon === "profile" ? 'data-profile-setup' : "";
    return '<button class="nav-link' + (active ? ' active' : '') + '" type="button" ' + state +
      '>' + icons[icon] + '<span>' + label + '</span>' +
      (disabled ? '<span class="nav-soon">Nach Profil</span>' : '') + '</button>';
  }

  function featureCard(icon, title, description, status) {
    return '<article class="feature-card"><span class="feature-icon">' + icons[icon] +
      '</span><h3>' + title + '</h3><p>' + description +
      '</p><span class="feature-status">' + status + '</span></article>';
  }

  function setupRole(role, user) {
    currentRole = role === "couple" || role === "photographer" ? role : "";
    currentUser = user;
    const couple = currentRole === "couple";
    const photographer = currentRole === "photographer";
    const name = user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name || user.user_metadata.given_name);
    const shortName = name ? name.trim().split(/\s+/)[0] : "";
    const roleName = couple ? "Hochzeitspaar" : photographer ? "Fotograf:in" : "Profil einrichten";

    document.querySelector("#side-role").textContent = roleName;
    document.querySelector("#side-email").textContent = user.email || "";
    document.querySelector("#avatar").textContent = (shortName || user.email || "W").slice(0, 1).toUpperCase();
    document.querySelector("#role-eyebrow").textContent = couple ? "Bereich für Hochzeitspaare" : photographer ? "Bereich für Fotograf:innen" : "Dein WedConnect-Konto";
    document.querySelector("#page-title").textContent = shortName ? "Willkommen, " + shortName : "Willkommen bei WedConnect";
    document.querySelector("#page-lead").textContent = couple
      ? "Dein nächster Schritt ist euer Hochzeitsprofil. Erst wenn es vollständig ist, kannst du passende Fotograf:innen entdecken."
      : photographer
        ? "Dein nächster Schritt ist dein Fotograf:innenprofil. Erst wenn es vollständig ist, kannst du passende Hochzeiten entdecken."
        : "Dein Konto ist bereit. Richte jetzt dein persönliches Profil ein. Danach schaltest du die passenden Bereiche frei.";
    document.querySelector("#hero-title").textContent = couple ? "Erzählt uns von eurer Hochzeit"
      : photographer ? "Zeig, wie du Hochzeiten siehst" : "Womit möchtest du starten?";
    document.querySelector("#hero-copy").textContent = couple
      ? "Mit Datum, Ort, Ablauf und euren Bildwünschen können Fotograf:innen einschätzen, ob eure Hochzeit zu ihnen passt."
      : photographer
        ? "Mit Region, Erfahrung, Stil und deinem Portfolio können Paare erkennen, ob deine Arbeit zu ihrer Hochzeit passt."
        : "Wähle im nächsten Schritt, ob du ein Hochzeitsprofil oder ein Fotograf:innenprofil anlegen möchtest.";
    document.querySelector("#next-title").textContent = couple ? "Erstelle dein Hochzeitsprofil"
      : photographer ? "Erstelle dein Fotograf:innenprofil" : "Lege dein Profil an";
    document.querySelector("#next-copy").textContent = couple
      ? "Dein Profil ist noch nicht vollständig. Ergänze später Datum, Ort, Ablauf und Bildwünsche, bevor du mit dem Matching beginnst."
      : photographer
        ? "Dein Profil ist noch nicht vollständig. Ergänze später Region, Erfahrung, Stil, Portfolio und Verfügbarkeit, bevor du mit dem Matching beginnst."
        : "Wähle zuerst deinen Profiltyp. Du vervollständigst dein Profil, bevor Entdecken, Matches und Nachrichten freigeschaltet werden.";
    document.querySelector("#next-status").textContent = currentRole ? "Entdecken und Matching bleiben bis zum vollständigen Profil gesperrt." : "Wähle jetzt deinen Profiltyp.";
    document.querySelector("#profile-status").textContent = currentRole ? "Profil · Noch unvollständig" : "Profil · Noch nicht angelegt";
    document.querySelector("#profile-action").textContent = currentRole ? "Profil fortsetzen" : "Profil anlegen";
    document.querySelector("#account-copy").textContent = user.email
      ? "Angemeldet als " + user.email + ". Deine Sitzung wird über Supabase geschützt."
      : "Du bist angemeldet. Deine Sitzung wird über Supabase geschützt.";

    const items = couple
      ? [
          ["Profil","profile","Dein Hochzeitsprofil","Datum, Ort, Ablauf und Bildwünsche festhalten.", "Noch einzurichten"],
          ["Entdecken","discover","Fotograf:innen entdecken","Portfolios und passende Bildsprachen kennenlernen.", "Nach vollständigem Profil"],
          ["Matches","matches","Deine Matches","Beidseitiges Interesse und neue Verbindungen sehen.", "Nach vollständigem Profil"],
          ["Nachrichten","messages","Nachrichten","Gespräche nach einem Match führen.", "Nach vollständigem Profil"]
        ]
      : photographer
        ? [
            ["Profil","profile","Dein Fotograf:innenprofil","Region, Stil, Erfahrung und Portfolio zeigen.", "Noch einzurichten"],
            ["Entdecken","discover","Hochzeiten entdecken","Paare und Feiern kennenlernen, die zu deiner Bildsprache passen.", "Nach vollständigem Profil"],
            ["Matches","matches","Deine Matches","Beidseitiges Interesse und neue Verbindungen sehen.", "Nach vollständigem Profil"],
            ["Nachrichten","messages","Nachrichten","Gespräche nach einem Match führen.", "Nach vollständigem Profil"]
          ]
        : [
            ["Profil","profile","Dein Profil","Wähle Hochzeitspaar oder Fotograf:in.", "Jetzt einrichten"],
            ["Entdecken","discover","Entdecken","Passende Profile ansehen.", "Nach vollständigem Profil"],
            ["Matches","matches","Matches","Beidseitiges Interesse sehen.", "Nach vollständigem Profil"],
            ["Nachrichten","messages","Nachrichten","Nach einem Match ins Gespräch kommen.", "Nach vollständigem Profil"]
          ];

    document.querySelector("#desktop-nav").innerHTML =
      navItem("Übersicht","home",true) +
      navItem(currentRole ? "Profil" : "Profil anlegen","profile") +
      items.slice(1).map((item) => navItem(item[0],item[1],false,true)).join("");
    document.querySelector("#mobile-nav").innerHTML =
      navItem("Übersicht","home",true) +
      navItem("Profil","profile") +
      navItem("Entdecken","discover",false,true) +
      navItem("Matches","matches",false,true) +
      navItem("Nachrichten","messages",false,true);
    document.querySelector("#feature-grid").innerHTML = items.map((item) =>
      featureCard(item[1],item[2],item[3],item[4])
    ).join("");
  }

  function openProfileSetup() {
    notice.classList.remove("show");
    if (!currentRole) {
      profileDialogStatus.textContent = "";
      profileSelect.value = "";
      profileDialog.showModal();
      profileSelect.focus();
      return;
    }
    showNotice("Dein Profil ist noch nicht vollständig. Vervollständige die Angaben, bevor Entdecken und Matching freigeschaltet werden.");
  }

  document.querySelector("#profile-action").addEventListener("click", openProfileSetup);
  document.querySelector("#profile-dialog-cancel").addEventListener("click", () => profileDialog.close());
  document.querySelector("#desktop-nav").addEventListener("click", (event) => {
    if (event.target.closest("[data-profile-setup]")) openProfileSetup();
  });
  document.querySelector("#mobile-nav").addEventListener("click", (event) => {
    if (event.target.closest("[data-profile-setup]")) openProfileSetup();
  });

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!profileForm.reportValidity()) return;
    profileSubmit.disabled = true;
    profileDialogStatus.textContent = "Dein Profiltyp wird gespeichert …";
    try {
      const { data, error } = await supabase.rpc("assign_initial_role", { p_role: profileSelect.value });
      if (error) throw error;
      const { data: profile, error: profileError } = await supabase
        .from("profiles").select("role").eq("id", currentUser.id).maybeSingle();
      if (profileError) throw profileError;
      const role = profile && profile.role ? profile.role : data;
      if (role !== "couple" && role !== "photographer") throw new Error("Dein Profiltyp konnte nicht bestätigt werden.");
      profileDialog.close();
      setupRole(role, currentUser);
      showNotice("Dein Profiltyp ist gespeichert. Das Profil bleibt unvollständig, bis du die erforderlichen Angaben ergänzt. Entdecken und Matching bleiben bis dahin gesperrt.");
    } catch (error) {
      profileDialogStatus.textContent = error && error.message
        ? error.message
        : "Dein Profiltyp konnte gerade nicht gespeichert werden. Bitte versuche es erneut.";
    } finally {
      profileSubmit.disabled = false;
    }
  });

  document.querySelectorAll("[data-signout]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    const { error } = await supabase.auth.signOut();
    if (error) {
      showNotice("Abmelden war gerade nicht möglich. Bitte versuche es erneut.");
      button.disabled = false;
    } else {
      window.location.assign("/?auth=signin");
    }
  }));

  async function start() {
    if (!config || !config.url || !config.publishableKey || !createClient) {
      showError("Die Supabase-Verbindung konnte nicht geladen werden.", "Verbindung nicht verfügbar");
      return;
    }
    supabase = createClient(config.url, config.publishableKey);
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      window.location.replace("/?auth=signin");
      return;
    }

    currentUser = sessionData.session.user;
    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("role").eq("id", currentUser.id).maybeSingle();
    if (profileError) {
      showError("Das Profil konnte nicht aus Supabase gelesen werden. Bitte prüfe die Profilmigration und die Zugriffsrichtlinien.", "Profil nicht erreichbar");
      return;
    }

    setupRole(profile && profile.role, currentUser);
    loading.classList.add("hidden");
    dashboard.classList.remove("hidden");
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") window.location.replace("/?auth=signin");
    });
  }

  start().catch(() => showError("Beim Laden deines WedConnect-Bereichs ist ein Fehler aufgetreten."));
})();
