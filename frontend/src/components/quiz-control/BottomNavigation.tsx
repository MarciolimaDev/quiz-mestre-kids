import Link from "next/link";
import { Icon } from "./Icon";
import styles from "./QuizControl.module.css";

export function BottomNavigation() {
  return (
    <nav aria-label="Navegação móvel" className={styles.bottomNav}>
      <Link href="/"><Icon name="rocket" size={21} /><span>Rodada</span></Link>
      <Link className={styles.bottomNavActive} href="/dashboard"><Icon name="book" size={21} /><span>Dashboard</span></Link>
      <Link href="/dashboard#atividade"><Icon name="star" size={21} /><span>Ranking</span></Link>
    </nav>
  );
}
