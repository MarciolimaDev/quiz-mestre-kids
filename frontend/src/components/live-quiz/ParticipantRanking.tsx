import Image from "next/image";
import { Icon } from "@/components/quiz-control/Icon";
import type { Participant } from "./LiveQuiz";
import styles from "./LiveQuiz.module.css";

type ParticipantRankingProps = {
  ranking: Participant[];
  selectedStudentId: number | null;
};

export function ParticipantRanking({ ranking, selectedStudentId }: ParticipantRankingProps) {
  const highestScore = Math.max(1, ...ranking.map((participant) => participant.pontuacao));

  return (
    <aside aria-labelledby="ranking-title" className={styles.rankingCard}>
      <div className={styles.rankingHeader}>
        <div><span>Classificação</span><h2 id="ranking-title">Ranking</h2></div>
        <Icon name="analytics" size={25} />
      </div>
      {ranking.length === 0 ? <p className={styles.rankingEmpty}>Nenhum participante.</p> : <ol className={styles.rankingList}>
        {ranking.map((participant, index) => (
          <li className={participant.aluno_id === selectedStudentId ? styles.rankingActive : undefined} key={participant.aluno_id}>
            <span className={styles.rankPosition}>{index + 1}</span>
            <span className={styles.rankAvatar}>
              {participant.avatar ? <Image alt={`Avatar de ${participant.nome}`} fill loader={({ src }) => src} sizes="50px" src={participant.avatar} unoptimized /> : <b>{participant.nome.slice(0, 1)}</b>}
            </span>
            <span className={styles.rankInfo}>
              <span><strong>{participant.apelido || participant.nome}</strong><b>{participant.pontuacao} pts</b></span>
              <span className={styles.rankProgress}><span style={{ width: `${(participant.pontuacao / highestScore) * 100}%` }} /></span>
            </span>
          </li>
        ))}
      </ol>}
    </aside>
  );
}
