import { Suspense } from "react";
import InviteClient from "./invite-client";

function InviteFallback() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-5 rounded-xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Carregando convite...</p>
      </div>
    </main>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<InviteFallback />}>
      <InviteClient />
    </Suspense>
  );
}
