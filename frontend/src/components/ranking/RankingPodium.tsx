import { RankingAvatar } from "./RankingAvatar";
import type { RankingEntry } from "./ranking.types";
import styles from "./GeneralRanking.module.css";

const podiumOrder = [1, 0, 2];
const medals = ["🥇", "🥈", "🥉"];

type RankingPodiumProps = {
  entries: RankingEntry[];
};

export function RankingPodium({ entries }: RankingPodiumProps) {
  return (
    <section aria-label="Pódio dos três primeiros colocados" className={styles.podium}>
      {podiumOrder.map((entryIndex) => {
        const entry = entries[entryIndex];
        if (!entry) return null;

        return (
          <article className={styles[`place${entryIndex + 1}`]} key={entry.aluno_id}>
            {entryIndex === 0 && <span aria-hidden="true" className={styles.crown}>👑</span>}
            <div className={styles.podiumPortrait}>
              <RankingAvatar entry={entry} />
              <span aria-label={`${entryIndex + 1}º lugar`} className={styles.medal}>{medals[entryIndex]}</span>
            </div>
            <div className={styles.podiumStep}>
              <h2>{entry.apelido || entry.nome}</h2>
              <strong>{entry.pontuacao.toLocaleString("pt-BR")} pts</strong>
              <span>{entry.turma}</span>
              {entryIndex === 0 && <small>Líder atual</small>}
            </div>
          </article>
        );
      })}
    </section>
  );
}
