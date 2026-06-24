import { Icon } from "@/components/quiz-control/Icon";
import styles from "./GeneralRanking.module.css";

type RankingHeaderProps = {
  students: number;
  points: number;
  rounds: number;
};

export function RankingHeader({ students, points, rounds }: RankingHeaderProps) {
  return (
    <header className={styles.pageHeader}>
      <div>
        <span className={styles.eyebrow}>Todas as rodadas</span>
        <h1>Mestres do Quiz! <span aria-hidden="true">🏆</span></h1>
        <p>Quem subirá ao topo hoje?</p>
      </div>
      <div aria-label="Resumo do ranking" className={styles.headerStats}>
        <div><Icon name="group" size={21} /><strong>{students}</strong><span>alunos</span></div>
        <div><Icon name="star" size={21} /><strong>{points.toLocaleString("pt-BR")}</strong><span>pontos</span></div>
        <div><Icon name="quiz" size={21} /><strong>{rounds}</strong><span>participações</span></div>
      </div>
    </header>
  );
}
