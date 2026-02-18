export function zoneClasses(zoneKey) {
  // Base: borda e fundo translúcido
  const base = "border bg-black/20";

  const map = {
    z1: `${base} border-blue-400/30 bg-blue-500/10 text-blue-100`,
    z2: `${base} border-emerald-400/30 bg-emerald-500/10 text-emerald-100`,
    z3: `${base} border-yellow-400/30 bg-yellow-500/10 text-yellow-100`,
    z4: `${base} border-orange-400/30 bg-orange-500/10 text-orange-100`,
    z5: `${base} border-red-400/30 bg-red-500/10 text-red-100`,
  };

  return map[zoneKey] ?? `${base} border-white/10 bg-white/5 text-white/80`;
}
