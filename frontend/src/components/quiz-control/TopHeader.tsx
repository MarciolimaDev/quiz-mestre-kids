import Link from "next/link";
import { UserMenu } from "@/components/auth/UserMenu";
import styles from "./QuizControl.module.css";

export function TopHeader() {
  return (
    <header className={styles.topHeader}>
      <div className={styles.brandGroup}>
        <Link className={styles.brand} href="/">QuizBlast!</Link>
        <nav aria-label="Navegação principal" className={styles.topNav}>
          <Link className={styles.topNavActive} href="/dashboard">Dashboard</Link>
          <Link href="/dashboard#atividade">Ranking</Link>
          <Link href="/">Rodada ao vivo</Link>
        </nav>
      </div>
      <UserMenu />
    </header>
  );
}
