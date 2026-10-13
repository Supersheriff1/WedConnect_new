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
  const authIntro = document.querySelector("#auth-intro");
  const authReturn = new URLSearchParams(window.location.search).get("auth");
  const googleModeStorageKey = "wedconnect-google-auth-mode";
  const roleField = document.createElement("label");
  const roleSelect = document.createElement("select");
  const pathname = window.location.pathname.toLowerCase();
  const pageRole = pathname.endsWith("/fotografen.html") ? "photographer"
    : pathname.endsWith("/hochzeitspaare.html") ? "couple" : "";
  let mode = "signup";
  let busy = false;
  let pendingGoogleReturn = authReturn === "google";
  let pendingRoleUser = null;
  let completingLogin = false;

  if (!config || !config.url || !config.publishableKey || !createClient) {
    document.querySelectorAll("[data-signup]").forEach((button) => button.addEventListener("click", () => {
      dialog.showModal();
      setStatus("Die Supabase-Verbindung konnte nicht geladen werden. Bitte später erneut versuchen.", "error");
    }));
    return;
  }

  const supabase = createClient(config.url, config.publishableKey);

  roleField.className = "auth-field";
  roleField.htmlFor = "auth-role";
  roleField.innerHTML = '<span>Ich bin hier als</span>';
  roleSelect.id = "auth-role";
  roleSelect.name = "account_role";
  roleSelect.required = true;
  roleSelect.innerHTML = '<option value="">Rolle auswählen</option><option value="couple">Hochzeitspaar</option><option value="photographer">Fotograf:in</option>';
  if (pageRole) roleSelect.value = pageRole;
  roleField.append(roleSelect);
  form.insertBefore(roleField, form.firstChild);

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
    authIntro.textContent = isSignup
      ? "Wähle deine Rolle. Sie bestimmt deinen persönlichen Bereich bei WedConnect."
      : isSignin ? "Melde dich mit deiner E-Mail-Adresse oder Google an. Wir öffnen dein Konto in der gespeicherten Rolle."
      : isRecoveryRequest ? "Wir senden dir einen Link zum Zurücksetzen deines Passworts."
      : "Lege ein neues Passwort für dein Konto fest.";
    roleField.hidden = !isSignup;
    roleSelect.required = isSignup;
    passwordField.hidden = isRecoveryRequest;
    passwordInput.autocomplete = isSignup ? "new-password" : "current-password";
    passwordInput.required = !isRecoveryRequest;
    passwordInput.minLength = 8;
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

  function savedGoogleRole() {
    try {
      const role = window.sessionStorage.getItem("wedconnect-google-auth-role");
      return role === "couple" || role === "photographer" ? role : "";
    } catch {
      return "";
    }
  }

  function clearGoogleState() {
    try {
      window.sessionStorage.removeItem(googleModeStorageKey);
      window.sessionStorage.removeItem("wedconnect-google-auth-role");
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

  async function resolveRole(user, fallbackRole = "") {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw new Error("Dein Profil konnte nicht geladen werden. Bitte prüfe die Supabase-Tabellen und versuche es erneut.");
    }
    if (profile && (profile.role === "couple" || profile.role === "photographer")) return profile.role;

    const metadataRole = user.user_metadata && user.user_metadata.account_role;
    const selectedRole = [metadataRole, fallbackRole].find((role) => role === "couple" || role === "photographer");
    if (!selectedRole) return "";

    const { data, error } = await supabase.rpc("assign_initial_role", { p_role: selectedRole });
    if (error) {
      const { data: refreshedProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (refreshedProfile && (refreshedProfile.role === "couple" || refreshedProfile.role === "photographer")) {
        return refreshedProfile.role;
      }
      throw new Error("Deine Rolle konnte nicht gespeichert werden. Bitte prüfe, ob die WedConnect-Profilmigration in Supabase ausgeführt wurde.");
    }
    return data === "couple" || data === "photographer" ? data : selectedRole;
  }

  async function finishLogin(user, fallbackRole = "") {
    if (!user || completingLogin) return;
    completingLogin = true;
    submitButton.disabled = true;
    googleButton.disabled = true;
    setStatus("Dein WedConnect-Bereich wird geöffnet …");
    try {
      const role = await resolveRole(user, fallbackRole || roleSelect.value);
      if (!role) {
        pendingRoleUser = user;
        roleField.hidden = false;
        roleSelect.required = true;
        authIntro.textContent = "Deinem Konto ist noch keine Rolle zugeordnet. Wähle aus, welchen Bereich du nutzen möchtest.";
        setStatus("Bitte wähle eine Rolle, damit wir dein Konto richtig einrichten.");
        return;
      }
      pendingRoleUser = null;
      window.location.assign("/dashboard.html");
    } catch (error) {
      setStatus(error && error.message ? error.message : "Dein Bereich konnte gerade nicht geöffnet werden.", "error");
    } finally {
      completingLogin = false;
      submitButton.disabled = false;
      googleButton.disabled = false;
    }
  }

  document.querySelectorAll("[data-signup]").forEach((button) => {
    button.addEventListener("click", () => {
      setMode("signup");
      roleField.hidden = false;
      dialog.showModal();
    });
  });

  closeButton.addEventListener("click", () => dialog.close());
  toggleButton.addEventListener("click", () => setMode(mode === "signup" ? "signin" : "signup"));

  roleSelect.addEventListener("change", () => {
    if (pendingRoleUser && roleSelect.value) finishLogin(pendingRoleUser, roleSelect.value);
  });

  resetButton.addEventListener("click", () => {
    setMode("recovery-request");
    emailInput.focus();
  });

  googleButton.addEventListener("click", async () => {
    googleButton.disabled = true;
    setStatus("Weiterleitung zu Google …");
    try {
      window.sessionStorage.setItem(googleModeStorageKey, mode);
      window.sessionStorage.setItem("wedconnect-google-auth-role", roleSelect.value);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUrl("google") }
      });
      if (error) throw error;
    } catch (error) {
      clearGoogleState();
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
    const selectedRole = roleSelect.value;

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { account_role: selectedRole },
            emailRedirectTo: redirectUrl("confirmed")
          }
        });
        if (error) throw error;
        if (data.session && data.user) {
          await finishLogin(data.user, selectedRole);
        } else {
          setStatus("Fast geschafft: Öffne den Bestätigungslink, den Supabase an deine E-Mail-Adresse geschickt hat. Deine gewählte Rolle wird dabei gespeichert.", "success");
        }
      } else if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await finishLogin(data.user, selectedRole);
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
        setStatus("Dein Passwort wurde geändert.");
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
      const returnRole = savedGoogleRole();
      clearGoogleState();
      setStatus("Google-Anmeldung erfolgreich. Dein WedConnect-Bereich wird vorbereitet …", "success");
      if (!dialog.open) dialog.showModal();
      clearAuthReturn();
      window.setTimeout(() => finishLogin(session.user, returnRole), 0);
    }
  });

  setMode("signup");

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
      clearGoogleState();
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
