import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, dashboardPathForRole } from "@/lib/auth";
import SignupForm from "./SignupForm";

async function SignupGate() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const role = await getUserRole(supabase, user);
    redirect(dashboardPathForRole(role));
  }

  return <SignupForm />;
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupGate />
    </Suspense>
  );
}
