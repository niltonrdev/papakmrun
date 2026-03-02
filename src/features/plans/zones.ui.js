export function zoneClasses(zoneKey) {
  const base = "border font-medium";
  
  const map = {
    z1: `${base} border-blue-400/30 bg-blue-500/10 text-blue-400`,
    z2: `${base} border-emerald-400/30 bg-emerald-500/10 text-emerald-400`,
    z3: `${base} border-yellow-400/30 bg-yellow-500/10 text-yellow-400`,
    z4: `${base} border-orange-400/30 bg-orange-500/10 text-orange-400`,
    z5: `${base} border-red-400/30 bg-red-500/10 text-red-400`,
  };

  return map[zoneKey] ?? `${base} border-white/10 bg-white/5 text-white/80`;
}
