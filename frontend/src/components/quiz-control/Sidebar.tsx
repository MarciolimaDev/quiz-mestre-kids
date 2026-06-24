"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import styles from "./QuizControl.module.css";

const items = [
  { icon: "dashboard" as const, label: "Visão geral", href: "/dashboard" },
  { icon: "quiz" as const, label: "Perguntas", href: "/dashboard/perguntas" },
  { icon: "group" as const, label: "Alunos", href: "/dashboard/alunos" },
  { icon: "analytics" as const, label: "Ranking", href: "/dashboard/ranking" },
  { icon: "settings" as const, label: "Configurações", href: "/dashboard/configuracoes" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeading}>
        <h2>Área do Professor</h2>
        <p>Gerenciar turma</p>
      </div>
      <nav aria-label="Navegação do professor" className={styles.sideNav}>
        {items.map((item) => (
          <Link className={pathname === item.href ? styles.sideNavActive : undefined} href={item.href} key={item.label}>
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <button className={`${styles.primaryButton} ${styles.pressable}`} type="button">
        Criar Novo Quiz
      </button>
    </aside>
  );
}
