export function normalizeRaceUrl(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function mapRaceRow(row) {
  return {
    id: row.id,
    title: row.title,
    raceDate: row.race_date,
    location: row.location,
    description: row.description,
    raceUrl: row.race_url ?? null,
    createdAt: row.created_at,
  };
}

export async function enrichRacesWithRsvps(supabase, userId, races, isStaff) {
  if (!races.length) return races;

  const raceIds = races.map((r) => r.id);

  const { data: mine } = await supabase
    .from("group_race_rsvps")
    .select("race_id")
    .eq("user_id", userId)
    .in("race_id", raceIds);

  const mySet = new Set((mine || []).map((r) => r.race_id));
  let counts = {};

  if (isStaff) {
    const { data: all } = await supabase
      .from("group_race_rsvps")
      .select("race_id")
      .in("race_id", raceIds);
    for (const row of all || []) {
      counts[row.race_id] = (counts[row.race_id] || 0) + 1;
    }
  }

  return races.map((race) => ({
    ...race,
    going: mySet.has(race.id),
    rsvpCount: isStaff ? counts[race.id] || 0 : undefined,
  }));
}
