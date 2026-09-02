"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserRole } from "@/lib/auth";
import Navbar from "./Navbar";

export default function NavbarAuth() {
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        return;
      }

      const role = await getUserRole(supabase, authUser);
      setUser({
        email: authUser.email ?? "",
        role,
      });
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return <Navbar user={user} />;
}
