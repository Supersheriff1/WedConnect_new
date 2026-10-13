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
  const maxPortfolioPhotoBytes = 2 * 1024 * 1024;
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
  let wizard = { step: 0, role: "", data: { couple: {}, photographer: {} }, photos: [], pendingPhotos: [] };

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
    ["black_white", "Schwarz-Weiß"]
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
    ["full_day", "Ganztagesreportage"],
    ["custom", "Individuelle Kombination"]
  ];

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
      multiSelectField("regions", "Region und Einsatzgebiet", REGION_OPTIONS, "Wähle ein oder mehrere Bundesländer. „Ganz Österreich“ schließt einzelne Bundesländer aus.") +
      '<div class="experience-grid">' +
      field("experience_years", "Erfahrung in Jahren", "number", "Optional, wenn du stattdessen Hochzeiten angibst.", false, ' min="0" max="80" step="1" inputmode="numeric"') +
      field("weddings_photographed", "Fotografierte Hochzeiten", "number", "Optional, wenn du stattdessen Jahre angibst.", false, ' min="0" max="10000" step="1" inputmode="numeric"') +
      "</div>" +
      multiSelectField("styles", "Dein Bildstil", STYLE_OPTIONS, "Wähle alle Bildstile, die deine Arbeit beschreiben.") +
      "</div>";
  }

  function renderPhotographerDetails() {
    return multiSelectField("coverage_options", "Begleitungsumfang", COVERAGE_OPTIONS, "Wähle alle Abschnitte und Reportage-Formate aus, die du anbietest.") +
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
    return '<div class="photo-panel portfolio-upload-panel"><h3>Deine Stilfotos</h3><p>Lade mindestens 3 Fotos hoch, die deinen Stil am besten zeigen. JPG, PNG oder WebP · maximal 2 MB pro Bild.</p>' +
      '<div id="portfolio-existing-photos" class="portfolio-photo-grid" aria-label="Bereits hochgeladene Stilfotos"></div>' +
      '<div id="portfolio-pending-photos" class="portfolio-photo-grid" aria-label="Ausgewählte Stilfotos"></div>' +
      '<input type="file" name="portfolio-photos" accept="image/jpeg,image/png,image/webp" multiple>' +
      '<p class="photo-count" id="portfolio-photo-count">Bereits hochgeladen: ' + portfolioCount + ' / 3</p></div>";
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
          ["Vorname", data.first_name],
          ["Region", (Array.isArray(data.regions) ? data.regions : []).map((value) => (REGION_OPTIONS.find((option) => option[0] === value) || [value, value])[1]).join(", ") || data.region],
          ["Erfahrung", [data.experience_years !== null && data.experience_years !== undefined && data.experience_years !== "" ? data.experience_years + (Number(data.experience_years) === 1 ? " Jahr" : " Jahre") : "", data.weddings_photographed !== null && data.weddings_photographed !== undefined && data.weddings_photographed !== "" ? data.weddings_photographed + " Hochzeiten" : ""].filter(Boolean).join(" · ") || data.experience],
          ["Bildstil", (Array.isArray(data.styles) ? data.styles : []).map((value) => (STYLE_OPTIONS.find((option) => option[0] === value) || [value, value])[1]).join(", ") || data.visual_style],
          ["Verfügbarkeit", data.availability],
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
          ? (wizard.role === "couple" ? "Erzähl kurz von eurer Feier und euren Bildwünschen." : "Wähle deinen Begleitungsumfang und verlinke optional deine Kanäle.")
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
    if (step === 3 && wizard.role === "photographer") attachPortfolioPhotoControls();
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
  const cropRotate = document.querySelector("#crop-rotate");
  let cropDrag = null;

  function openCropEditor(blob, onApply) {
    const sourceUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      cropState = { image, sourceUrl, onApply, rotation: 0, zoom: 1, offsetX: 0, offsetY: 0 };
      cropCanvas.width = 1200;
      cropCanvas.height = 800;
      cropZoom.value = "1";
      drawCrop(cropCanvas, cropState);
      cropDialog.showModal();
    };
    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      errorLine.textContent = "Das Foto konnte nicht geöffnet werden.";
    };
    image.src = sourceUrl;
  }

  function blobFromCanvas(canvas, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Das Foto konnte nicht verarbeitet werden.")), "image/jpeg", quality);
    });
  }

  async function createCroppedPhoto() {
    let result = await blobFromCanvas(cropCanvas, 0.88);
    if (result.size <= maxPortfolioPhotoBytes) return result;
    result = await blobFromCanvas(cropCanvas, 0.74);
    if (result.size <= maxPortfolioPhotoBytes) return result;
    const reduced = document.createElement("canvas");
    reduced.width = 900;
    reduced.height = 600;
    drawCrop(reduced, cropState);
    result = await blobFromCanvas(reduced, 0.72);
    if (result.size > maxPortfolioPhotoBytes) throw new Error("Das zugeschnittene Foto ist noch größer als 2 MB.");
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
    if (!cropState) return;
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
      errorLine.textContent = error && error.message ? error.message : "Das Foto konnte nicht gespeichert werden.";
    } finally {
      cropSave.disabled = false;
      cropSave.textContent = "Zuschnitt übernehmen";
    }
  });

  function renderPendingPortfolioPhotos() {
    const container = document.querySelector("#portfolio-pending-photos");
    if (!container) return;
    container.innerHTML = "";
    (wizard.pendingPhotos || []).forEach((item, index) => {
      const card = document.createElement("article");
      card.className = "portfolio-photo-card";
      const image = document.createElement("img");
      image.src = item.previewUrl;
      image.alt = "Ausgewähltes Stilfoto " + (index + 1);
      const caption = document.createElement("p");
      caption.textContent = item.name;
      const actions = document.createElement("div");
      actions.className = "portfolio-photo-actions";
      const cropButton = document.createElement("button");
      cropButton.className = "button button-secondary";
      cropButton.type = "button";
      cropButton.textContent = "Zuschneiden / ausrichten";
      cropButton.addEventListener("click", () => openCropEditor(item.file, async (blob) => {
        URL.revokeObjectURL(item.previewUrl);
        item.file = new File([blob], item.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
        item.previewUrl = URL.createObjectURL(blob);
        renderPendingPortfolioPhotos();
      }));
      const removeButton = document.createElement("button");
      removeButton.className = "button button-secondary";
      removeButton.type = "button";
      removeButton.textContent = "Entfernen";
      removeButton.addEventListener("click", () => {
        URL.revokeObjectURL(item.previewUrl);
        wizard.pendingPhotos.splice(index, 1);
        renderPendingPortfolioPhotos();
        updatePortfolioPhotoCount();
      });
      actions.append(cropButton, removeButton);
      card.append(image, caption, actions);
      container.append(card);
    });
  }

  function updatePortfolioPhotoCount() {
    const count = document.querySelector("#portfolio-photo-count");
    if (count) count.textContent = "Bereits hochgeladen: " + currentPhotoCount("portfolio") + " · ausgewählt: " + (wizard.pendingPhotos || []).length + " · mindestens 3";
  }

  async function loadExistingPortfolioPhotos() {
    const container = document.querySelector("#portfolio-existing-photos");
    if (!container) return;
    container.innerHTML = "";
    const portfolio = wizard.photos.filter((photo) => photo.photo_type === "portfolio");
    for (const [index, photo] of portfolio.entries()) {
      const { data, error } = await supabase.storage.from(photoBucket).createSignedUrl(photo.object_path, 600);
      if (error || !data || !data.signedUrl) continue;
      const card = document.createElement("article");
      card.className = "portfolio-photo-card";
      const image = document.createElement("img");
      image.src = data.signedUrl;
      image.alt = "Hochgeladenes Stilfoto " + (index + 1);
      const caption = document.createElement("p");
      caption.textContent = "Stilfoto " + (index + 1);
      const editButton = document.createElement("button");
      editButton.className = "button button-secondary";
      editButton.type = "button";
      editButton.textContent = "Zuschneiden / ausrichten";
      editButton.addEventListener("click", async () => {
        editButton.disabled = true;
        try {
          const response = await fetch(data.signedUrl);
          if (!response.ok) throw new Error("Das Foto konnte nicht geladen werden.");
          const sourceBlob = await response.blob();
          openCropEditor(sourceBlob, async (blob) => {
            const { error: uploadError } = await supabase.storage.from(photoBucket).upload(photo.object_path, blob, {
              contentType: "image/jpeg",
              upsert: true
            });
            if (uploadError) throw new Error("Das zugeschnittene Foto konnte nicht gespeichert werden.");
            await loadExistingPortfolioPhotos();
          });
        } catch (error) {
          errorLine.textContent = error && error.message ? error.message : "Das Foto konnte nicht bearbeitet werden.";
        } finally {
          editButton.disabled = false;
        }
      });
      card.append(image, caption, editButton);
      container.append(card);
    }
    updatePortfolioPhotoCount();
  }

  function attachPortfolioPhotoControls() {
    const input = document.querySelector('[name="portfolio-photos"]');
    if (!input) return;
    renderPendingPortfolioPhotos();
    loadExistingPortfolioPhotos();
    updatePortfolioPhotoCount();
    input.addEventListener("change", () => {
      errorLine.textContent = "";
      const accepted = ["image/jpeg", "image/png", "image/webp"];
      const additions = [];
      for (const file of Array.from(input.files || [])) {
        if (!accepted.includes(file.type)) {
          errorLine.textContent = "Akzeptiert werden JPG-, PNG- und WebP-Dateien.";
          continue;
        }
        if (file.size > maxPortfolioPhotoBytes) {
          errorLine.textContent = "Jedes Stilfoto darf höchstens 2 MB groß sein.";
          continue;
        }
        additions.push({ file, name: file.name, previewUrl: URL.createObjectURL(file) });
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
      const regions = Array.isArray(data.regions) ? data.regions : [];
      const styles = Array.isArray(data.styles) ? data.styles : [];
      const regionLabels = regions.map((value) => (REGION_OPTIONS.find((option) => option[0] === value) || [value, value])[1]);
      const styleLabels = styles.map((value) => (STYLE_OPTIONS.find((option) => option[0] === value) || [value, value])[1]);
      const years = data.experience_years === "" || data.experience_years == null ? null : Number(data.experience_years);
      const weddings = data.weddings_photographed === "" || data.weddings_photographed == null ? null : Number(data.weddings_photographed);
      if (!regions.length) throw new Error("Wähle mindestens ein Einsatzgebiet aus.");
      if (!styles.length) throw new Error("Wähle mindestens einen Bildstil aus.");
      if (years === null && weddings === null) throw new Error("Gib Erfahrung in Jahren oder die Anzahl fotografierter Hochzeiten an.");
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
        if (!coverage.length) throw new Error("Wähle mindestens einen Begleitungsumfang aus.");
        data.coverage_options = coverage;
        data.coverage_scope = coverageLabels.join(", ");
      }
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
    wizard = { step: startStep, role: role || "", data: { couple: {}, photographer: {} }, photos: [], pendingPhotos: [] };
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
    const sizeLimit = photoType === "portfolio" ? maxPortfolioPhotoBytes : maxPhotoBytes;
    if (file.size > sizeLimit) {
      throw new Error("Jedes Foto darf höchstens " + (photoType === "portfolio" ? "2" : "10") + " MB groß sein.");
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
      const pending = wizard.pendingPhotos || [];
      const existingCount = currentPhotoCount("portfolio");
      if (existingCount + pending.length < 3) {
        throw new Error("Für dein Portfolio brauchst du mindestens 3 Stilfotos. Aktuell ausgewählt oder hochgeladen: " + (existingCount + pending.length) + ".");
      }
      for (const [index, item] of pending.entries()) {
        await uploadFile(item.file, "portfolio", existingCount + index);
      }
    }
    const { data, error } = await supabase.from("profile_photos")
      .select("photo_type,object_path,sort_order").eq("user_id", currentUser.id).order("sort_order");
    if (error) throw new Error("Die Fotoliste konnte nicht aktualisiert werden.");
    wizard.photos = data || [];
    if (wizard.role === "photographer") {
      (wizard.pendingPhotos || []).forEach((item) => URL.revokeObjectURL(item.previewUrl));
      wizard.pendingPhotos = [];
    }
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

  fields.addEventListener("change", (event) => {
    const target = event.target;
    if (!target.matches('input[type="checkbox"][data-select-group="regions"]')) return;
    const countrywide = fields.querySelector('input[name="regions"][value="AT"]');
    if (!countrywide) return;
    if (target.value === "AT" && target.checked) {
      fields.querySelectorAll('input[name="regions"]:not([value="AT"])').forEach((input) => { input.checked = false; });
    } else if (target.value !== "AT" && target.checked) {
      countrywide.checked = false;
    }
  });

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
        if (wizard.role === "photographer" && wizard.step === 1) {
          if (!values.regions || !values.regions.length) throw new Error("Wähle mindestens ein Einsatzgebiet aus.");
          if (!values.styles || !values.styles.length) throw new Error("Wähle mindestens einen Bildstil aus.");
          if (!values.experience_years && !values.weddings_photographed) throw new Error("Gib Erfahrung in Jahren oder die Anzahl fotografierter Hochzeiten an.");
        }
        if (wizard.role === "photographer" && wizard.step === 2 && (!values.coverage_options || !values.coverage_options.length)) {
          throw new Error("Wähle mindestens einen Begleitungsumfang aus.");
        }
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
          if (message.includes("portfolio_requires_3_photos")) throw new Error("Lade mindestens 3 Stilfotos hoch.");
          if (message.includes("portfolio_requires_10_photos")) throw new Error("Lade mindestens 3 Stilfotos hoch.");
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