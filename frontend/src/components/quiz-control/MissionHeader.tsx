import { Icon } from "./Icon";
import styles from "./QuizControl.module.css";

export function MissionHeader() {
  return (
    <section className={styles.missionHeader} id="conteudo">
      <div>
        <h1>Missão Espacial: Frações</h1>
        <p>Sessão ao vivo <span aria-hidden="true">•</span> Sala 4B</p>
      </div>
      <div className={styles.connectedBadge}>
        <Icon name="group" size={21} />
        <span>24 alunos conectados</span>
      </div>
    </section>
  );
}
