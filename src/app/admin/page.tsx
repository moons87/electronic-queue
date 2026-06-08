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
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Администрирование</h1>

      <section className="mb-8 grid grid-cols-2 gap-4">
        <Stat label="Обслужено" value={stats.served} />
        <Stat label="Не явились" value={stats.noShow} />
        <Stat label="Ср. ожидание" value={`${stats.avgWaitMin} мин`} />
        <Stat label="Ср. обслуживание" value={`${stats.avgServiceMin} мин`} />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Направления</h2>
        <ul className="list-disc pl-5">
          {services.map((s) => <li key={s.id}>{s.name} ({s.prefix})</li>)}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Окна</h2>
        <ul className="list-disc pl-5">
          {counters.map((c) => <li key={c.id}>{c.name}</li>)}
        </ul>
      </section>

      <OperatorManager operators={operators} counters={counters} />

      <AdminControls />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-gray-500">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
