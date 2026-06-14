export const MIN_PASSWORD_LENGTH = 8;

const SYMBOLS = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

export function validatePassword(password) {
  const value = String(password || "");

  if (value.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    };
  }

  if (!/[a-z]/.test(value)) {
    return { ok: false, message: "Inclua pelo menos uma letra minúscula." };
  }

  if (!/[A-Z]/.test(value)) {
    return { ok: false, message: "Inclua pelo menos uma letra maiúscula." };
  }

  if (!/\d/.test(value)) {
    return { ok: false, message: "Inclua pelo menos um número." };
  }

  if (!SYMBOLS.test(value)) {
    return {
      ok: false,
      message: "Inclua pelo menos um símbolo (ex.: ! @ # $ %).",
    };
  }

  return { ok: true, message: "" };
}

export const PASSWORD_HINT =
  "Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo.";
