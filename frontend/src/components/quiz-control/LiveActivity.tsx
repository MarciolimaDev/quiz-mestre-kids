import { Icon } from "./Icon";
import styles from "./QuizControl.module.css";

const activities = [
  { icon: "star" as const, tone: "green", content: <><strong>João</strong> acertou a pergunta! (+10 pts)</> },
  { icon: "trending" as const, tone: "blue", content: <><strong>Maria</strong> está em uma sequência de 5 acertos!</> },
  { icon: "bolt" as const, tone: "orange", content: <><strong>Lucas</strong> respondeu em menos de 3 segundos!</> },
];

export function LiveActivity() {
  return (
    <section className={styles.liveActivity} id="atividade">
      <h2>Atividade em tempo real</h2>
      <div className={styles.activityList}>
        {activities.map((activity) => (
          <div className={styles.activityChip} key={activity.tone}>
            <Icon className={styles[activity.tone]} name={activity.icon} size={19} />
            <span>{activity.content}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
