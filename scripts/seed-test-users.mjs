/**
 * Cria usuários de teste e planilhas base no Supabase (requer SUPABASE_SERVICE_ROLE_KEY no .env.local).
 *
 *   npm run seed:users
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvLocal() {
  const p = join(root, ".env.local");
  if (!existsSync(p)) return;
  const raw = readFileSync(p, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const k = m[1];
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local (Project Settings → API → service_role)."
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function importMockPlan() {
  const p = join(root, "src", "features", "plans", "mockWeek.js");
  const mod = await import(pathToFileURL(p).href);
  return mod.MOCK_PLAN;
}

async function importVolumePlan() {
  const pathJson = join(root, "scripts", "volume-plan.json");
  if (existsSync(pathJson)) {
    return JSON.parse(readFileSync(pathJson, "utf8"));
  }
  return null;
}

const USERS = [
  {
    email: "test.nilton@papakm.test",
    password: "140548",
    meta: {
      role: "admin",
      athlete_slug: "nilton-rodrigues",
      display_name: "Nilton (Admin)",
    },
  },
  {
    email: "prof.eron@papakm.test",
    password: "123456",
    meta: {
      role: "coach",
      athlete_slug: "prof-eron",
      display_name: "Prof. Eron",
    },
  },
  {
    email: "prof.matheus@papakm.test",
    password: "123456",
    meta: {
      role: "coach",
      athlete_slug: "prof-matheus",
      display_name: "Prof. Matheus",
    },
  },
  {
    email: "aluno.rafael@papakm.test",
    password: "123456",
    meta: {
      role: "plan",
      athlete_slug: "aluno-rafael",
      display_name: "Aluno Rafael",
    },
  },
  {
    email: "aluna.bianca@papakm.test",
    password: "123456",
    meta: {
      role: "social",
      athlete_slug: "aluna-bianca",
      display_name: "Aluna Bianca",
    },
  },
];

async function upsertUser(u) {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list?.users?.find((x) => x.email === u.email);
  async function ensureProfile(userId, email) {
    await admin.from("profiles").upsert(
      {
        id: userId,
        email,
        role: u.meta.role,
        athlete_slug: u.meta.athlete_slug,
        display_name: u.meta.display_name,
      },
      { onConflict: "id" }
    );
  }
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, {
      password: u.password,
      user_metadata: u.meta,
      email_confirm: true,
    });
    await ensureProfile(existing.id, u.email);
    console.log("Atualizado:", u.email);
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: u.meta,
  });
  if (error) {
    console.error("Erro ao criar", u.email, error.message);
    return null;
  }
  await ensureProfile(data.user.id, u.email);
  console.log("Criado:", u.email);
  return data.user.id;
}

async function main() {
  const MOCK_PLAN = await importMockPlan();
  const volumeWeeks = await importVolumePlan();

  for (const u of USERS) {
    await upsertUser(u);
  }

  const { error: e1 } = await admin.from("plan_templates").upsert(
    {
      plan_key: "sub20",
      title: "Plano Sub20 (5 km)",
      weeks: MOCK_PLAN,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "plan_key" }
  );
  if (e1) console.error("plan_templates sub20:", e1.message);
  else console.log("Planilha base sub20 salva no banco.");

  if (volumeWeeks && Object.keys(volumeWeeks).length) {
    const { error: e2 } = await admin.from("plan_templates").upsert(
      {
        plan_key: "volume",
        title: "Plano Volume (meia / base)",
        weeks: volumeWeeks,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "plan_key" }
    );
    if (e2) console.error("plan_templates volume:", e2.message);
    else console.log("Planilha base volume salva no banco.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
