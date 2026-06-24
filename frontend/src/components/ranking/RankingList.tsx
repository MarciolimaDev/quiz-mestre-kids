import { RankingAvatar } from "./RankingAvatar";
import type { RankingEntry } from "./ranking.types";
import styles from "./GeneralRanking.module.css";

type RankingListProps = {
  entries: RankingEntry[];
  highestScore: number;
  search: string;
  onSearchChange: (value: string) => void;
};

export function RankingList({ entries, highestScore, search, onSearchChange }: RankingListProps) {
  return (
    <section aria-labelledby="complete-ranking-title" className={styles.listSection}>
      <div className={styles.listHeader}>
        <div>
          <span>Classificação geral</span>
          <h2 id="complete-ranking-title">Todos os participantes</h2>
        </div>
        <label className={styles.searchField}>
          <span className={styles.srOnly}>Buscar aluno ou turma</span>
          <input
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar aluno ou turma..."
            type="search"
            value={search}
          />
        </label>
      </div>

      {entries.length === 0 ? (
        <p className={styles.noResults}>Nenhum participante encontrado.</p>
      ) : (
        <ol className={styles.rankingList}>
          {entries.map((entry) => {
            const progress = Math.max(4, Math.round((entry.pontuacao / highestScore) * 100));
            return (
              <li key={entry.aluno_id}>
                <strong className={styles.position}>{entry.posicao}</strong>
                <RankingAvatar className={styles.rowAvatar} entry={entry} />
                <div className={styles.studentInfo}>
                  <div><h3>{entry.apelido || entry.nome}</h3><span>{entry.turma}</span></div>
                  <div aria-label={`${progress}% da pontuação do primeiro colocado`} className={styles.progressTrack}>
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <small>{entry.acertos} acertos · {entry.erros} erros · {entry.rodadas} {entry.rodadas === 1 ? "rodada" : "rodadas"}</small>
                </div>
                <strong className={styles.points}>{entry.pontuacao.toLocaleString("pt-BR")} pts</strong>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
