import { createClient } from "@/lib/supabase/server";
import { getActiveServices } from "@/lib/db/queries";
import { createTicketAction } from "@/app/actions";
import { brand } from "@/lib/brand";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const sb = await createClient();
  const services = await getActiveServices(sb);

  async function take(formData: FormData) {
    "use server";
    const serviceId = String(formData.get("serviceId"));
    const ticket = await createTicketAction(serviceId);
    redirect(`/ticket/${ticket.id}`);
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-10 sm:py-14">
      <div className="rise text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-wine-700">
          {brand.fullName}
        </p>
        <h1 className="font-display mt-3 text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
          Электронная очередь
        </h1>
        <p className="mt-3 text-ink-soft">
          Выберите направление — получите талон и следите за очередью с телефона.
        </p>
      </div>

      <div className="rule-brass mx-auto my-8 w-40" />

      <div className="grid gap-4">
        {services.map((s, i) => (
          <form
            action={take}
            key={s.id}
            className="rise"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <input type="hidden" name="serviceId" value={s.id} />
            <button
              type="submit"
              className="card group flex w-full items-center gap-4 rounded-2xl p-5 text-left transition hover:-translate-y-0.5"
            >
              <span className="font-display grid size-12 shrink-0 place-items-center rounded-xl bg-wine-700 text-xl font-bold text-paper">
                {s.prefix}
              </span>
              <span className="flex-1">
                <span className="block text-lg font-bold text-ink">{s.name}</span>
                <span className="block text-sm text-ink-soft">
                  Нажмите, чтобы встать в очередь
                </span>
              </span>
              <span className="text-wine-600 transition group-hover:translate-x-1">
                →
              </span>
            </button>
          </form>
        ))}
        {services.length === 0 && (
          <p className="text-center text-ink-soft">Сейчас нет открытых направлений.</p>
        )}
      </div>
    </main>
  );
}
