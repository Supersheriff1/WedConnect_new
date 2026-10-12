(() => {
  const dialog = document.querySelector("#signup-dialog");
  if (!dialog) return;

  const config = window.WEDCONNECT_SUPABASE_CONFIG;
  const createClient = window.supabase && window.supabase.createClient;
  const form = document.querySelector("#auth-form");
  const status = document.querySelector("#auth-status");
  const passwordField = document.querySelector("#auth-password-field");
  const passwordInput = document.querySelector("#auth-password");
  const submitButton = document.querySelector("[data-auth-submit]");
  const googleButton = document.querySelector("[data-google-auth]");
  const toggleButton = document.querySelector("[data-auth-toggle]");
  const resetButton = document.querySelector("[data-password-reset]");
  const closeButton = document.querySelector("[data-auth-close]");
  const title = document.querySelector("#dialog-title");
  const emailInput = document.querySelector("#auth-email");
  let mode = "signup";
  let busy = false;
  let pendingGoogleReturn = authReturn === "google";
  const googleModeStorageKey = "wedconnect-google-auth-mode";

  if (!config || !config.url || !config.publishableKey || !createClient) {
    document.querySelectorAll("[data-signup]").forEach((button) => button.addEventListener("click", () => {
      dialog.showModal();
      setStatus("Die Supabase-Verbindung konnte nicht geladen werden. Bitte später erneut versuchen.", "error");
    }));
    return;
  }

  const supabase = createClient(config.url, config.publishableKey);

  function setStatus(message, state = "info") {
    status.textContent = message;
    status.dataset.state = state;
  }

  function setMode(nextMode) {
    mode = nextMode;
    const isSignup = mode === "signup";
    const isSignin = mode === "signin";
    const isRecoveryRequest = mode === "recovery-request";
    const isRecoveryUpdate = mode === "recovery-update";

    title.textContent = isSignup ? "Konto erstellen" : isSignin ? "Anmelden" : isRecoveryRequest ? "Passwort zurücksetzen" : "Neues Passwort festlegen";
    document.querySelector("#auth-intro").textContent = isSignup
      ? "Erstelle zuerst dein Konto. Deine Rolle legst du später im Profil fest."
      : isSignin ? "Melde dich mit deiner E-Mail-Adresse oder Google an."
      : isRecoveryRequest ? "Wir senden dir einen Link zum Zurücksetzen deines Passworts."
      : "Lege ein neues Passwort für dein Konto fest.";
    passwordField.hidden = isRecoveryRequest;
    passwordInput.autocomplete = isSignup ? "new-password" : "current-password";
    passwordInput.required = !isRecoveryRequest;
    passwordInput.minLength = isRecoveryUpdate ? 8 : 8;
    passwordInput.value = "";
    if (isRecoveryRequest) passwordInput.required = false;
    if (isRecoveryUpdate) {
      passwordField.hidden = false;
      passwordInput.autocomplete = "new-password";
    }

    submitButton.textContent = isSignup ? "Konto erstellen" : isSignin ? "Anmelden" : isRecoveryRequest ? "Link per E-Mail senden" : "Passwort speichern";
    googleButton.hidden = isRecoveryRequest || isRecoveryUpdate;
    toggleButton.hidden = isRecoveryRequest || isRecoveryUpdate;
    resetButton.hidden = !isSignin;
    toggleButton.textContent = isSignin ? "Noch kein Konto? Konto erstellen" : "Schon registriert? Anmelden";
    setStatus("");
  }

  function redirectUrl(state) {
    const url = new URL(window.location.href);
    url.searchParams.set("auth", state);
    return url.toString();
  }

  function savedGoogleMode() {
    try {
      return window.sessionStorage.getItem(googleModeStorageKey) === "signin" ? "signin" : "signup";
    } catch {
      return "signup";
    }
  }

  function clearGoogleMode() {
    try {
      window.sessionStorage.removeItem(googleModeStorageKey);
    } catch {
      // Session storage may be unavailable in restricted browser contexts.
    }
  }

  function clearAuthReturn() {
    const url = new URL(window.location.href);
    url.searchParams.delete("auth");
    window.history.replaceState(window.history.state, "", url.toString());
  }

  function googleReturnError() {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    return query.get("error_description") || hash.get("error_description")
      || query.get("error") || hash.get("error");
  }

  document.querySelectorAll("[data-signup]").forEach((button) => {
    button.addEventListener("click", () => {
      setMode("signup");
      dialog.showModal();
    });
  });

  closeButton.addEventListener("click", () => dialog.close());
  toggleButton.addEventListener("click", () => setMode(mode === "signup" ? "signin" : "signup"));

  resetButton.addEventListener("click", () => {
    setMode("recovery-request");
    emailInput.focus();
  });

  googleButton.addEventListener("click", async () => {
    googleButton.disabled = true;
    setStatus("Weiterleitung zu Google …");
    try {
      window.sessionStorage.setItem(googleModeStorageKey, mode);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl("google") }
      });
      if (error) throw error;
    } catch (error) {
      clearGoogleMode();
      setStatus(error && error.message ? error.message : "Die Anmeldung mit Google ist gerade nicht verfügbar.", "error");
      googleButton.disabled = false;
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    if (!form.reportValidity()) return;

    busy = true;
    submitButton.disabled = true;
    googleButton.disabled = true;
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl("confirmed")
          }
        });
        if (error) throw error;
        if (data.session) {
          setStatus("Konto erstellt. Dein Profilbereich folgt im nächsten Entwicklungsschritt.", "success");
        } else {
          setStatus("Fast geschafft: Öffne den Bestätigungslink, den Supabase an deine E-Mail-Adresse geschickt hat.", "success");
        }
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setStatus("Anmeldung erfolgreich. Dein Profilbereich folgt im nächsten Entwicklungsschritt.", "success");
      } else if (mode === "recovery-request") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl("password-reset")
        });
        if (error) throw error;
        setStatus("Wenn ein Konto zu dieser Adresse besteht, erhältst du eine E-Mail mit dem Link zum Zurücksetzen.", "success");
      } else if (mode === "recovery-update") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMode("signin");
        setStatus("Dein Passwort wurde geändert.", "success");
      }
    } catch (error) {
      const message = error && error.message ? error.message : "Das hat gerade nicht funktioniert. Bitte versuche es erneut.";
      setStatus(message, "error");
    } finally {
      busy = false;
      submitButton.disabled = false;
      googleButton.disabled = false;
    }
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      setMode("recovery-update");
      setStatus("Lege jetzt ein neues Passwort fest.");
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (pendingGoogleReturn && (event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
      pendingGoogleReturn = false;
      setMode(savedGoogleMode());
      clearGoogleMode();
      setStatus("Google-Anmeldung erfolgreich. Dein Profilbereich folgt im nächsten Entwicklungsschritt.", "success");
      if (!dialog.open) dialog.showModal();
      clearAuthReturn();
    }
  });

  setMode("signup");

  const authReturn = new URLSearchParams(window.location.search).get("auth");
  if (authReturn === "confirmed") {
    setMode("signin");
    setStatus("E-Mail bestätigt. Du kannst dich jetzt anmelden.", "success");
    dialog.showModal();
  } else if (authReturn === "password-reset") {
    setMode("recovery-update");
    dialog.showModal();
  } else if (authReturn === "google") {
    setMode(savedGoogleMode());
    dialog.showModal();
    const oauthError = googleReturnError();
    if (oauthError) {
      pendingGoogleReturn = false;
      clearGoogleMode();
      setStatus(`Google-Anmeldung fehlgeschlagen: ${oauthError}`, "error");
      clearAuthReturn();
    } else {
      setStatus("Google-Anmeldung wird abgeschlossen …");
    }
  } else if (authReturn === "signup") {
    setMode("signup");
    dialog.showModal();
  } else if (authReturn === "signin") {
    setMode("signin");
    dialog.showModal();
  }
})();