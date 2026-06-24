import { Icon } from "./Icon";
import styles from "./QuizControl.module.css";

const options = [
  { letter: "A", value: "1/4" },
  { letter: "B", value: "3/4", selected: true },
  { letter: "C", value: "2/8" },
  { letter: "D", value: "1/3" },
];

export function QuestionPanel() {
  return (
    <section aria-labelledby="question-title" className={`${styles.panel} ${styles.questionPanel}`}>
      <Icon className={styles.rocketWatermark} name="rocket" size={128} />
      <div className={styles.questionBadges}>
        <span className={styles.questionNumber}>PERGUNTA 4/10</span>
        <span className={styles.levelBadge}>NÍVEL: MÉDIO</span>
      </div>
      <h2 id="question-title">Qual dessas frações é maior que 1/2?</h2>
      <div className={styles.optionsGrid}>
        {options.map((option) => (
          <div className={option.selected ? styles.optionSelected : styles.option} key={option.letter}>
            <span className={styles.optionLetter}>{option.letter}</span>
            <span className={styles.optionValue}>{option.value}</span>
            {option.selected && <Icon className={styles.optionCheck} name="check" size={21} />}
          </div>
        ))}
      </div>
      <div className={styles.progressSection}>
        <div className={styles.progressLabels}>
          <span>Respostas recebidas</span>
          <strong>18/24</strong>
        </div>
        <div aria-label="18 de 24 respostas recebidas" aria-valuemax={24} aria-valuemin={0} aria-valuenow={18} className={styles.progressTrack} role="progressbar">
          <div className={styles.progressBar} />
        </div>
      </div>
    </section>
  );
}
