"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/quiz-control/Icon";
import { apiFetch } from "@/lib/api";
import styles from "@/components/quiz-control/QuizControl.module.css";

type User = { first_name: string; nome_completo: string };

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<User>("/auth/me/")
      .then((data) => { if (!cancelled) setUser(data); })
      .catch(() => { if (!cancelled) setUser(null); });
    return () => { cancelled = true; };
  }, []);

  async function logout() {
    await apiFetch<void>("/auth/logout/", { method: "POST" }).catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className={styles.userMenu}>
      <span><Icon name="account" size={27} /><b>{user?.first_name || "Professor"}</b></span>
      <button className={styles.logoutButton} onClick={logout} type="button">Sair</button>
    </div>
  );
}
