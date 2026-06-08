import { createClient } from "@/lib/supabase/server";
import { getActiveServices } from "@/lib/db/queries";
import { createTicketAction } from "@/app/actions";
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
    <main className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">Электронная очередь</h1>
      <p className="mb-4 text-gray-600">Выберите направление:</p>
      <div className="flex flex-col gap-3">
        {services.map((s) => (
          <form action={take} key={s.id}>
            <input type="hidden" name="serviceId" value={s.id} />
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 p-5 text-lg font-semibold text-white active:bg-blue-700"
            >
              {s.name}
            </button>
          </form>
        ))}
      </div>
    </main>
  );
}
