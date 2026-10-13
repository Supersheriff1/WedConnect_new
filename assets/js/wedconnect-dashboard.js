(() => {
  const config = window.WEDCONNECT_SUPABASE_CONFIG;
  const createClient = window.supabase && window.supabase.createClient;
  const loading = document.querySelector("#loading");
  const dashboard = document.querySelector("#dashboard");
  const onboarding = document.querySelector("#onboarding");
  const errorState = document.querySelector("#error-state");
  const notice = document.querySelector("#notice");
  const fields = document.querySelector("#setup-fields");
  const form = document.querySelector("#onboarding-form");
  const backButton = document.querySelector("#setup-back");
  const nextButton = document.querySelector("#setup-next");
  const errorLine = document.querySelector("#setup-error");
  const progressBar = document.querySelector(".setup-progress");
  const progressFill = document.querySelector("#setup-progress-fill");
  const maxPhotoBytes = 10 * 1024 * 1024;
  const loadingStartedAt = performance.now();
  const minimumLoadingTime = 1800;

  async function keepLoadingVisible() {
    const remaining = minimumLoadingTime - (performance.now() - loadingStartedAt);
    if (remaining > 0) await new Promise((resolve) => window.setTimeout(resolve, remaining));
  }
  const photoBucket = "wedconnect-profile-photos";
  let supabase;
  let currentUser = null;
  let currentRole = "";
  let wizard = { step: 0, role: "", data: { couple: {}, photographer: {} }, photos: [] };

  function showError(message, title = "Dashboard konnte nicht geladen werden") {
    loading.classList.add("hidden");
    dashboard.classList.add("hidden");
    onboarding.classList.add("hidden");
    errorState.classList.remove("hidden");
    document.querySelector("#error-title").textContent = title;
    document.querySelector("#error-copy").textContent = message;
  }

  function showNotice(message) {
    notice.textContent = message;
    notice.classList.add("show");
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[character]));
  }

  function valueOf(key) {
    return wizard.data[wizard.role === "couple" ? "couple" : "photographer"][key] || "";
  }

  function field(name, label, type, hint, required, extra) {
    const value = valueOf(name);
    const attrs = extra || "";
    const req = required ? " required" : "";
    if (type === "textarea") {
      return '<div class="setup-field"><label for="field-' + name + '">' + label + (required ? " *" : "") +
        '</label><textarea id="field-' + name + '" name="' + name + '" data-profile-field' + req + attrs + ">" +
        escapeHtml(value) + "</textarea>" + (hint ? '<p class="setup-hint">' + hint + "</p>" : "") + "</div>";
    }
    return '<div class="setup-field"><label for="field-' + name + '">' + label + (required ? " *" : "") +
      '</label><input id="field-' + name + '" name="' + name + '" data-profile-field type="' + type +
      '" value="' + escapeHtml(value) + '"' + req + attrs + ">" +
      (hint ? '<p class="setup-hint">' + hint + "</p>" : "") + "</div>";
  }

  function currentPhotoCount(type) {
    return wizard.photos.filter((photo) => photo.photo_type === type).length;
  }

  function renderRoleStep() {
    return '<fieldset class="setup-group"><legend>Ich bin …</legend><div class="role-options">' +
      '<div class="role-option"><input id="role-couple" type="radio" name="selected-role" value="couple"' +
      (wizard.role === "couple" ? " checked" : "") + '><label for="role-couple"><strong>Hochzeitspaar</strong><span>Wir suchen einen Fotografen für unsere Hochzeit.</span></label></div>' +
      '<div class="role-option"><input id="role-photographer" type="radio" name="selected-role" value="photographer"' +
      (wizard.role === "photographer" ? " checked" : "") + '><label for="role-photographer"><strong>Fotograf</strong><span>Ich möchte passende Hochzeiten entdecken.</span></label></div>' +
      "</div></fieldset>";
  }

  function renderCoupleBasics() {
    return '<div class="setup-two-col">' +
      field("partner_one_first_name", "Vorname der ersten Person", "text", "", true, ' autocomplete="given-name" maxlength="80"') +
      field("partner_two_first_name", "Vorname der zweiten Person", "text", "", true, ' maxlength="80"') +
      field("wedding_date", "Hochzeitsdatum", "date", "", true, "") +
      field("location", "Ort oder Location", "text", "Zum Beispiel Wien oder Schloss Belvedere", true, ' maxlength="160"') +
      field("guest_count", "Ungefähre Gästezahl", "number", "", true, ' min="1" max="5000"') +
      "</div>";
  }

  function choiceField(name, label, options, hint) {
    const selected = valueOf(name);
    return '<div class="setup-field"><label for="field-' + name + '">' + label + ' *</label><select id="field-' + name + '" name="' + name + '" data-profile-field required>' +
      '<option value="">Bitte auswählen</option>' + options.map((option) =>
        '<option value="' + option[0] + '"' + (selected === option[0] ? " selected" : "") + ">" + option[1] + "</option>"
      ).join("") + '</select><p class="setup-hint">' + hint + "</p></div>";
  }

  function renderCoupleDetails() {
    return field("schedule", "Geplanter Ablauf", "textarea", "Welche Programmpunkte sind wichtig?", true, ' maxlength="4000"') +
      field("coverage_scope", "Gewünschte Begleitung", "textarea", "Zum Beispiel Trauung und Paarfotos oder vom Getting Ready bis zur Feier.", true, ' maxlength="1200"') +
      field("visual_style", "Bildstil", "textarea", "Welche Bildsprache gefällt euch?", true, ' maxlength="1200"') +
      field("image_wishes", "Bildwünsche", "textarea", "Welche Menschen, Momente oder Motive sollen festgehalten werden?", true, ' maxlength="2000"') +
      choiceField("photographer_usage_preference", "Nutzung der Fotos durch den Fotografen", [
        ["open", "Grundsätzlich offen"],
        ["case_by_case", "Nur nach Absprache"],
        ["no", "Nein"]
      ], "Eine verbindliche Freigabe wird vor einer Zusammenarbeit separat vereinbart.");
  }

  function renderPhotographerBasics() {
    return '<div class="setup-two-col">' +
      field("first_name", "Dein Vorname", "text", "", true, ' autocomplete="given-name" maxlength="80"') +
      field("region", "Region und Einsatzgebiet", "text", "Zum Beispiel Wien und Niederösterreich", true, ' maxlength="160"') +
      field("experience", "Erfahrung", "textarea", "Erzähl kurz von deiner bisherigen Arbeit.", true, ' maxlength="2000"') +
      field("visual_style", "Bildstil", "textarea", "Wie würdest du deine Bildsprache beschreiben?", true, ' maxlength="1200"') +
      "</div>";
  }

  function renderPhotographerDetails() {
    return field("availability", "Verfügbarkeit", "textarea", "Wie können Paare dich für einen Termin anfragen?", true, ' maxlength="2000"') +
      field("coverage_scope", "Gewünschter Begleitungsumfang", "textarea", "Welche Teile einer Hochzeit möchtest du fotografieren?", true, ' maxlength="1200"') +
      field("instagram_url", "Instagram (optional)", "text", "@name oder instagram.com/name", false, ' maxlength="300"') +
      field("website_url", "Website (optional)", "text", "https://…", false, ' inputmode="url" maxlength="500"');
  }

  function renderPhotoStep() {
    if (wizard.role === "couple") {
      const jointCount = currentPhotoCount("couple");
      const oneCount = currentPhotoCount("partner_one");
      const twoCount = currentPhotoCount("partner_two");
      return '<div class="photo-methods"><label class="photo-method"><input type="radio" name="couple-photo-method" value="joint" checked><span><strong>Ein gemeinsames Foto</strong><br>Beide Personen sind auf dem Foto zu sehen.</span></label>' +
        '<label class="photo-method"><input type="radio" name="couple-photo-method" value="individual"><span><strong>Ein Foto pro Person</strong><br>Lade für beide Personen je ein Foto hoch.</span></label></div>' +
        '<div class="photo-panel" id="joint-photo-panel"><h3>Gemeinsames Foto</h3><p>Beide heiratenden Personen müssen zu sehen sein.</p>' +
        '<input type="file" name="joint-photos" accept="image/jpeg,image/png,image/webp" multiple><p class="photo-count">Bereits hochgeladen: ' + jointCount + "</p></div>" +
        '<div class="setup-two-col" id="individual-photo-panels" hidden><div class="photo-panel"><h3>Erste Person</h3><p>Ein Foto, auf dem diese Person zu sehen ist.</p>' +
        '<input type="file" name="partner-one-photos" accept="image/jpeg,image/png,image/webp" multiple><p class="photo-count">Bereits hochgeladen: ' + oneCount + "</p></div>" +
        '<div class="photo-panel"><h3>Zweite Person</h3><p>Ein Foto, auf dem diese Person zu sehen ist.</p>' +
        '<input type="file" name="partner-two-photos" accept="image/jpeg,image/png,image/webp" multiple><p class="photo-count">Bereits hochgeladen: ' + twoCount + "</p></div></div>";
    }
    const portfolioCount = currentPhotoCount("portfolio");
    return '<div class="photo-panel"><h3>Portfoliofotos</h3><p>Lade mindestens 10 Hochzeitsfotos hoch.</p>' +
      '<input type="file" name="portfolio-photos" accept="image/jpeg,image/png,image/webp" multiple>' +
      '<p class="photo-count">Bereits hochgeladen: ' + portfolioCount + " / 10</p></div>";
  }

  function renderReview() {
    const data = wizard.data[wizard.role === "couple" ? "couple" : "photographer"];
    const entries = wizard.role === "couple"
      ? [
          ["Vornamen", data.partner_one_first_name + " und " + data.partner_two_first_name],
          ["Hochzeitsdatum", data.wedding_date], ["Ort", data.location], ["Gäste", data.guest_count],
          ["Ablauf", data.schedule], ["Begleitung", data.coverage_scope],
          ["Bildstil", data.visual_style], ["Bildwünsche", data.image_wishes],
          ["Nutzung durch Fotograf", data.photographer_usage_preference === "open" ? "Grundsätzlich offen" : data.photographer_usage_preference === "case_by_case" ? "Nur nach Absprache" : "Nein"],
          ["Fotos", currentPhotoCount("couple") ? "Gemeinsames Foto hochgeladen" : "Fotos beider Personen hochgeladen"]
        ]
      : [
          ["Vorname", data.first_name], ["Region", data.region], ["Erfahrung", data.experience],
          ["Bildstil", data.visual_style], ["Verfügbarkeit", data.availability],
          ["Begleitung", data.coverage_scope], ["Portfolio", currentPhotoCount("portfolio") + " Fotos"],
          ["Instagram", data.instagram_url || "Nicht angegeben"], ["Website", data.website_url || "Nicht angegeben"]
        ];
    return '<div id="photo-preview-grid" class="photo-preview-grid" aria-label="Fotovorschau"></div><div class="setup-summary">' + entries.map((entry) =>
      "<div><strong>" + escapeHtml(entry[0]) + "</strong><span>" + escapeHtml(entry[1]) + "</span></div>"
    ).join("") + "</div>";
  }

  function renderWizard() {
    const step = wizard.step;
    const firstStep = wizard.role ? 1 : 0;
    const totalSteps = wizard.role ? 4 : 5;
    const visibleStep = step - firstStep + 1;
    const titles = step === 0
      ? ["Wähle deine Rolle", "Über euch", "Eure Hochzeit", "Fotos von euch", "Profil prüfen"]
      : wizard.role === "couple"
        ? ["", "Über euch", "Eure Hochzeit", "Fotos von euch", "Profil prüfen"]
        : ["", "Über dich", "Deine Arbeit", "Portfolio", "Profil prüfen"];
    const descriptions = step === 0
      ? "Die Auswahl erfolgt nach der Anmeldung."
      : step === 1
        ? (wizard.role === "couple" ? "Wie dürfen wir euch ansprechen und wann heiratet ihr?" : "Wie dürfen wir dich ansprechen?")
        : step === 2
          ? (wizard.role === "couple" ? "Erzähl kurz von eurer Feier und euren Bildwünschen." : "Beschreibe deine Arbeit und verlinke optional deine Kanäle.")
          : step === 3
            ? (wizard.role === "couple" ? "Lade ein gemeinsames Foto oder je ein Foto von euch beiden hoch." : "Lade mindestens 10 Fotos für dein Portfolio hoch.")
            : "Prüfe deine Angaben und schließe dein Profil ab.";
    document.querySelector("#setup-title").textContent = titles[step];
    document.querySelector("#setup-step-label").textContent = "PROFIL · SCHRITT " + visibleStep + " VON " + totalSteps;
    document.querySelector("#setup-description").textContent = descriptions;
    const percent = Math.round((visibleStep / totalSteps) * 100);
    progressFill.style.width = percent + "%";
    progressBar.setAttribute("aria-valuenow", String(percent));
    backButton.hidden = step === 0;
    nextButton.innerHTML = step === 4 ? 'Profil abschließen <span aria-hidden="true">✓</span>' : 'Weiter <span aria-hidden="true">→</span>';
    errorLine.textContent = "";
    fields.innerHTML = step === 0 ? renderRoleStep()
      : step === 1 ? (wizard.role === "couple" ? renderCoupleBasics() : renderPhotographerBasics())
        : step === 2 ? (wizard.role === "couple" ? renderCoupleDetails() : renderPhotographerDetails())
          : step === 3 ? renderPhotoStep() : renderReview();
    if (step === 4) loadPhotoPreviews();
    if (step === 3 && wizard.role === "couple") {
      document.querySelectorAll('input[name="couple-photo-method"]').forEach((radio) =>
        radio.addEventListener("change", toggleCouplePhotoMethod)
      );
      toggleCouplePhotoMethod();
    }
  }

  function toggleCouplePhotoMethod() {
    const method = document.querySelector('input[name="couple-photo-method"]:checked');
    const jointPanel = document.querySelector("#joint-photo-panel");
    const individualPanels = document.querySelector("#individual-photo-panels");
    if (!method || !jointPanel || !individualPanels) return;
    jointPanel.hidden = method.value !== "joint";
    individualPanels.hidden = method.value !== "individual";
  }

  function collectFields() {
    const values = {};
    fields.querySelectorAll("[data-profile-field]").forEach((element) => {
      values[element.name] = element.value.trim();
    });
    return values;
  }

  function normalizeInstagram(value) {
    const clean = value.trim();
    if (!clean) return null;
    let url = clean;
    const lower = clean.toLowerCase();
    if (!lower.startsWith("https://") && !lower.startsWith("http://")) {
      let handle = clean.startsWith("@") ? clean.slice(1) : clean;
      if (handle.toLowerCase().startsWith("www.instagram.com/")) {
        url = "https://" + handle;
      } else if (handle.toLowerCase().startsWith("instagram.com/")) {
        url = "https://www." + handle;
      } else {
        url = "https://www.instagram.com/" + handle.replaceAll("/", "") + "/";
      }
    }
    let parsed;
    try { parsed = new URL(url); } catch (_) { throw new Error("Bitte gib einen gültigen Instagram-Namen oder Link ein."); }
    if (!["instagram.com", "www.instagram.com"].includes(parsed.hostname.toLowerCase()) || !parsed.pathname.replaceAll("/", "")) {
      throw new Error("Bitte gib einen gültigen Instagram-Namen oder Link ein.");
    }
    return parsed.toString();
  }

  function normalizeWebsite(value) {
    const clean = value.trim();
    if (!clean) return null;
    const url = clean.toLowerCase().startsWith("https://") || clean.toLowerCase().startsWith("http://") ? clean : "https://" + clean;
    let parsed;
    try { parsed = new URL(url); } catch (_) { throw new Error("Bitte gib eine gültige Website-Adresse ein."); }
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) {
      throw new Error("Bitte gib eine gültige Website-Adresse ein.");
    }
    return parsed.toString();
  }

  async function saveRoleProfile(values) {
    const key = wizard.role === "couple" ? "couple" : "photographer";
    const table = wizard.role === "couple" ? "couple_profiles" : "photographer_profiles";
    const data = Object.assign({}, wizard.data[key], values);
    if (wizard.role === "photographer") {
      data.instagram_url = normalizeInstagram(data.instagram_url || "");
      data.website_url = normalizeWebsite(data.website_url || "");
    }
    data.id = currentUser.id;
    data.updated_at = new Date().toISOString();
    const { error } = await supabase.from(table).upsert(data);
    if (error) {
      const code = error.code ? " (" + error.code + ")" : "";
      throw new Error("Speichern fehlgeschlagen" + code + ": " + (error.message || "Bitte versuche es erneut."));
    }
    wizard.data[key] = data;
  }

  async function loadWizard(role, startStep) {
    wizard = { step: startStep, role: role || "", data: { couple: {}, photographer: {} }, photos: [] };
    currentRole = role || "";
    if (role === "couple") {
      const [{ data, error }, { data: photos, error: photoError }] = await Promise.all([
        supabase.from("couple_profiles").select("*").eq("id", currentUser.id).maybeSingle(),
        supabase.from("profile_photos").select("photo_type,object_path,sort_order").eq("user_id", currentUser.id).order("sort_order")
      ]);
      if (error) throw error;
      if (photoError) throw photoError;
      wizard.data.couple = data || {};
      wizard.photos = photos || [];
    } else if (role === "photographer") {
      const [{ data, error }, { data: photos, error: photoError }] = await Promise.all([
        supabase.from("photographer_profiles").select("*").eq("id", currentUser.id).maybeSingle(),
        supabase.from("profile_photos").select("photo_type,object_path,sort_order").eq("user_id", currentUser.id).order("sort_order")
      ]);
      if (error) throw error;
      if (photoError) throw photoError;
      wizard.data.photographer = data || {};
      wizard.photos = photos || [];
    }
    onboarding.classList.remove("hidden");
    dashboard.classList.add("hidden");
    loading.classList.add("hidden");
    errorState.classList.add("hidden");
    renderWizard();
  }

  async function beginWizard(role, step) {
    try {
      await loadWizard(role, step);
    } catch (_) {
      showError("Dein Profil konnte nicht geladen werden. Bitte versuche es erneut.", "Profil nicht erreichbar");
    }
  }

  async function uploadFile(file, photoType, sortOrder) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error("Bitte lade JPG-, PNG- oder WebP-Bilder hoch.");
    }
    if (file.size > maxPhotoBytes) {
      throw new Error("Jedes Foto darf höchstens 10 MB groß sein.");
    }
    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const objectPath = currentUser.id + "/" + crypto.randomUUID() + "." + extension;
    const { error: uploadError } = await supabase.storage.from(photoBucket).upload(objectPath, file, {
      contentType: file.type,
      upsert: false
    });
    if (uploadError) throw new Error("Ein Foto konnte nicht hochgeladen werden. Bitte prüfe Dateiformat und Größe.");
    const { error: rowError } = await supabase.from("profile_photos").insert({
      user_id: currentUser.id,
      photo_type: photoType,
      object_path: objectPath,
      sort_order: sortOrder
    });
    if (rowError) {
      await supabase.storage.from(photoBucket).remove([objectPath]);
      throw new Error("Das Foto wurde nicht gespeichert. Bitte versuche es erneut.");
    }
  }

  async function uploadSelectedPhotos() {
    const methodElement = document.querySelector('input[name="couple-photo-method"]:checked');
    if (wizard.role === "couple") {
      const method = methodElement ? methodElement.value : "joint";
      const jointFiles = method === "joint" ? Array.from(document.querySelector('[name="joint-photos"]').files) : [];
      const oneFiles = method === "individual" ? Array.from(document.querySelector('[name="partner-one-photos"]').files) : [];
      const twoFiles = method === "individual" ? Array.from(document.querySelector('[name="partner-two-photos"]').files) : [];
      const hasJoint = currentPhotoCount("couple") > 0 || jointFiles.length > 0;
      const hasOne = currentPhotoCount("partner_one") > 0 || oneFiles.length > 0;
      const hasTwo = currentPhotoCount("partner_two") > 0 || twoFiles.length > 0;
      if (!hasJoint && !(hasOne && hasTwo)) {
        throw new Error("Lade ein gemeinsames Foto oder je ein Foto von euch beiden hoch.");
      }
      const queue = [
        ...jointFiles.map((file) => [file, "couple"]),
        ...oneFiles.map((file) => [file, "partner_one"]),
        ...twoFiles.map((file) => [file, "partner_two"])
      ];
      for (const [index, item] of queue.entries()) {
        await uploadFile(item[0], item[1], wizard.photos.length + index);
      }
    } else {
      const input = document.querySelector('[name="portfolio-photos"]');
      const files = Array.from(input.files);
      const existingCount = currentPhotoCount("portfolio");
      if (existingCount + files.length < 10) {
        throw new Error("Für dein Portfolio brauchst du mindestens 10 Fotos. Aktuell: " + existingCount + ".");
      }
      for (const [index, file] of files.entries()) {
        await uploadFile(file, "portfolio", existingCount + index);
      }
    }
    const { data, error } = await supabase.from("profile_photos")
      .select("photo_type,object_path,sort_order").eq("user_id", currentUser.id).order("sort_order");
    if (error) throw new Error("Die Fotoliste konnte nicht aktualisiert werden.");
    wizard.photos = data || [];
  }

  async function loadPhotoPreviews() {
    const container = document.querySelector("#photo-preview-grid");
    if (!container) return;
    container.innerHTML = "";
    const labels = { couple: "Gemeinsames Foto", partner_one: "Erste Person", partner_two: "Zweite Person", portfolio: "Portfolio" };
    const photos = wizard.photos;
    for (let index = 0; index < photos.length; index += 1) {
      const photo = photos[index];
      const { data, error } = await supabase.storage.from(photoBucket).createSignedUrl(photo.object_path, 600);
      if (error || !data || !data.signedUrl) continue;
      const card = document.createElement("div");
      card.className = "photo-preview";
      const image = document.createElement("img");
      image.src = data.signedUrl;
      image.alt = labels[photo.photo_type] + " " + (index + 1);
      const caption = document.createElement("span");
      caption.textContent = labels[photo.photo_type] || "Foto";
      card.append(image, caption);
      container.append(card);
    }
  }

  function profileGreeting(role, profile) {
    if (role === "couple" && profile) {
      return (profile.partner_one_first_name || "") + " und " + (profile.partner_two_first_name || "");
    }
    return profile && profile.first_name ? profile.first_name : "";
  }

  function setupRole(role, user, complete, greeting) {
    currentRole = role === "couple" || role === "photographer" ? role : "";
    const couple = currentRole === "couple";
    const photographer = currentRole === "photographer";
    const roleName = couple ? "Hochzeitspaar" : photographer ? "Fotograf" : "Profil einrichten";
    document.querySelector("#side-role").textContent = roleName;
    document.querySelector("#side-email").textContent = user.email || "";
    document.querySelector("#avatar").textContent = (greeting || user.email || "W").slice(0, 1).toUpperCase();
    document.querySelector("#role-eyebrow").textContent = couple ? "Hochzeitspaar" : photographer ? "Fotograf" : "Dein WedConnect-Konto";
    document.querySelector("#page-title").textContent = greeting ? "Willkommen, " + greeting : "Dein Dashboard";
    document.querySelector("#next-title").textContent = complete ? "Dein Profil ist vollständig" : couple ? "Hochzeitsprofil vervollständigen" : photographer ? "Fotografenprofil vervollständigen" : "Profil anlegen";
    document.querySelector("#next-copy").textContent = complete ? "Dein Profil ist bereit." : couple ? "Datum, Ort und Bildwünsche" : photographer ? "Region, Portfolio und Verfügbarkeit" : "Wähle zuerst deinen Profiltyp.";
    document.querySelector("#profile-status").textContent = complete ? "Profil · Vollständig" : currentRole ? "Profil · Noch offen" : "Profil · Noch nicht angelegt";
    document.querySelector("#profile-action").textContent = complete ? "Profil ansehen" : "Profil anlegen";
    document.querySelector("#account-copy").textContent = user.email ? "Angemeldet als " + user.email : "Angemeldet";
    const discoverLabel = couple ? "Fotografen entdecken" : "Hochzeiten entdecken";
    document.querySelector("#desktop-nav").innerHTML =
      navItem("Übersicht", "home", true, false) +
      navItem("Profil", "profile", false, !currentRole) +
      navItem(discoverLabel, "discover", false, true) +
      navItem("Matches", "matches", false, true) +
      navItem("Nachrichten", "messages", false, true);
    document.querySelector("#mobile-nav").innerHTML =
      navItem("Übersicht", "home", true, false) +
      navItem("Profil", "profile", false, !currentRole) +
      navItem("Entdecken", "discover", false, true) +
      navItem("Matches", "matches", false, true) +
      navItem("Nachrichten", "messages", false, true);
    loading.classList.add("hidden");
    onboarding.classList.add("hidden");
    dashboard.classList.remove("hidden");
  }

  const icons = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/></svg>',
    profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 21a7.5 7.5 0 0115 0"/></svg>',
    discover: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="7.3"/><path d="m16.2 16.2 4.5 4.5M10.8 7.5v6.6m-3.3-3.3h6.6"/></svg>',
    matches: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10M7 17h10M5 12h14"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/><circle cx="17" cy="12" r="2.5"/></svg>',
    messages: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 01-7.5 7.5H6l-3 2v-6a7.5 7.5 0 117 4"/></svg>'
  };

  function navItem(label, icon, active, disabled) {
    const state = active ? 'aria-current="page"' : disabled
      ? 'disabled aria-disabled="true"' : icon === "profile" ? 'data-profile-setup' : "";
    return '<button class="nav-link' + (active ? " active" : "") + '" type="button" ' + state + ">" +
      icons[icon] + "<span>" + label + "</span>" +
      (disabled ? '<span class="nav-soon">Nach Profil</span>' : "") + "</button>";
  }

  backButton.addEventListener("click", () => {
    if (wizard.step > 0) {
      if (wizard.step === 1 || wizard.step === 2) {
        const key = wizard.role === "couple" ? "couple" : "photographer";
        Object.assign(wizard.data[key], collectFields());
      }
      wizard.step -= 1;
      renderWizard();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorLine.textContent = "";
    const originalButtonHtml = nextButton.innerHTML;
    nextButton.disabled = true;
    nextButton.innerHTML = wizard.step === 3 ? "Fotos werden hochgeladen …" : wizard.step === 4 ? "Profil wird abgeschlossen …" : "Wird gespeichert …";
    backButton.disabled = true;
    try {
      if (wizard.step === 0) {
        const selected = form.querySelector('input[name="selected-role"]:checked');
        if (!selected) throw new Error("Wähle Hochzeitspaar oder Fotograf aus.");
        const { data, error } = await supabase.rpc("assign_initial_role", { p_role: selected.value });
        if (error) {
          const code = error.code ? " (" + error.code + ")" : "";
          throw new Error("Rolle konnte nicht gespeichert werden" + code + ": " + (error.message || "Bitte versuche es erneut."));
        }
        wizard.role = data || selected.value;
        currentRole = wizard.role;
        wizard.step = 1;
      } else if (wizard.step === 1 || wizard.step === 2) {
        if (!form.reportValidity()) return;
        const values = collectFields();
        await saveRoleProfile(values);
        wizard.step += 1;
      } else if (wizard.step === 3) {
        await uploadSelectedPhotos();
        wizard.step = 4;
      } else if (wizard.step === 4) {
        const { error } = await supabase.rpc("complete_profile");
        if (error) {
          const message = error.message || "";
          if (message.includes("photos_for_both_partners_required")) throw new Error("Lade Fotos von beiden Personen hoch.");
          if (message.includes("portfolio_requires_10_photos")) throw new Error("Lade mindestens 10 Portfoliofotos hoch.");
          const code = error.code ? " (" + error.code + ")" : "";
          throw new Error("Profilabschluss fehlgeschlagen" + code + ": " + (message || "Bitte prüfe alle Angaben und Fotos."));
        }
        const table = wizard.role === "couple" ? "couple_profiles" : "photographer_profiles";
        const { data: profile } = await supabase.from(table).select("*").eq("id", currentUser.id).maybeSingle();
        setupRole(wizard.role, currentUser, true, profileGreeting(wizard.role, profile || wizard.data[wizard.role]));
        showNotice("Profil vollständig.");
        return;
      }
      renderWizard();
    } catch (error) {
      errorLine.textContent = error && error.message ? error.message : "Das hat gerade nicht funktioniert. Bitte versuche es erneut.";
    } finally {
      nextButton.disabled = false;
      nextButton.innerHTML = originalButtonHtml;
      backButton.disabled = false;
    }
  });

  document.querySelector("#profile-action").addEventListener("click", () => beginWizard(currentRole, currentRole ? 1 : 0));
  document.querySelector("#desktop-nav").addEventListener("click", (event) => {
    if (event.target.closest("[data-profile-setup]")) beginWizard(currentRole, 1);
  });
  document.querySelector("#mobile-nav").addEventListener("click", (event) => {
    if (event.target.closest("[data-profile-setup]")) beginWizard(currentRole, 1);
  });

  document.querySelectorAll("[data-signout]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    const { error } = await supabase.auth.signOut();
    if (error) {
      showNotice("Abmelden war gerade nicht möglich. Bitte versuche es erneut.");
      button.disabled = false;
    } else {
      window.location.assign(new URL("index.html?auth=signin", window.location.href).toString());
    }
  }));

  function waitForAuthSession(timeoutMs = 12000) {
    return new Promise((resolve) => {
      let settled = false;
      let subscription = null;
      let timer = null;
      const finish = (session) => {
        if (settled) return;
        settled = true;
        if (timer) window.clearTimeout(timer);
        if (subscription) subscription.unsubscribe();
        resolve(session || null);
      };
      timer = window.setTimeout(() => finish(null), timeoutMs);
      const listener = supabase.auth.onAuthStateChange((event, session) => {
        if (session && ["INITIAL_SESSION", "SIGNED_IN", "TOKEN_REFRESHED"].includes(event)) finish(session);
        else if (event === "SIGNED_OUT") finish(null);
      });
      subscription = listener.data.subscription;
      if (settled && subscription) subscription.unsubscribe();
      supabase.auth.getSession().then(({ data, error }) => {
        if (!error && data.session) finish(data.session);
      }).catch(() => {});
    });
  }

  async function start() {
    if (!config || !config.url || !config.publishableKey || !createClient) {
      showError("Die Supabase-Verbindung konnte nicht geladen werden.", "Verbindung nicht verfügbar");
      return;
    }
    supabase = createClient(config.url, config.publishableKey);
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    let session = !sessionError && sessionData.session ? sessionData.session : null;
    if (!session) session = await waitForAuthSession();
    if (!session) {
      window.location.replace(new URL("index.html?auth=signin", window.location.href).toString());
      return;
    }
    currentUser = session.user;
    const { data: account, error: profileError } = await supabase
      .from("profiles").select("role,profile_status").eq("id", currentUser.id).maybeSingle();
    if (profileError) {
      showError("Führe in Supabase zuerst die Migration 20261013120000_profile_onboarding.sql aus.", "Profilsetup noch nicht eingerichtet");
      return;
    }
    if (!account || !account.role) {
      await keepLoadingVisible();
      await beginWizard("", 0);
      return;
    }
    if (account.profile_status !== "complete") {
      await keepLoadingVisible();
      await beginWizard(account.role, 1);
      return;
    }
    const table = account.role === "couple" ? "couple_profiles" : "photographer_profiles";
    const { data: profile, error } = await supabase.from(table).select("*").eq("id", currentUser.id).maybeSingle();
    if (error) {
      showError("Dein Profil konnte nicht geladen werden.", "Profil nicht erreichbar");
      return;
    }
    await keepLoadingVisible();
    setupRole(account.role, currentUser, true, profileGreeting(account.role, profile));
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") window.location.replace(new URL("index.html?auth=signin", window.location.href).toString());
    });
  }

  start().catch(() => showError("Beim Laden deines WedConnect-Bereichs ist ein Fehler aufgetreten."));
})();