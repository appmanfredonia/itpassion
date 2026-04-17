"use server";

import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import {
  ensureUserProfile,
  getAuthenticatedRedirectPath,
  getUserPassionStatus,
  isValidUsername,
  normalizeUsername,
} from "@/lib/auth";
import { getAppSiteUrl, toAbsoluteAppUrl } from "@/lib/app-url";
import { getItalianCityValidationError, resolveItalianLocation } from "@/lib/location";
import { actionErrorDetail } from "@/lib/server-actions";
import { createServerSupabaseClient } from "@/lib/supabase";

function buildErrorRedirect(pathname: "/login" | "/register", message: string): never {
  const params = new URLSearchParams({ error: message });
  redirect(`${pathname}?${params.toString()}`);
}

function buildStatusRedirect(pathname: string, key: "error" | "success", message: string): never {
  const params = new URLSearchParams({ [key]: message });
  redirect(`${pathname}?${params.toString()}`);
}

function getSafeAuthMode(value: FormDataEntryValue | null): "login" | "register" {
  return value === "register" ? "register" : "login";
}

function getCallbackUrl(nextPath?: string): string {
  const callback = new URL("/auth/callback", getAppSiteUrl());
  if (nextPath) {
    callback.searchParams.set("next", nextPath);
  }

  return callback.toString();
}

function normalizeDisplayName(value: FormDataEntryValue | null, fallbackUsername: string): string {
  if (typeof value !== "string") {
    return fallbackUsername;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue.slice(0, 60) : fallbackUsername;
}

function isValidOtpType(value: string): value is EmailOtpType {
  return value === "email" || value === "recovery" || value === "invite" || value === "email_change";
}

export async function loginAction(formData: FormData): Promise<never> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    buildErrorRedirect("/login", "Inserisci email e password valide.");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    buildErrorRedirect("/login", "Accesso non riuscito. Controlla le credenziali.");
  }

  if (data.user) {
    try {
      await ensureUserProfile(supabase, data.user);
    } catch {
      // Se il profilo pubblico non e sincronizzabile ora, non blocchiamo il login.
    }
  }

  const { hasPassions } = await getUserPassionStatus(supabase, data.user);
  redirect(getAuthenticatedRedirectPath(hasPassions));
}

export async function registerAction(formData: FormData): Promise<never> {
  const username = formData.get("username");
  const displayName = formData.get("displayName");
  const email = formData.get("email");
  const password = formData.get("password");
  const city = formData.get("city");

  const normalizedUsername =
    typeof username === "string" ? normalizeUsername(username) : "";

  if (
    !isValidUsername(normalizedUsername) ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email ||
    password.length < 6
  ) {
    buildErrorRedirect(
      "/register",
      "Username non valido (3-24 caratteri: lettere, numeri, underscore o punto).",
    );
  }

  const cityValue = typeof city === "string" ? city.trim() : "";

  if (cityValue.length < 2) {
    buildErrorRedirect("/register", "Inserisci la tua citta per completare la registrazione.");
  }

  if (cityValue.length > 80) {
    buildErrorRedirect("/register", "La citta non puo superare 80 caratteri.");
  }

  const resolvedLocation = resolveItalianLocation({
    city: cityValue,
    province: null,
  });
  const locationError = getItalianCityValidationError(resolvedLocation);
  if (locationError) {
    buildErrorRedirect("/register", locationError);
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: normalizedUsername,
        display_name: normalizeDisplayName(displayName, normalizedUsername),
        city: resolvedLocation.location.city,
        province: resolvedLocation.location.province,
        region: resolvedLocation.location.region,
        latitude: resolvedLocation.location.latitude,
        longitude: resolvedLocation.location.longitude,
      },
    },
  });

  if (error) {
    buildErrorRedirect("/register", "Registrazione non riuscita. Riprova tra poco.");
  }

  if (!data.session) {
    const params = new URLSearchParams({
      success: "Account creato. Controlla l'email di conferma e poi accedi.",
    });
    redirect(`/login?${params.toString()}`);
  }

  if (data.user) {
    try {
      await ensureUserProfile(supabase, data.user);
    } catch {
      // La sync profilo non deve bloccare la registrazione con sessione attiva.
    }
  }

  const { hasPassions } = await getUserPassionStatus(supabase, data.user);
  redirect(getAuthenticatedRedirectPath(hasPassions));
}

