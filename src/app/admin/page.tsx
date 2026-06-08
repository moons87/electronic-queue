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

      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Обслужено" value={stats.served} />
        <Stat label="Не явились" value={stats.noShow} />
        <Stat label="Ср. ожидание" value={`${stats.avgWaitMin}м`} />
        <Stat label="Ср. приём" value={`${stats.avgServiceMin}м`} />
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="card rounded-2xl p-5">
          <h2 className="mb-3 font-semibold text-wine-800">Направления</h2>
          <ul className="space-y-1 text-sm">
            {services.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <span className="font-display grid size-6 place-items-center rounded-md bg-wine-700 text-xs font-bold text-paper">
                  {s.prefix}
                </span>
                {s.name}
              </li>
            ))}
          </ul>
        </section>

        <section className="card rounded-2xl p-5">
          <h2 className="mb-3 font-semibold text-wine-800">Окна</h2>
          <ul className="space-y-1 text-sm">
            {counters.map((c) => <li key={c.id}>· {c.name}</li>)}
          </ul>
        </section>
      </div>

      <div className="mt-8">
        <OperatorManager operators={operators} counters={counters} />
      </div>

      <AdminControls />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card rounded-2xl p-4">
      <p className="tnum font-display text-3xl font-extrabold text-wine-700">{value}</p>
      <p className="mt-1 text-xs text-ink-soft">{label}</p>
    </div>
  );
}
