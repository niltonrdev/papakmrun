import { getTodayWorkout, getZoneByKey } from "@/features/plans/plans.service";

function TodayCard() {
  const w = getTodayWorkout();

  if (!w) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/70">
          Hoje não tem treino planejado (mock). 👍
        </div>
        <div className="mt-2 text-xs text-white/50">
          Treinos mock: Terça, Quinta e Sábado.
        </div>
      </div>
    );
  }

  const z = getZoneByKey(w.zoneKey);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm text-white/60">Treino de hoje</div>
          <div className="text-lg font-semibold">
            {w.dayLabel} • {w.title} • {w.km} km
          </div>
        </div>
        {z && (
          <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/80">
            {z.label} • {z.paceMin}-{z.paceMax}
          </div>
        )}
      </div>

      <p className="mt-3 text-sm text-white/70 leading-relaxed">
        {w.description}
      </p>

      <div className="mt-4 flex items-center justify-end">
        <button
          type="button"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          disabled
          title="Check-in entra na próxima etapa"
        >
          Check-in (em breve)
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <TodayCard />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm text-white/70">
          Aqui vai entrar: mural de atividades e ranking semanal.
        </div>
      </div>
    </section>
  );
}
