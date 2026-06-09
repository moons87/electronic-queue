import { getOperatorProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getActiveServices, getCounters } from "@/lib/db/queries";
import { getDayStats } from "@/lib/db/stats";
import { getOperatorList } from "@/lib/db/operators";
import { AdminControls } from "./AdminControls";
import { OperatorManager } from "./OperatorManager";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const profile = await getOperatorProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") {
    return <main className="p-6">Доступ только для администратора.</main>;
  }

  const sb = await createClient();
  const [services, counters, stats, operators] = await Promise.all([
    getActiveServices(sb), getCounters(sb), getDayStats(sb), getOperatorList(),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="font-display mb-1 text-2xl font-bold text-wine-800">
        Администрирование
      </h1>
      <p className="mb-6 text-sm text-ink-soft">Статистика за сегодня и сотрудники</p>

      <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Выдано талонов" value={stats.total} />
        <Stat label="Ждут сейчас" value={stats.waitingNow} accent />
        <Stat label="Обслужено" value={stats.served} />
        <Stat label="Не явились" value={stats.noShow} />
      </section>
      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="На приёме" value={stats.servingNow} />
        <Stat label="Ср. ожидание" value={`${stats.avgWaitMin}м`} />
        <Stat label="Ср. приём" value={`${stats.avgServiceMin}м`} />
        <Stat label="Час пик" value={stats.busiestHour ?? "—"} />
      </section>

      <section className="card mb-8 rounded-2xl p-5">
        <h2 className="mb-3 font-semibold text-wine-800">Очередь по направлениям</h2>
        <ul className="space-y-2 text-sm">
          {services.map((s) => {
            const load = stats.perService.find((p) => p.serviceId === s.id);
            return (
              <li key={s.id} className="flex items-center gap-3">
                <span className="font-display grid size-6 shrink-0 place-items-center rounded-md bg-wine-700 text-xs font-bold text-paper">
                  {s.prefix}
                </span>
                <span className="flex-1">{s.name}</span>
                <span className="tnum font-semibold text-wine-700">
                  {load?.waiting ?? 0}
                </span>
                <span className="text-ink-soft">ждут</span>
                {(load?.serving ?? 0) > 0 && (
                  <span className="tnum rounded-full bg-brass-400/20 px-2 py-0.5 text-xs font-semibold text-wine-800">
                    {load?.serving} на приёме
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card rounded-2xl p-5">
        <h2 className="mb-3 font-semibold text-wine-800">Окна</h2>
        <ul className="space-y-1 text-sm">
          {counters.map((c) => <li key={c.id}>· {c.name}</li>)}
        </ul>
      </section>

      <div className="mt-8">
        <OperatorManager operators={operators} counters={counters} />
      </div>

      <AdminControls />
    </main>
  );
}

function Stat({
  label, value, accent,
}: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`card rounded-2xl p-4 ${accent ? "ring-1 ring-brass-400" : ""}`}>
      <p className="tnum font-display text-3xl font-extrabold text-wine-700">{value}</p>
      <p className="mt-1 text-xs text-ink-soft">{label}</p>
    </div>
  );
}
