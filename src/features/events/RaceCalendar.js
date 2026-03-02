import { Calendar } from "lucide-react";

const races = [
  { id: 1, name: "10K Noturno", date: "02/02", local: "Centro" },
  { id: 2, name: "Meia Maratona", date: "18/03", local: "Orla" },
  { id: 3, name: "Trail 12K", date: "05/04", local: "Serra" },
];

export default function RaceCalendar() {
  return (
    <div className="rounded-3xl bg-papa-card p-6 border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Calendário de Provas</h3>
        <Calendar className="text-papa-blue w-5 h-5" />
      </div>

      <div className="space-y-4">
        {races.map((race) => (
          <div key={race.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
            <div>
              <div className="font-bold text-white">{race.name}</div>
              <div className="text-xs text-white/50">{race.date} · {race.local}</div>
            </div>
            <button className="bg-papa-orange hover:bg-orange-600 text-white text-xs font-bold py-2 px-4 rounded-xl transition-colors">
              Eu vou!
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}