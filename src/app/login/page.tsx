import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, dashboardPathForRole } from "@/lib/auth";
import LoginForm from "./LoginForm";

async function LoginGate() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const role = await getUserRole(supabase, user);
    redirect(dashboardPathForRole(role));
  }

  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginGate />
    </Suspense>
  );
}
