export async function stravaFetch(path, accessToken, init = {}) {
  const res = await fetch(`https://www.strava.com/api/v3${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Strava API ${path}: ${res.status} ${t}`);
  }
  return res.json();
}

export async function getAthlete(accessToken) {
  return stravaFetch("/athlete", accessToken);
}

export async function getAthleteStats(accessToken, athleteId) {
  return stravaFetch(`/athletes/${athleteId}/stats`, accessToken);
}

export async function getRecentActivities(accessToken, { perPage = 15 } = {}) {
  return stravaFetch(`/athlete/activities?per_page=${perPage}`, accessToken);
}

export async function getActivityStreams(accessToken, activityId, keys = ["latlng", "time"]) {
  const keyParam = keys.join(",");
  return stravaFetch(
    `/activities/${activityId}/streams?keys=${keyParam}&key_by_type=true`,
    accessToken
  );
}
