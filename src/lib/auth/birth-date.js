export function validateBirthDate(value) {
  if (!value) {
    return { ok: false, message: "Informe sua data de nascimento." };
  }
  const birth = new Date(`${value}T12:00:00`);
  if (Number.isNaN(birth.getTime())) {
    return { ok: false, message: "Data de nascimento inválida." };
  }
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  if (birth > today) {
    return { ok: false, message: "A data de nascimento não pode ser no futuro." };
  }
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  if (age < 10 || age > 120) {
    return { ok: false, message: "Idade deve estar entre 10 e 120 anos." };
  }
  return { ok: true };
}

export function formatBirthDate(value) {
  if (!value) return null;
  const d = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR");
}

export function birthDateInputBounds() {
  const maxBirthDate = new Date().toISOString().slice(0, 10);
  const min = new Date();
  min.setFullYear(min.getFullYear() - 120);
  return { min: min.toISOString().slice(0, 10), max: maxBirthDate };
}
