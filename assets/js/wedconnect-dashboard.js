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
  const maxPhotoBytes = 2 * 1024 * 1024;
  const maxPortfolioPhotoBytes = 2 * 1024 * 1024;
  const maxPortfolioPhotos = 20;
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
  let currentGreeting = "";
  let activeConversationPeer = "";
  let activityCache = { incoming: [], matches: [], messages: [], summaries: new Map() };
  let accountAvatarPath = "";
  let accountAvatarUrl = "";
  let wizard = { step: 0, role: "", data: { couple: {}, photographer: {} }, photos: [], pendingPhotos: [], pendingCouplePhotos: [], isEditing: false, autoSaveEnabled: false };
  let draftAutoSaveTimer = null;
  let draftAutoSavePromise = Promise.resolve();

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

  function portfolioPhotoCounts() {
    const portfolio = wizard.photos.filter((photo) => photo.photo_type === "portfolio");
    const pending = wizard.pendingPhotos || [];
    return { total: portfolio.length + pending.length, gallery: portfolio.length + pending.length };
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

  async function renderAccountAvatar() {
    const button = document.querySelector("#avatar");
    if (!button) return;
    button.replaceChildren();
    if (accountAvatarPath) {
      const { data, error } = await supabase.storage.from(photoBucket).createSignedUrl(accountAvatarPath, 3600);
      if (!error && data && data.signedUrl) {
        accountAvatarUrl = data.signedUrl;
        const image = document.createElement("img");
        image.src = accountAvatarUrl;
        image.alt = "";
        image.className = "account-avatar-image";
        button.append(image);
        refreshAccountPhotoPreview();
        return;
      }
    }
    accountAvatarUrl = "";
    button.textContent = ((currentUser && currentUser.user_metadata && currentUser.user_metadata.first_name) || currentUser && currentUser.email || "W").slice(0, 1).toUpperCase();
    refreshAccountPhotoPreview();
  }

  function refreshAccountPhotoPreview() {
    const preview = document.querySelector("#account-photo-preview");
    const remove = document.querySelector("#account-photo-remove");
    if (!preview) return;
    preview.replaceChildren();
    if (accountAvatarUrl) {
      const image = document.createElement("img");
      image.src = accountAvatarUrl;
      image.alt = "";
      preview.append(image);
    } else {
      const fallback = document.createElement("span");
      fallback.textContent = "＋";
      preview.append(fallback);
    }
    if (remove) remove.hidden = !accountAvatarPath;
    const avatarOpenLabel = document.querySelector("#account-avatar-open-label");
    if (avatarOpenLabel) avatarOpenLabel.textContent = accountAvatarPath ? "Profilfoto ändern" : "Profilfoto hinzufügen";
  }

  function avatarSourcePathsFor(path) {
    if (!path) return [];
    const match = path.match(/^(.*)\/avatar-([^.\/]+)\.[^.]+$/);
    return match ? [match[1] + "/avatar-" + match[2] + "-source", match[1] + "/avatar-source-" + match[2]] : [];
  }

  function validateAccountPhoto(file) {
    if (!file) throw new Error("Bitte wähle zuerst ein Foto aus.");
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      const detectedType = file.type || "nicht erkennbar";
      throw new Error("„" + file.name + "“ hat das Format " + detectedType + ". Unterstützt werden JPG, PNG und WebP.");
    }
    if (file.size > 2 * 1024 * 1024) {
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(1).replace(".", ",");
      throw new Error("„" + file.name + "“ ist " + sizeInMb + " MB groß. Erlaubt sind höchstens 2 MB.");
    }
    return true;
  }

  function accountPhotoErrorMessage(action, error) {
    const message = String(error && (error.message || error.error_description) || error || "").trim();
    const code = String(error && (error.code || error.statusCode) || "").trim();
    const detail = [code, message].filter(Boolean).join(" · ");
    const normalized = detail.toLowerCase();
    if (/too large|payload too large|exceed.*size|file size|413/.test(normalized)) {
      return "Das Foto ist zu groß. Bitte verwende ein Bild mit maximal 2 MB.";
    }
    if (/bucket.*not found|no such bucket/.test(normalized)) {
      return "Der Fotospeicher ist in Supabase nicht eingerichtet. Bitte prüfe den Bucket „wedconnect-profile-photos“.";
    }
    if (/row-level security|rls|permission denied|not authorized|unauthorized/.test(normalized)) {
      return "Supabase hat den Zugriff auf den Fotospeicher verweigert. Bitte prüfe die Storage-Berechtigungen für den angemeldeten Account." + (detail ? " (" + detail + ")" : "");
    }
    if (/profile_avatars|relation .* does not exist|schema cache/.test(normalized)) {
      return "Die Profilfoto-Tabelle fehlt oder ist nicht erreichbar. Bitte prüfe die Profilfoto-Migration in Supabase." + (detail ? " (" + detail + ")" : "");
    }
    const fallback = action === "save"
      ? "Das Profilfoto konnte nicht in deinem Konto gespeichert werden."
      : action === "read"
        ? "Das Profilfoto konnte nicht aus dem Speicher geladen werden."
        : "Das Profilfoto konnte nicht hochgeladen werden.";
    return detail ? fallback + " Supabase meldet: " + detail : fallback + " Bitte versuche es erneut.";
  }

  async function uploadAccountPhoto(file, originalPhoto = null) {
    validateAccountPhoto(file);
    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const photoId = crypto.randomUUID();
    const path = currentUser.id + "/avatar-" + photoId + "." + extension;
    const sourcePath = originalPhoto ? currentUser.id + "/avatar-" + photoId + "-source" : "";
    const bucket = supabase.storage.from(photoBucket);
    const { error: uploadError } = await bucket.upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error(accountPhotoErrorMessage("upload", uploadError));
    let originalSaved = false;
    if (originalPhoto) {
      const { error: sourceError } = await bucket.upload(sourcePath, originalPhoto, { contentType: originalPhoto.type || "image/jpeg", upsert: false });
      originalSaved = !sourceError;
    }
    const previousPath = accountAvatarPath;
    const { error: rowError } = await supabase.from("profile_avatars").upsert({ user_id: currentUser.id, object_path: path, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (rowError) {
      await bucket.remove([path, sourcePath].filter(Boolean));
      throw new Error(accountPhotoErrorMessage("save", rowError));
    }
    accountAvatarPath = path;
    await renderAccountAvatar();
    if (previousPath) await bucket.remove([previousPath, ...avatarSourcePathsFor(previousPath)]);
    const photoStatus = document.querySelector("#account-photo-status");
    if (originalPhoto && !originalSaved && photoStatus) {
      const sourceResult = await bucket.download(sourcePath);
      photoStatus.textContent = "Profilfoto gespeichert. Das Original konnte nicht für spätere Zuschnittänderungen gesichert werden." + (sourceResult.error ? " Supabase meldet: " + accountPhotoErrorMessage("upload", sourceResult.error) : "");
    }
  }

  async function removeAccountPhoto() {
    if (!accountAvatarPath) return;
    const previousPath = accountAvatarPath;
    const { error } = await supabase.from("profile_avatars").delete().eq("user_id", currentUser.id);
    if (error) throw new Error(accountPhotoErrorMessage("save", error));
    accountAvatarPath = "";
    await renderAccountAvatar();
    await supabase.storage.from(photoBucket).remove([previousPath, ...avatarSourcePathsFor(previousPath)]);
  }

  function renderCoupleBasics() {
    return '<div class="setup-two-col">' +
      field("partner_one_first_name", "Vorname der ersten Person", "text", "", true, ' autocomplete="given-name" maxlength="80"') +
      field("partner_two_first_name", "Vorname der zweiten Person", "text", "", true, ' maxlength="80"') +
      field("wedding_date", "Hochzeitsdatum", "date", "", true, "") +
      choiceField("region_code", "Bundesland", COUPLE_REGION_OPTIONS, "Für die Zuordnung zu Fotografen.") +
      field("wedding_town", "Ort der Hochzeit", "text", "Zum Beispiel Wien oder Baden bei Wien.", true, ' autocomplete="address-level2" maxlength="160"') +
      field("ceremony_location", "Location der Trauung", "text", "Name der Kirche, des Standesamts oder des Trauungsorts.", false, ' maxlength="160"') +
      field("reception_location", "Location der Feier", "text", "Name der Feierlocation, falls sie an einem anderen Ort stattfindet.", false, ' maxlength="160"') +
      field("guest_count", "Ungefähre Gästezahl", "number", "", true, ' min="1" max="5000" step="1" inputmode="numeric"') +
      "</div>";
  }

  function choiceField(name, label, options, hint) {
    const selected = valueOf(name);
    const hasSelection = options.some((option) => option[0] === selected);
    return '<div class="setup-field"><label for="field-' + name + '">' + label + ' *</label><select id="field-' + name + '" name="' + name + '" data-profile-field required>' +
      '<option value=""' + (!hasSelection ? " selected" : "") + '>Bitte auswählen</option>' + options.map((option) =>
        '<option value="' + option[0] + '"' + (selected === option[0] ? " selected" : "") + ">" + option[1] + "</option>"
      ).join("") + '</select><p class="setup-hint">' + hint + "</p></div>";
  }

  function renderCoupleDetails() {
    return field("public_intro", "Eure Vorstellung", "textarea", "Optional · erscheint in eurem Profil.", false, ' maxlength="1200"') +
      choiceField("ceremony_type", "Art der Trauung", CEREMONY_OPTIONS, "Bitte wählt standesamtlich, kirchlich oder frei.") +
      multiSelectField("coverage_options", "Gewünschte Begleitung", COVERAGE_OPTIONS, "Wählt alle Abschnitte aus, die fotografisch begleitet werden sollen.") +
      renderWeddingTimeline() +
      choiceField("photographer_usage_preference", "Fotos durch den Fotografen nutzbar?", [
        ["open", "Grundsätzlich offen"],
        ["case_by_case", "Nur nach Absprache"],
        ["no", "Nein"]
      ], "Die konkrete Freigabe wird separat vereinbart.");
  }

  const REGION_OPTIONS = [
    ["AT", "Ganz Österreich"],
    ["BGL", "Burgenland"],
    ["KTN", "Kärnten"],
    ["NOE", "Niederösterreich"],
    ["OOE", "Oberösterreich"],
    ["SBG", "Salzburg"],
    ["STMK", "Steiermark"],
    ["TIR", "Tirol"],
    ["VBG", "Vorarlberg"],
    ["W", "Wien"]
  ];
  const COUPLE_REGION_OPTIONS = REGION_OPTIONS.filter((option) => option[0] !== "AT");
  const CEREMONY_OPTIONS = [
    ["civil", "Standesamtliche Trauung"],
    ["religious", "Kirchliche Trauung"],
    ["free", "Freie Trauung"],
  ];
  const SCHEDULE_EVENTS = [
    ["getting_ready", "Getting Ready", "Vorbereitung am Hochzeitstag"],
    ["ceremony", "Trauung", "Ungefähre Uhrzeit der Trauung"],
    ["couple_photos", "Paarfotos", "Zum Beispiel vor oder nach der Trauung"],
    ["reception", "Agape und Empfang", ""],
    ["dinner_speeches", "Essen und Reden", ""],
    ["party", "Feier und Party", ""],
    ["other", "Weiterer Programmpunkt", "Zum Beispiel Sektempfang oder Hochzeitstanz"]
  ];
  const STYLE_OPTIONS = [
    ["documentary", "Reportage"],
    ["natural", "Natürlich & authentisch"],
    ["romantic", "Romantisch"],
    ["editorial", "Editorial"],
    ["fine_art", "Fine Art"],
    ["timeless", "Klassisch & zeitlos"],
    ["modern", "Modern"],
    ["moody", "Moody & cinematisch"],
    ["light_airy", "Hell & luftig"],
    ["film", "Filmlook / Analog"],
    ["black_white", "Schwarz-Weiß"],
    ["boho", "Boho"]
  ];

  const COVERAGE_OPTIONS = [
    ["pre_wedding", "Pre-Wedding-Shooting"],
    ["getting_ready", "Getting Ready"],
    ["ceremony", "Trauung"],
    ["couple_photos", "Paarfotos"],
    ["reception", "Agape und Empfang"],
    ["dinner_speeches", "Essen und Reden"],
    ["party", "Feier und Party"],
    ["half_day", "Halbtagesreportage"],
    ["full_day", "Ganztagesreportage"]
  ];

  function scheduleItemsForForm() {
    const value = valueOf("schedule_items");
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch (_) {}
    }
    const legacy = String(valueOf("schedule") || "").trim();
    return legacy ? [{ event: "other", label: "Bisheriger Ablauf", time: "", note: legacy }] : [];
  }

  function renderWeddingTimeline() {
    const existing = scheduleItemsForForm();
    const byEvent = new Map(existing.map((item) => [item.event, item]));
    return '<fieldset class="setup-group wedding-timeline"><legend>Euer Ablauf</legend>' +
      '<p class="setup-hint">Wählt die Programmpunkte aus, die bei euch geplant sind. Uhrzeiten sind ungefähr und können später ergänzt werden.</p>' +
      '<div class="schedule-event-list">' + SCHEDULE_EVENTS.map((option) => {
        const item = byEvent.get(option[0]) || {};
        const checked = byEvent.has(option[0]);
        const label = option[0] === "other" && item.label ? item.label : option[1];
        const extraTitle = option[0] === "other"
          ? '<div class="setup-field"><label for="schedule-other-label">Programmpunkt</label><input id="schedule-other-label" name="schedule_other_label" data-profile-field type="text" maxlength="120" placeholder="Zum Beispiel Hochzeitstanz" value="' + escapeHtml(item.label && item.label !== option[1] && item.label !== "Bisheriger Ablauf" ? item.label : "") + '"></div>'
          : "";
        const hint = option[2] ? '<span class="schedule-event-hint">' + option[2] + '</span>' : "";
        return '<div class="schedule-event-card">' +
          '<label class="schedule-event-choice"><input type="checkbox" name="schedule_event" value="' + option[0] + '" data-profile-field data-schedule-event' + (checked ? " checked" : "") + '><span><strong>' + option[1] + '</strong>' + hint + '</span></label>' +
          '<div class="schedule-event-fields" data-schedule-fields' + (checked ? "" : " hidden") + '>' + extraTitle +
          '<div class="setup-field"><label for="schedule-' + option[0] + '-time">Ungefähre Uhrzeit</label><input id="schedule-' + option[0] + '-time" name="schedule_' + option[0] + '_time" data-profile-field type="time" value="' + escapeHtml(item.time || "") + '"></div>' +
          '<div class="setup-field"><label for="schedule-' + option[0] + '-note">Optionale Notiz</label><input id="schedule-' + option[0] + '-note" name="schedule_' + option[0] + '_note" data-profile-field type="text" maxlength="240" value="' + escapeHtml(item.note || "") + '" placeholder="Weitere kurze Angaben"></div>' +
          '</div></div>';
      }).join("") + '</div></fieldset>';
  }

  function selectedValues(name) {
    const value = valueOf(name);
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "string") return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function multiSelectField(name, label, options, hint) {
    const selected = selectedValues(name);
    return '<fieldset class="setup-group select-group"><legend>' + label + ' *</legend>' +
      '<div class="choice-grid">' + options.map((option) =>
        '<label class="choice-chip"><input type="checkbox" name="' + name + '" value="' + option[0] +
        '" data-profile-field data-select-group="' + name + '"' +
        (selected.includes(option[0]) ? " checked" : "") + '><span>' + option[1] + "</span></label>"
      ).join("") + '</div><p class="setup-hint">' + hint + "</p></fieldset>";
  }

  function renderPhotographerBasics() {
    const compensationType = valueOf("compensation_type");
    return '<div class="photographer-basics">' +
      field("first_name", "Dein Vorname", "text", "", true, ' autocomplete="given-name" maxlength="80"') +
      multiSelectField("regions", "Region und Einsatzgebiet", REGION_OPTIONS, "Wähle ein oder mehrere Bundesländer. „Ganz Österreich“ schließt einzelne Bundesländer aus.") +
      '<div class="experience-grid">' +
      field("experience_years", "Erfahrung in Jahren", "number", "Optional, wenn du stattdessen Hochzeiten angibst.", false, ' min="0" max="80" step="1" inputmode="numeric"') +
      field("weddings_photographed", "Fotografierte Hochzeiten", "number", "Optional, wenn du stattdessen Jahre angibst.", false, ' min="0" max="10000" step="1" inputmode="numeric"') +
      "</div>" +
      multiSelectField("styles", "Dein Bildstil", STYLE_OPTIONS, "Wähle alle Bildstile, die deine Arbeit beschreiben.") +
      choiceField("compensation_type", "Vergütung für deine fotografische Leistung", [
        ["free", "Unentgeltlich"],
        ["fixed", "Fixbetrag"]
      ], "Lege fest, welche Vergütung du für deinen fotografischen Einsatz erwartest.") +
      '<div id="compensation-amount-wrap" class="setup-field"' + (compensationType === "fixed" ? "" : " hidden") + '><label for="field-compensation_amount_eur">Gewünschter Betrag in Euro *</label><div class="input-with-suffix"><input id="field-compensation_amount_eur" name="compensation_amount_eur" data-profile-field type="number" min="1" max="100000" step="1" inputmode="numeric" value="' + escapeHtml(valueOf("compensation_amount_eur")) + '"' + (compensationType === "fixed" ? " required" : "") + '><span>€</span></div></div>' +
      "</div>";
  }

  function renderPhotographerDetails() {
    return field("public_intro", "Deine Vorstellung", "textarea", "Stell dich und deine Arbeit kurz vor. Dieser Text erscheint über deinen Fotos im Profil.", false, ' maxlength="1200"') +
      multiSelectField("coverage_options", "Begleitungsumfang", COVERAGE_OPTIONS, "Wähle alle Teile einer Hochzeit aus, die dir für dein Portfolio noch fehlen und die du gerne fotografieren möchtest.") +
      field("instagram_url", "Instagram (optional)", "text", "@name oder instagram.com/name", false, ' class="social-link-input instagram-input" maxlength="300"') +
      '<a class="profile-social-link setup-link-check" id="instagram-link-check" target="_blank" rel="noopener noreferrer" hidden>Instagram-Profil öffnen ↗</a>' +
      field("website_url", "Website (optional)", "text", "https://…", false, ' class="social-link-input website-input" inputmode="url" maxlength="500"') +
      '<a class="profile-social-link setup-link-check" id="website-link-check" target="_blank" rel="noopener noreferrer" hidden>Website öffnen ↗</a>';
  }

  function updateLinkCheck(name) {
    const isInstagram = name === "instagram_url";
    const field = fields.querySelector('[name="' + name + '"]');
    const link = document.querySelector(isInstagram ? "#instagram-link-check" : "#website-link-check");
    if (!field || !link) return;
    try {
      const url = isInstagram ? normalizeInstagram(field.value) : normalizeWebsite(field.value);
      link.href = url || "";
      link.hidden = !url;
    } catch (_) {
      link.removeAttribute("href");
      link.hidden = true;
    }
  }

  function updateProfileLinkChecks() {
    updateLinkCheck("instagram_url");
    updateLinkCheck("website_url");
  }

  function photoPicker(name, label, multiple = true) {
    const id = "photo-picker-" + name;
    return '<div class="photo-picker"><input class="photo-picker-input" id="' + id + '" type="file" name="' + name + '" accept="image/jpeg,image/png,image/webp"' + (multiple ? " multiple" : "") + '>' +
      '<label class="button button-secondary photo-picker-button" for="' + id + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M5 14v5a2 2 0 002 2h10a2 2 0 002-2v-5"/></svg><span>' + label + '</span></label></div>';
  }

  function normalizePhotoFile(file) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    const extension = (file.name.split(".").pop() || "").toLowerCase();
    const inferred = extension === "jpg" || extension === "jpeg" ? "image/jpeg"
      : extension === "png" ? "image/png"
        : extension === "webp" ? "image/webp" : "";
    let type = file.type === "image/jpg" ? "image/jpeg" : file.type;
    if ((!type || type === "application/octet-stream") && inferred) type = inferred;
    if (!allowed.includes(type)) {
      throw new Error('„' + file.name + '“ wird nicht unterstützt. Erlaubt sind JPG, PNG und WebP.');
    }
    return file.type === type ? file : new File([file], file.name, { type, lastModified: file.lastModified });
  }

  function couplePhotoFeedback(inputName, message) {
    const feedbackId = inputName === "joint-photos" ? "#joint-photo-feedback"
      : inputName === "partner-one-photos" ? "#partner-one-photo-feedback" : "#partner-two-photo-feedback";
    const feedback = document.querySelector(feedbackId);
    if (feedback) feedback.textContent = message || "";
  }

  function coupleInputName(photoType) {
    return photoType === "couple" ? "joint-photos"
      : photoType === "partner_one" ? "partner-one-photos" : "partner-two-photos";
  }

  async function uploadCouplePhotoItem(item) {
    if (item.uploading) return;
    const inputName = coupleInputName(item.photoType);
    item.uploading = true;
    item.status = "Foto wird hochgeladen …";
    renderPendingCouplePhotos();
    nextButton.disabled = true;
    try {
      const file = normalizePhotoFile(item.file);
      if (file.size > maxPhotoBytes) throw new Error("Das Originalfoto ist größer als 2 MB.");
      const displayFile = item.displayFile || await createContainedPhoto(file);
      const savedPhoto = await uploadFile(file, item.photoType, wizard.photos.length, displayFile);
      wizard.photos = (wizard.photos || []).concat(savedPhoto);
      if (item.originalPreviewUrl) URL.revokeObjectURL(item.originalPreviewUrl);
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      wizard.pendingCouplePhotos = (wizard.pendingCouplePhotos || []).filter((candidate) => candidate !== item);
      renderPendingCouplePhotos();
      const countId = inputName === "joint-photos" ? "#joint-photo-count"
        : inputName === "partner-one-photos" ? "#partner-one-photo-count" : "#partner-two-photo-count";
      const count = document.querySelector(countId);
      if (count) count.textContent = "Bereits hochgeladen: " + currentPhotoCount(item.photoType);
      couplePhotoFeedback(inputName, "Foto erfolgreich hochgeladen.");
      loadExistingCouplePhotos();
    } catch (error) {
      item.uploading = false;
      item.status = error && error.message ? error.message : "Das Foto konnte nicht hochgeladen werden.";
      renderPendingCouplePhotos();
      couplePhotoFeedback(inputName, item.status);
      throw error;
    } finally {
      nextButton.disabled = false;
    }
  }

  function startCouplePhotoCrop(item) {
    if (item.uploading) return;
    item.status = "Wähle den Ausschnitt. Nach „Zuschnitt übernehmen“ wird sofort hochgeladen.";
    renderPendingCouplePhotos();
    openCropEditor(item.file, async (blob) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      item.displayFile = new File([blob], item.name + "-display.jpg", { type: "image/jpeg" });
      item.previewUrl = URL.createObjectURL(blob);
      item.status = "Foto wird hochgeladen …";
      renderPendingCouplePhotos();
      await uploadCouplePhotoItem(item);
    });
  }

  function attachCouplePhotoControls() {
    const inputTypes = {
      "joint-photos": "couple",
      "partner-one-photos": "partner_one",
      "partner-two-photos": "partner_two"
    };
    Object.entries(inputTypes).forEach(([inputName, photoType]) => {
      const input = fields.querySelector('[name="' + inputName + '"]');
      if (!input) return;
      input.addEventListener("change", () => {
        errorLine.textContent = "";
        const files = Array.from(input.files || []);
        if (!files.length) return;
        const additions = [];
        try {
          files.forEach((file) => {
            const normalized = normalizePhotoFile(file);
            if (normalized.size > maxPhotoBytes) {
              throw new Error('„' + file.name + '“ ist größer als 2 MB. Bitte wähle ein kleineres Foto.');
            }
            additions.push({
              file: normalized,
              photoType,
              name: normalized.name,
              originalPreviewUrl: URL.createObjectURL(normalized),
              previewUrl: "",
              displayFile: null,
              uploading: false,
              status: ""
            });
          });
          wizard.pendingCouplePhotos = (wizard.pendingCouplePhotos || []).concat(additions);
          input.value = "";
          renderPendingCouplePhotos();
          couplePhotoFeedback(inputName, "Bitte wähle den Fotoausschnitt aus.");
          startCouplePhotoCrop(additions[0]);
        } catch (error) {
          additions.forEach((item) => URL.revokeObjectURL(item.originalPreviewUrl));
          errorLine.textContent = error && error.message ? error.message : "Das Foto kann nicht verwendet werden.";
        }
      });
    });
  }

  function couplePhotoName(photoType, profile) {
    if (!profile) return "";
    if (photoType === "couple") {
      return [profile.partner_one_first_name, profile.partner_two_first_name].filter(Boolean).join(" & ");
    }
    if (photoType === "partner_one") return profile.partner_one_first_name || "";
    if (photoType === "partner_two") return profile.partner_two_first_name || "";
    return "";
  }

  function createCouplePhotoNameOverlay(photoType, profile) {
    const name = couplePhotoName(photoType, profile);
    if (!name) return null;
    const overlay = document.createElement("span");
    overlay.className = "couple-photo-name-overlay";
    overlay.textContent = name;
    return overlay;
  }

  function renderPendingCouplePhotos() {
    const container = document.querySelector("#couple-pending-photos");
    if (!container) return;
    container.innerHTML = "";
    const labels = {
      couple: "Gemeinsames Foto",
      partner_one: wizard.data.couple.partner_one_first_name || "Erste Person",
      partner_two: wizard.data.couple.partner_two_first_name || "Zweite Person"
    };
    (wizard.pendingCouplePhotos || []).forEach((item, index) => {
      const card = document.createElement("article");
      card.className = "portfolio-photo-card";
      const frame = document.createElement("div");
      frame.className = "couple-photo-preview-frame";
      const image = document.createElement("img");
      image.src = item.previewUrl || item.originalPreviewUrl;
      image.alt = labels[item.photoType] + " · Vorschau";
      frame.append(image);
      const nameOverlay = createCouplePhotoNameOverlay(item.photoType, wizard.data.couple || {});
      if (nameOverlay) frame.append(nameOverlay);
      activateMobileGalleryPhoto(container, card, image, image.alt);
      const caption = document.createElement("p");
      caption.textContent = labels[item.photoType];
      const actions = document.createElement("div");
      actions.className = "portfolio-photo-actions";
      const cropButton = document.createElement("button");
      cropButton.className = "button button-secondary photo-crop-button";
      cropButton.type = "button";
      cropButton.setAttribute("aria-label", "Foto zuschneiden und hochladen");
      cropButton.title = "Foto zuschneiden und hochladen";
      cropButton.disabled = Boolean(item.uploading);
      cropButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v14a2 2 0 0 0 2 2h12M3 7h14a2 2 0 0 1 2 2v12"/></svg>';
      cropButton.addEventListener("click", () => startCouplePhotoCrop(item));
      const removeButton = document.createElement("button");
      removeButton.className = "button button-secondary photo-delete-button";
      removeButton.type = "button";
      removeButton.setAttribute("aria-label", "Ausgewähltes Foto entfernen");
      removeButton.title = "Ausgewähltes Foto entfernen";
      removeButton.disabled = Boolean(item.uploading);
      removeButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 14h11l-1-14M9 7V4h6v3"/></svg>';
      removeButton.addEventListener("click", () => {
        if (item.originalPreviewUrl) URL.revokeObjectURL(item.originalPreviewUrl);
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        wizard.pendingCouplePhotos.splice(index, 1);
        renderPendingCouplePhotos();
      });
      const status = document.createElement("p");
      status.className = "photo-selection-feedback";
      status.setAttribute("aria-live", "polite");
      status.textContent = item.status || "Nach dem Zuschnitt wird das Foto sofort hochgeladen.";
      actions.append(cropButton, removeButton);
      card.append(frame, caption, status, actions);
      container.append(card);
    });
    syncMobileGallerySelection(container);
  }

  function renderPhotoStep() {
    if (wizard.role === "couple") {
      const jointCount = currentPhotoCount("couple");
      const oneCount = currentPhotoCount("partner_one");
      const twoCount = currentPhotoCount("partner_two");
      const coupleProfile = wizard.data.couple || {};
      const firstName = escapeHtml(coupleProfile.partner_one_first_name || "Erste Person");
      const secondName = escapeHtml(coupleProfile.partner_two_first_name || "Zweite Person");
      return '<p class="photo-upload-detail photo-instructions">Jede Person muss mindestens ein eigenes Foto hochladen. Nach der Auswahl kannst du den Ausschnitt festlegen; mit „Zuschnitt übernehmen“ wird das Foto sofort hochgeladen. Ein gemeinsames Foto ist optional und ersetzt keines der beiden eigenen Fotos.</p>' +
        '<div class="setup-two-col couple-individual-photo-panels"><div class="photo-panel"><h3>' + firstName + '</h3><p>Eigenes Foto dieser Person · Pflicht</p>' +
        photoPicker("partner-one-photos", "Eigenes Foto hinzufügen", false) + '<p class="photo-upload-hint">JPG, PNG oder WebP · maximal 2 MB pro Foto.</p><p id="partner-one-photo-feedback" class="photo-selection-feedback" aria-live="polite"></p><p id="partner-one-photo-count" class="photo-count">Bereits hochgeladen: ' + oneCount + "</p></div>" +
        '<div class="photo-panel"><h3>' + secondName + '</h3><p>Eigenes Foto dieser Person · Pflicht</p>' +
        photoPicker("partner-two-photos", "Eigenes Foto hinzufügen", false) + '<p class="photo-upload-hint">JPG, PNG oder WebP · maximal 2 MB pro Foto.</p><p id="partner-two-photo-feedback" class="photo-selection-feedback" aria-live="polite"></p><p id="partner-two-photo-count" class="photo-count">Bereits hochgeladen: ' + twoCount + "</p></div></div>" +
        '<div class="photo-panel couple-joint-photo-panel"><h3>Gemeinsames Foto · optional</h3><p>Das gemeinsame Foto kann zusätzlich hochgeladen werden. Für jedes von euch ist trotzdem ein eigenes Foto erforderlich.</p>' +
        photoPicker("joint-photos", "Gemeinsames Foto hinzufügen", false) + '<p class="photo-upload-hint">JPG, PNG oder WebP · maximal 2 MB pro Foto.</p><p id="joint-photo-feedback" class="photo-selection-feedback" aria-live="polite"></p><p id="joint-photo-count" class="photo-count">Bereits hochgeladen: ' + jointCount + "</p></div>" +
        '<div id="couple-pending-photos" class="portfolio-photo-grid couple-photo-grid" aria-label="Ausgewählte Fotos"></div>' +
        '<div id="couple-existing-photos" class="portfolio-photo-grid couple-photo-grid" aria-label="Bereits hochgeladene Fotos"></div>';
    }
    const portfolioCount = currentPhotoCount("portfolio");
    return '<div class="photo-panel portfolio-upload-panel"><h3>Deine Galerie</h3>' +
      '<p class="photo-upload-detail photo-instructions">Lade mindestens 3 und bis zu 20 Fotos hoch, die deinen Stil am besten zeigen. Alle Fotos werden gemeinsam in deinem Profil angezeigt.</p>' +
      '<div id="portfolio-existing-photos" class="portfolio-photo-grid" aria-label="Bereits hochgeladene Galeriefotos"></div>' +
      '<div id="portfolio-pending-photos" class="portfolio-photo-grid" aria-label="Ausgewählte Galeriefotos"></div>' +
      photoPicker("portfolio-photos", "Fotos hinzufügen") +
      '<p class="photo-upload-detail">JPG, PNG oder WebP · maximal 2 MB pro Bild</p>' +
      '<p class="photo-count" id="portfolio-photo-count">Galerie: ' + portfolioCount + ' / 20 Fotos</p></div>';
  }

  function renderReview() {
    const data = wizard.data[wizard.role === "couple" ? "couple" : "photographer"];
    const entries = wizard.role === "couple"
      ? [
          ["Vornamen", data.partner_one_first_name + " & " + data.partner_two_first_name],
          ["Vorstellung", data.public_intro],
          ["Hochzeitsdatum", data.wedding_date],
          ["Bundesland", coupleRegionLabel(data.region_code)],
          ["Ort der Hochzeit", data.wedding_town],
          ["Location der Trauung", data.ceremony_location],
          ["Location der Feier", data.reception_location],
          ["Gäste", data.guest_count],
          ["Art der Trauung", ceremonyTypeLabel(data.ceremony_type)],
          ["Gewünschte Begleitung", profileLabels(data.coverage_options, COVERAGE_OPTIONS) || data.coverage_scope],
          ["Ablauf", formatScheduleItems(data.schedule_items) || data.schedule],
          ["Nutzung durch Fotograf", data.photographer_usage_preference === "open" ? "Grundsätzlich offen" : data.photographer_usage_preference === "case_by_case" ? "Nur nach Absprache" : "Nein"],
          ["Fotos", currentPhotoCount("couple") ? "Gemeinsames Foto hochgeladen" : Math.min(2, Number(currentPhotoCount("partner_one") > 0) + Number(currentPhotoCount("partner_two") > 0)) + " von 2 Einzelfotos hochgeladen"]
        ]
      : [
          ["Vorname", data.first_name],
          ["Vorstellung", data.public_intro],
          ["Region", (Array.isArray(data.regions) ? data.regions : []).map((value) => (REGION_OPTIONS.find((option) => option[0] === value) || [value, value])[1]).join(", ") || data.region],
          ["Erfahrung", [data.experience_years !== null && data.experience_years !== undefined && data.experience_years !== "" ? data.experience_years + (Number(data.experience_years) === 1 ? " Jahr" : " Jahre") : "", data.weddings_photographed !== null && data.weddings_photographed !== undefined && data.weddings_photographed !== "" ? data.weddings_photographed + " Hochzeiten" : ""].filter(Boolean).join(" · ") || data.experience],
          ["Bildstil", (Array.isArray(data.styles) ? data.styles : []).map((value) => (STYLE_OPTIONS.find((option) => option[0] === value) || [value, value])[1]).join(", ") || data.visual_style],
          ["Begleitung", data.coverage_scope],
          ["Vergütung", data.compensation_type === "free" ? "Unentgeltlich" : data.compensation_type === "fixed" ? "Fixbetrag " + Number(data.compensation_amount_eur).toLocaleString("de-AT") + " €" : "Nicht angegeben"],
          ["Fotos", portfolioPhotoCounts().gallery + " Fotos in der Galerie"],
          ["Instagram", data.instagram_url || "Nicht angegeben"], ["Website", data.website_url || "Nicht angegeben"]
        ];
    const photoReview = wizard.role === "photographer"
      ? '<div class="profile-review-photos"><section><h3>Deine Galerie</h3><div id="photo-preview-grid" class="photo-preview-grid review-photo-grid profile-photo-gallery" aria-label="Fotogalerie"></div></section></div>'
      : '<div id="photo-preview-grid" class="photo-preview-grid review-photo-grid profile-photo-gallery" aria-label="Fotovorschau"></div>';
    return photoReview + '<div class="setup-summary">' + entries.filter((entry) => entry[1] !== null && entry[1] !== undefined && String(entry[1]).trim() !== "").map((entry) => {
      if ((entry[0] === "Instagram" || entry[0] === "Website") && entry[1] !== "Nicht angegeben") {
        let display = entry[1];
        try {
          const parsed = new URL(entry[1]);
          display = entry[0] === "Instagram"
            ? "@" + parsed.pathname.split("/").filter(Boolean)[0]
            : parsed.hostname.replace(/^www\./i, "");
        } catch (_) {}
        const kind = entry[0] === "Instagram" ? "instagram" : "website";
        return '<div class="setup-summary-social"><strong>' + escapeHtml(entry[0]) + '</strong><span><a class="profile-social-link profile-social-' + kind + '" href="' + escapeHtml(entry[1]) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(display) + '<span aria-hidden="true"> ↗</span></a></span></div>';
      }
      return "<div><strong>" + escapeHtml(entry[0]) + "</strong><span>" + escapeHtml(entry[1]) + "</span></div>";
    }).join("") + "</div>";
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
          ? (wizard.role === "couple" ? "Wählt eure Trauungsart, Begleitungsabschnitte und ungefähr geplante Uhrzeiten aus." : "Wähle aus, was dir für dein Portfolio noch fehlt und du gerne fotografieren möchtest, zum Beispiel ein Getting Ready, die Trauung oder eine Ganztagesreportage. Instagram und Website kannst du optional ergänzen.")
          : step === 3
            ? (wizard.role === "couple" ? "Lade für jede Person mindestens ein eigenes Foto hoch. Ein gemeinsames Foto ist optional." : "Lade mindestens 3 Stilfotos für dein Portfolio hoch.")
            : "Prüfe deine Angaben und schließe dein Profil ab.";
    const profileEditExit = document.querySelector("#profile-edit-exit");
    if (profileEditExit) profileEditExit.hidden = !wizard.isEditing;
    setDraftAutoSaveStatus(wizard.isEditing ? "Änderungen werden automatisch gespeichert" : "");
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
    if (step === 2 && wizard.role === "photographer") updateProfileLinkChecks();
    if (step === 4) loadPhotoPreviews();
    if (step === 3 && wizard.role === "photographer") attachPortfolioPhotoControls();
    if (step === 3 && wizard.role === "couple") {
      renderPendingCouplePhotos();
      loadExistingCouplePhotos();
      attachCouplePhotoControls();
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

  function drawCrop(canvas, state) {
    const context = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const imageWidth = state.image.naturalWidth;
    const imageHeight = state.image.naturalHeight;
    const quarterTurn = state.rotation % 180 !== 0;
    const rotatedWidth = quarterTurn ? imageHeight : imageWidth;
    const rotatedHeight = quarterTurn ? imageWidth : imageHeight;
    const scale = Math.max(width / rotatedWidth, height / rotatedHeight) * state.zoom;
    const maxX = Math.max(0, (rotatedWidth * scale - width) / 2);
    const maxY = Math.max(0, (rotatedHeight * scale - height) / 2);
    state.offsetX = Math.min(maxX, Math.max(-maxX, state.offsetX));
    state.offsetY = Math.min(maxY, Math.max(-maxY, state.offsetY));
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#25242b";
    context.fillRect(0, 0, width, height);
    context.save();
    context.translate(width / 2 + state.offsetX, height / 2 + state.offsetY);
    context.rotate(state.rotation * Math.PI / 180);
    context.scale(scale, scale);
    context.drawImage(state.image, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight);
    context.restore();
  }

  let cropState = null;
  const cropDialog = document.querySelector("#crop-dialog");
  const cropCanvas = document.querySelector("#crop-canvas");
  const cropZoom = document.querySelector("#crop-zoom");
  const cropSave = document.querySelector("#crop-save");
  const cropErrorLine = document.querySelector("#crop-error");
  const cropRotate = document.querySelector("#crop-rotate");
  let cropDrag = null;

  function openCropEditor(blob, onApply, options = {}) {
    const isAvatarCrop = Boolean(options.avatar);
    if (cropErrorLine) cropErrorLine.textContent = "";
    const sourceUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      cropState = { image, sourceUrl, onApply, rotation: 0, zoom: 1, offsetX: 0, offsetY: 0, isAvatarCrop };
      cropCanvas.width = isAvatarCrop ? 1000 : 960;
      cropCanvas.height = isAvatarCrop ? 1000 : 1200;
      cropCanvas.style.aspectRatio = isAvatarCrop ? "1 / 1" : "4 / 5";
      cropZoom.min = isAvatarCrop ? "1" : "0.5";
      cropZoom.value = "1";
      cropDialog.classList.toggle("avatar-crop", isAvatarCrop);
      document.querySelector("#crop-title").textContent = isAvatarCrop ? "Profilfoto ausrichten" : "Foto zuschneiden und ausrichten";
      cropDialog.querySelector(".crop-intro").textContent = isAvatarCrop
        ? "Verschiebe und zoome das Foto, bis dein Gesicht im Kreis gut sitzt."
        : "Verschiebe und drehe das Foto, bis der sichtbare Hochformat-Ausschnitt passt.";
      drawCrop(cropCanvas, cropState);
      cropDialog.showModal();
    };
    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      const message = "„" + (blob.name || "Das ausgewählte Foto") + "“ konnte nicht geöffnet werden. Bitte speichere das Bild als JPG, PNG oder WebP und versuche es erneut.";
      if (cropErrorLine) cropErrorLine.textContent = message;
      const photoStatus = document.querySelector("#account-photo-status");
      if (photoStatus) photoStatus.textContent = message;
    };
    image.src = sourceUrl;
  }

  function blobFromCanvas(canvas, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Das Foto konnte nicht verarbeitet werden.")), "image/jpeg", quality);
    });
  }

  async function createContainedPhoto(file) {
    const sourceUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("Ein Foto konnte nicht für die Vorschau vorbereitet werden."));
        image.src = sourceUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = 960;
      canvas.height = 1200;
      const context = canvas.getContext("2d");
      context.fillStyle = "#25242b";
      context.fillRect(0, 0, canvas.width, canvas.height);
      const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      let result = await blobFromCanvas(canvas, 0.86);
      if (result.size > maxPortfolioPhotoBytes) result = await blobFromCanvas(canvas, 0.68);
      if (result.size > maxPortfolioPhotoBytes) throw new Error("Die Bilddarstellung ist größer als 2 MB. Bitte wähle ein kleineres Originalfoto.");
      return new File([result], "wedconnect-display.jpg", { type: "image/jpeg" });
    } finally {
      URL.revokeObjectURL(sourceUrl);
    }
  }

  async function createCroppedPhoto() {
    let result = await blobFromCanvas(cropCanvas, 0.88);
    if (result.size > maxPortfolioPhotoBytes) result = await blobFromCanvas(cropCanvas, 0.68);
    if (result.size > maxPortfolioPhotoBytes) throw new Error("Der Bildausschnitt ist noch größer als 2 MB.");
    return result;
  }

  cropZoom.addEventListener("input", () => {
    if (!cropState) return;
    cropState.zoom = Number(cropZoom.value);
    drawCrop(cropCanvas, cropState);
  });

  cropRotate.addEventListener("click", () => {
    if (!cropState) return;
    cropState.rotation = (cropState.rotation + 90) % 360;
    drawCrop(cropCanvas, cropState);
  });

  cropCanvas.addEventListener("pointerdown", (event) => {
    if (!cropState || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    cropDrag = { x: event.clientX, y: event.clientY, offsetX: cropState.offsetX, offsetY: cropState.offsetY };
    cropCanvas.setPointerCapture(event.pointerId);
    cropCanvas.classList.add("is-dragging");
  });
  cropCanvas.addEventListener("pointermove", (event) => {
    if (!cropDrag || !cropState) return;
    const rect = cropCanvas.getBoundingClientRect();
    const factor = cropCanvas.width / rect.width;
    cropState.offsetX = cropDrag.offsetX + (event.clientX - cropDrag.x) * factor;
    cropState.offsetY = cropDrag.offsetY + (event.clientY - cropDrag.y) * factor;
    drawCrop(cropCanvas, cropState);
  });
  const endCropDrag = () => {
    cropDrag = null;
    cropCanvas.classList.remove("is-dragging");
  };
  cropCanvas.addEventListener("pointerup", endCropDrag);
  cropCanvas.addEventListener("pointercancel", endCropDrag);

  document.querySelector("#crop-cancel").addEventListener("click", () => cropDialog.close());
  cropDialog.addEventListener("close", () => {
    if (cropState && cropState.sourceUrl) URL.revokeObjectURL(cropState.sourceUrl);
    cropState = null;
  });
  cropSave.addEventListener("click", async () => {
    if (!cropState) return;
    cropSave.disabled = true;
    cropSave.textContent = "Wird übernommen …";
    try {
      const blob = await createCroppedPhoto();
      await cropState.onApply(blob);
      cropDialog.close();
    } catch (error) {
      if (cropErrorLine) cropErrorLine.textContent = error && error.message ? error.message : "Das Foto konnte nicht gespeichert werden.";
    } finally {
      cropSave.disabled = false;
      cropSave.textContent = "Zuschnitt übernehmen";
    }
  });

  function syncMobileGallerySelection(container) {
    if (!container || !window.matchMedia("(max-width: 560px)").matches) return;
    const cards = Array.from(container.querySelectorAll(":scope > .portfolio-photo-card, :scope > .photo-preview"));
    container.querySelectorAll(":scope > .gallery-active-thumbnail").forEach((thumb) => thumb.remove());
    if (!cards.length) return;
    let activeIndex = cards.findIndex((card) => card.classList.contains("is-mobile-main"));
    if (activeIndex < 0) {
      activeIndex = 0;
      cards[0].classList.add("is-mobile-main");
    }
    const activeCard = cards[activeIndex];
    cards.forEach((card, index) => {
      card.style.order = card === activeCard ? "-1" : String(card.dataset.galleryOrder || index);
    });
    const activeImage = activeCard.querySelector("img");
    if (!activeImage) return;
    activeImage.setAttribute("aria-label", (activeImage.alt || "Foto") + " · aktuell ausgewählt");
    const thumbnail = document.createElement("button");
    thumbnail.type = "button";
    thumbnail.className = "gallery-active-thumbnail";
    thumbnail.setAttribute("aria-current", "true");
    thumbnail.setAttribute("aria-label", (activeImage.alt || "Foto") + " · ausgewählt");
    thumbnail.title = "Dieses Foto ist ausgewählt";
    thumbnail.style.order = String(activeCard.dataset.galleryOrder || activeIndex);
    const image = document.createElement("img");
    image.src = activeImage.currentSrc || activeImage.src;
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    thumbnail.append(image);
    container.append(thumbnail);
  }

  function activateMobileGalleryPhoto(container, card, image, label) {
    if (!container || !card || !image) return;
    if (!container.querySelector(".is-mobile-main")) card.classList.add("is-mobile-main");
    if (card.dataset.galleryOrder === undefined) {
      card.dataset.galleryOrder = String(container.querySelectorAll(".portfolio-photo-card, .photo-preview").length);
    }
    const mobile = window.matchMedia("(max-width: 560px)");
    const selectAsMain = () => {
      if (!mobile.matches) return;
      container.querySelectorAll(".portfolio-photo-card, .photo-preview").forEach((photoCard) => {
        photoCard.classList.toggle("is-mobile-main", photoCard === card);
      });
      syncMobileGallerySelection(container);
    };
    image.addEventListener("click", selectAsMain);
    if (mobile.matches) {
      image.setAttribute("role", "button");
      image.tabIndex = 0;
      image.setAttribute("aria-label", (label || "Foto") + " als Hauptfoto anzeigen");
      image.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectAsMain();
        }
      });
    }
  }

  function renderPendingPortfolioPhotos() {
    const container = document.querySelector("#portfolio-pending-photos");
    if (!container) return;
    container.innerHTML = "";
    (wizard.pendingPhotos || []).forEach((item, index) => {
      const card = document.createElement("article");
      card.className = "portfolio-photo-card";
      const image = document.createElement("img");
      image.src = item.previewUrl || item.originalPreviewUrl;
      image.alt = "Ausgewähltes Stilfoto " + (index + 1);
      activateMobileGalleryPhoto(container, card, image, image.alt);
      const actions = document.createElement("div");
      actions.className = "portfolio-photo-actions";
      const cropButton = document.createElement("button");
      cropButton.className = "button button-secondary photo-crop-button";
      cropButton.type = "button";
      cropButton.setAttribute("aria-label", "Zuschnitt anpassen");
      cropButton.title = "Zuschnitt anpassen";
      cropButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v14a2 2 0 0 0 2 2h12M3 7h14a2 2 0 0 1 2 2v12"/></svg>';
      cropButton.addEventListener("click", () => openCropEditor(item.file, async (blob) => {
        if (item.previewUrl && item.previewUrl !== item.originalPreviewUrl) URL.revokeObjectURL(item.previewUrl);
        item.displayFile = new File([blob], item.name.replace(/\.[^.]+$/, "") + "-display.jpg", { type: "image/jpeg" });
        item.previewUrl = URL.createObjectURL(blob);
        renderPendingPortfolioPhotos();
      }));
      const removeButton = document.createElement("button");
      removeButton.className = "button button-secondary";
      removeButton.type = "button";
      removeButton.classList.add("photo-delete-button");
      removeButton.setAttribute("aria-label", "Ausgewähltes Foto entfernen");
      removeButton.title = "Ausgewähltes Foto entfernen";
      removeButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 14h11l1-14M9 7V4h6v3"/></svg>';
      removeButton.addEventListener("click", () => {
        if (item.originalPreviewUrl) URL.revokeObjectURL(item.originalPreviewUrl);
        if (item.previewUrl && item.previewUrl !== item.originalPreviewUrl) URL.revokeObjectURL(item.previewUrl);
        wizard.pendingPhotos.splice(index, 1);
        renderPendingPortfolioPhotos();
        updatePortfolioPhotoCount();
      });
      actions.append(cropButton, removeButton);
      card.append(image, actions);
      container.append(card);
    });
    syncMobileGallerySelection(container);
  }

  function updatePortfolioPhotoCount() {
    const galleryCount = document.querySelector("#portfolio-photo-count");
    if (!galleryCount) return;
    const totals = portfolioPhotoCounts();
    galleryCount.textContent = "Galerie: " + totals.gallery + " / " + maxPortfolioPhotos + " Fotos";
    const input = document.querySelector('[name="portfolio-photos"]');
    const picker = input && input.nextElementSibling;
    if (input) input.disabled = totals.gallery >= maxPortfolioPhotos;
    if (picker) {
      picker.setAttribute("aria-disabled", totals.gallery >= maxPortfolioPhotos ? "true" : "false");
      picker.classList.toggle("is-disabled", totals.gallery >= maxPortfolioPhotos);
    }
  }

  const photoViewer = document.querySelector("#photo-viewer");
  const photoViewerImage = document.querySelector("#photo-viewer-image");
  const photoViewerClose = document.querySelector("#photo-viewer-close");
  const fullscreenGalleryDialog = document.querySelector("#fullscreen-gallery-dialog");
  let activeFullscreenGallery = null;
  let fullscreenGalleryPlaceholder = null;
  const orientationGuard = document.querySelector("#orientation-guard");
  const narrowLandscape = window.matchMedia("(orientation: landscape) and (max-height: 600px) and (pointer: coarse)");

  async function getSignedPhotoUrl(path) {
    if (!path) return "";
    try {
      const { data, error } = await supabase.storage.from(photoBucket).createSignedUrl(path, 3600);
      return !error && data && data.signedUrl ? data.signedUrl : "";
    } catch (_) {
      return "";
    }
  }

  function markGalleryImageLoaded(image) {
    const figure = image && image.closest(".profile-preview-photo");
    if (!figure) return;
    figure.classList.add("is-loaded");
    figure.classList.remove("is-failed");
  }

  async function openGalleryFullscreen(gallery) {
    if (!fullscreenGalleryDialog || !gallery || fullscreenGalleryDialog.open) return;
    const track = gallery.querySelector(".profile-preview-track");
    const previousWidth = track ? track.clientWidth : 1;
    gallery.dataset.fullscreenIndex = String(track ? Math.round(track.scrollLeft / previousWidth) : 0);
    fullscreenGalleryPlaceholder = document.createComment("WedConnect gallery location");
    gallery.parentNode.insertBefore(fullscreenGalleryPlaceholder, gallery);
    activeFullscreenGallery = gallery;
    gallery.classList.add("is-fullscreen");
    fullscreenGalleryDialog.append(gallery);
    document.body.classList.add("is-gallery-fullscreen");
    fullscreenGalleryDialog.showModal();
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches && document.documentElement.requestFullscreen) {
      try {
        const fullscreenRequest = document.documentElement.requestFullscreen({ navigationUI: "hide" });
        if (fullscreenRequest && typeof fullscreenRequest.catch === "function") fullscreenRequest.catch(() => {});
      } catch (_) {}
    }
    syncProfileFullscreenButtons();
    syncOrientationGuard();

    requestAnimationFrame(() => {
      if (activeFullscreenGallery !== gallery || !track) return;
      track.scrollLeft = Number(gallery.dataset.fullscreenIndex || 0) * track.clientWidth;
    });
    const images = Array.from(gallery.querySelectorAll("img[data-original-photo-path]"));
    await Promise.all(images.map(async (image) => {
      const displayUrl = image.dataset.displayUrl || await getSignedPhotoUrl(image.dataset.photoPath);
      if (activeFullscreenGallery !== gallery) return;
      if (displayUrl) {
        image.dataset.displayUrl = displayUrl;
        image.src = displayUrl;
      }

      const originalUrl = await getSignedPhotoUrl(image.dataset.originalPhotoPath);
      if (activeFullscreenGallery !== gallery) return;
      if (!originalUrl) return;
      image.dataset.fullscreenUrl = originalUrl;
      image.addEventListener("load", () => {
        markGalleryImageLoaded(image);
        syncFullscreenGalleryIndicators(gallery);
      }, { once: true });
      image.addEventListener("error", () => {
        if (activeFullscreenGallery === gallery && image.dataset.displayUrl) image.src = image.dataset.displayUrl;
      }, { once: true });
      image.src = originalUrl;
    }));
  }

  function closeGalleryFullscreen() {
    if (!activeFullscreenGallery) return;
    const gallery = activeFullscreenGallery;
    const selectedIndex = Number(gallery.dataset.fullscreenIndex || 0);
    gallery.classList.remove("is-fullscreen");
    Array.from(gallery.querySelectorAll("img[data-photo-path]")).forEach((image) => {
      if (image.dataset.displayUrl) {
        image.addEventListener("load", () => markGalleryImageLoaded(image), { once: true });
        image.src = image.dataset.displayUrl;
        if (image.complete && image.naturalWidth) markGalleryImageLoaded(image);
        image.dataset.photoState = "done";
      } else {
        image.removeAttribute("src");
        delete image.dataset.photoState;
      }
      delete image.dataset.fullscreenUrl;
    });
    if (fullscreenGalleryPlaceholder && fullscreenGalleryPlaceholder.parentNode) {
      fullscreenGalleryPlaceholder.parentNode.insertBefore(gallery, fullscreenGalleryPlaceholder);
      fullscreenGalleryPlaceholder.remove();
    }
    activeFullscreenGallery = null;
    fullscreenGalleryPlaceholder = null;
    document.body.classList.remove("is-gallery-fullscreen");
    if (document.fullscreenElement && document.exitFullscreen) {
      try {
        const exitRequest = document.exitFullscreen();
        if (exitRequest && typeof exitRequest.catch === "function") exitRequest.catch(() => {});
      } catch (_) {}
    }
    if (fullscreenGalleryDialog && fullscreenGalleryDialog.open) fullscreenGalleryDialog.close();
    const track = gallery.querySelector(".profile-preview-track");
    if (track) requestAnimationFrame(() => { track.scrollLeft = selectedIndex * track.clientWidth; });
    loadProfileGalleryImages(gallery);
    syncProfileFullscreenButtons();
    syncOrientationGuard();
  }

  const fullscreenRotateHint = document.querySelector("#fullscreen-rotate-hint");
  const canPromptToRotate = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const portraitViewport = window.matchMedia ? window.matchMedia("(orientation: portrait)") : { matches: true };

  function syncFullscreenGalleryIndicators(gallery = activeFullscreenGallery) {
    if (!gallery) return;
    const indicatorGroup = gallery.querySelector(".profile-preview-indicators");
    const track = gallery.querySelector(".profile-preview-track");
    if (!indicatorGroup || !track) return;
    const fullscreenMobile = gallery.classList.contains("is-fullscreen") && window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    if (!fullscreenMobile) {
      indicatorGroup.style.removeProperty("--gallery-indicator-left");
      indicatorGroup.style.removeProperty("--gallery-indicator-width");
      indicatorGroup.style.removeProperty("--gallery-indicator-top");
      return;
    }
    const index = Math.max(0, Math.min(track.children.length - 1, Math.round(track.scrollLeft / (track.clientWidth || 1))));
    const image = track.children[index] && track.children[index].querySelector("img");
    if (!image || !image.naturalWidth || !image.naturalHeight) return;
    const imageRect = image.getBoundingClientRect();
    const galleryRect = gallery.getBoundingClientRect();
    const ratio = image.naturalWidth / image.naturalHeight;
    let visibleWidth = imageRect.width;
    let visibleHeight = visibleWidth / ratio;
    if (visibleHeight > imageRect.height) {
      visibleHeight = imageRect.height;
      visibleWidth = visibleHeight * ratio;
    }
    const visibleLeft = imageRect.left + (imageRect.width - visibleWidth) / 2;
    const visibleTop = imageRect.top + (imageRect.height - visibleHeight) / 2;
    indicatorGroup.style.setProperty("--gallery-indicator-left", Math.max(6, visibleLeft - galleryRect.left + 8) + "px");
    indicatorGroup.style.setProperty("--gallery-indicator-width", Math.max(0, visibleWidth - 16) + "px");
    indicatorGroup.style.setProperty("--gallery-indicator-top", Math.max(6, visibleTop - galleryRect.top + 8) + "px");
  }

  function syncOrientationGuard() {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
    const photoIsExpanded = Boolean(
      document.querySelector(".profile-preview-gallery.is-fullscreen") ||
      (fullscreenElement && fullscreenElement.classList.contains("profile-preview-gallery")) ||
      (photoViewer && photoViewer.open)
    );
    const mustReturnToPortrait = narrowLandscape.matches && !photoIsExpanded;
    syncFullscreenGalleryIndicators();
    const galleryIsFullscreen = Boolean(document.querySelector(".profile-preview-gallery.is-fullscreen"));
    if (fullscreenRotateHint) fullscreenRotateHint.hidden = !(galleryIsFullscreen && canPromptToRotate && portraitViewport.matches);
    document.body.classList.toggle("is-portrait-required", mustReturnToPortrait);
    if (orientationGuard) orientationGuard.setAttribute("aria-hidden", mustReturnToPortrait ? "false" : "true");
  }

  window.addEventListener("orientationchange", syncOrientationGuard);
  window.addEventListener("resize", syncOrientationGuard, { passive: true });
  if (narrowLandscape.addEventListener) narrowLandscape.addEventListener("change", syncOrientationGuard);
  else if (narrowLandscape.addListener) narrowLandscape.addListener(syncOrientationGuard);
  syncOrientationGuard();

  function showPhotoViewer(url, label) {
    if (!photoViewer || !photoViewerImage) return;
    photoViewerImage.src = url;
    photoViewerImage.alt = label || "Foto in Originalansicht";
    photoViewer.showModal();
  }

  function syncProfileFullscreenButtons() {
    document.querySelectorAll(".profile-preview-fullscreen").forEach((button) => {
      const gallery = button.closest(".profile-preview-gallery");
      const isFullscreen = Boolean(gallery && (gallery.classList.contains("is-fullscreen") || document.fullscreenElement === gallery || document.webkitFullscreenElement === gallery));
      button.classList.toggle("is-fullscreen", isFullscreen);
      button.setAttribute("aria-label", isFullscreen ? "Vollbild schließen" : "Galerie im Vollbild anzeigen");
      button.title = isFullscreen ? "Vollbild schließen" : "Galerie im Vollbild anzeigen";
      button.innerHTML = isFullscreen
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>';
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeFullscreenGallery) {
      event.preventDefault();
      closeGalleryFullscreen();
    }
  });

  if (fullscreenGalleryDialog) fullscreenGalleryDialog.addEventListener("click", (event) => {
    if (event.target === fullscreenGalleryDialog) closeGalleryFullscreen();
  });

  document.addEventListener("fullscreenchange", () => {
    syncProfileFullscreenButtons();
    syncOrientationGuard();
  });
  document.addEventListener("webkitfullscreenchange", () => {
    syncProfileFullscreenButtons();
    syncOrientationGuard();
  });

  if (photoViewerClose) photoViewerClose.addEventListener("click", () => photoViewer.close());
  if (photoViewer) photoViewer.addEventListener("close", syncOrientationGuard);
  if (photoViewer) photoViewer.addEventListener("click", (event) => {
    if (event.target === photoViewer) photoViewer.close();
  });

  function makeImageViewable(image, url, label) {
    if (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(max-width: 560px)").matches) return;
    image.setAttribute("role", "button");
    image.tabIndex = 0;
    image.setAttribute("aria-label", (label || "Foto") + " groß anzeigen");
    image.title = "Tippen oder klicken, um das Foto groß anzuzeigen";
    image.addEventListener("click", () => showPhotoViewer(url, label));
    image.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showPhotoViewer(url, label);
      }
    });
  }

  function confirmPhotoDelete(message) {
    const dialog = document.querySelector("#delete-photo-dialog");
    document.querySelector("#delete-photo-message").textContent = message;
    return new Promise((resolve) => {
      const handleClose = () => resolve(dialog.returnValue === "confirm");
      dialog.addEventListener("close", handleClose, { once: true });
      dialog.showModal();
    });
  }

  async function removeProfilePhoto(photo) {
    const { error: rowError } = await supabase.from("profile_photos")
      .delete()
      .eq("user_id", currentUser.id)
      .eq("object_path", photo.object_path);
    if (rowError) throw new Error("Das Foto konnte nicht aus dem Profil entfernt werden.");
    wizard.photos = wizard.photos.filter((item) => item.object_path !== photo.object_path);
    const paths = [photo.object_path, photo.display_path].filter(Boolean);
    const { error: storageError } = await supabase.storage.from(photoBucket).remove(paths);
    return storageError;
  }

  function updateCouplePhotoCounts() {
    [
      ["#joint-photo-count", "couple"],
      ["#partner-one-photo-count", "partner_one"],
      ["#partner-two-photo-count", "partner_two"]
    ].forEach(([selector, type]) => {
      const node = document.querySelector(selector);
      if (node) node.textContent = "Bereits hochgeladen: " + currentPhotoCount(type);
    });
  }

  async function loadExistingCouplePhotos() {
    const container = document.querySelector("#couple-existing-photos");
    if (!container) return;
    container.innerHTML = "";
    const labels = {
      couple: "Gemeinsames Foto",
      partner_one: wizard.data.couple.partner_one_first_name || "Erste Person",
      partner_two: wizard.data.couple.partner_two_first_name || "Zweite Person"
    };
    const photos = wizard.photos.filter((photo) => photo.photo_type !== "portfolio");
    for (const [index, photo] of photos.entries()) {
      const { data: originalData, error: originalError } = await supabase.storage.from(photoBucket).createSignedUrl(photo.object_path, 600);
      if (originalError || !originalData || !originalData.signedUrl) {
        errorLine.textContent = "Ein hochgeladenes Foto konnte nicht geladen werden. Bitte prüfe den Speicherzugriff.";
        continue;
      }
      let displayUrl = originalData.signedUrl;
      if (photo.display_path) {
        const { data: displayData, error: displayError } = await supabase.storage.from(photoBucket).createSignedUrl(photo.display_path, 600);
        if (!displayError && displayData && displayData.signedUrl) displayUrl = displayData.signedUrl;
      }
      const label = labels[photo.photo_type] || "Foto";
      const card = document.createElement("article");
      card.className = "portfolio-photo-card";
      const frame = document.createElement("div");
      frame.className = "couple-photo-preview-frame";
      const image = document.createElement("img");
      image.src = displayUrl;
      image.alt = label + " " + (index + 1);
      frame.append(image);
      const nameOverlay = createCouplePhotoNameOverlay(photo.photo_type, wizard.data.couple || {});
      if (nameOverlay) frame.append(nameOverlay);
      activateMobileGalleryPhoto(container, card, image, image.alt);
      const caption = document.createElement("p");
      caption.textContent = label;
      const actions = document.createElement("div");
      actions.className = "portfolio-photo-actions";
      const editButton = document.createElement("button");
      editButton.className = "button button-secondary photo-crop-button";
      editButton.type = "button";
      editButton.setAttribute("aria-label", "Foto zuschneiden und ausrichten");
      editButton.title = "Foto zuschneiden und ausrichten";
      editButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v14a2 2 0 0 0 2 2h12M3 7h14a2 2 0 0 1 2 2v12"/></svg>';
      editButton.addEventListener("click", async () => {
        editButton.disabled = true;
        try {
          const response = await fetch(originalData.signedUrl);
          if (!response.ok) throw new Error("Das Originalfoto konnte nicht geladen werden.");
          const sourceBlob = await response.blob();
          const sourceFile = new File([sourceBlob], label.replaceAll(" ", "-") + ".jpg", { type: sourceBlob.type || "image/jpeg" });
          openCropEditor(sourceFile, async (blob) => {
            const displayPath = photo.display_path || currentUser.id + "/" + crypto.randomUUID() + "-display.jpg";
            const { error: uploadError } = await supabase.storage.from(photoBucket).upload(displayPath, blob, {
              contentType: "image/jpeg",
              upsert: Boolean(photo.display_path)
            });
            if (uploadError) throw new Error("Der Zuschnitt konnte nicht gespeichert werden: " + (uploadError.message || "Speicherfehler."));
            const { error: updateError } = await supabase.from("profile_photos")
              .update({ display_path: displayPath })
              .eq("user_id", currentUser.id)
              .eq("object_path", photo.object_path);
            if (updateError) {
              if (!photo.display_path) await supabase.storage.from(photoBucket).remove([displayPath]);
              throw new Error("Der Zuschnitt wurde erstellt, aber nicht mit dem Foto verknüpft: " + (updateError.message || "Datenbankfehler."));
            }
            photo.display_path = displayPath;
            await loadExistingCouplePhotos();
          });
        } catch (error) {
          errorLine.textContent = error && error.message ? error.message : "Das Foto konnte nicht bearbeitet werden.";
        } finally {
          editButton.disabled = false;
        }
      });
      const deleteButton = document.createElement("button");
      deleteButton.className = "button button-secondary photo-delete-button";
      deleteButton.type = "button";
      deleteButton.setAttribute("aria-label", "Foto löschen");
      deleteButton.title = "Foto löschen";
      deleteButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 14h11l-1-14M9 7V4h6v3"/></svg>';
      deleteButton.addEventListener("click", async () => {
        if (!(await confirmPhotoDelete(label + " und seinen Zuschnitt endgültig löschen?"))) return;
        deleteButton.disabled = true;
        editButton.disabled = true;
        try {
          const storageError = await removeProfilePhoto(photo);
          await loadExistingCouplePhotos();
          updateCouplePhotoCounts();
          if (storageError) errorLine.textContent = "Das Foto wurde aus dem Profil entfernt. Die gespeicherte Datei konnte nicht vollständig gelöscht werden.";
        } catch (error) {
          errorLine.textContent = error && error.message ? error.message : "Das Foto konnte nicht gelöscht werden.";
        } finally {
          deleteButton.disabled = false;
          editButton.disabled = false;
        }
      });
      actions.append(editButton, deleteButton);
      card.append(frame, caption, actions);
      container.append(card);
    }
    syncMobileGallerySelection(container);
    updateCouplePhotoCounts();
  }

  async function loadExistingPortfolioPhotos() {
    const container = document.querySelector("#portfolio-existing-photos");
    if (!container) return;
    container.innerHTML = "";
    const portfolio = wizard.photos.filter((photo) => photo.photo_type === "portfolio");
    for (const [index, photo] of portfolio.entries()) {
      const { data: originalData, error: originalError } = await supabase.storage.from(photoBucket).createSignedUrl(photo.object_path, 600);
      if (originalError || !originalData || !originalData.signedUrl) continue;
      let displayUrl = originalData.signedUrl;
      if (photo.display_path) {
        const { data: displayData, error: displayError } = await supabase.storage.from(photoBucket).createSignedUrl(photo.display_path, 600);
        if (!displayError && displayData && displayData.signedUrl) displayUrl = displayData.signedUrl;
      }
      const card = document.createElement("article");
      card.className = "portfolio-photo-card";
      const image = document.createElement("img");
      image.src = displayUrl;
      image.alt = "Hochgeladenes Stilfoto " + (index + 1);
      activateMobileGalleryPhoto(container, card, image, image.alt);
      const editButton = document.createElement("button");
      editButton.className = "button button-secondary photo-crop-button";
      editButton.type = "button";
      editButton.setAttribute("aria-label", "Zuschnitt anpassen");
      editButton.title = "Zuschnitt anpassen";
      editButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v14a2 2 0 0 0 2 2h12M3 7h14a2 2 0 0 1 2 2v12"/></svg>';
      editButton.addEventListener("click", async () => {
        editButton.disabled = true;
        try {
          const response = await fetch(originalData.signedUrl);
          if (!response.ok) throw new Error("Das Originalfoto konnte nicht geladen werden.");
          const sourceBlob = await response.blob();
          openCropEditor(sourceBlob, async (blob) => {
            const displayPath = photo.display_path || currentUser.id + "/" + crypto.randomUUID() + "-display.jpg";
            const { error: uploadError } = await supabase.storage.from(photoBucket).upload(displayPath, blob, {
              contentType: "image/jpeg",
              upsert: Boolean(photo.display_path)
            });
            if (uploadError) throw new Error("Der Bildausschnitt konnte nicht gespeichert werden.");
            const { error: updateError } = await supabase.from("profile_photos")
              .update({ display_path: displayPath })
              .eq("user_id", currentUser.id)
              .eq("object_path", photo.object_path);
            if (updateError) {
              if (!photo.display_path) await supabase.storage.from(photoBucket).remove([displayPath]);
              throw new Error("Der Bildausschnitt konnte nicht mit dem Original verknüpft werden. Bitte prüfe die neue Supabase-Migration.");
            }
            photo.display_path = displayPath;
            await loadExistingPortfolioPhotos();
          });
        } catch (error) {
          errorLine.textContent = error && error.message ? error.message : "Das Foto konnte nicht bearbeitet werden.";
        } finally {
          editButton.disabled = false;
        }
      });
      const deleteButton = document.createElement("button");
      deleteButton.className = "button button-secondary";
      deleteButton.type = "button";
      deleteButton.classList.add("photo-delete-button");
      deleteButton.setAttribute("aria-label", "Foto löschen");
      deleteButton.title = "Foto löschen";
      deleteButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 14h11l1-14M9 7V4h6v3"/></svg>';
      deleteButton.addEventListener("click", async () => {
        if (!(await confirmPhotoDelete("Stilfoto " + (index + 1) + " und sein Zuschnitt endgültig löschen?"))) return;
        deleteButton.disabled = true;
        editButton.disabled = true;
        try {
          const storageError = await removeProfilePhoto(photo);
          await loadExistingPortfolioPhotos();
          if (storageError) errorLine.textContent = "Das Foto wurde aus dem Profil entfernt. Die gespeicherte Datei konnte nicht vollständig gelöscht werden.";
        } catch (error) {
          errorLine.textContent = error && error.message ? error.message : "Das Foto konnte nicht gelöscht werden.";
        } finally {
          deleteButton.disabled = false;
          editButton.disabled = false;
        }
      });
      const actions = document.createElement("div");
      actions.className = "portfolio-photo-actions";
      actions.append(editButton, deleteButton);
      card.append(image, actions);
      container.append(card);
    }
    syncMobileGallerySelection(container);
    updatePortfolioPhotoCount();
  }

  function attachPortfolioPhotoControls() {
    const input = document.querySelector('[name="portfolio-photos"]');
    if (!input) return;
    renderPendingPortfolioPhotos();
    loadExistingPortfolioPhotos();
    updatePortfolioPhotoCount();
    input.addEventListener("change", async () => {
      errorLine.textContent = "";
      const accepted = ["image/jpeg", "image/png", "image/webp"];
      const additions = [];
      const remainingGallerySlots = Math.max(0, maxPortfolioPhotos - portfolioPhotoCounts().gallery);
      for (const file of Array.from(input.files || [])) {
        if (additions.length >= remainingGallerySlots) {
          errorLine.textContent = "Du kannst insgesamt höchstens " + maxPortfolioPhotos + " Fotos hochladen.";
          continue;
        }
        if (!accepted.includes(file.type)) {
          errorLine.textContent = "Akzeptiert werden JPG-, PNG- und WebP-Dateien.";
          continue;
        }
        if (file.size > maxPortfolioPhotoBytes) {
          errorLine.textContent = "Jedes Stilfoto darf höchstens 2 MB groß sein.";
          continue;
        }
        const originalPreviewUrl = URL.createObjectURL(file);
        try {
          const displayFile = await createContainedPhoto(file);
          additions.push({
            file, name: file.name, originalPreviewUrl,
            previewUrl: URL.createObjectURL(displayFile),
            displayFile
          });
        } catch (error) {
          URL.revokeObjectURL(originalPreviewUrl);
          errorLine.textContent = error && error.message ? error.message : "Ein Stilfoto konnte nicht vorbereitet werden.";
        }
      }
      wizard.pendingPhotos = (wizard.pendingPhotos || []).concat(additions);
      input.value = "";
      renderPendingPortfolioPhotos();
      updatePortfolioPhotoCount();
    });
  }

  function collectFields() {
    const values = {};
    fields.querySelectorAll("[data-profile-field]").forEach((element) => {
      if (element.type === "checkbox") {
        if (!values[element.name]) values[element.name] = [];
        if (element.checked) values[element.name].push(element.value);
      } else {
        values[element.name] = element.value.trim();
      }
    });
    if (wizard.role === "couple" && fields.querySelector('[name="schedule_event"]')) {
      const selected = values.schedule_event || [];
      values.schedule_items = selected.map((event) => ({
        event,
        label: event === "other" ? (values.schedule_other_label || "") : "",
        time: values["schedule_" + event + "_time"] || "",
        note: values["schedule_" + event + "_note"] || ""
      }));
      delete values.schedule_event;
      delete values.schedule_other_label;
      SCHEDULE_EVENTS.forEach(([event]) => {
        delete values["schedule_" + event + "_time"];
        delete values["schedule_" + event + "_note"];
      });
    }
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

  async function saveRoleProfile(values, allowIncomplete = false) {
    const key = wizard.role === "couple" ? "couple" : "photographer";
    const table = wizard.role === "couple" ? "couple_profiles" : "photographer_profiles";
    const data = Object.assign({}, wizard.data[key], values);
    if (wizard.role === "couple") {
      const coverage = Array.isArray(data.coverage_options) ? data.coverage_options : [];
      const regionCode = data.region_code || "";
      const ceremonyType = data.ceremony_type || "";
      const scheduleItems = Array.isArray(data.schedule_items) ? data.schedule_items : [];
      if (!allowIncomplete && wizard.step === 1 && !COUPLE_REGION_OPTIONS.some((option) => option[0] === regionCode)) {
        throw new Error("Wähle das Bundesland eurer Hochzeit aus.");
      }
      if (!allowIncomplete && wizard.step === 2 && !CEREMONY_OPTIONS.some((option) => option[0] === ceremonyType)) {
        throw new Error("Wähle die Art der Trauung aus.");
      }
      if (!allowIncomplete && wizard.step === 2 && !coverage.length) throw new Error("Wähle mindestens einen Begleitungsumfang aus.");
      if (!allowIncomplete && wizard.step === 2 && scheduleItems.some((item) => item.event === "other" && !String(item.label || "").trim())) {
        throw new Error("Gib den Namen für den weiteren Programmpunkt ein.");
      }
      data.region_code = regionCode;
      data.ceremony_type = ceremonyType;
      data.coverage_options = coverage;
      data.coverage_scope = coverage.map((value) => (COVERAGE_OPTIONS.find((option) => option[0] === value) || [value, value])[1]).join(", ");
      data.schedule_items = scheduleItems;
      data.schedule = formatScheduleItems(scheduleItems);
      data.styles = [];
      data.visual_style = "";
      data.image_wishes = "";
    }
    if (wizard.role === "photographer") {
      const regions = Array.isArray(data.regions) ? data.regions : [];
      const styles = Array.isArray(data.styles) ? data.styles : [];
      const regionLabels = regions.map((value) => (REGION_OPTIONS.find((option) => option[0] === value) || [value, value])[1]);
      const styleLabels = styles.map((value) => (STYLE_OPTIONS.find((option) => option[0] === value) || [value, value])[1]);
      const years = data.experience_years === "" || data.experience_years == null ? null : Number(data.experience_years);
      const weddings = data.weddings_photographed === "" || data.weddings_photographed == null ? null : Number(data.weddings_photographed);
      if (!allowIncomplete && !regions.length) throw new Error("Wähle mindestens ein Einsatzgebiet aus.");
      if (!allowIncomplete && !styles.length) throw new Error("Wähle mindestens einen Bildstil aus.");
      if (!allowIncomplete && years === null && weddings === null) throw new Error("Gib Erfahrung in Jahren oder die Anzahl fotografierter Hochzeiten an.");
      if (years !== null && (!Number.isInteger(years) || years < 0 || years > 80)) throw new Error("Die Erfahrungsjahre müssen zwischen 0 und 80 liegen.");
      if (weddings !== null && (!Number.isInteger(weddings) || weddings < 0 || weddings > 10000)) throw new Error("Die Anzahl der Hochzeiten muss zwischen 0 und 10.000 liegen.");
      data.regions = regions;
      data.region = regionLabels.join(", ");
      data.experience_years = years;
      data.weddings_photographed = weddings;
      data.experience = [years !== null ? years + (years === 1 ? " Jahr Erfahrung" : " Jahre Erfahrung") : "", weddings !== null ? weddings + " fotografierte Hochzeiten" : ""].filter(Boolean).join(" · ");
      data.styles = styles;
      data.visual_style = styleLabels.join(", ");
      if (wizard.step === 2) {
        const coverage = Array.isArray(data.coverage_options) ? data.coverage_options : [];
        const coverageLabels = coverage.map((value) => (COVERAGE_OPTIONS.find((option) => option[0] === value) || [value, value])[1]);
        if (!allowIncomplete && !coverage.length) throw new Error("Wähle mindestens einen Begleitungsumfang aus.");
        data.coverage_options = coverage;
        data.coverage_scope = coverageLabels.join(", ");
      }
      if (!allowIncomplete && !["free", "fixed"].includes(data.compensation_type)) {
        throw new Error("Wähle deine gewünschte Vergütung aus.");
      }
      const amount = data.compensation_amount_eur === "" || data.compensation_amount_eur == null ? null : Number(data.compensation_amount_eur);
      if (!allowIncomplete && data.compensation_type === "fixed" && (!Number.isInteger(amount) || amount < 1 || amount > 100000)) {
        throw new Error("Gib einen Betrag zwischen 1 und 100.000 Euro ein.");
      }
      if (data.compensation_type !== "fixed") data.compensation_amount_eur = null;
      else data.compensation_amount_eur = amount;
      if (allowIncomplete) {
        try { data.instagram_url = normalizeInstagram(data.instagram_url || ""); } catch (_) {}
        try { data.website_url = normalizeWebsite(data.website_url || ""); } catch (_) {}
      } else {
        data.instagram_url = normalizeInstagram(data.instagram_url || "");
        data.website_url = normalizeWebsite(data.website_url || "");
      }
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

  function setDraftAutoSaveStatus(message, failed = false) {
    const status = document.querySelector("#setup-autosave-status");
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", failed);
    status.hidden = !message;
  }

  function scheduleDraftAutoSave() {
    if (!wizard.autoSaveEnabled || ![1, 2].includes(wizard.step)) return;
    window.clearTimeout(draftAutoSaveTimer);
    setDraftAutoSaveStatus("Speichert Änderungen …");
    draftAutoSaveTimer = window.setTimeout(() => {
      draftAutoSaveTimer = null;
      const values = collectFields();
      draftAutoSavePromise = draftAutoSavePromise.catch(() => {}).then(() => saveRoleProfile(values, true));
      draftAutoSavePromise.then(() => setDraftAutoSaveStatus("Automatisch gespeichert")).catch((error) => {
        setDraftAutoSaveStatus("Speichern fehlgeschlagen", true);
        showNotice(error && error.message ? error.message : "Deine Änderungen konnten nicht gespeichert werden.");
      });
    }, 450);
  }

  async function flushDraftAutoSave() {
    if (!wizard.autoSaveEnabled || ![1, 2].includes(wizard.step)) return;
    if (draftAutoSaveTimer) {
      window.clearTimeout(draftAutoSaveTimer);
      draftAutoSaveTimer = null;
      const values = collectFields();
      draftAutoSavePromise = draftAutoSavePromise.catch(() => {}).then(() => saveRoleProfile(values, true));
    }
    try {
      await draftAutoSavePromise;
      setDraftAutoSaveStatus("Automatisch gespeichert");
    } catch (error) {
      setDraftAutoSaveStatus("Speichern fehlgeschlagen", true);
      showNotice(error && error.message ? error.message : "Deine Änderungen konnten nicht gespeichert werden.");
    }
  }

  async function closeProfileEditor() {
    if (!wizard.isEditing) return;
    await flushDraftAutoSave();
    if (wizard.step === 3) {
      try {
        await uploadSelectedPhotos(true);
      } catch (error) {
        showNotice(error && error.message ? error.message : "Einige Fotoänderungen konnten nicht gespeichert werden.");
      }
    }
    const profile = wizard.data[wizard.role === "couple" ? "couple" : "photographer"] || {};
    await renderOwnProfilePreview(wizard.role, profile, wizard.photos || []);
    const greeting = profileGreeting(wizard.role, profile);
    document.querySelector("#page-title").textContent = greeting ? "Willkommen, " + greeting + "!" : "Willkommen!";
    onboarding.classList.add("hidden");
    onboarding.classList.remove("profile-edit-overlay");
    dashboard.classList.remove("is-editing-profile");
    wizard.autoSaveEnabled = false;
    wizard.isEditing = false;
    setActiveNavigation("home");
  }

  async function loadWizard(role, startStep) {
    wizard = { step: startStep, role: role || "", data: { couple: {}, photographer: {} }, photos: [], pendingPhotos: [], pendingCouplePhotos: [], isEditing: false, autoSaveEnabled: false };
    currentRole = role || "";
    if (role === "couple") {
      const [{ data, error }, { data: photos, error: photoError }] = await Promise.all([
        supabase.from("couple_profiles").select("*").eq("id", currentUser.id).maybeSingle(),
        supabase.from("profile_photos").select("photo_type,object_path,display_path,sort_order").eq("user_id", currentUser.id).order("sort_order")
      ]);
      if (error) throw error;
      if (photoError) throw photoError;
      wizard.data.couple = data || {};
      wizard.photos = photos || [];
    } else if (role === "photographer") {
      const [{ data, error }, { data: photos, error: photoError }] = await Promise.all([
        supabase.from("photographer_profiles").select("*").eq("id", currentUser.id).maybeSingle(),
        supabase.from("profile_photos").select("photo_type,object_path,display_path,sort_order").eq("user_id", currentUser.id).order("sort_order")
      ]);
      if (error) throw error;
      if (photoError) throw photoError;
      wizard.data.photographer = data || {};
      wizard.photos = photos || [];
    }
    const activeProfile = role === "couple" ? wizard.data.couple : role === "photographer" ? wizard.data.photographer : null;
    wizard.isEditing = Boolean(role && startStep > 0 && activeProfile && Object.keys(activeProfile).length > 0);
    wizard.autoSaveEnabled = wizard.isEditing;
    onboarding.classList.remove("hidden");
    if (wizard.isEditing) {
      onboarding.classList.add("profile-edit-overlay");
      dashboard.classList.remove("hidden");
      dashboard.classList.add("is-editing-profile");
      setActiveNavigation("profile");
    } else {
      onboarding.classList.remove("profile-edit-overlay");
      dashboard.classList.add("hidden");
      dashboard.classList.remove("is-editing-profile");
    }
    loading.classList.add("hidden");
    errorState.classList.add("hidden");
    renderWizard();
  }

  async function beginWizard(role, step) {
    try {
      if (wizard.isEditing) {
        await flushDraftAutoSave();
        if (wizard.step === 3) await uploadSelectedPhotos(true);
      }
      await loadWizard(role, step);
    } catch (_) {
      showError("Dein Profil konnte nicht geladen werden. Bitte versuche es erneut.", "Profil nicht erreichbar");
    }
  }

  async function uploadFile(file, photoType, sortOrder, displayFile) {
    file = normalizePhotoFile(file);
    const sizeLimit = photoType === "portfolio" ? maxPortfolioPhotoBytes : maxPhotoBytes;
    if (file.size > sizeLimit) {
      throw new Error('„' + file.name + '“ ist größer als ' + "2" + " MB.");
    }
    const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    const objectPath = currentUser.id + "/" + crypto.randomUUID() + "." + extension;
    const displayPath = currentUser.id + "/" + crypto.randomUUID() + "-display.jpg";
    let uploadError;
    try {
      ({ error: uploadError } = await supabase.storage.from(photoBucket).upload(objectPath, file, {
        contentType: file.type,
        upsert: false
      }));
    } catch (error) {
      throw new Error('„' + file.name + '“ konnte nicht hochgeladen werden: ' + (error.message || "Netzwerkfehler."));
    }
    if (uploadError) {
      throw new Error('„' + file.name + '“ konnte nicht hochgeladen werden: ' + (uploadError.message || uploadError.statusCode || "Supabase hat den Upload abgelehnt."));
    }
    const { error: displayError } = await supabase.storage.from(photoBucket).upload(displayPath, displayFile, {
      contentType: "image/jpeg",
      upsert: false
    });
    if (displayError) {
      await supabase.storage.from(photoBucket).remove([objectPath]);
      throw new Error('„' + file.name + '“ wurde übertragen, aber die Profilansicht konnte nicht gespeichert werden: ' + (displayError.message || "Speicherfehler."));
    }
    const { error: rowError } = await supabase.from("profile_photos").insert({
      user_id: currentUser.id,
      photo_type: photoType,
      object_path: objectPath,
      display_path: displayPath,
      sort_order: sortOrder
    });
    if (rowError) {
      await supabase.storage.from(photoBucket).remove([objectPath, displayPath]);
      if (rowError.message && rowError.message.includes("display_path")) {
        throw new Error("Die Supabase-Migration für Original- und Darstellungsbilder fehlt noch.");
      }
      throw new Error('„' + file.name + '“ wurde hochgeladen, aber nicht im Profil gespeichert: ' + (rowError.message || "Datenbankfehler."));
    }
    return { photo_type: photoType, object_path: objectPath, display_path: displayPath, sort_order: sortOrder };
  }

  async function uploadSelectedPhotos(allowPartial = false) {
    if (wizard.role === "couple") {
      for (const item of [...(wizard.pendingCouplePhotos || [])]) {
        try {
          if (!item.displayFile) item.displayFile = await createContainedPhoto(item.file);
          await uploadCouplePhotoItem(item);
        } catch (error) {
          const fileName = item.file && item.file.name ? item.file.name : "Foto";
          throw new Error('„' + fileName + '“: ' + (error && error.message ? error.message : "Das Foto konnte nicht verarbeitet werden."));
        }
      }
      if (!allowPartial) {
        const couple = wizard.data.couple || {};
        if (!currentPhotoCount("partner_one")) {
          throw new Error("Lade mindestens ein eigenes Foto für " + (couple.partner_one_first_name || "die erste Person") + " hoch. Ein gemeinsames Foto reicht dafür nicht.");
        }
        if (!currentPhotoCount("partner_two")) {
          throw new Error("Lade mindestens ein eigenes Foto für " + (couple.partner_two_first_name || "die zweite Person") + " hoch. Ein gemeinsames Foto reicht dafür nicht.");
        }
      }
    } else {
      const pending = wizard.pendingPhotos || [];
      for (const [index, item] of pending.entries()) {
        try {
          const displayFile = item.displayFile || await createContainedPhoto(item.file);
          const existingPortfolioCount = wizard.photos.filter((photo) => photo.photo_type === "portfolio").length;
          await uploadFile(item.file, "portfolio", existingPortfolioCount + index, displayFile);
        } catch (error) {
          throw new Error('„' + item.file.name + '“: ' + (error && error.message ? error.message : "Das Foto konnte nicht verarbeitet werden."));
        }
      }
    }
    const { data, error } = await supabase.from("profile_photos")
      .select("photo_type,object_path,display_path,sort_order").eq("user_id", currentUser.id).order("sort_order");
    if (error) throw new Error("Die Fotoliste konnte nicht aktualisiert werden: " + (error.message || "Datenbankfehler."));
    wizard.photos = data || [];
    if (wizard.role === "photographer") {
      (wizard.pendingPhotos || []).forEach((item) => {
        if (item.originalPreviewUrl) URL.revokeObjectURL(item.originalPreviewUrl);
        if (item.previewUrl && item.previewUrl !== item.originalPreviewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      wizard.pendingPhotos = [];
    }
  }

  async function loadPhotoPreviews() {
    const labels = { couple: "Gemeinsames Foto", partner_one: "Erste Person", partner_two: "Zweite Person", portfolio: "Portfolio" };
    const photos = wizard.photos;
    const isPhotographer = wizard.role === "photographer";
    const container = document.querySelector("#photo-preview-grid");
    if (!container) return;
    container.innerHTML = "";
    const visiblePhotos = photos.filter((photo) => !isPhotographer || photo.photo_type === "portfolio");
    for (let index = 0; index < visiblePhotos.length; index += 1) {
      const photo = visiblePhotos[index];
      const photoPath = isPhotographer ? photo.object_path : photo.display_path || photo.object_path;
      const { data, error } = await supabase.storage.from(photoBucket).createSignedUrl(photoPath, 600);
      if (error || !data || !data.signedUrl) continue;
      const card = document.createElement("div");
      card.className = "photo-preview";
      const image = document.createElement("img");
      image.src = data.signedUrl;
      image.alt = labels[photo.photo_type] + " " + (index + 1);
      card.append(image);
      container.append(card);
    }
  }

  function profileGreeting(role, profile) {
    if (role === "couple" && profile) {
      return [profile.partner_one_first_name, profile.partner_two_first_name].filter(Boolean).join(" & ");
    }
    return profile && profile.first_name ? profile.first_name : "";
  }

  function profileArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value !== "string" || !value.trim()) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : value.split(",").map((item) => item.trim()).filter(Boolean);
    } catch (_) {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }

  function profileLabels(values, options) {
    return profileArray(values).map((value) => (options.find((option) => option[0] === value) || [value, value])[1]).join(", ");
  }

  function ceremonyTypeLabel(value) {
    return (CEREMONY_OPTIONS.find((option) => option[0] === value) || ["", ""])[1] || "";
  }

  function formatScheduleItems(value) {
    let items = value;
    if (!Array.isArray(items) && typeof items === "string" && items.trim()) {
      try { items = JSON.parse(items); } catch (_) { return items; }
    }
    if (!Array.isArray(items)) return "";
    return items.map((item) => {
      const option = SCHEDULE_EVENTS.find(([event]) => event === item.event);
      const label = item.event === "other" ? item.label : option ? option[1] : item.label || item.event;
      return [label, item.time, item.note].filter(Boolean).join(" · ");
    }).filter(Boolean).join("; ");
  }

  function coupleRegionLabel(value) {
    return (COUPLE_REGION_OPTIONS.find((option) => option[0] === value) || ["", ""])[1] || "";
  }

  function profileDate(value) {
    if (!value) return "";
    const date = new Date(value + "T00:00:00");
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "long", year: "numeric" }).format(date);
  }

  const PREVIEW_ICONS = {
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v10H2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="3"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>',
    users: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/></svg>',
    euro: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 5a7 7 0 0 0-4-1.2A7 7 0 0 0 8 10v4a7 7 0 0 0 7 6.2 7 7 0 0 0 4-1.2M5 10h10M5 14h9"/></svg>'
  };

  function addPreviewChip(container, icon, label, value) {
    if (value === null || value === undefined || String(value).trim() === "") return;
    const item = document.createElement("span");
    item.className = "profile-preview-chip";
    item.innerHTML = PREVIEW_ICONS[icon] || "";
    const text = document.createElement("span");
    text.textContent = String(value);
    item.append(text);
    item.setAttribute("aria-label", label + ": " + String(value));
    container.append(item);
  }

  function addPreviewSection(container, title, value, className) {
    if (value === null || value === undefined || String(value).trim() === "") return;
    const section = document.createElement("section");
    section.className = "profile-preview-section" + (className ? " " + className : "");
    const heading = document.createElement("h4");
    heading.textContent = title;
    const copy = document.createElement("p");
    copy.textContent = String(value);
    section.append(heading, copy);
    container.append(section);
  }

  function profileDetailRows(role, profile) {
    if (role === "couple") {
      const preference = profile.photographer_usage_preference === "open"
        ? "Grundsätzlich offen"
        : profile.photographer_usage_preference === "case_by_case"
          ? "Nur nach Absprache"
          : profile.photographer_usage_preference === "no" ? "Nein" : "";
      const region = coupleRegionLabel(profile.region_code);
      const location = [profile.wedding_town, region].filter(Boolean).join(", ");
      const weddingLocations = [
        ["Location der Trauung", profile.ceremony_location],
        ["Location der Feier", profile.reception_location]
      ].filter(([, value]) => String(value || "").trim());
      return {
        chips: [
          ["calendar", "Hochzeitsdatum", profileDate(profile.wedding_date)],
          ["pin", "Hochzeitsort", location],
          ["camera", "Nutzung durch den Fotografen", preference]
        ],
        sections: [
          ...weddingLocations,
          ["Art der Trauung", ceremonyTypeLabel(profile.ceremony_type)],
          ["Gewünschte Begleitung", profileLabels(profile.coverage_options, COVERAGE_OPTIONS) || profile.coverage_scope],
          ["Ablauf", formatScheduleItems(profile.schedule_items) || profile.schedule],
          ["Nutzung durch den Fotografen", preference]
        ]
      };
    }
    const years = profile.experience_years === null || profile.experience_years === undefined || profile.experience_years === ""
      ? "" : profile.experience_years + (Number(profile.experience_years) === 1 ? " Jahr" : " Jahre");
    const weddings = profile.weddings_photographed === null || profile.weddings_photographed === undefined || profile.weddings_photographed === ""
      ? "" : profile.weddings_photographed + " Hochzeiten";
    const regions = profileLabels(profile.regions, REGION_OPTIONS) || profile.region || "";
    const styles = profileLabels(profile.styles, STYLE_OPTIONS) || profile.visual_style || "";
    const coverage = profileLabels(profile.coverage_options, COVERAGE_OPTIONS) || profile.coverage_scope || "";
    const compensation = profile.compensation_type === "free"
      ? "Unentgeltlich"
      : profile.compensation_type === "fixed" && profile.compensation_amount_eur
        ? "Entgeltlich · " + Number(profile.compensation_amount_eur).toLocaleString("de-AT") + " €"
        : profile.compensation_type === "fixed" ? "Entgeltlich" : "";
    return {
      keyFacts: [
        ["camera", "Erfahrung", years],
        ["euro", "Vergütung", compensation]
      ],
      chips: [
        ["pin", "Einsatzgebiet", regions],
        ["sparkle", "Bildstil", styles],
        ["clock", "Begleitungsumfang", coverage]
      ],
      sections: weddings ? [["Fotografierte Hochzeiten", weddings]] : []
    };
  }

  let profileGalleryResizeObserver = null;
  let profileGalleryImageObserver = null;
  let profileDetailsResizeHandler = null;
  function setupProfileGallery(gallery, photoCount) {
    const track = gallery.querySelector(".profile-preview-track");
    if (!track) return;
    if (profileGalleryResizeObserver) profileGalleryResizeObserver.disconnect();
    if (profileGalleryImageObserver) profileGalleryImageObserver.disconnect();

    const figures = Array.from(track.querySelectorAll(".profile-preview-photo"));
    const indicators = Array.from(gallery.querySelectorAll(".profile-preview-indicator"));
    const previous = gallery.querySelector(".profile-preview-arrow--previous");
    const next = gallery.querySelector(".profile-preview-arrow--next");
    const status = gallery.querySelector(".profile-preview-gallery-status");
    if (!figures.length) return;

    let activeIndex = 0;
    let scrollFrame = 0;
    const setActive = (index) => {
      activeIndex = Math.max(0, Math.min(figures.length - 1, index));
      indicators.forEach((button, i) => {
        button.classList.toggle("is-active", i === activeIndex);
        button.setAttribute("aria-current", i === activeIndex ? "true" : "false");
      });
      if (previous) previous.disabled = activeIndex <= 0;
      if (next) next.disabled = activeIndex >= figures.length - 1;
      if (status) status.textContent = (activeIndex + 1) + " von " + figures.length;
    };
    const goTo = (index, smooth = true) => {
      const targetIndex = Math.max(0, Math.min(figures.length - 1, index));
      const target = figures[targetIndex];
      if (!target) return;
      track.scrollTo({ left: targetIndex * track.clientWidth, behavior: smooth ? "smooth" : "auto" });
      setActive(targetIndex);
    };
    const updateActiveFromScroll = () => {
      scrollFrame = 0;
      const width = track.clientWidth || 1;
      setActive(Math.round(track.scrollLeft / width));
    };

    if (previous) previous.addEventListener("click", () => goTo(activeIndex - 1));
    if (next) next.addEventListener("click", () => goTo(activeIndex + 1));
    indicators.forEach((button) => button.addEventListener("click", () => goTo(Number(button.dataset.index))));
    track.addEventListener("scroll", () => {
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateActiveFromScroll);
    }, { passive: true });
    gallery.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); goTo(activeIndex - 1); }
      if (event.key === "ArrowRight") { event.preventDefault(); goTo(activeIndex + 1); }
    });
    setActive(0);
    if ("ResizeObserver" in window) {
      profileGalleryResizeObserver = new ResizeObserver(() => goTo(activeIndex, false));
      profileGalleryResizeObserver.observe(track);
    }
  }

  function loadProfileGalleryImages(gallery) {
    const track = gallery.querySelector(".profile-preview-track");
    const images = Array.from(gallery.querySelectorAll("img[data-photo-path]"));
    if (!images.length || !track) return;

    if (gallery._wedconnectImageScrollHandler) {
      track.removeEventListener("scroll", gallery._wedconnectImageScrollHandler);
    }
    const queue = [];
    let active = 0;
    const maxConcurrent = 2;

    function finish(image, failed) {
      if (gallery.classList.contains("is-fullscreen")) {
        delete image.dataset.photoState;
      } else {
        image.dataset.photoState = "done";
        const figure = image.closest(".profile-preview-photo");
        if (figure) {
          figure.classList.toggle("is-failed", Boolean(failed));
          if (!failed) figure.classList.add("is-loaded");
        }
      }
      active = Math.max(0, active - 1);
      pump();
    }

    function pump() {
      while (active < maxConcurrent && queue.length) {
        const image = queue.shift();
        if (image.dataset.photoState || !image.isConnected) continue;
        image.dataset.photoState = "loading";
        active += 1;
        let settled = false;
        const settle = (failed) => {
          if (settled) return;
          settled = true;
          finish(image, failed);
        };
        image.addEventListener("load", () => settle(false), { once: true });
        image.addEventListener("error", () => settle(true), { once: true });
        supabase.storage.from(photoBucket).createSignedUrl(image.dataset.photoPath, 3600)
          .then(({ data, error }) => {
            if (error || !data || !data.signedUrl) {
              settle(true);
              return;
            }
            image.dataset.displayUrl = data.signedUrl;
            if (!gallery.classList.contains("is-fullscreen")) image.src = data.signedUrl;
            else settle(false);
          })
          .catch(() => settle(true));
      }
    }

    function enqueueNearby() {
      const width = track.clientWidth || 1;
      const current = Math.max(0, Math.round(track.scrollLeft / width));
      const first = Math.max(0, current - 1);
      const last = Math.min(images.length, current + 3);
      const nearby = images.slice(first, last);
      nearby.forEach((image) => {
        if (!image.dataset.photoState && !queue.includes(image)) queue.push(image);
      });
      pump();
    }

    gallery._wedconnectImageScrollHandler = enqueueNearby;
    track.addEventListener("scroll", enqueueNearby, { passive: true });
    enqueueNearby();
  }

  async function renderOwnProfilePreview(role, profile, photos) {
    const container = document.querySelector("#profile-preview");
    if (!container) return;
    container.innerHTML = "";
    const card = document.createElement("article");
    card.className = "profile-preview-card";

    const visiblePhotos = (photos || []).filter((photo) => role !== "photographer" || photo.photo_type === "portfolio");
    const gallery = document.createElement("div");
    gallery.className = "profile-preview-gallery";
    gallery.tabIndex = 0;
    gallery.setAttribute("aria-label", role === "couple" ? "Fotos des Hochzeitspaars" : "Portfoliofotos");
    const track = document.createElement("div");
    track.className = "profile-preview-track";
    const controls = document.createElement("div"); controls.className = "profile-preview-gallery-controls";
    const previous = document.createElement("button"); previous.type = "button"; previous.className = "profile-preview-arrow profile-preview-arrow--previous"; previous.setAttribute("aria-label", "Vorheriges Foto"); previous.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
    const next = document.createElement("button"); next.type = "button"; next.className = "profile-preview-arrow profile-preview-arrow--next"; next.setAttribute("aria-label", "Nächstes Foto"); next.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
    const indicatorGroup = document.createElement("div"); indicatorGroup.className = "profile-preview-indicators"; indicatorGroup.setAttribute("role","group"); indicatorGroup.setAttribute("aria-label","Foto auswählen");
    let renderedCount = 0;
    visiblePhotos.forEach((photo, index) => {
      const path = photo.display_path || photo.object_path;
      if (!path) return;
      const figure = document.createElement("figure");
      figure.className = "profile-preview-photo" + (renderedCount === 0 ? " is-featured" : "");
      figure.style.setProperty("--image-order", String(renderedCount));
      const image = document.createElement("img");
      image.dataset.photoPath = path;
      image.dataset.originalPhotoPath = photo.object_path || path;
      image.loading = "lazy";
      image.decoding = "async";
      image.alt = role === "couple" ? "Foto des Hochzeitspaars " + (index + 1) : "Portfoliofoto " + (index + 1);
      figure.append(image);
      if (role === "couple") {
        const nameOverlay = createCouplePhotoNameOverlay(photo.photo_type, profile);
        if (nameOverlay) figure.append(nameOverlay);
      }
      track.append(figure);
      renderedCount += 1;
    });
    if (!renderedCount) {
      const empty = document.createElement("p");
      empty.className = "profile-preview-empty";
      empty.textContent = "Noch keine Profilfotos vorhanden.";
      track.append(empty);
    }
    for (let index = 0; index < renderedCount; index += 1) {
      const indicator = document.createElement("button");
      indicator.type = "button"; indicator.className = "profile-preview-indicator"; indicator.dataset.index = String(index);
      indicator.setAttribute("aria-label", "Foto " + (index + 1) + " anzeigen"); indicatorGroup.append(indicator);
    }
    const status = document.createElement("span"); status.className = "profile-preview-gallery-status"; status.setAttribute("aria-live", "polite");

    const identity = document.createElement("header");
    identity.className = "profile-preview-identity";
    const name = document.createElement("h3");
    name.textContent = role === "couple"
      ? [profile.partner_one_first_name, profile.partner_two_first_name].filter(Boolean).join(" & ")
      : profile.first_name || "Dein Profil";
    identity.append(name);

    const overlay = document.createElement("div");
    overlay.className = "profile-preview-overlay";
    const actions = document.createElement("div");
    actions.className = "profile-preview-actions";
    const passButton = document.createElement("button");
    passButton.type = "button";
    passButton.className = "profile-preview-action profile-preview-action--pass";
    passButton.disabled = true;
    passButton.setAttribute("aria-label", "Profil überspringen");
    passButton.title = "Wird in Entdecken verfügbar sein";
    passButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>';
    const likeButton = document.createElement("button");
    likeButton.type = "button";
    likeButton.className = "profile-preview-action profile-preview-action--like";
    likeButton.disabled = true;
    likeButton.setAttribute("aria-label", "Profil liken");
    likeButton.title = "Wird in Entdecken verfügbar sein";
    likeButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>';
    actions.append(passButton, likeButton);
    overlay.append(actions);
    controls.append(previous, next);
    gallery.append(track, controls, indicatorGroup, status, overlay);
    if (renderedCount) {
      const fullscreenButton = document.createElement("button");
      fullscreenButton.type = "button";
      fullscreenButton.className = "profile-preview-fullscreen";
      fullscreenButton.setAttribute("aria-label", "Galerie im Vollbild anzeigen");
      fullscreenButton.title = "Galerie im Vollbild anzeigen";
      fullscreenButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>';
      fullscreenButton.addEventListener("click", () => {
        if (gallery.classList.contains("is-fullscreen")) closeGalleryFullscreen();
        else openGalleryFullscreen(gallery);
      });
      gallery.append(fullscreenButton);
    }

    const detailsData = profileDetailRows(role, profile);
    const metadata = document.createElement("div");
    metadata.className = role === "couple" ? "profile-preview-key-facts" : "profile-preview-metadata";
    detailsData.chips.forEach(([icon, label, value]) => addPreviewChip(metadata, icon, label, value));

    const content = document.createElement("div");
    content.className = "profile-preview-content";
    content.append(identity);
    if (role === "couple" && metadata.children.length) content.append(metadata);
    if (role === "photographer") {
      const keyFacts = document.createElement("div");
      keyFacts.className = "profile-preview-key-facts";
      (detailsData.keyFacts || []).filter(([, , value]) => value).forEach(([icon, label, value]) => addPreviewChip(keyFacts, icon, label, value));
      const links = document.createElement("div");
      links.className = "profile-preview-identity-links";
      [["Instagram", profile.instagram_url, normalizeInstagram], ["Website", profile.website_url, normalizeWebsite]].forEach(([label, value, normalize]) => {
        if (!value) return;
        try {
          const url = normalize(value);
          if (!url) return;
          const link = document.createElement("a");
          link.className = "profile-preview-chip profile-preview-social-chip";
          link.href = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.setAttribute("aria-label", label === "Instagram" ? "Instagram-Profil öffnen" : "Website öffnen");
          link.title = label;
          link.innerHTML = label === "Instagram"
            ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r=".9" class="icon-dot"/></svg>'
            : '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18M4.5 7.5h15M4.5 16.5h15"/></svg>';
          links.append(link);
        } catch (_) {}
      });
      if (links.children.length) keyFacts.append(links);
      if (keyFacts.children.length) content.append(keyFacts);
    }

    const about = document.createElement("section");
    about.className = "profile-preview-about";
    const aboutHeader = document.createElement("div");
    aboutHeader.className = "profile-preview-about-header";
    const aboutTitle = document.createElement("h4");
    aboutTitle.textContent = role === "couple" ? "Über euch" : "Über mich";
    aboutHeader.append(aboutTitle);
    about.append(aboutHeader);

    const introText = String(profile.public_intro || "").trim();
    if (introText) {
      const intro = document.createElement("p");
      intro.className = "profile-preview-intro-copy";
      intro.textContent = introText;
      about.append(intro);
    }

    const additional = document.createElement("div");
    additional.className = "profile-preview-additional";
    if (role === "photographer" && metadata.children.length) additional.append(metadata);
    detailsData.sections.forEach(([title, value]) => addPreviewSection(additional, title, value));
    if (profileDetailsResizeHandler) {
      window.removeEventListener("resize", profileDetailsResizeHandler);
      profileDetailsResizeHandler = null;
    }
    content.append(about, additional);
    card.append(gallery, content);
    container.append(card);
    setupProfileGallery(gallery, renderedCount);
    loadProfileGalleryImages(gallery);
  }

  async function loadPublicProfileSummary(userId) {
    const { data: header, error: headerError } = await supabase.from("profiles").select("id,role").eq("id", userId).maybeSingle();
    if (headerError || !header) return null;
    const table = header.role === "couple" ? "couple_profiles" : "photographer_profiles";
    const { data: profile, error: profileError } = await supabase.from(table).select("*").eq("id", userId).maybeSingle();
    if (profileError || !profile) return null;
    const summary = { id: userId, role: header.role, name: "", detail: "", photoUrl: "" };
    if (header.role === "couple") {
      summary.name = [profile.partner_one_first_name, profile.partner_two_first_name].filter(Boolean).join(" & ") || "Hochzeitspaar";
      summary.detail = [profileDate(profile.wedding_date), profile.wedding_town, coupleRegionLabel(profile.region_code)].filter(Boolean).join(" · ");
    } else {
      summary.name = profile.first_name || "Fotograf";
      summary.detail = [profile.region, profile.experience_years != null ? profile.experience_years + (Number(profile.experience_years) === 1 ? " Jahr Erfahrung" : " Jahre Erfahrung") : ""].filter(Boolean).join(" · ");
    }
    const { data: photos } = await supabase.from("profile_photos")
      .select("photo_type,object_path,display_path,sort_order").eq("user_id", userId).order("sort_order").limit(30);
    const candidates = (photos || []).filter((photo) => header.role === "photographer"
      ? photo.photo_type === "portfolio"
      : ["couple", "partner_one", "partner_two"].includes(photo.photo_type));
    const photo = header.role === "couple"
      ? candidates.find((item) => item.photo_type === "couple") || candidates.find((item) => item.photo_type === "partner_one") || candidates[0]
      : candidates[0];
    if (photo) {
      const { data } = await supabase.storage.from(photoBucket).createSignedUrl(photo.display_path || photo.object_path, 600);
      if (data && data.signedUrl) summary.photoUrl = data.signedUrl;
    }
    return summary;
  }

  async function loadDashboardContent() {
    const today = new Date().toISOString();
    const [newsResult, offersResult] = await Promise.all([
      supabase.from("app_announcements").select("id,title,body,destination_url,target_role,published_at,expires_at")
        .eq("is_published", true).lte("published_at", today).or("target_role.is.null,target_role.eq." + currentRole).order("published_at", { ascending: false }),
      supabase.from("partner_offers").select("id,partner_name,title,description,terms,destination_url,target_role,starts_at,expires_at")
        .eq("is_published", true).lte("starts_at", today).or("target_role.is.null,target_role.eq." + currentRole).order("starts_at", { ascending: false })
    ]);
    const active = (rows, startKey) => (rows || []).filter((item) =>
      !item.expires_at || new Date(item.expires_at).getTime() > Date.now()
    );
    return {
      news: newsResult.error ? [] : active(newsResult.data, "published_at"),
      offers: offersResult.error ? [] : active(offersResult.data, "starts_at")
    };
  }

  function createContentCard(item, kind) {
    const card = document.createElement("article");
    card.className = "activity-card content-card";
    const copy = document.createElement("div");
    copy.className = "activity-card-copy";
    const label = document.createElement("span");
    label.className = "content-card-label";
    label.textContent = kind === "offer" ? "Partnerangebot" : "WedConnect-Neuigkeit";
    const title = document.createElement("strong");
    title.textContent = item.title || (kind === "offer" ? "Angebot" : "Neuigkeit");
    const detail = document.createElement("p");
    detail.textContent = kind === "offer"
      ? [item.partner_name, item.description, item.terms ? "Bedingungen: " + item.terms : ""].filter(Boolean).join(" · ")
      : item.body || "";
    copy.append(label, title, detail);
    card.append(copy);
    const rawUrl = item.destination_url || "";
    if (rawUrl) {
      try {
        const url = new URL(rawUrl, window.location.href);
        if (["http:", "https:"].includes(url.protocol)) {
          const link = document.createElement("a");
          link.className = "button button-secondary";
          link.href = url.toString();
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = kind === "offer" ? "Zum Angebot" : "Mehr erfahren";
          card.append(link);
        }
      } catch (_) {}
    }
    return card;
  }

  function createActivityCard(summary, kind) {
    const card = document.createElement("article");
    card.className = "activity-card";
    const avatar = document.createElement("div");
    avatar.className = "activity-avatar";
    if (summary.photoUrl) {
      const image = document.createElement("img");
      image.src = summary.photoUrl;
      image.alt = "";
      avatar.append(image);
    } else {
      avatar.textContent = summary.name.trim().slice(0, 1).toUpperCase() || "W";
      avatar.setAttribute("aria-hidden", "true");
    }
    const copy = document.createElement("div");
    copy.className = "activity-card-copy";
    const name = document.createElement("strong");
    name.textContent = summary.name;
    const detail = document.createElement("p");
    detail.textContent = summary.detail || (summary.role === "couple" ? "Hochzeitspaar" : "Fotograf");
    copy.append(name, detail);
    const actions = document.createElement("div");
    actions.className = "activity-card-actions";
    if (kind === "like") {
      const likeBack = document.createElement("button");
      likeBack.type = "button";
      likeBack.className = "button button-primary";
      likeBack.dataset.likeBack = summary.id;
      likeBack.textContent = "Zurückliken";
      const pass = document.createElement("button");
      pass.type = "button";
      pass.className = "button button-secondary";
      pass.dataset.dismissLike = summary.id;
      pass.textContent = "Nein danke";
      actions.append(likeBack, pass);
    } else {
      const message = document.createElement("button");
      message.type = "button";
      message.className = "button button-primary";
      message.dataset.openConversation = summary.id;
      message.textContent = activityCache.messagedPeers && activityCache.messagedPeers.has(summary.id) ? "Gespräch öffnen" : "Nachricht schreiben";
      actions.append(message);
    }
    card.append(avatar, copy, actions);
    return card;
  }

  async function loadActivityData() {
    const userId = currentUser && currentUser.id;
    if (!userId) return;
    const [inboundResult, outboundResult] = await Promise.all([
      supabase.from("profile_likes").select("liker_id,created_at").eq("liked_id", userId).order("created_at", { ascending: false }),
      supabase.from("profile_likes").select("liked_id,created_at").eq("liker_id", userId).order("created_at", { ascending: false })
    ]);
    if (inboundResult.error || outboundResult.error) throw new Error("Likes konnten nicht geladen werden. Prüfe die Profil-Likes-Migration in Supabase.");
    const inbound = inboundResult.data || [];
    const outgoingIds = new Set((outboundResult.data || []).map((item) => item.liked_id));
    const matches = inbound.filter((item) => outgoingIds.has(item.liker_id)).map((item) => item.liker_id);
    const incoming = inbound.filter((item) => !outgoingIds.has(item.liker_id)).map((item) => item.liker_id);
    let messages = [];
    if (matches.length) {
      const result = await supabase.from("profile_messages")
        .select("sender_id,recipient_id,body,created_at")
        .or("sender_id.eq." + userId + ",recipient_id.eq." + userId)
        .order("created_at", { ascending: true });
      if (result.error) throw new Error("Nachrichten konnten nicht geladen werden. Führe die WedConnect-Nachrichtenmigration aus.");
      messages = result.data || [];
    } else {
      const result = await supabase.from("profile_messages")
        .select("sender_id,recipient_id,body,created_at")
        .or("sender_id.eq." + userId + ",recipient_id.eq." + userId)
        .order("created_at", { ascending: true });
      if (!result.error) messages = result.data || [];
    }
    const messagedPeers = new Set(messages.map((item) => item.sender_id === userId ? item.recipient_id : item.sender_id));
    const newMatches = matches.filter((peerId) => !messagedPeers.has(peerId));
    const ids = Array.from(new Set([...incoming, ...matches]));
    const summaries = await Promise.all(ids.map((id) => loadPublicProfileSummary(id)));
    const content = await loadDashboardContent();
    activityCache = {
      incoming: incoming.map((id) => summaries.find((summary) => summary && summary.id === id)).filter(Boolean),
      matches: matches.map((id) => summaries.find((summary) => summary && summary.id === id)).filter(Boolean),
      newMatches: newMatches.map((id) => summaries.find((summary) => summary && summary.id === id)).filter(Boolean),
      messages,
      messagedPeers,
      news: content.news,
      offers: content.offers,
      summaries: new Map(summaries.filter(Boolean).map((summary) => [summary.id, summary]))
    };
  }

  function renderOverviewActivity() {
    const incomingSection = document.querySelector("#incoming-likes-section");
    const matchesSection = document.querySelector("#new-matches-section");
    const incomingList = document.querySelector("#incoming-likes-list");
    const matchesList = document.querySelector("#new-matches-list");
    incomingList.replaceChildren();
    matchesList.replaceChildren();
    activityCache.incoming.forEach((summary) => incomingList.append(createActivityCard(summary, "like")));
    activityCache.newMatches.forEach((summary) => matchesList.append(createActivityCard(summary, "match")));
    incomingSection.hidden = !activityCache.incoming.length;
    matchesSection.hidden = !activityCache.newMatches.length;
    document.querySelector("#incoming-likes-count").textContent = String(activityCache.incoming.length);
    document.querySelector("#new-matches-count").textContent = String(activityCache.newMatches.length);
    document.querySelector("#overview-empty-state").hidden = Boolean(activityCache.incoming.length || activityCache.newMatches.length || activityCache.news.length || activityCache.offers.length);
    const newsSection = document.querySelector("#overview-news-section");
    const newsList = document.querySelector("#overview-news-list");
    newsList.replaceChildren();
    (activityCache.news || []).forEach((item) => newsList.append(createContentCard(item, "news")));
    newsSection.hidden = !activityCache.news.length;
    const offersSection = document.querySelector("#overview-offers-section");
    const offersList = document.querySelector("#overview-offers-list");
    offersList.replaceChildren();
    (activityCache.offers || []).forEach((item) => offersList.append(createContentCard(item, "offer")));
    offersSection.hidden = !activityCache.offers.length;
  }

  function renderMatchList() {
    const container = document.querySelector("#matches-list");
    container.replaceChildren();
    activityCache.matches.forEach((summary) => container.append(createActivityCard(summary, activityCache.messagedPeers.has(summary.id) ? "match" : "match")));
    document.querySelector("#matches-empty-state").hidden = activityCache.matches.length > 0;
  }

  function renderMessagesList() {
    const container = document.querySelector("#messages-list");
    container.replaceChildren();
    const peers = Array.from(activityCache.messagedPeers || []);
    peers.forEach((peerId) => {
      const summary = activityCache.summaries.get(peerId) || { id: peerId, name: "WedConnect-Mitglied", detail: "", photoUrl: "" };
      const card = document.createElement("article");
      card.className = "activity-card";
      const copy = document.createElement("div");
      copy.className = "activity-card-copy";
      const name = document.createElement("strong");
      name.textContent = summary.name;
      const peerMessages = activityCache.messages.filter((item) => item.sender_id === peerId || item.recipient_id === peerId);
      const latest = peerMessages[peerMessages.length - 1];
      const detail = document.createElement("p");
      detail.textContent = latest ? latest.body : "Gespräch öffnen";
      copy.append(name, detail);
      const open = document.createElement("button");
      open.type = "button";
      open.className = "button button-secondary";
      open.dataset.openConversation = peerId;
      open.textContent = "Gespräch öffnen";
      card.append(copy, open);
      container.append(card);
    });
    document.querySelector("#messages-empty-state").hidden = peers.length > 0;
  }

  async function refreshActivityViews() {
    try {
      await loadActivityData();
      renderOverviewActivity();
      renderMatchList();
      renderMessagesList();
    } catch (error) {
      showNotice(error && error.message ? error.message : "Aktivitäten konnten nicht geladen werden.");
      document.querySelector("#overview-empty-state").hidden = false;
    }
  }

  function setDashboardView(view) {
    document.querySelectorAll("[data-dashboard-view]").forEach((section) => {
      section.hidden = section.dataset.dashboardView !== view;
    });
    setActiveNavigation(view);
    const titles = {
      home: "Willkommen" + (currentGreeting ? ", " + currentGreeting : "") + "!",
      profile: currentRole === "couple" ? "Euer Profil" : "Dein Profil",
      matches: "Matches",
      messages: "Nachrichten"
    };
    document.querySelector("#page-title").textContent = titles[view] || "Willkommen!";
  }

  async function openConversation(peerId) {
    activeConversationPeer = peerId;
    const summary = activityCache.summaries.get(peerId) || await loadPublicProfileSummary(peerId);
    document.querySelector("#conversation-title").textContent = summary ? summary.name : "Nachricht";
    await renderConversationThread();
    document.querySelector("#conversation-status").textContent = "";
    openWorkspaceDialog(document.querySelector("#conversation-dialog"));
  }

  async function renderConversationThread() {
    const container = document.querySelector("#conversation-thread");
    if (!container) return;
    container.replaceChildren();
    const userId = currentUser.id;
    const messages = activityCache.messages.filter((item) =>
      (item.sender_id === userId && item.recipient_id === activeConversationPeer)
      || (item.sender_id === activeConversationPeer && item.recipient_id === userId));
    if (!messages.length) {
      const empty = document.createElement("p");
      empty.className = "conversation-empty";
      empty.textContent = "Ihr habt noch keine Nachricht ausgetauscht. Schreib den ersten Satz.";
      container.append(empty);
      return;
    }
    messages.forEach((item) => {
      const bubble = document.createElement("div");
      bubble.className = "conversation-message" + (item.sender_id === userId ? " is-own" : "");
      const body = document.createElement("span");
      body.textContent = item.body;
      const time = document.createElement("time");
      time.dateTime = item.created_at;
      time.textContent = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(item.created_at));
      bubble.append(body, time);
      container.append(bubble);
    });
    container.scrollTop = container.scrollHeight;
  }

  async function persistEmailPreferences() {
    const form = document.querySelector("#email-preferences-form");
    const status = document.querySelector("#email-preferences-status");
    if (!form || !currentUser) return;
    const preferences = Object.fromEntries(Array.from(form.querySelectorAll('input[type="checkbox"]')).map((input) => [input.name, input.checked]));
    status.textContent = "Wird gespeichert …";
    const { error } = await supabase.from("user_email_preferences").upsert({
      user_id: currentUser.id,
      incoming_likes: preferences.incoming_likes,
      new_matches: preferences.new_matches,
      new_messages: preferences.new_messages,
      app_news: preferences.app_news,
      partner_offers: preferences.partner_offers,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });
    status.textContent = error ? "Speichern nicht möglich. Prüfe die Benachrichtigungs-Migration." : "Gespeichert.";
    status.dataset.state = error ? "error" : "success";
  }

  async function loadEmailPreferences() {
    const form = document.querySelector("#email-preferences-form");
    const status = document.querySelector("#email-preferences-status");
    if (!form || !currentUser) return;
    const { data, error } = await supabase.from("user_email_preferences")
      .select("incoming_likes,new_matches,new_messages,app_news,partner_offers").eq("user_id", currentUser.id).maybeSingle();
    if (!error && data) {
      Object.entries(data).forEach(([name, checked]) => {
        const input = form.querySelector('[name="' + name + '"]');
        if (input) input.checked = Boolean(checked);
      });
      status.textContent = "Gespeichert.";
    } else if (error) {
      status.textContent = "Einstellungen konnten nicht geladen werden. Prüfe die Benachrichtigungs-Migration.";
      status.dataset.state = "error";
    } else {
      status.textContent = "Noch nicht gespeichert. Deine Auswahl wird beim Ändern gespeichert.";
    }
  }

  async function setupRole(role, user, complete, greeting, profile, photos) {
    wizard.isEditing = false;
    wizard.autoSaveEnabled = false;
    onboarding.classList.remove("profile-edit-overlay");
    dashboard.classList.remove("is-editing-profile");
    currentRole = role === "couple" || role === "photographer" ? role : "";
    const couple = currentRole === "couple";
    const photographer = currentRole === "photographer";
    currentGreeting = greeting || "";
    const roleName = couple ? "Hochzeitspaar" : photographer ? "Fotograf" : "Profil einrichten";
    document.querySelector("#side-role").textContent = roleName;
    await renderAccountAvatar();
    document.querySelector("#account-email").textContent = user.email || "E-Mail nicht verfügbar";
    document.querySelector("#account-role-label").textContent = roleName;
    document.querySelector("#role-eyebrow").textContent = couple ? "Hochzeitspaar" : photographer ? "Fotograf" : "Dein WedConnect-Konto";
    document.querySelector("#page-title").textContent = greeting ? "Willkommen, " + greeting + "!" : "Willkommen!";
    document.querySelector("#profile-status").textContent = complete ? "Profil vollständig" : "Profil noch offen";
    document.querySelector("#desktop-nav").innerHTML =
      navItem("Übersicht", "home", true, false) +
      navItem("Profil", "profile", false, !currentRole) +
      navItem(couple ? "Fotografen entdecken" : "Hochzeiten entdecken", "discover", false, true) +
      navItem("Matches", "matches", false, false) +
      navItem("Nachrichten", "messages", false, false);
    document.querySelector("#mobile-nav").innerHTML =
      navItem("Übersicht", "home", true, false) +
      navItem("Profil", "profile", false, !currentRole) +
      navItem("Entdecken", "discover", false, true) +
      navItem("Matches", "matches", false, false) +
      navItem("Nachrichten", "messages", false, false);
    await renderOwnProfilePreview(currentRole, profile || {}, photos || []);
    loading.classList.add("hidden");
    onboarding.classList.add("hidden");
    dashboard.classList.remove("hidden");
    setDashboardView("home");
    await Promise.all([refreshActivityViews(), loadEmailPreferences()]);
  }

  const icons = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/></svg>',
    profile: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 21a7.5 7.5 0 0115 0"/></svg>',
    discover: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="7.3"/><path d="m16.2 16.2 4.5 4.5M10.8 7.5v6.6m-3.3-3.3h6.6"/></svg>',
    matches: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10M7 17h10M5 12h14"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/><circle cx="17" cy="12" r="2.5"/></svg>',
    messages: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 01-7.5 7.5H6l-3 2v-6a7.5 7.5 0 117 4"/></svg>'
  };

  function navItem(label, icon, active, disabled) {
    const state = active ? 'aria-current="page"' : disabled ? 'disabled aria-disabled="true"' : "";
    return '<button class="nav-link' + (active ? " active" : "") + '" type="button" data-nav-item="' + icon + '" ' + state + ">" +
      icons[icon] + "<span>" + label + "</span>" +
      (disabled ? '<span class="nav-soon">Nach Profil</span>' : "") + "</button>";
  }

  function setActiveNavigation(icon) {
    [document.querySelector("#desktop-nav"), document.querySelector("#mobile-nav")].forEach((nav) => {
      if (!nav) return;
      nav.querySelectorAll("[data-nav-item]").forEach((item) => {
        const active = item.dataset.navItem === icon;
        item.classList.toggle("active", active);
        if (active) item.setAttribute("aria-current", "page");
        else item.removeAttribute("aria-current");
      });
    });
  }

  fields.addEventListener("input", (event) => {
    if (event.target.name === "instagram_url" || event.target.name === "website_url") {
      updateLinkCheck(event.target.name);
    }
    scheduleDraftAutoSave();
  });

  fields.addEventListener("change", (event) => {
    const target = event.target;
    scheduleDraftAutoSave();
    if (target.matches('input[type="checkbox"][data-schedule-event]')) {
      const row = target.closest(".schedule-event-card");
      const details = row && row.querySelector("[data-schedule-fields]");
      if (details) details.hidden = !target.checked;
    }
    if (target.matches('select[name="compensation_type"]')) {
      const amountWrap = fields.querySelector("#compensation-amount-wrap");
      const amountInput = fields.querySelector('input[name="compensation_amount_eur"]');
      if (amountWrap && amountInput) {
        const showAmount = target.value === "fixed";
        amountWrap.hidden = !showAmount;
        amountInput.required = showAmount;
        if (!showAmount) amountInput.value = "";
      }
    }
    if (!target.matches('input[type="checkbox"][data-select-group="regions"]')) return;
    const countrywide = fields.querySelector('input[name="regions"][value="AT"]');
    if (!countrywide) return;
    if (target.value === "AT" && target.checked) {
      fields.querySelectorAll('input[name="regions"]:not([value="AT"])').forEach((input) => { input.checked = false; });
    } else if (target.value !== "AT" && target.checked) {
      countrywide.checked = false;
    }
  });


  backButton.addEventListener("click", async () => {
    await flushDraftAutoSave();
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
    nextButton.disabled = true;
    nextButton.innerHTML = wizard.step === 3 ? "Fotos werden hochgeladen …" : wizard.step === 4 ? "Profil wird abgeschlossen …" : "Wird gespeichert …";
    backButton.disabled = true;
    try {
      if (wizard.step === 0) {
        const selected = form.querySelector('input[name="selected-role"]:checked');
        if (!selected) throw new Error("Wähle Hochzeitspaar oder Fotograf aus.");
        const { data, error } = await supabase.rpc("assign_initial_role", { p_role: selected.value });
        if (error) {
          if ((error.message || "").includes("account_role_already_set")) {
            throw new Error("Die Rollenänderung ist in Supabase noch nicht aktiviert. Führe die neue Migration aus und lade die Seite danach neu.");
          }
          const code = error.code ? " (" + error.code + ")" : "";
          throw new Error("Rolle konnte nicht gespeichert werden" + code + ": " + (error.message || "Bitte versuche es erneut."));
        }
        const previousRole = wizard.role;
        const nextRole = data || selected.value;
        const changedRole = Boolean(previousRole && previousRole !== nextRole);
        await loadWizard(nextRole, 1);
        if (changedRole) showNotice("Rolle geändert. Ergänze jetzt dein Profil für " + (nextRole === "couple" ? "Hochzeitspaare." : "Fotografen."));
      } else if (wizard.step === 1 || wizard.step === 2) {
        if (!form.reportValidity()) return;
        const values = collectFields();
        if (wizard.role === "couple" && wizard.step === 2) {
          if (!values.coverage_options || !values.coverage_options.length) throw new Error("Wähle mindestens einen Begleitungsumfang aus.");
          if (!CEREMONY_OPTIONS.some((option) => option[0] === values.ceremony_type)) throw new Error("Wähle die Art der Trauung aus.");
        }
        if (wizard.role === "photographer" && wizard.step === 1) {
          if (!values.regions || !values.regions.length) throw new Error("Wähle mindestens ein Einsatzgebiet aus.");
          if (!values.styles || !values.styles.length) throw new Error("Wähle mindestens einen Bildstil aus.");
          if (!values.experience_years && !values.weddings_photographed) throw new Error("Gib Erfahrung in Jahren oder die Anzahl fotografierter Hochzeiten an.");
        }
        if (wizard.role === "photographer" && wizard.step === 2 && (!values.coverage_options || !values.coverage_options.length)) {
          throw new Error("Wähle mindestens einen Begleitungsumfang aus.");
        }
        await flushDraftAutoSave();
        await saveRoleProfile(values);
        wizard.step += 1;
      } else if (wizard.step === 3) {
        await uploadSelectedPhotos();
        wizard.step = 4;
      } else if (wizard.step === 4) {
        if (!["couple", "photographer"].includes(wizard.role)) {
          throw new Error("Bitte gehe zurück und wähle zuerst deine Rolle aus.");
        }
        const { error } = await supabase.rpc("complete_profile_for_role", { p_role: wizard.role });
        if (error) {
          const message = error.message || "";
          if (message.includes("photos_for_both_partners_required")) {
            const couple = wizard.data.couple || {};
            const hasJointPhoto = currentPhotoCount("couple") > 0;
            if (!hasJointPhoto && !currentPhotoCount("partner_one")) {
              throw new Error("Lade ein gemeinsames Foto oder ein eigenes Foto für " + (couple.partner_one_first_name || "die erste Person") + " hoch.");
            }
            if (!hasJointPhoto && !currentPhotoCount("partner_two")) {
              throw new Error("Lade ein gemeinsames Foto oder ein eigenes Foto für " + (couple.partner_two_first_name || "die zweite Person") + " hoch.");
            }
            throw new Error("Lade ein gemeinsames Foto oder je ein Foto für beide Personen hoch.");
          }
          if (message.includes("couple_profile_incomplete")) throw new Error("Bitte prüfe die Pflichtfelder, Trauungsart, Begleitung und Fotos.");
          if (message.includes("portfolio_requires_3_photos")) throw new Error("Lade mindestens 3 Stilfotos hoch.");
          if (message.includes("portfolio_requires_10_photos")) throw new Error("Lade mindestens 3 Stilfotos hoch.");
          const code = error.code ? " (" + error.code + ")" : "";
          throw new Error("Profilabschluss fehlgeschlagen" + code + ": " + (message || "Bitte prüfe alle Angaben und Fotos."));
        }
        const table = wizard.role === "couple" ? "couple_profiles" : "photographer_profiles";
        const [{ data: profile, error: profileError }, { data: photos, error: photoError }] = await Promise.all([
          supabase.from(table).select("*").eq("id", currentUser.id).maybeSingle(),
          supabase.from("profile_photos").select("photo_type,object_path,display_path,sort_order").eq("user_id", currentUser.id).order("sort_order")
        ]);
        if (profileError) throw new Error("Dein Profil wurde gespeichert, konnte aber nicht angezeigt werden.");
        await setupRole(wizard.role, currentUser, true, profileGreeting(wizard.role, profile || wizard.data[wizard.role]), profile, photoError ? [] : photos || []);
        if (photoError) showNotice("Dein Profil ist vollständig. Einige Fotos konnten nicht geladen werden.");
        else showNotice("Profil vollständig.");
        return;
      }
      renderWizard();
    } catch (error) {
      errorLine.textContent = error && error.message ? error.message : "Das hat gerade nicht funktioniert. Bitte versuche es erneut.";
    } finally {
      nextButton.disabled = false;
      nextButton.innerHTML = wizard.step === 4
        ? 'Profil abschließen <span aria-hidden="true">✓</span>'
        : 'Weiter <span aria-hidden="true">→</span>';
      backButton.disabled = false;
    }
  });

  const accountDialog = document.querySelector("#account-dialog");
  const settingsDialog = document.querySelector("#settings-dialog");
  const accountTrigger = document.querySelector("#account-open");
  const settingsTrigger = document.querySelector("#settings-open");
  const mobileAccountTrigger = document.querySelector("#avatar");
  const accountPhotoDialog = document.querySelector("#account-photo-dialog");
  const accountPhotoInput = document.querySelector("#account-photo-input");
  const accountPhotoRemove = document.querySelector("#account-photo-remove");
  const accountPhotoStatus = document.querySelector("#account-photo-status");
  const accountAvatarOpen = document.querySelector("#account-avatar-open");
  function openWorkspaceDialog(dialog) {
    if (dialog && !dialog.open) dialog.showModal();
  }
  if (accountTrigger) accountTrigger.addEventListener("click", () => openWorkspaceDialog(accountDialog));
  if (mobileAccountTrigger) mobileAccountTrigger.addEventListener("click", () => openWorkspaceDialog(accountDialog));
  const accountPhotoPreview = document.querySelector("#account-photo-preview");
  if (accountPhotoPreview) accountPhotoPreview.addEventListener("click", async () => {
    if (!accountAvatarPath) {
      if (accountPhotoInput) accountPhotoInput.click();
      return;
    }
    if (accountPhotoStatus) accountPhotoStatus.textContent = "";
    accountPhotoPreview.disabled = true;
    try {
      const bucket = supabase.storage.from(photoBucket);
      let data = null;
      let error = null;
      for (const sourcePath of avatarSourcePathsFor(accountAvatarPath)) {
        const result = await bucket.download(sourcePath);
        if (!result.error && result.data) { data = result.data; break; }
      }
      if (!data) ({ data, error } = await bucket.download(accountAvatarPath));
      if (error || !data) throw new Error(accountPhotoErrorMessage("read", error));
      openCropEditor(data, async (croppedPhoto) => uploadAccountPhoto(croppedPhoto, data), { avatar: true });
    } catch (error) {
      if (accountPhotoStatus) accountPhotoStatus.textContent = error && error.message ? error.message : "Das Profilfoto konnte nicht geöffnet werden.";
    } finally { accountPhotoPreview.disabled = false; }
  });
  if (accountAvatarOpen) accountAvatarOpen.addEventListener("click", () => {
    if (accountDialog && accountDialog.open) accountDialog.close();
    if (accountPhotoStatus) accountPhotoStatus.textContent = "";
    refreshAccountPhotoPreview();
    openWorkspaceDialog(accountPhotoDialog);
  });
  if (accountPhotoInput) accountPhotoInput.addEventListener("change", () => {
    const file = accountPhotoInput.files && accountPhotoInput.files[0];
    if (!file) return;
    if (accountPhotoStatus) accountPhotoStatus.textContent = "";
    try {
      validateAccountPhoto(file);
      openCropEditor(file, async (croppedPhoto) => uploadAccountPhoto(croppedPhoto, file), { avatar: true });
    } catch (error) {
      if (accountPhotoStatus) accountPhotoStatus.textContent = error && error.message ? error.message : "Das Profilfoto konnte nicht vorbereitet werden. Bitte versuche es erneut.";
    } finally { accountPhotoInput.value = ""; }
  });
  if (accountPhotoRemove) accountPhotoRemove.addEventListener("click", async () => {
    if (!(await confirmPhotoDelete("Möchtest du dein Profilfoto wirklich löschen?"))) return;
    accountPhotoRemove.disabled = true;
    if (accountPhotoStatus) accountPhotoStatus.textContent = "";
    try { await removeAccountPhoto(); }
    catch (error) { if (accountPhotoStatus) accountPhotoStatus.textContent = error && error.message ? error.message : "Das Profilfoto konnte nicht entfernt werden."; }
    finally { accountPhotoRemove.disabled = false; }
  });
  if (settingsTrigger) settingsTrigger.addEventListener("click", () => {
    openWorkspaceDialog(settingsDialog);
    loadEmailPreferences();
  });
  document.querySelector("#account-settings-open").addEventListener("click", () => {
    if (accountDialog.open) accountDialog.close();
    openWorkspaceDialog(settingsDialog);
    loadEmailPreferences();
  });
  document.querySelector("#email-preferences-form").addEventListener("change", persistEmailPreferences);
  document.querySelector("#account-profile-edit").addEventListener("click", () => {
    if (accountDialog.open) accountDialog.close();
    beginWizard(currentRole, currentRole ? 1 : 0);
  });
  document.querySelector("#account-role-change").addEventListener("click", () => {
    if (accountDialog.open) accountDialog.close();
    beginWizard(currentRole, 0);
  });
  document.addEventListener("click", async (event) => {
    const likeBack = event.target.closest("[data-like-back]");
    if (likeBack) {
      likeBack.disabled = true;
      const { error } = await supabase.from("profile_likes").insert({ liker_id: currentUser.id, liked_id: likeBack.dataset.likeBack });
      if (error && !/duplicate|unique/i.test(error.message || "")) showNotice("Dein Like konnte nicht gespeichert werden.");
      await refreshActivityViews();
      return;
    }
    const dismiss = event.target.closest("[data-dismiss-like]");
    if (dismiss) {
      dismiss.disabled = true;
      const { error } = await supabase.from("profile_likes").delete()
        .eq("liker_id", dismiss.dataset.dismissLike).eq("liked_id", currentUser.id);
      if (error) showNotice("Das Like konnte nicht ausgeblendet werden. Prüfe die Profil-Likes-Migration.");
      await refreshActivityViews();
      return;
    }
    const openMessage = event.target.closest("[data-open-conversation]");
    if (openMessage) await openConversation(openMessage.dataset.openConversation);
  });

  document.querySelector("#conversation-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.querySelector("#conversation-input");
    const status = document.querySelector("#conversation-status");
    const body = String(input.value || "").trim();
    if (!body || !activeConversationPeer) return;
    status.textContent = "Wird gesendet …";
    const send = document.querySelector("#conversation-form button[type=submit]");
    send.disabled = true;
    const { error } = await supabase.from("profile_messages").insert({
      sender_id: currentUser.id,
      recipient_id: activeConversationPeer,
      body
    });
    send.disabled = false;
    if (error) {
      status.textContent = "Nachricht konnte nicht gesendet werden. Prüfe, ob das Match noch besteht.";
      return;
    }
    input.value = "";
    status.textContent = "Nachricht gesendet.";
    await refreshActivityViews();
    await renderConversationThread();
  });

  document.querySelectorAll("[data-dialog-close]").forEach((button) => button.addEventListener("click", () => {
    const dialog = button.closest("dialog");
    if (dialog && dialog.open) dialog.close();
  }));

  async function handleDashboardNavigation(event) {
    const button = event.target.closest("[data-nav-item]");
    if (!button || button.disabled) return;
    const view = button.dataset.navItem;
    if (!["home", "profile", "matches", "messages"].includes(view)) return;
    if (wizard.isEditing) await closeProfileEditor();
    setDashboardView(view);
    if (view === "home" || view === "matches" || view === "messages") await refreshActivityViews();
  }
  document.querySelector("#desktop-nav").addEventListener("click", handleDashboardNavigation);
  document.querySelector("#mobile-nav").addEventListener("click", handleDashboardNavigation);

  document.querySelectorAll("[data-signout]").forEach((button) => button.addEventListener("click", async () => {
    if (wizard.isEditing) {
      await flushDraftAutoSave();
      if (wizard.step === 3) {
        try { await uploadSelectedPhotos(true); } catch (_) {}
      }
    }
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
    try {
      const { data: avatar, error: avatarError } = await supabase.from("profile_avatars").select("object_path").eq("user_id", currentUser.id).maybeSingle();
      if (!avatarError && avatar) accountAvatarPath = avatar.object_path || "";
      if (accountAvatarPath) await renderAccountAvatar();
    } catch (_) { /* Avatar migration can be applied independently of sign-in. */ }
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
    const [{ data: profile, error }, { data: photos, error: photoError }] = await Promise.all([
      supabase.from(table).select("*").eq("id", currentUser.id).maybeSingle(),
      supabase.from("profile_photos").select("photo_type,object_path,display_path,sort_order").eq("user_id", currentUser.id).order("sort_order")
    ]);
    if (error) {
      showError("Dein Profil konnte nicht geladen werden.", "Profil nicht erreichbar");
      return;
    }
    await keepLoadingVisible();
    if (photoError) showNotice("Einige Profilfotos konnten nicht geladen werden.");
    await setupRole(account.role, currentUser, true, profileGreeting(account.role, profile), profile, photoError ? [] : photos || []);
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") window.location.replace(new URL("index.html?auth=signin", window.location.href).toString());
    });
  }

  start().catch(() => showError("Beim Laden deines WedConnect-Bereichs ist ein Fehler aufgetreten."));
})();