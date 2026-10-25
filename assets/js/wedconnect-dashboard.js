Warning: truncated output (original token count: 79727)
Total output lines: 6077

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
  let currentProfile = {};
  let currentGreeting = "";
  let activeDashboardView = "";
  let activeConversationPeer = "";
  let activeSupportThreadId = "";
  let supportFeatureAvailable = false;
  let supportOperator = false;
  let restrictedAccount = false;
  let supportNoticeShown = false;
  let messageReactionPickerId = "";
  let conversationRefreshTimer = null;
  let conversationRefreshBusy = false;
  let reactionFeatureAvailable = false;
  let reactionMigrationNoticeShown = false;
  let messageDeletionFeatureAvailable = false;
  let messageDeletionNoticeShown = false;
  let readReceiptFeatureAvailable = false;
  let readReceiptNoticeShown = false;
  let supportReadFeatureAvailable = false;
  let conversationHideFeatureAvailable = false;
  let supportHideFeatureAvailable = false;
  let conversationHideNoticeShown = false;
  let supportHideNoticeShown = false;
  let pendingDeleteConversation = null;
  let conversationLongPressTimer = null;
  let conversationLongPressStart = null;
  let suppressConversationClickUntil = 0;
  let unreadRefreshTimer = null;
  let unreadRefreshBusy = false;
  let discoverRefreshTimer = null;
  let discoverRefreshBusy = false;
  let discoverPreferencesByViewerRole = {};
  let discoverPreferencesLoaded = false;
  let discoverPreferencesLoadError = null;
  let discoverPreferencesSaving = false;
  let discoverPreferencesSavePending = false;
  let incomingLikeBadgeRefreshBusy = false;
  let pendingDeleteMessageId = "";
  let messageLongPressTimer = null;
  let messageLongPressStart = null;
  let suppressOwnMessageClickUntil = 0;
  let activityCache = { incoming: [], matches: [], messages: [], reactions: [], supportThreads: [], supportMessages: [], conversationReads: [], supportReads: [], conversationHidden: [], supportHidden: [], profileBlocks: [], summaries: new Map() };
  let blockFeatureAvailable = false;
  let blockFeatureNoticeShown = false;
  let pendingBlockPeerId = "";
  const profilePhotoUrlCache = new Map();
  let discoverState = { loaded: false, loading: false, ids: [], index: 0, active: null, photoIndex: 0, mode: "discover", savedIds: new Set(), likedIds: new Set(), skippedIds: new Set(), savedFeatureAvailable: true, busy: false };
  let activeMatchedProfileContext = "match";
  let pendingMatchPeerId = "";
  let pendingMatchFromDiscover = false;
  const matchMomentsShown = new Set();
  let accountAvatarPath = "";
  let accountAvatarUrl = "";
  let accountMenuScreen = "home";
  let accountReturnScreen = "home";
  let roleChangeMode = false;
  let roleChangeConfirmed = false;
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
    button.textContent = ((currentGreeting) || (currentUser && currentUser.user_metadata && currentUser.user_metadata.first_name) || "W").slice(0, 1).toUpperCase();
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

  function consentField(name, legend, statement, hint) {
    const savedValue = valueOf(name);
    const checked = savedValue === true || savedValue === "true" || (Array.isArray(savedValue) && savedValue.includes("yes"));
    return '<fieldset class="setup-group"><legend>' + legend + ' *</legend><label class="schedule-event-choice"><input type="checkbox" name="' + name + '" value="yes" data-profile-field data-profile-boolean required' + (checked ? " checked" : "") + '><span><strong>' + statement + '</strong></span></label><p class="setup-hint">' + hint + "</p></fieldset>";
  }

  function renderCoupleDetails() {
    return field("public_intro", "Eure Vorstellung", "textarea", "Optional · erscheint in eurem Profil.", false, ' maxlength="1200"') +
      choiceField("ceremony_type", "Art der Trauung", CEREMONY_OPTIONS, "Bitte wählt standesamtlich, kirchlich oder frei.") +
      multiSelectField("coverage_options", "Gewünschte Begleitung", COVERAGE_OPTIONS, "Wählt alle Abschnitte aus, die fotografisch begleitet werden sollen.") +
      renderWeddingTimeline() +
      consentField("photo_use_consent", "Bildnutzung", "Wir stimmen grundsätzlich zu, dass der Fotograf ausgewählte Fotos verwenden darf.", "Vor jeder Veröffentlichung legt der Fotograf euch die betreffenden Fotos zur Freigabe vor. Ihr entscheidet über die einzelnen Bilder.") +
      choiceField("reduced_payment_willingness", "Wärt ihr bereit, einen reduzierten Betrag zu bezahlen?", [
        ["yes", "Ja"],
        ["no", "Nein"],
        ["depends", "Kommt auf Umfang und Angebot an"]
      ], "Gemeint ist ein reduzierter Preis im Gegenzug zur vereinbarten Bildnutzung. Den konkreten Preis besprecht ihr passend zum Begleitungsumfang.");
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
    return '<div class="photographer-basics">' +
      field("first_name", "Dein Vorname", "text", "", true, ' autocomplete="given-name" maxlength="80"') +
      '<div class="experience-grid">' +
      field("admin_uid_number", "UID-Nummer (optional)", "text", "Nur für die gewerbliche Verifizierung", false, ' maxlength="40" autocomplete="off"') +
      field("admin_company_number", "Firmenbuchnummer (optional)", "text", "Nur für die gewerbliche Verifizierung", false, ' maxlength="40" autocomplete="off"') +
      '</div>' +
      field("admin_company_name", "Name laut Register (optional)", "text", "", false, ' maxlength="180" autocomplete="organization"') +
      multiSelectField("regions", "Region und Einsatzgebiet", REGION_OPTIONS, "Wähle ein oder mehrere Bundesländer. „Ganz Österreich“ schließt einzelne Bundesländer aus.") +
      '<div class="experience-grid">' +
      field("experience_years", "Erfahrung in Jahren", "number", "Optional, wenn du stattdessen Hochzeiten angibst.", false, ' min="0" max="80" step="1" inputmode="numeric"') +
      field("weddings_photographed", "Fotografierte Hochzeiten", "number", "Optional, wenn du stattdessen Jahre angibst.", false, ' min="0" max="10000" step="1" inputmode="numeric"') +
      "</div>" +
      multiSelectField("styles", "Dein Bildstil", STYLE_OPTIONS, "Wähle alle Bildstile, die deine Arbeit beschreiben.") +
      choiceField("compensation_model", "Dein Vergütungsmodell bei vereinbarter Bildnutzung", [
        ["free", "Kostenlos (TFP)"],
        ["reduced", "Reduzierter Preis"],
        ["both", "Beides ist möglich"]
      ], "Ein reduzierter Preis hängt vom gewünschten Begleitungsumfang ab. Den konkreten Betrag vereinbarst du später mit dem Paar.") +
      "</div>";
  }

  function renderPhotographerDetails() {
    return field("public_intro", "Deine Vorstellung", "textarea", "Stell dich und deine Arbeit kurz vor. Dieser Text erscheint über deinen Fotos im Profil.", false, ' maxlength="1200"') +
      multiSelectField("coverage_options", "Begleitungsumfang", COVERAGE_OPTIONS, "Wähle alle Teile einer Hochzeit aus, die dir für dein Portfolio noch fehlen und die du gerne fotografieren möchtest.") +
      consentField("photo_use_approval", "Bildfreigabe", "Ich lege dem Paar ausgewählte Fotos vor einer Veröffentlichung zur Freigabe vor.", "Die Bildnutzung ausgewählter Fotos nach vorheriger Freigabe ist Grundlage der Zusammenarbeit auf WedConnect.") +
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
          ["Bildnutzung", data.photo_use_consent ? "Ausgewählte Fotos nach vorheriger Freigabe" : "Noch nicht bestätigt"],
          ["Bereitschaft zu reduziertem Preis", reducedPaymentWillingnessLabel(data.reduced_payment_willingness)],
          ["Fotos", currentPhotoCount("couple") ? "Gemeinsames Foto hochgeladen" : Math.min(2, Number(currentPhotoCount("partner_one") > 0) + Number(currentPhotoCount("partner_two") > 0)) + " von 2 Einzelfotos hochgeladen"]
        ]
      : [
          ["Vorname", data.first_name],
          ["Vorstellung", data.public_intro],
          ["Region", (Array.isArray(data.regions) ? data.regions : []).map((value) => (REGION_OPTIONS.find((option) => option[0] === value) || [value, value])[1]).join(", ") || data.region],
          ["Erfahrung", [data.experience_years !== null && data.experience_years !== undefined && data.experience_years !== "" ? data.experience_years + (Number(data.experience_years) === 1 ? " Jahr" : " Jahre") : "", data.weddings_photographed !== null && data.weddings_photographed !== undefined && data.weddings_photographed !== "" ? data.weddings_photographed + " Hochzeiten" : ""].filter(Boolean).join(" · ") || data.experience],
          ["Bildstil", (Array.isArray(data.styles) ? data.styles : []).map((value) => (STYLE_OPTIONS.find((option) => option[0] === value) || [value, value])[1]).join(", ") || data.visual_style],
          ["Begleitung", data.coverage_scope],
          ["Vergütung", compensationModelLabel(data.compensation_model)],
          ["Bildfreigabe", data.photo_use_approval ? "Ausgewählte Fotos nach vorheriger Freigabe" : "Noch nicht bestätigt"],
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

  function reducedPaymentWillingnessLabel(value) {
    return value === "yes" ? "Ja, grundsätzlich bereit" : value === "no" ? "Nein" : value === "depends" ? "Abhängig von Umfang und Angebot" : "Nicht angegeben";
  }

  function compensationModelLabel(value) {
    return value === "free" ? "Kostenlos (TFP)" : value === "reduced" ? "Reduzierter Preis" : value === "both" ? "Kostenlos oder reduziert" : "Nicht angegeben";
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
    if (profileEditExit) profileEditExit.hidden = !wizard.isEditing && !roleChangeMode;
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
    syncMob…39727 tokens truncated…ext === "saved") await showSavedProfiles();
      if (result.newMatch) openMatchDialog(profileId, false);
      else if (result.matched) showNotice("Ihr habt bereits ein Match.");
      else {
        if (bar) bar.replaceWith(createProfileDecisionBar(profileId, context));
        showNotice("Interesse gesendet.");
      }
      return;
    }
    if (action === "skip") {
      const skipped = await supabase.from("profile_skips").insert({ skipper_id: currentUser.id, skipped_id: profileId });
      if (skipped.error && !/duplicate|unique/i.test(skipped.error.message || "")) {
        showNotice("Das Profil konnte gerade nicht übersprungen werden. Bitte versuche es erneut.");
        if (bar) bar.querySelectorAll("button").forEach((item) => { item.disabled = false; });
        return;
      }
      discoverState.skippedIds.add(profileId);
      const dismissed = await supabase.from("profile_likes").delete().eq("liker_id", profileId).eq("liked_id", currentUser.id);
      if (dismissed.error) showNotice("Das Like konnte nicht aus deiner Übersicht entfernt werden.");
      if (discoverState.savedIds.has(profileId)) {
        const removed = await supabase.from("profile_saved_profiles").delete().eq("user_id", currentUser.id).eq("saved_profile_id", profileId);
        if (!removed.error) discoverState.savedIds.delete(profileId);
        else showNotice("Das Profil wurde übersprungen, konnte aber nicht aus der Merkliste entfernt werden.");
      }
      updateDiscoverModeButtons();
      await refreshActivityViews();
      if (context === "incoming") {
        setMatchesTab("likes");
        setDashboardView("matches");
      } else if (context === "saved") {
        await showSavedProfiles();
      }
      return;
    }
    if (action === "save" || action === "unsave") {
      const save = action === "save";
      const result = save
        ? await supabase.from("profile_saved_profiles").insert({ user_id: currentUser.id, saved_profile_id: profileId })
        : await supabase.from("profile_saved_profiles").delete().eq("user_id", currentUser.id).eq("saved_profile_id", profileId);
      if (result.error && !(save && /duplicate|unique/i.test(result.error.message || ""))) {
        showNotice("Das Profil konnte nicht in der Merkliste aktualisiert werden. Prüfe die Merkliste-Migration in Supabase.");
        if (bar) bar.querySelectorAll("button").forEach((item) => { item.disabled = false; });
        return;
      }
      if (save) discoverState.savedIds.add(profileId);
      else discoverState.savedIds.delete(profileId);
      updateDiscoverModeButtons();
      if (context === "saved") await showSavedProfiles();
      else {
        const bookmark = bar && bar.querySelector("[data-profile-decision=\"save\"], [data-profile-decision=\"unsave\"]");
        if (bookmark) {
          bookmark.dataset.profileDecision = save ? "unsave" : "save";
          const label = save ? "Entmerken" : "Merken";
          bookmark.setAttribute("aria-label", label);
          bookmark.title = label;
          bookmark.querySelector("span").textContent = label;
          bookmark.disabled = false;
        }
        if (bar) bar.querySelectorAll("button").forEach((item) => { if (item !== bookmark) item.disabled = false; });
      }
      showNotice(save ? "Profil in deiner Merkliste gespeichert." : "Profil aus deiner Merkliste entfernt.");
    }
  }

  function syncOverviewScrollHint() {
    const hint = document.querySelector("#overview-scroll-hint");
    const home = document.querySelector("#home-view");
    if (!hint || !home) return;
    const root = document.documentElement;
    const scrollTop = window.scrollY || root.scrollTop || 0;
    const scrollHeight = Math.max(root.scrollHeight, document.body.scrollHeight);
    const maxScroll = Math.max(0, scrollHeight - window.innerHeight);
    const isOverview = !home.hidden;
    const hasMoreBelow = maxScroll > 32 && scrollTop < 24 && maxScroll - scrollTop > 32;
    hint.hidden = !(isOverview && hasMoreBelow);
  }
  function setDashboardView(view) {
    const viewChanged = activeDashboardView !== view;
    activeDashboardView = view;
    document.querySelectorAll("[data-dashboard-view]").forEach((section) => {
      section.hidden = section.dataset.dashboardView !== view;
    });
    setActiveNavigation(view === "matched-profile" ? "matches" : view === "offer-detail" || view === "partner-offers" ? "home" : view);
    const titles = {
      home: "Willkommen" + (currentGreeting ? ", " + currentGreeting : "") + "!",
      profile: currentRole === "couple" ? "Euer Profil" : "Dein Profil",
      matches: "Matches",
      "partner-offers": "Partnerangebote",
      "offer-detail": "Angebot",
      "matched-profile": "Profil",
      messages: "Nachrichten",
      discover: currentRole === "couple" ? "Fotografen entdecken" : "Hochzeiten entdecken"
    };
    const pageTitle = document.querySelector("#page-title");
    pageTitle.textContent = titles[view] || "Willkommen!";
    pageTitle.hidden = view === "matched-profile";
    document.querySelector("#page-title-row").classList.toggle("hidden", view === "matched-profile");
    const contextBack = document.querySelector("#offer-detail-back");
    contextBack.classList.toggle("hidden", view !== "offer-detail" && view !== "partner-offers");
    const returnFromPartnerList = view === "partner-offers";
    const returnFromPartnerDetail = view === "offer-detail" && offerDetailReturnView === "partner-offers";
    contextBack.textContent = returnFromPartnerList ? "‹ Konto" : returnFromPartnerDetail ? "‹ Partnerangebote" : "‹ Übersicht";
    contextBack.setAttribute("aria-label", returnFromPartnerList ? "Zurück zum Konto-Menü" : returnFromPartnerDetail ? "Zurück zu Partnerangeboten" : "Zurück zur Übersicht");
    const roleEyebrow = document.querySelector("#role-eyebrow");
    const profileStatus = document.querySelector("#profile-status-pill");
    roleEyebrow.hidden = view === "messages" || view === "matches" || view === "discover" || view === "matched-profile" || view === "offer-detail" || view === "partner-offers";
    profileStatus.hidden = view !== "profile";
    profileStatus.classList.toggle("hidden", profileStatus.hidden);
    const roleRow = roleEyebrow.closest(".profile-role-row");
    const hideRoleRow = roleEyebrow.hidden && profileStatus.hidden;
    roleRow.hidden = hideRoleRow;
    roleRow.classList.toggle("hidden", hideRoleRow);
    if (view === "discover") startDiscoverProfileRefresh();
    else stopDiscoverProfileRefresh();
    if (viewChanged) {
      window.scrollTo(0, 0);
      const pageContent = document.querySelector(".content");
      if (pageContent) pageContent.scrollTop = 0;
    }
    syncOverviewScrollHint();
  }

  async function openConversation(peerId) {
    activeSupportThreadId = "";
    activeConversationPeer = peerId;
    resetConversationComposer("Nachricht schreiben …", "Nachricht");
    const summary = activityCache.summaries.get(peerId) || await loadPublicProfileSummary(peerId);
    const partnerName = summary && summary.name ? summary.name : "Nachricht";
    const titleButton = document.querySelector("#conversation-title");
    titleButton.textContent = partnerName;
    titleButton.dataset.openProfile = peerId;
    titleButton.dataset.profileContext = "match";
    titleButton.setAttribute("aria-label", "Profil von " + partnerName + " öffnen");
    const avatar = document.querySelector("#conversation-avatar");
    avatar.replaceChildren();
    renderProfileSummaryAvatar(avatar, summary, partnerName);
    updateConversationBlockUI(peerId);
    await renderConversationThread();
    document.querySelector("#conversation-status").textContent = "";
    messageReactionPickerId = "";
    openWorkspaceDialog(document.querySelector("#conversation-dialog"));
    if (!isPeerBlocked(peerId)) await markConversationRead(peerId);
    const thread = document.querySelector("#conversation-thread");
    requestAnimationFrame(() => { if (thread) thread.scrollTop = thread.scrollHeight; });
    await refreshOpenConversationMessages();
    requestAnimationFrame(() => { if (thread) thread.scrollTop = thread.scrollHeight; });
    startConversationMessagePolling();
  }

  async function openSupportConversation(threadId) {
    const thread = (activityCache.supportThreads || []).find((item) => item.id === threadId);
    if (!thread) return;
    activeConversationPeer = "";
    activeSupportThreadId = threadId;
    resetConversationComposer("Nachricht an WedConnect schreiben …", "Nachricht an WedConnect");
    updateConversationBlockUI("");
    setConversationMenuOpen(false);
    const title = supportOperator ? ("Support · " + (thread.subject || "Anfrage")) : "WedConnect-Team";
    const titleButton = document.querySelector("#conversation-title");
    titleButton.textContent = title;
    delete titleButton.dataset.openProfile;
    delete titleButton.dataset.profileContext;
    titleButton.removeAttribute("aria-label");
    const avatar = document.querySelector("#conversation-avatar");
    avatar.replaceChildren();
    avatar.textContent = "W";
    messageReactionPickerId = "";
    await renderConversationThread(true);
    document.querySelector("#conversation-status").textContent = "";
    openWorkspaceDialog(document.querySelector("#conversation-dialog"));
    await markSupportThreadRead(threadId);
    const threadElement = document.querySelector("#conversation-thread");
    requestAnimationFrame(() => { if (threadElement) threadElement.scrollTop = threadElement.scrollHeight; });
    await refreshOpenConversationMessages();
    startConversationMessagePolling();
  }

  async function renderConversationThread(forceBottom = false) {
    const container = document.querySelector("#conversation-thread");
    if (!container) return;
    const wasNearBottom = forceBottom || container.scrollHeight - container.scrollTop - container.clientHeight < 80;
    container.replaceChildren();
    const userId = currentUser.id;
    if (activeSupportThreadId) {
      const supportMessages = visibleSupportMessagesForThread(activeSupportThreadId);
      if (!supportMessages.length) {
        const empty = document.createElement("p");
        empty.className = "conversation-empty";
        empty.textContent = "Schreib dem WedConnect-Team deine erste Nachricht.";
        container.append(empty);
        return;
      }
      supportMessages.forEach((item) => {
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
      if (wasNearBottom) container.scrollTop = container.scrollHeight;
      return;
    }
    const messages = visibleMessagesForPeer(activeConversationPeer);
    if (!messages.length) {
      const empty = document.createElement("p");
      empty.className = "conversation-empty";
      empty.textContent = "Ihr habt noch keine Nachricht ausgetauscht. Schreib den ersten Satz.";
      container.append(empty);
      return;
    }
    messages.forEach((item) => {
      if (item.deleted_at) {
        const deletionNote = document.createElement("div");
        deletionNote.className = "conversation-message is-deleted" + (item.sender_id === userId ? " is-own" : "");
        deletionNote.setAttribute("aria-label", "Nachricht wurde gelöscht");
        deletionNote.textContent = "Nachricht wurde gelöscht";
        container.append(deletionNote);
        return;
      }
      const bubble = document.createElement("div");
      bubble.className = "conversation-message" + (item.sender_id === userId ? " is-own" : "");
      if (item.sender_id !== userId) {
        bubble.dataset.messageBubble = item.id;
        bubble.tabIndex = 0;
        bubble.setAttribute("role", "group");
        bubble.setAttribute("aria-label", "Nachricht. Tippen oder Enter drücken, um zu reagieren.");
      }
      const body = document.createElement("span");
      body.textContent = item.body;
      const time = document.createElement("time");
      time.dateTime = item.created_at;
      time.textContent = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(item.created_at));
      bubble.append(body, time);
      if (item.sender_id === userId) {
        bubble.dataset.ownMessage = item.id;
        if (messageDeletionFeatureAvailable) {
          const menuTrigger = document.createElement("button");
          menuTrigger.type = "button";
          menuTrigger.className = "message-more-button";
          menuTrigger.dataset.ownMessageMenu = item.id;
          menuTrigger.setAttribute("aria-label", "Nachricht für alle löschen");
          menuTrigger.textContent = "⋯";
          bubble.append(menuTrigger);
        }
      }
      if (reactionFeatureAvailable) {
        const messageReactions = (activityCache.reactions || []).filter((reaction) => reaction.message_id === item.id && reaction.reaction === "heart");
        const ownHeart = messageReactions.some((reaction) => reaction.user_id === userId);
        if (messageReactions.length || messageReactionPickerId === item.id) bubble.classList.add("has-reaction");
        if (messageReactions.length && messageReactionPickerId !== item.id) {
          const sticker = document.createElement("span");
          sticker.className = "message-reaction-sticker";
          sticker.setAttribute("aria-label", "Herzreaktion");
          sticker.textContent = "♥";
          bubble.append(sticker);
        }
        if (item.sender_id !== userId && messageReactionPickerId === item.id) {
          const heart = document.createElement("button");
          heart.type = "button";
          heart.className = "message-heart-picker" + (ownHeart ? " is-active" : "");
          heart.dataset.messageHeart = item.id;
          heart.setAttribute("aria-label", ownHeart ? "Herzreaktion entfernen" : "Mit Herz reagieren");
          heart.setAttribute("aria-pressed", String(ownHeart));
          heart.textContent = "♥";
          bubble.append(heart);
        }
      }
      container.append(bubble);
    });
    if (wasNearBottom) container.scrollTop = container.scrollHeight;
  }
  async function refreshOpenConversationMessages() {
    const dialog = document.querySelector("#conversation-dialog");
    const peerId = activeConversationPeer;
    const supportThreadId = activeSupportThreadId;
    if ((!peerId && !supportThreadId) || !dialog || !dialog.open || document.visibilityState !== "visible" || conversationRefreshBusy) return;
    conversationRefreshBusy = true;
    try {
      if (supportThreadId) {
        const before = visibleSupportMessagesForThread(supportThreadId).map((item) => [item.id, item.created_at].join("|")).join(";");
        const loaded = await loadSupportData(false);
        if (!loaded || supportThreadId !== activeSupportThreadId) return;
        const after = visibleSupportMessagesForThread(supportThreadId).map((item) => [item.id, item.created_at].join("|")).join(";");
        if (before !== after) {
          await markSupportThreadRead(supportThreadId);
          renderMessagesList();
          await renderConversationThread();
        }
        return;
      }
      const userId = currentUser.id;
      const messageResult = await loadProfileMessages(userId);
      if (messageResult.error || peerId !== activeConversationPeer) return;
      const incoming = messageResult.data || [];
      const forPeer = (items) => items.filter((item) =>
        (item.sender_id === userId && item.recipient_id === peerId)
        || (item.sender_id === peerId && item.recipient_id === userId));
      const allPeerMessages = forPeer(incoming);
      const peerMessages = allPeerMessages.filter((item) => !item.deleted_at);
      const previous = forPeer(activityCache.messages || []);
      const previousVisibleMessages = previous.filter((item) => !item.deleted_at);
      const messagesKey = (items) => items.map((item) => [item.id, item.created_at, item.deleted_at || ""].join("|")).join(";");
      const messagesChanged = messagesKey(previous) !== messagesKey(allPeerMessages);
      let peerReactions = null;
      if (peerMessages.length) {
        const { data: reactions, error: reactionError } = await supabase.from("profile_message_reactions")
          .select("message_id,user_id,reaction,created_at")
          .in("message_id", peerMessages.map((item) => item.id));
        if (reactionError) {
          if (!reactionMigrationNoticeShown) {
            const missingTable = /does not exist|schema cache|42P01|could not find the table/i.test(String(reactionError.message || ""));
            showNotice(missingTable
              ? "Herzreaktionen sind noch nicht eingerichtet. Bitte führe die Nachrichtenreaktions-Migration in Supabase aus."
              : "Herzreaktionen konnten gerade nicht geladen werden.");
            reactionMigrationNoticeShown = true;
          }
          reactionFeatureAvailable = false;
        } else {
          reactionFeatureAvailable = true;
          peerReactions = reactions || [];
        }
      }
      const previousMessageIds = new Set(previousVisibleMessages.map((item) => item.id));
      const nextMessageIds = new Set(peerMessages.map((item) => item.id));
      const reactionKey = (items) => items.map((item) => [item.message_id, item.user_id, item.reaction].join("|")).sort().join(";");
      const oldPeerReactions = (activityCache.reactions || []).filter((item) => previousMessageIds.has(item.message_id));
      const reactionsChanged = peerReactions !== null && reactionKey(oldPeerReactions) !== reactionKey(peerReactions);
      if (!messagesChanged && !reactionsChanged) return;
      if (messagesChanged) {
        activityCache.messages = (activityCache.messages || [])
          .filter((item) => item.sender_id !== peerId && item.recipient_id !== peerId)
          .concat(allPeerMessages)
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        await markConversationRead(peerId);
      }
      if (activityCache.messagedPeers) {
        if (visibleMessagesForPeer(peerId).length) activityCache.messagedPeers.add(peerId);
        else activityCache.messagedPeers.delete(peerId);
      }
      if (peerReactions !== null) {
        const replacedIds = new Set([...previousMessageIds, ...nextMessageIds]);
        activityCache.reactions = (activityCache.reactions || [])
          .filter((item) => !replacedIds.has(item.message_id))
          .concat(peerReactions);
      } else if (messagesChanged) {
        const removedIds = new Set([...previousMessageIds].filter((id) => !nextMessageIds.has(id)));
        activityCache.reactions = (activityCache.reactions || []).filter((item) => !removedIds.has(item.message_id));
      }
      renderMessagesList();
      await renderConversationThread();
    } finally {
      conversationRefreshBusy = false;
    }
  }

  function startConversationMessagePolling() {
    if (conversationRefreshTimer) window.clearInterval(conversationRefreshTimer);
    conversationRefreshTimer = window.setInterval(refreshOpenConversationMessages, 5000);
  }

  function stopConversationMessagePolling() {
    if (conversationRefreshTimer) window.clearInterval(conversationRefreshTimer);
    conversationRefreshTimer = null;
  }

  document.querySelector("#conversation-dialog").addEventListener("close", () => {
    stopConversationMessagePolling();
    activeConversationPeer = "";
    activeSupportThreadId = "";
    pendingDeleteMessageId = "";
    cancelMessageLongPress();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refreshOpenConversationMessages();
      refreshUnreadMessageState();
      refreshIncomingLikeBadge();
    }
  });

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
    currentProfile = profile || {};
    await loadDiscoverPreferences();
    const couple = currentRole === "couple";
    const photographer = currentRole === "photographer";
    currentGreeting = greeting || "";
    const roleName = couple ? "Hochzeitspaar" : photographer ? "Fotograf" : "Profil einrichten";
    const discoverIntro = document.querySelector("#discover-intro");
    if (discoverIntro) discoverIntro.textContent = couple ? "Entdecke Hochzeitsfotografen, die zu euch passen könnten." : "Entdecke Hochzeitspaare, deren Geschichten zu deiner Arbeit passen könnten.";
    document.querySelector("#side-role").textContent = roleName;
    await renderAccountAvatar();
    document.querySelector("#account-display-name").textContent = greeting || profileGreeting(currentRole, profile) || (user.user_metadata && user.user_metadata.first_name) || "Dein WedConnect-Profil";
    renderAccountStats();
    document.querySelector("#account-role-label").textContent = roleName;
    document.querySelector("#role-eyebrow").textContent = couple ? "Hochzeitspaar" : photographer ? "Fotograf" : "Dein WedConnect-Konto";
    document.querySelector("#page-title").textContent = greeting ? "Willkommen, " + greeting + "!" : "Willkommen!";
    document.querySelector("#profile-status").textContent = complete ? "Profil vollständig" : "Profil noch offen";
    const verificationAction = document.querySelector("#business-verification-action");
    const verificationButton = document.querySelector("#business-verification-submit");
    if (verificationAction && verificationButton) {
      const hasBusinessNumber = Boolean(profile && (profile.admin_uid_number || profile.admin_company_number));
      const verificationStatus = profile && profile.admin_verification_status || "not_submitted";
      verificationAction.hidden = !(photographer && complete && hasBusinessNumber);
      verificationButton.disabled = verificationStatus === "pending" || verificationStatus === "verified";
      verificationButton.textContent = verificationStatus === "verified" ? "Gewerblich verifiziert" : verificationStatus === "pending" ? "Verifizierung wird geprüft" : "Gewerbliche Verifizierung beantragen";
    }
    document.querySelector("#desktop-nav").innerHTML =
      navItem("Übersicht", "home", true, false) +
      navItem("Profil", "profile", false, !currentRole) +
      navItem(couple ? "Fotografen entdecken" : "Hochzeiten entdecken", "discover", false, false) +
      navItem("Matches", "matches", false, false) +
      navItem("Nachrichten", "messages", false, false);
    document.querySelector("#mobile-nav").innerHTML =
      navItem("Übersicht", "home", true, false) +
      navItem("Profil", "profile", false, !currentRole) +
      navItem("Entdecken", "discover", false, false) +
      navItem("Matches", "matches", false, false) +
      navItem("Nachrichten", "messages", false, false);
    await renderOwnProfilePreview(currentRole, profile || {}, photos || []);
    loading.classList.add("hidden");
    onboarding.classList.add("hidden");
    dashboard.classList.remove("hidden");
    setDashboardView("home");
    await Promise.all([refreshActivityViews(), loadEmailPreferences()]);
    startUnreadMessageRefresh();
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
    const badge = icon === "messages"
      ? '<span class="nav-unread-badge" data-unread-badge hidden></span>'
      : icon === "matches" ? '<span class="nav-unread-badge" data-matches-badge hidden></span>' : "";
    return '<button class="nav-link' + (active ? " active" : "") + '" type="button" data-nav-item="' + icon + '" ' + state + ">" +
      icons[icon] + "<span>" + label + "</span>" + badge +
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
        if (roleChangeMode && currentRole && selected.value !== currentRole && !roleChangeConfirmed) {
          openWorkspaceDialog(document.querySelector("#role-change-confirm-dialog"));
          return;
        }
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
        roleChangeConfirmed = false;
        if (changedRole) roleChangeMode = false;
        await loadWizard(nextRole, 1);
        if (changedRole) showNotice("Rolle geändert. Ergänze jetzt dein Profil für " + (nextRole === "couple" ? "Hochzeitspaare." : "Fotografen."));
      } else if (wizard.step === 1 || wizard.step === 2) {
        if (!form.reportValidity()) return;
        const values = collectFields();
        if (wizard.role === "couple" && wizard.step === 2) {
          if (!values.coverage_options || !values.coverage_options.length) throw new Error("Wähle mindestens einen Begleitungsumfang aus.");
          if (!CEREMONY_OPTIONS.some((option) => option[0] === values.ceremony_type)) throw new Error("Wähle die Art der Trauung aus.");
          if (!values.photo_use_consent) throw new Error("Für ein WedConnect-Profil ist die Bildnutzung ausgewählter Fotos nach vorheriger Freigabe erforderlich.");
          if (!["yes", "no", "depends"].includes(values.reduced_payment_willingness)) throw new Error("Wähle aus, ob ihr zu einem reduzierten Preis bereit wärt.");
        }
        if (wizard.role === "photographer" && wizard.step === 1) {
          if (!values.regions || !values.regions.length) throw new Error("Wähle mindestens ein Einsatzgebiet aus.");
          if (!values.styles || !values.styles.length) throw new Error("Wähle mindestens einen Bildstil aus.");
          if (!values.experience_years && !values.weddings_photographed) throw new Error("Gib Erfahrung in Jahren oder die Anzahl fotografierter Hochzeiten an.");
        }
        if (wizard.role === "photographer" && wizard.step === 2 && (!values.coverage_options || !values.coverage_options.length)) {
          throw new Error("Wähle mindestens einen Begleitungsumfang aus.");
        }
        if (wizard.role === "photographer" && wizard.step === 2 && !values.photo_use_approval) {
          throw new Error("Bestätige, dass du ausgewählte Fotos vor der Veröffentlichung dem Paar zur Freigabe vorlegst.");
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
          if (message.includes("couple_collaboration_terms_required")) throw new Error("Bitte bestätige die Bildnutzung nach vorheriger Freigabe und gib eure Bereitschaft zu einem reduzierten Preis an.");
          if (message.includes("photographer_collaboration_terms_required")) throw new Error("Bitte bestätige die Bildfreigabe und wähle dein Vergütungsmodell.");
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

  const contactDialog = document.querySelector("#contact-feedback-dialog");
  const accountContactOpen = document.querySelector("#account-contact-open");
  document.querySelector("#support-new-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const category = String(formData.get("category") || "other");
    const subject = String(formData.get("subject") || "").trim();
    const body = String(formData.get("body") || "").trim();
    const topicSelect = document.querySelector("#support-category");
    const topic = topicSelect && topicSelect.selectedOptions[0]
      ? topicSelect.selectedOptions[0].textContent.trim()
      : category;
    const status = document.querySelector("#support-new-status");
    const submit = document.querySelector("#support-new-submit");
    if (!body || !subject || !supportFeatureAvailable) return;
    const contactMessage = "Thema: " + topic + "\nBetreff: " + subject + "\n\n" + body;
    if (contactMessage.length > 2000) {
      status.textContent = "Bitte kürze die Nachricht, damit Thema und Betreff mitgesendet werden können.";
      return;
    }
    submit.disabled = true;
    status.textContent = "Wird gesendet …";

    const supportDataLoaded = await loadSupportData(false);
    if (!supportDataLoaded) {
      submit.disabled = false;
      status.textContent = "Deine Support-Unterhaltungen konnten nicht geladen werden. Bitte versuche es erneut.";
      return;
    }
    const existingThread = (activityCache.supportThreads || [])
      .filter((thread) => thread.channel === "chat" && thread.user_id === currentUser.id)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

    let threadId = "";
    if (existingThread) {
      const { error } = await supabase.from("support_messages").insert({
        thread_id: existingThread.id,
        sender_id: currentUser.id,
        sender_type: supportOperator ? "operator" : "user",
        body: contactMessage
      });
      if (error) {
        submit.disabled = false;
        status.textContent = "Deine Nachricht konnte nicht zur bestehenden Unterhaltung hinzugefügt werden. Bitte versuche es erneut.";
        return;
      }
      threadId = existingThread.id;
    } else {
      const { data, error } = await supabase.rpc("create_support_thread", {
        p_channel: "chat",
        p_category: category,
        p_subject: subject,
        p_body: contactMessage
      });
      if (error || !data || !data.length) {
        submit.disabled = false;
        status.textContent = "Deine Nachricht konnte nicht gespeichert werden. Bitte versuche es erneut.";
        return;
      }
      threadId = data[0].thread_id;
    }

    form.reset();
    submit.disabled = false;
    status.textContent = "";
    if (contactDialog && contactDialog.open) contactDialog.close();
    await loadSupportData(false);
    await openSupportConversation(threadId);
    renderMessagesList();
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

  function setAccountMenuScreen(screen = "home") {
    accountMenuScreen = screen;
    document.querySelectorAll("[data-account-screen]").forEach((section) => {
      section.hidden = section.dataset.accountScreen !== screen;
    });
    const accountTitle = document.querySelector("#account-dialog-title");
    const accountBack = accountDialog && accountDialog.querySelector("[data-account-back]");
    if (accountTitle) accountTitle.textContent = screen === "profile" ? "Profil" : screen === "offers" ? "Angebote und Hilfe" : screen === "legal" ? "Rechtliches" : "Konto";
    if (accountBack) accountBack.hidden = screen === "home";
    const dialogContent = accountDialog && accountDialog.querySelector(".workspace-dialog-content");
    if (dialogContent) dialogContent.scrollTop = 0;
  }

  function openDeleteMessageDialog(messageId) {
    const message = (activityCache.messages || []).find((item) => item.id === messageId && item.sender_id === currentUser.id);
    if (!message || !messageDeletionFeatureAvailable) return;
    pendingDeleteMessageId = messageId;
    document.querySelector("#delete-message-status").textContent = "";
    openWorkspaceDialog(document.querySelector("#delete-message-dialog"));
  }
  document.querySelector("#delete-message-dialog").addEventListener("close", () => {
    pendingDeleteMessageId = "";
    document.querySelector("#delete-message-confirm").disabled = false;
  });
  document.querySelector("#delete-conversation-dialog").addEventListener("close", () => {
    pendingDeleteConversation = null;
    document.querySelector("#delete-conversation-confirm").disabled = false;
  });
  if (accountTrigger) accountTrigger.addEventListener("click", () => { setAccountMenuScreen("home"); openWorkspaceDialog(accountDialog); });
  if (mobileAccountTrigger) mobileAccountTrigger.addEventListener("click", () => { setAccountMenuScreen("home"); openWorkspaceDialog(accountDialog); });
  document.querySelector("#business-verification-submit")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const { error } = await supabase.rpc("submit_business_verification");
      if (error) throw error;
      currentProfile.admin_verification_status = "pending";
      button.textContent = "Verifizierung wird geprüft";
      showNotice("Deine gewerbliche Verifizierung wurde eingereicht.");
    } catch (error) {
      button.disabled = false;
      showNotice(error.message === "business_number_required" ? "Trage zuerst deine UID-Nummer oder Firmenbuchnummer im Profil ein." : "Die Verifizierung konnte nicht eingereicht werden. Prüfe die Admin-Migration und versuche es erneut.");
    }
  });
  document.addEventListener("click", (event) => {
    const openSection = event.target.closest("[data-account-section-open]");
    if (openSection) { setAccountMenuScreen(openSection.dataset.accountSectionOpen); return; }
    if (event.target.closest("[data-account-back]")) { setAccountMenuScreen("home"); return; }
    const returnButton = event.target.closest("[data-account-return]");
    if (returnButton) {
      const currentDialog = returnButton.closest("dialog");
      if (currentDialog && currentDialog.open) currentDialog.close();
      setAccountMenuScreen(returnButton.dataset.accountReturn || "home");
      openWorkspaceDialog(accountDialog);
    }
  });
  const profileEditExit = document.querySelector("#profile-edit-exit");
  if (profileEditExit) profileEditExit.addEventListener("click", async () => {
    try { if (wizard.isEditing) await flushDraftAutoSave(); } catch (_) {}
    onboarding.classList.add("hidden");
    onboarding.classList.remove("profile-edit-overlay");
    dashboard.classList.remove("is-editing-profile", "hidden");
    roleChangeMode = false; roleChangeConfirmed = false;
    setAccountMenuScreen("profile");
    openWorkspaceDialog(accountDialog);
  });
  document.querySelector("#role-change-confirm")?.addEventListener("click", () => {
    roleChangeConfirmed = true;
    const dialog = document.querySelector("#role-change-confirm-dialog");
    if (dialog && dialog.open) dialog.close();
    form.requestSubmit();
  });
  document.querySelector("#role-change-cancel")?.addEventListener("click", () => {
    const dialog = document.querySelector("#role-change-confirm-dialog");
    if (dialog && dialog.open) dialog.close();
  });
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
    accountReturnScreen = "profile";
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
    accountReturnScreen = "home";
    if (accountDialog.open) accountDialog.close();
    openWorkspaceDialog(settingsDialog);
    loadEmailPreferences();
  });
  document.querySelector("#account-discover-preferences-open").addEventListener("click", async () => {
    accountReturnScreen = "discover";
    if (accountDialog.open) accountDialog.close();
    await loadDiscoverPreferences();
    renderDiscoverPreferenceOptions();
    openWorkspaceDialog(document.querySelector("#discover-preferences-dialog"));
  });
  document.querySelector("#discover-preferences-list").addEventListener("change", (event) => {
    const input = event.target.closest("input[data-discover-criterion]");
    if (!input) return;
    const preferences = activeDiscoverPreferences(currentRole);
    preferences.enabled[input.dataset.discoverCriterion] = input.checked;
    discoverPreferencesByViewerRole[currentRole] = preferences;
    const status = document.querySelector("#discover-preferences-status");
    status.textContent = "Sortierung wird aktualisiert …";
    status.dataset.state = "";
    persistDiscoverPreferences();
  });
  document.querySelector("#email-preferences-form").addEventListener("change", persistEmailPreferences);
  const deleteAccountDialog = document.querySelector("#delete-account-dialog");
  const deleteAccountForm = document.querySelector("#delete-account-form");
  const deleteAccountConfirmation = document.querySelector("#delete-account-confirmation");
  const deleteAccountSubmit = document.querySelector("#delete-account-submit");
  const deleteAccountStatus = document.querySelector("#delete-account-status");
  document.querySelector("#account-delete-open").addEventListener("click", () => {
    if (settingsDialog.open) settingsDialog.close();
    deleteAccountConfirmation.value = "";
    deleteAccountSubmit.disabled = true;
    deleteAccountStatus.textContent = "";
    deleteAccountStatus.dataset.state = "";
    openWorkspaceDialog(deleteAccountDialog);
    deleteAccountConfirmation.focus();
  });
  deleteAccountConfirmation.addEventListener("input", () => {
    deleteAccountSubmit.disabled = deleteAccountConfirmation.value.trim() !== "KONTO LÖSCHEN";
  });
  deleteAccountDialog.addEventListener("cancel", (event) => {
    if (deleteAccountDialog.dataset.busy) event.preventDefault();
  });
  deleteAccountDialog.addEventListener("close", () => {
    if (!deleteAccountSubmit.dataset.busy) {
      deleteAccountConfirmation.value = "";
      deleteAccountSubmit.disabled = true;
      deleteAccountStatus.textContent = "";
      deleteAccountStatus.dataset.state = "";
    }
  });
  deleteAccountForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser || deleteAccountConfirmation.value.trim() !== "KONTO LÖSCHEN") return;
    deleteAccountSubmit.disabled = true;
    deleteAccountSubmit.dataset.busy = "true";
    deleteAccountDialog.dataset.busy = "true";
    deleteAccountDialog.querySelectorAll("[data-dialog-close]").forEach((button) => { button.disabled = true; });
    deleteAccountStatus.textContent = "Konto und Daten werden dauerhaft gelöscht …";
    deleteAccountStatus.dataset.state = "";
    try {
      const { error } = await supabase.functions.invoke("delete-account", { body: { confirmation: "KONTO LÖSCHEN" } });
      if (error) throw error;
      deleteAccountStatus.textContent = "Konto gelöscht. Du wirst abgemeldet …";
      deleteAccountStatus.dataset.state = "success";
      await supabase.auth.signOut({ scope: "local" });
      window.location.assign(new URL("index.html?auth=signin&account=deleted", window.location.href).toString());
    } catch (error) {
      deleteAccountStatus.textContent = error && error.message
        ? "Die Löschung konnte nicht abgeschlossen werden. " + error.message
        : "Die Löschung konnte nicht abgeschlossen werden. Bitte versuche es erneut.";
      deleteAccountStatus.dataset.state = "error";
      deleteAccountSubmit.dataset.busy = "";
      deleteAccountDialog.dataset.busy = "";
      deleteAccountDialog.querySelectorAll("[data-dialog-close]").forEach((button) => { button.disabled = false; });
      deleteAccountSubmit.disabled = deleteAccountConfirmation.value.trim() !== "KONTO LÖSCHEN";
    }
  });
  document.querySelector("#account-profile-edit").addEventListener("click", () => {
    roleChangeMode = false; roleChangeConfirmed = false;
    if (accountDialog.open) accountDialog.close();
    beginWizard(currentRole, currentRole ? 1 : 0);
  });
  document.querySelector("#account-role-change").addEventListener("click", () => {
    roleChangeMode = true; roleChangeConfirmed = false;
    if (accountDialog.open) accountDialog.close();
    beginWizard(currentRole, 0);
  });
  document.addEventListener("keydown", (event) => {
    const tab = event.target.closest("[data-matches-tab]");
    if (tab && (event.key === "ArrowRight" || event.key === "ArrowLeft")) {
      event.preventDefault();
      const nextTab = document.querySelector('[data-matches-tab="' + (event.key === "ArrowRight" ? "likes" : "matches") + '"]');
      if (nextTab) {
        setMatchesTab(nextTab.dataset.matchesTab);
        nextTab.focus();
      }
      return;
    }
    const messageCard = event.target.closest(".activity-message-card");
    if (messageCard && event.target === messageCard && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      if (messageCard.dataset.openSupportThread) openSupportConversation(messageCard.dataset.openSupportThread);
      else openConversation(messageCard.dataset.openConversation);
      return;
    }
    const card = event.target.closest(".activity-card-profile-clickable");
    if (!card || event.target !== card || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    openMatchedProfile(card.dataset.openProfile, card.dataset.profileContext || "match");
  });
  document.querySelector("#conversation-thread")?.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-message-bubble]")) {
      event.preventDefault();
      messageReactionPickerId = messageReactionPickerId === event.target.dataset.messageBubble ? "" : event.target.dataset.messageBubble;
      renderConversationThread();
    }
  });

  const conversationThread = document.querySelector("#conversation-thread");
  if (conversationThread) {
    conversationThread.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" || event.target.closest("[data-own-message-menu], .message-reaction-sticker")) return;
      const bubble = event.target.closest("[data-own-message]");
      if (!bubble || !messageDeletionFeatureAvailable) return;
      if (messageLongPressTimer) window.clearTimeout(messageLongPressTimer);
      const messageId = bubble.dataset.ownMessage;
      messageLongPressStart = { x: event.clientX, y: event.clientY };
      messageLongPressTimer = window.setTimeout(() => {
        messageLongPressTimer = null;
        messageLongPressStart = null;
        suppressOwnMessageClickUntil = Date.now() + 900;
        openDeleteMessageDialog(messageId);
      }, 550);
    });
    conversationThread.addEventListener("contextmenu", (event) => {
      if (event.target.closest(".message-reaction-sticker")) return;
      const bubble = event.target.closest("[data-own-message]");
      if (!bubble || !messageDeletionFeatureAvailable) return;
      event.preventDefault();
      openDeleteMessageDialog(bubble.dataset.ownMessage);
    });
  }
  const cancelMessageLongPress = () => {
    if (messageLongPressTimer) window.clearTimeout(messageLongPressTimer);
    messageLongPressTimer = null;
    messageLongPressStart = null;
  };
  document.addEventListener("pointermove", (event) => {
    if (!messageLongPressTimer || !messageLongPressStart) return;
    if (Math.hypot(event.clientX - messageLongPressStart.x, event.clientY - messageLongPressStart.y) > 12) cancelMessageLongPress();
  });
  document.addEventListener("pointerup", cancelMessageLongPress);
  document.addEventListener("pointercancel", cancelMessageLongPress);

  const messagesListForDelete = document.querySelector("#messages-list");
  const cancelConversationLongPress = () => {
    if (conversationLongPressTimer) window.clearTimeout(conversationLongPressTimer);
    conversationLongPressTimer = null;
    conversationLongPressStart = null;
  };
  messagesListForDelete.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" || event.target.closest("[data-delete-conversation]")) return;
    const card = event.target.closest(".activity-message-card");
    if (!card) return;
    const kind = card.dataset.openSupportThread ? "support" : "match";
    const id = card.dataset.openSupportThread || card.dataset.openConversation;
    if (!id) return;
    conversationLongPressStart = { x: event.clientX, y: event.clientY };
    conversationLongPressTimer = window.setTimeout(() => {
      conversationLongPressTimer = null;
      conversationLongPressStart = null;
      suppressConversationClickUntil = Date.now() + 1000;
      const selection = window.getSelection && window.getSelection();
      if (selection) selection.removeAllRanges();
      openDeleteConversationDialog(kind, id);
    }, 550);
  });
  messagesListForDelete.addEventListener("contextmenu", (event) => {
    if (event.target.closest("[data-delete-conversation]")) return;
    const card = event.target.closest(".activity-message-card");
    if (!card) return;
    event.preventDefault();
    const kind = card.dataset.openSupportThread ? "support" : "match";
    openDeleteConversationDialog(kind, card.dataset.openSupportThread || card.dataset.openConversation);
  });
  document.addEventListener("pointermove", (event) => {
    if (!conversationLongPressTimer || !conversationLongPressStart) return;
    if (Math.hypot(event.clientX - conversationLongPressStart.x, event.clientY - conversationLongPressStart.y) > 12) cancelConversationLongPress();
  });
  document.addEventListener("pointerup", cancelConversationLongPress);
  document.addEventListener("pointercancel", cancelConversationLongPress);

  document.addEventListener("click", async (event) => {
    if (!event.target.closest("#conversation-action-menu") && !event.target.closest("#conversation-menu-button")) setConversationMenuOpen(false);
    if (Date.now() < suppressConversationClickUntil && event.target.closest("#messages-list .activity-message-card")) {
      suppressConversationClickUntil = 0;
      event.preventDefault();
      return;
    }
    if (Date.now() < suppressOwnMessageClickUntil && event.target.closest("#delete-message-dialog")) {
      suppressOwnMessageClickUntil = 0;
      event.preventDefault();
      return;
    }
    const menuButton = event.target.closest("#conversation-menu-button");
    if (menuButton) {
      event.preventDefault();
      setConversationMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
      return;
    }
    const blockAction = event.target.closest("[data-conversation-block-action]");
    if (blockAction) {
      event.preventDefault();
      setConversationMenuOpen(false);
      openBlockProfileDialog();
      return;
    }
    const confirmBlock = event.target.closest("#block-profile-confirm");
    if (confirmBlock) {
      await applyProfileBlock();
      return;
    }
    const deleteConversationButton = event.target.closest("[data-delete-conversation]");
    if (deleteConversationButton) {
      event.preventDefault();
      openDeleteConversationDialog(deleteConversationButton.dataset.deleteConversationKind, deleteConversationButton.dataset.deleteConversation);
      return;
    }
    const confirmConversationDelete = event.target.closest("#delete-conversation-confirm");
    if (confirmConversationDelete) {
      confirmConversationDelete.disabled = true;
      document.querySelector("#delete-conversation-status").textContent = "Chat wird aus deiner Übersicht entfernt …";
      await deleteConversationForCurrentUser();
      return;
    }
    const partnerOffersOpen = event.target.closest("#account-partner-offers-open");
    if (partnerOffersOpen) {
      accountReturnScreen = "offers";
      if (accountDialog && accountDialog.open) accountDialog.close();
      setDashboardView("partner-offers");
      await refreshActivityViews();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const contactOpen = event.target.closest("#account-contact-open");
    if (contactOpen) {
      accountReturnScreen = "offers";
      if (accountDialog && accountDialog.open) accountDialog.close();
      openWorkspaceDialog(contactDialog);
      await loadSupportData(true);
      return;
    }
    const confirmMessageDelete = event.target.closest("#delete-message-confirm");
    if (confirmMessageDelete) {
      const messageId = pendingDeleteMessageId;
      const message = (activityCache.messages || []).find((item) => item.id === messageId && item.sender_id === currentUser.id);
      if (!message || !messageDeletionFeatureAvailable) return;
      const status = document.querySelector("#delete-message-status");
      confirmMessageDelete.disabled = true;
      status.textContent = "Nachricht wird für beide gelöscht …";
      const deletedAt = new Date().toISOString();
      const { data, error } = await supabase.from("profile_messages")
        .update({ body: "[Diese Nachricht wurde gelöscht.]", deleted_at: deletedAt })
        .eq("id", messageId).eq("sender_id", currentUser.id).is("deleted_at", null)
        .select("id").maybeSingle();
      confirmMessageDelete.disabled = false;
      if (error || !data) {
        status.textContent = error ? "Die Nachricht konnte nicht gelöscht werden. Bitte prüfe die Nachrichten-Löschmigration in Supabase." : "Die Nachricht wurde bereits gelöscht oder ist nicht mehr verfügbar.";
        return;
      }
      const cachedMessage = (activityCache.messages || []).find((item) => item.id === messageId);
      if (cachedMessage) {
        cachedMessage.body = "[Diese Nachricht wurde gelöscht.]";
        cachedMessage.deleted_at = deletedAt;
      }
      activityCache.reactions = (activityCache.reactions || []).filter((item) => item.message_id !== messageId);
      pendingDeleteMessageId = "";
      document.querySelector("#delete-message-dialog").close();
      await renderConversationThread();
      renderMessagesList();
      showNotice("Nachricht wurde für beide Seiten gelöscht.");
      return;
    }
    const ownMessageMenuButton = event.target.closest("[data-own-message-menu]");
    if (ownMessageMenuButton) {
      openDeleteMessageDialog(ownMessageMenuButton.dataset.ownMessageMenu);
      return;
    }
    if (event.target.closest(".message-reaction-sticker")) return;
    const matchesTab = event.target.closest("[data-matches-tab]");
    if (matchesTab) {
      setMatchesTab(matchesTab.dataset.matchesTab);
      return;
    }
    const offerBack = event.target.closest("#offer-detail-back");
    if (offerBack) {
      const currentPartnerOffersView = !document.querySelector("#partner-offers-view").hidden;
      if (currentPartnerOffersView) {
        setDashboardView("home");
        setAccountMenuScreen("offers");
        openWorkspaceDialog(accountDialog);
      } else {
        setDashboardView(offerDetailReturnView);
      }
      return;
    }
    const profileBack = event.target.closest("#matched-profile-back");
    if (profileBack) {
      if (activeMatchedProfileContext === "like") setMatchesTab("likes");
      setDashboardView("matches");
      return;
    }
    const cardAction = event.target.closest("[data-like-back], [data-dismiss-like], [data-open-conversation]");
    const profileButton = cardAction ? null : event.target.closest("[data-open-profile]");
    if (profileButton) {
      const conversationDialog = profileButton.closest("#conversation-dialog");
      if (conversationDialog && conversationDialog.open) conversationDialog.close();
      openMatchedProfile(profileButton.dataset.openProfile, profileButton.dataset.profileContext || "match");
      return;
    }
    const profileDecision = event.target.closest("[data-profile-decision]");
    if (profileDecision) { await handleProfileDecision(profileDecision); return; }
    const discoverMode = event.target.closest("[data-discover-mode]");
    if (discoverMode) {
      await setDiscoverMode(discoverMode.dataset.discoverMode);
      return;
    }
    const removeSaved = event.target.closest("[data-remove-saved-profile]");
    if (removeSaved) {
      await removeSavedProfile(removeSaved.dataset.removeSavedProfile, removeSaved);
      return;
    }
    const discoverAction = event.target.closest("[data-discover-action]");
    if (discoverAction) {
      await handleDiscoverAction(discoverAction);
      return;
    }
    const heartReaction = event.target.closest("[data-message-heart]");
    if (heartReaction) {
      const messageId = heartReaction.dataset.messageHeart;
      const alreadyReacted = (activityCache.reactions || []).some((reaction) => reaction.message_id === messageId && reaction.user_id === currentUser.id && reaction.reaction === "heart");
      heartReaction.disabled = true;
      const result = alreadyReacted
        ? await supabase.from("profile_message_reactions").delete().eq("message_id", messageId).eq("user_id", currentUser.id).eq("reaction", "heart")
        : await supabase.from("profile_message_reactions").insert({ message_id: messageId, user_id: currentUser.id, reaction: "heart" });
      if (result.error) {
        heartReaction.disabled = false;
        showNotice("Dein Herz konnte nicht gespeichert werden. Prüfe die Nachrichtenreaktions-Migration in Supabase.");
        return;
      }
      activityCache.reactions = (activityCache.reactions || []).filter((reaction) => !(reaction.message_id === messageId && reaction.user_id === currentUser.id && reaction.reaction === "heart"));
      if (!alreadyReacted) activityCache.reactions.push({ message_id: messageId, user_id: currentUser.id, reaction: "heart" });
      messageReactionPickerId = "";
      await renderConversationThread();
      await refreshOpenConversationMessages();
      return;
    }
    const messageBubble = event.target.closest("[data-message-bubble]");
    if (messageBubble) {
      if (reactionFeatureAvailable) {
        const messageId = messageBubble.dataset.messageBubble;
        messageReactionPickerId = messageReactionPickerId === messageId ? "" : messageId;
        await renderConversationThread();
      }
      return;
    }
    if (messageReactionPickerId) {
      messageReactionPickerId = "";
      if (document.querySelector("#conversation-dialog")?.open) await renderConversationThread();
    }
    const likeBack = event.target.closest("[data-like-back]");
    if (likeBack) {
      likeBack.disabled = true;
      const peerId = likeBack.dataset.likeBack;
      const result = await sendProfileLike(peerId);
      if (result.error) {
        showNotice("Dein Like konnte nicht gespeichert werden.");
        likeBack.disabled = false;
        return;
      }
      await refreshActivityViews();
      if (result.newMatch) openMatchDialog(peerId, false);
      return;
    }
    const dismiss = event.target.closest("[data-dismiss-like]");
    if (dismiss) {
      dismiss.disabled = true;
      const skippedId = dismiss.dataset.dismissLike;
      const { error: skipError } = await supabase.from("profile_skips").insert({
        skipper_id: currentUser.id,
        skipped_id: skippedId
      });
      if (skipError && !/duplicate|unique/i.test(skipError.message || "")) {
        showNotice("Das Profil konnte nicht dauerhaft übersprungen werden. Prüfe die Entdecken-Migration in Supabase.");
        dismiss.disabled = false;
        return;
      }
      const { error } = await supabase.from("profile_likes").delete()
        .eq("liker_id", skippedId).eq("liked_id", currentUser.id);
      if (error) showNotice("Das Like konnte nicht ausgeblendet werden. Prüfe die Profil-Likes-Migration.");
      else {
        discoverState.skippedIds.add(skippedId);
        discoverState.ids = discoverState.ids.filter((id) => id !== skippedId);
      }
      await refreshActivityViews();
      return;
    }
    const openSupport = event.target.closest("[data-open-support-thread]");
    if (openSupport) { await openSupportConversation(openSupport.dataset.openSupportThread); return; }
    const openMessage = event.target.closest("[data-open-conversation]");
    if (openMessage) await openConversation(openMessage.dataset.openConversation);
  });

  const matchDialog = document.querySelector("#match-dialog");
  if (matchDialog) {
    matchDialog.addEventListener("click", async (event) => {
      const close = event.target.closest("[data-match-close]");
      if (close || event.target === matchDialog) {
        matchDialog.close();
        pendingMatchPeerId = "";
        return;
      }
      if (event.target.closest("[data-match-message]")) {
        const peerId = pendingMatchPeerId;
        matchDialog.close();
        pendingMatchPeerId = "";
        if (!peerId) return;
        setDashboardView("messages");
        await openConversation(peerId);
        return;
      }
      if (event.target.closest("[data-match-discover]")) {
        const fromDiscover = pendingMatchFromDiscover;
        matchDialog.close();
        pendingMatchPeerId = "";
        if (fromDiscover) return;
        setDashboardView("discover");
        discoverState.mode = "discover";
        discoverState.loaded = false;
        discoverState.active = null;
        discoverState.ids = [];
        discoverState.index = 0;
        await loadDiscoverFeed();
      }
    });
    matchDialog.addEventListener("close", () => {
      matchDialog.classList.remove("is-flashing");
      if (!matchDialog.open) pendingMatchPeerId = "";
    });
  }

  document.querySelector("#conversation-input").addEventListener("input", (event) => {
    const input = event.currentTarget;
    input.style.height = "50px";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
    input.style.overflowY = input.scrollHeight > 120 ? "auto" : "hidden";
  });

  document.querySelector("#conversation-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.querySelector("#conversation-input");
    const status = document.querySelector("#conversation-status");
    const body = String(input.value || "").trim();
    if (!body || (!activeConversationPeer && !activeSupportThreadId)) return;
    status.textContent = "";
    const form = document.querySelector("#conversation-form");
    form.setAttribute("aria-busy", "true");
    const send = document.querySelector("#conversation-form button[type=submit]");
    send.disabled = true;
    if (activeConversationPeer && isPeerBlocked(activeConversationPeer)) {
      status.textContent = "Nachricht konnte nicht gesendet werden, weil dieser Chat blockiert ist.";
      return;
    }
    if (activeSupportThreadId) {
      const { error: supportError } = await supabase.from("support_messages").insert({
        thread_id: activeSupportThreadId,
        sender_id: currentUser.id,
        sender_type: supportOperator ? "operator" : "user",
        body
      });
      send.disabled = false;
      form.removeAttribute("aria-busy");
      if (supportError) {
        status.textContent = "Nachricht konnte nicht gesendet werden. Prüfe die Support-Migration und deine Berechtigung.";
        return;
      }
      input.value = "";
      input.style.height = "50px";
      input.style.overflowY = "hidden";
      await loadSupportData(false);
      renderMessagesList();
      await renderConversationThread(true);
      return;
    }
    const { error } = await supabase.from("profile_messages").insert({
      sender_id: currentUser.id,
      recipient_id: activeConversationPeer,
      body
    });
    send.disabled = false;
    form.removeAttribute("aria-busy");
    if (error) {
      status.textContent = String(error.message || "").includes("profile_blocked")
        ? "Nachricht konnte nicht gesendet werden, weil dieser Chat blockiert ist."
        : "Nachricht konnte nicht gesendet werden. Prüfe, ob das Match noch besteht.";
      return;
    }
    input.value = "";
    input.style.height = "50px";
    input.style.overflowY = "hidden";
    status.textContent = "";
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
    if (!["home", "profile", "matches", "messages", "discover"].includes(view)) return;
    if (restrictedAccount && view !== "messages") { showNotice("Dein Konto ist derzeit eingeschränkt. Du kannst den Support kontaktieren oder dein Konto löschen."); return; }
    if (wizard.isEditing) await closeProfileEditor();
    setDashboardView(view);
    if (view === "home" || view === "matches" || view === "messages") await refreshActivityViews();
    if (view === "discover") await loadDiscoverFeed();
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

  function waitForAuthSession(timeoutMs = 950) {
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
        else if (event === "SIGNED_OUT" || event === "INITIAL_SESSION") finish(null);
      });
      subscription = listener.data.subscription;
      if (settled && subscription) subscription.unsubscribe();
      supabase.auth.getSession().then(({ data, error }) => {
        if (!error) finish(data.session || null);
      }).catch(() => {});
    });
  }

  async function start() {
    if (!config || !config.url || !config.publishableKey || !createClient) {
      showError("Die Supabase-Verbindung konnte nicht geladen werden.", "Verbindung nicht verfügbar");
      return;
    }
    supabase = createClient(config.url, config.publishableKey);
    const session = await waitForAuthSession();
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
    const [{ data: profile, error }, { data: photos, error: photoError }, { data: businessRows, error: businessError }] = await Promise.all([
      supabase.from(table).select("*").eq("id", currentUser.id).maybeSingle(),
      supabase.from("profile_photos").select("photo_type,object_path,display_path,sort_order").eq("user_id", currentUser.id).order("sort_order"),
      account.role === "photographer" ? supabase.rpc("get_own_photographer_business_details") : Promise.resolve({ data: [], error: null })
    ]);
    if (error) {
      showError("Dein Profil konnte nicht geladen werden.", "Profil nicht erreichbar");
      return;
    }
    if (businessError) {
      showError("Deine Registerdaten konnten nicht geladen werden.", "Profil nicht erreichbar");
      return;
    }
    if (account.role === "photographer" && profile && businessRows && businessRows[0]) Object.assign(profile, {
      admin_uid_number: businessRows[0].uid_number || "",
      admin_company_number: businessRows[0].company_number || "",
      admin_company_name: businessRows[0].company_name || ""
    });
    await keepLoadingVisible();
    if (photoError) showNotice("Einige Profilfotos konnten nicht geladen werden.");
    await setupRole(account.role, currentUser, true, profileGreeting(account.role, profile), profile, photoError ? [] : photos || []);
    const { data: accountStateRows, error: accountStateError } = await supabase.rpc("admin_account_state_for_me");
    const accountState = !accountStateError && accountStateRows && accountStateRows[0] ? accountStateRows[0] : null;
    if (accountState && ["suspended","paused"].includes(accountState.status)) {
      restrictedAccount = true;
      document.querySelectorAll("#desktop-nav [data-nav-item], #mobile-nav [data-nav-item]").forEach(button => { button.hidden = button.dataset.navItem !== "messages"; });
      setDashboardView("messages");
      await refreshActivityViews();
      showNotice(`${accountState.reason ? `Grund: ${accountState.reason}. ` : ""}Dein Konto ist derzeit eingeschränkt. Nutze den WedConnect-Support oder lösche dein Konto.`);
    }
    const { data: accountNotices, error: noticeError } = await supabase.rpc("admin_user_notices_for_me");
    if (!noticeError && accountNotices && accountNotices.length) {
      const latestNotice = accountNotices.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
      showNotice(latestNotice.message);
    }
    const requestedAccountScreen = new URLSearchParams(window.location.search).get("account");
    if (requestedAccountScreen === "legal") {
      setAccountMenuScreen("legal");
      openWorkspaceDialog(accountDialog);
    }
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") window.location.replace(new URL("index.html?auth=signin", window.location.href).toString());
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshDiscoverProfiles();
  });

  window.addEventListener("scroll", syncOverviewScrollHint, { passive: true });
  window.addEventListener("resize", syncOverviewScrollHint);
  const homeForScrollHint = document.querySelector("#home-view");
  if (homeForScrollHint && "ResizeObserver" in window) {
    const overviewHintResizeObserver = new ResizeObserver(syncOverviewScrollHint);
    overviewHintResizeObserver.observe(homeForScrollHint);
  }
  window.setTimeout(syncOverviewScrollHint, 0);

  start().catch(() => showError("Beim Laden deines WedConnect-Bereichs ist ein Fehler aufgetreten."));
})();
