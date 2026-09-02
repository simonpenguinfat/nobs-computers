import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, dashboardPathForRole } from "@/lib/auth";
import AdminLoginForm from "./AdminLoginForm";

export default async function AdminLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const role = await getUserRole(supabase, user);
    redirect(dashboardPathForRole(role));
  }

  return <AdminLoginForm />;
}