export async function forgotPasswordAction(formData: FormData): Promise<never> {
  const email = formData.get("email");

  if (typeof email !== "string" || !email.includes("@")) {
    buildStatusRedirect("/forgot-password", "error", "Inserisci un'email valida.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getCallbackUrl("/reset-password"),
  });

  if (error) {
    console.error("[auth][forgotPasswordAction] failed", {
      detail: actionErrorDetail(error),
      rawError: error,
    });
    buildStatusRedirect(
      "/forgot-password",
      "error",
      "Invio link non riuscito. Controlla l'indirizzo e riprova.",
    );
  }

  buildStatusRedirect(
    "/forgot-password",
    "success",
    "Se l'account esiste, riceverai un'email per impostare una nuova password.",
  );
}

export async function resetPasswordAction(formData: FormData): Promise<never> {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof password !== "string" || password.trim().length < 6) {
    buildStatusRedirect(
      "/reset-password",
      "error",
      "La nuova password deve contenere almeno 6 caratteri.",
    );
  }

  if (password !== confirmPassword) {
    buildStatusRedirect("/reset-password", "error", "Le password non coincidono.");
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    buildStatusRedirect(
      "/forgot-password",
      "error",
      "Il link di recupero non e piu valido. Richiedine uno nuovo.",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    console.error("[auth][resetPasswordAction] failed", {
      detail: actionErrorDetail(error),
      rawError: error,
    });
    buildStatusRedirect(
      "/reset-password",
      "error",
      "Aggiornamento password non riuscito. Riapri il link ricevuto via email.",
    );
  }

  const { hasPassions } = await getUserPassionStatus(supabase, user);
  redirect(getAuthenticatedRedirectPath(hasPassions));
}

export async function signInWithGoogleAction(formData: FormData): Promise<never> {
  const mode = getSafeAuthMode(formData.get("mode"));
  const redirectPath = mode === "register" ? "/register" : "/login";

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getCallbackUrl(),
    },
  });

  if (error || !data.url) {
    console.error("[auth][signInWithGoogleAction] failed", {
      detail: actionErrorDetail(error),
      rawError: error,
    });
    buildStatusRedirect(
      redirectPath,
      "error",
      "Accesso con Google non disponibile. Verifica il provider Google in Supabase e i redirect autorizzati.",
    );
  }

  redirect(data.url);
}

export async function completeAuthCallback(params: URLSearchParams): Promise<never> {
  const requestedNext = params.get("next");
  const nextPath =
    requestedNext && requestedNext.startsWith("/") ? requestedNext : null;

  const tokenHash = params.get("token_hash");
  const otpType = params.get("type");
  const code = params.get("code");
  const providerErrorDescription = params.get("error_description");
  const providerError = params.get("error");

  if (providerErrorDescription || providerError) {
    buildStatusRedirect(
      "/login",
      "error",
      providerErrorDescription ?? "Autenticazione esterna non riuscita. Riprova.",
    );
  }

  const supabase = await createServerSupabaseClient();

  if (tokenHash && typeof otpType === "string" && isValidOtpType(otpType)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });

    if (error) {
      console.error("[auth][completeAuthCallback] verifyOtp failed", {
        detail: actionErrorDetail(error),
        rawError: error,
      });
      buildStatusRedirect(
        "/login",
        "error",
        "Link di verifica non valido o scaduto. Prova a richiederne uno nuovo.",
      );
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth][completeAuthCallback] exchangeCodeForSession failed", {
        detail: actionErrorDetail(error),
        rawError: error,
      });
      buildStatusRedirect(
        "/login",
        "error",
        "Accesso non completato. Riprova dal pulsante di login.",
      );
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    buildStatusRedirect(
      "/login",
      "error",
      "Sessione non disponibile dopo l'autenticazione. Riprova.",
    );
  }

  try {
    await ensureUserProfile(supabase, user);
  } catch (error) {
    console.error("[auth][completeAuthCallback] ensureUserProfile failed", {
      detail: actionErrorDetail(error),
      rawError: error,
    });
  }

  if (nextPath === "/reset-password" || otpType === "recovery") {
    redirect(toAbsoluteAppUrl("/reset-password"));
  }

  const { hasPassions } = await getUserPassionStatus(supabase, user);
  redirect(toAbsoluteAppUrl(getAuthenticatedRedirectPath(hasPassions)));
}
