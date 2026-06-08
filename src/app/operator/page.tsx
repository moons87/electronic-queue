import { getOperatorProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OperatorPanel } from "@/components/OperatorPanel";
import { redirect } from "next/navigation";
import type { Counter } from "@/lib/queue/types";

export default async function OperatorPage() {
  const profile = await getOperatorProfile();
  if (!profile) redirect("/login");
  if (!profile.counter_id) {
    return <main className="p-6">Окно не назначено. Обратитесь к админу.</main>;
  }
  const sb = await createClient();
  const { data } = await sb
    .from("counters").select("*").eq("id", profile.counter_id).single();

  return <OperatorPanel counter={data as Counter} />;
}
