"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/quiz-control/Icon";
import { apiFetch } from "@/lib/api";
import styles from "./GeneralRanking.module.css";
import { RankingHeader } from "./RankingHeader";
import { RankingList } from "./RankingList";
import { RankingPodium } from "./RankingPodium";
import type { RankingEntry } from "./ranking.types";

export function GeneralRanking() {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch<RankingEntry[]>("/rankings/geral/")
      .then((data) => { if (!cancelled) setRanking(data); })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Erro ao carregar ranking.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return ranking;
    return ranking.filter((entry) =>
      `${entry.nome} ${entry.apelido} ${entry.turma}`.toLocaleLowerCase("pt-BR").includes(term),
    );
  }, [ranking, search]);

  const totalPoints = ranking.reduce((total, entry) => total + entry.pontuacao, 0);
  const totalRounds = ranking.reduce((total, entry) => total + entry.rodadas, 0);
  const highestScore = Math.max(1, ...ranking.map((entry) => entry.pontuacao));

  return (
    <div className={styles.page}>
      <RankingHeader points={totalPoints} rounds={totalRounds} students={ranking.length} />
      {error && <div className={styles.errorMessage} role="alert">{error}</div>}
      {loading ? (
        <section className={styles.state}><span className={styles.loader} /><h2>Carregando classificação...</h2></section>
      ) : ranking.length === 0 ? (
        <section className={styles.state}><Icon name="analytics" size={58} /><h2>O ranking ainda está vazio</h2><p>Os resultados aparecerão após a primeira rodada respondida.</p></section>
      ) : (
        <>
          <RankingPodium entries={ranking.slice(0, 3)} />
          <RankingList entries={filtered} highestScore={highestScore} onSearchChange={setSearch} search={search} />
        </>
      )}
    </div>
  );
}
