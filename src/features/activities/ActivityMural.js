export default function ActivityMural() {
  const dias = [
    { label: 'S', status: 'done' },
    { label: 'T', status: 'done' },
    { label: 'Q', status: 'empty' },
    { label: 'Q', status: 'empty' },
    { label: 'S', status: 'done' },
    { label: 'S', status: 'empty' },
    { label: 'D', status: 'empty' },
  ];

  return (
    <div className="rounded-3xl bg-papa-card p-6 border border-white/5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-white/40 text-xs uppercase font-bold tracking-widest">Mural de Atividades</span>
          <h3 className="text-white font-bold text-lg">Semana</h3>
        </div>
        <span className="bg-papa-blue/10 text-papa-blue text-xs font-bold px-3 py-1 rounded-full border border-papa-blue/20">
          3/7 feitos
        </span>
      </div>
      <div className="flex justify-between items-center max-w-md">
        {dias.map((dia, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              dia.status === 'done' 
                ? 'bg-papa-blue border-papa-blue shadow-[0_0_15px_rgba(0,209,255,0.4)]' 
                : 'border-white/10 bg-transparent'
            }`}>
              {dia.status === 'done' && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
            <span className="text-white/40 text-xs font-bold">{dia.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}