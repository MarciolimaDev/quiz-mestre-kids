"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/quiz-control/Icon";
import { apiFetch } from "@/lib/api";
import { ParticipantRanking } from "./ParticipantRanking";
import styles from "./LiveQuiz.module.css";

export type Participant = {
  participante_id: number;
  aluno_id: number;
  nome: string;
  apelido: string;
  avatar: string | null;
  pontuacao: number;
  acertos: number;
  erros: number;
};

type QuizOption = { id: number; titulo: string; turma: string | null };
type GameState = {
  status: "sem_sessao" | "em_andamento" | "finalizada";
  quizzes?: QuizOption[];
  sessao_id?: number;
  quiz?: { id: number; titulo: string; categoria: string; turma: string; pontos_por_acerto: number };
  pergunta?: { id: number; enunciado: string; nivel: string; nivel_label: string; imagem: string | null; alternativas: { id: number; texto: string; ordem: number }[] } | null;
  pergunta_numero?: number;
  total_perguntas?: number;
  tempo_por_pergunta?: number;
  tempo_restante?: number;
  aluno_atual_id?: number | null;
  resposta?: { alternativa_id: number; correta: boolean; pontos: number } | null;
  participantes?: Participant[];
  ranking?: Participant[];
};

function randomIndex(length: number) {
  return Math.floor(Math.random() * length);
}

function AvatarImage({ participant, sizes = "112px", priority = false }: { participant: Participant; sizes?: string; priority?: boolean }) {
  if (!participant.avatar) return <span className={styles.avatarInitial}>{participant.nome.slice(0, 1)}</span>;
  return <Image alt={`Avatar de ${participant.nome}`} fill loader={({ src }) => src} priority={priority} sizes={sizes} src={participant.avatar} unoptimized />;
}

export function LiveQuiz() {
  const [game, setGame] = useState<GameState | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyState(state: GameState) {
    setGame(state);
    setTimeRemaining(state.tempo_restante ?? 0);
  }

  useEffect(() => {
    let cancelled = false;
    apiFetch<GameState>("/jogo/estado/")
      .then((state) => { if (!cancelled) applyState(state); })
      .catch((requestError: unknown) => { if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Erro ao carregar a rodada."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (timeRemaining <= 0 || game?.status !== "em_andamento") return;
    const timeout = window.setTimeout(() => setTimeRemaining((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timeout);
  }, [game?.status, timeRemaining]);

  async function action(path: string, body: object) {
    try {
      setBusy(true);
      setError(null);
      const state = await apiFetch<GameState>(path, { method: "POST", body: JSON.stringify(body) });
      applyState(state);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível atualizar a rodada.");
    } finally {
      setBusy(false);
    }
  }

  function startGame(quizId: number) {
    void action("/jogo/iniciar/", { quiz_id: quizId });
  }

  function selectStudent(alunoId: number) {
    if (!game?.sessao_id) return;
    void action("/jogo/selecionar-aluno/", { sessao_id: game.sessao_id, aluno_id: alunoId });
  }

  function selectRandomStudent() {
    const participants = game?.participantes ?? [];
    if (!participants.length) return;
    const candidates = participants.filter((participant) => participant.aluno_id !== game?.aluno_atual_id);
    const pool = candidates.length ? candidates : participants;
    selectStudent(pool[randomIndex(pool.length)].aluno_id);
  }

  function answerQuestion(alternativeId: number) {
    if (!game?.sessao_id) return;
    void action("/jogo/responder/", {
      sessao_id: game.sessao_id,
      alternativa_id: alternativeId,
      tempo_gasto_segundos: Math.max(0, (game.tempo_por_pergunta ?? 90) - timeRemaining),
    });
  }

  function nextQuestion() {
    if (game?.sessao_id) void action("/jogo/proxima/", { sessao_id: game.sessao_id });
  }

  const selectedStudent = game?.participantes?.find((participant) => participant.aluno_id === game.aluno_atual_id);
  const isTimeUp = timeRemaining === 0;
  const formattedTime = `${String(Math.floor(timeRemaining / 60)).padStart(2, "0")}:${String(timeRemaining % 60).padStart(2, "0")}`;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">QuizBlast!</Link>
        <div className={styles.room}><span className={styles.liveDot} />{game?.status === "em_andamento" ? <>Rodada ao vivo <strong>{game.quiz?.turma}</strong></> : "Aguardando rodada"}</div>
        <Link aria-label="Abrir dashboard do professor" className={styles.dashboardLink} href="/dashboard"><Icon name="settings" size={20} /><span>Dashboard</span></Link>
      </header>

      {loading ? <section className={styles.stateScreen}><Icon name="rocket" size={65} /><h1>Carregando rodada...</h1></section> : error && !game ? <section className={styles.stateScreen}><h1>Não foi possível carregar</h1><p>{error}</p><Link href="/login">Entrar novamente</Link></section> : game?.status === "sem_sessao" ? <section className={styles.stateScreen}><Icon name="rocket" size={72} /><span>Sala de aula</span><h1>Inicie uma nova rodada</h1><p>Escolha um quiz com perguntas e alunos cadastrados.</p><div className={styles.quizChoices}>{game.quizzes?.map((quiz) => <button disabled={busy} key={quiz.id} onClick={() => startGame(quiz.id)} type="button"><strong>{quiz.titulo}</strong><small>{quiz.turma}</small><Icon name="play" size={22} /></button>)}</div>{!game.quizzes?.length && <p>Nenhum quiz disponível. Configure um quiz, turma e perguntas no dashboard.</p>}</section> : game?.status === "finalizada" ? <section className={styles.stateScreen}><Icon name="star" size={70} /><span>Rodada finalizada</span><h1>Ranking final</h1><div className={styles.finalRanking}>{game.ranking?.map((participant, index) => <div key={participant.aluno_id}><b>{index + 1}</b><strong>{participant.apelido || participant.nome}</strong><span>{participant.pontuacao} pts</span></div>)}</div><button onClick={() => window.location.reload()} type="button">Voltar ao início</button></section> : game?.pergunta && game.quiz ? <section className={styles.quizStage}>
        <div className={styles.missionInfo}><div><span className={styles.eyebrow}>{game.quiz.categoria}</span><h1>{game.quiz.titulo}</h1></div><div aria-live="polite" className={`${styles.timer} ${isTimeUp ? styles.timerExpired : ""}`}><Icon name="timer" size={24} /><div><span>{isTimeUp ? "Tempo esgotado" : "Tempo restante"}</span><strong>{formattedTime}</strong></div></div></div>
        {error && <div className={styles.gameError}>{error}</div>}
        <div className={styles.stageGrid}>
          <aside className={styles.playerCard}>{selectedStudent ? <><div className={styles.currentPlayer}><span className={styles.playerLabel}>Astronauta da vez</span><div className={styles.avatar}><AvatarImage participant={selectedStudent} priority /></div><div className={styles.playerDetails}><h2>{selectedStudent.apelido || selectedStudent.nome}</h2><p>Escolha uma alternativa!</p><div className={styles.score}><Icon name="star" size={19} /> {selectedStudent.pontuacao} pontos</div></div></div><div className={styles.studentPicker}><span>Selecionar astronauta</span><div>{game.participantes?.map((participant) => <button aria-label={`Selecionar ${participant.nome}`} aria-pressed={participant.aluno_id === game.aluno_atual_id} className={participant.aluno_id === game.aluno_atual_id ? styles.miniStudentActive : styles.miniStudent} disabled={busy} key={participant.aluno_id} onClick={() => selectStudent(participant.aluno_id)} title={participant.nome} type="button"><AvatarImage participant={participant} sizes="43px" /></button>)}</div></div><button className={styles.randomStudentButton} disabled={busy} onClick={selectRandomStudent} type="button"><Icon name="shuffle" size={18} /> Astronauta aleatório</button></> : <p>Nenhum aluno ativo nesta turma.</p>}</aside>
          <section aria-labelledby="live-question" className={styles.questionCard}><Icon className={styles.rocket} name="rocket" size={112} /><div className={styles.questionMeta}><span>Pergunta {game.pergunta_numero} de {game.total_perguntas}</span><span>Nível {game.pergunta.nivel_label}</span></div><h2 id="live-question">{game.pergunta.enunciado}</h2>{game.pergunta.imagem && <Image alt="Imagem de apoio da pergunta" className={styles.questionImage} height={220} loader={({ src }) => src} src={game.pergunta.imagem} unoptimized width={500} />}<div className={styles.answers}>{game.pergunta.alternativas.map((alternative) => { const selected = game.resposta?.alternativa_id === alternative.id; const correct = selected && game.resposta?.correta; return <button className={`${styles.answer} ${correct ? styles.correct : ""} ${selected && !correct ? styles.wrong : ""}`} disabled={busy || isTimeUp || Boolean(game.resposta) || !selectedStudent} key={alternative.id} onClick={() => answerQuestion(alternative.id)} type="button"><span>{String.fromCharCode(64 + alternative.ordem)}</span><strong>{alternative.texto}</strong>{selected && <Icon name={correct ? "check" : "quiz"} size={23} />}</button>; })}</div><div className={styles.questionFooter}><div aria-live="polite" className={styles.feedback}>{isTimeUp && !game.resposta && <span className={styles.tryAgain}>Tempo esgotado. Avance para a próxima pergunta.</span>}{game.resposta && (game.resposta.correta ? <span className={styles.success}>Resposta correta! +{game.resposta.pontos} pontos</span> : <span className={styles.tryAgain}>Resposta incorreta.</span>)}</div><button className={styles.nextQuestionButton} disabled={busy} onClick={nextQuestion} type="button">Próxima pergunta <Icon name="play" size={22} /></button></div></section>
          <ParticipantRanking ranking={game.ranking ?? []} selectedStudentId={game.aluno_atual_id ?? null} />
        </div>
        <div className={styles.roundProgress}><div><span>Progresso da rodada</span><strong>{game.pergunta_numero}/{game.total_perguntas}</strong></div><div className={styles.progressTrack}><span style={{ width: `${((game.pergunta_numero ?? 0) / Math.max(1, game.total_perguntas ?? 1)) * 100}%` }} /></div></div>
      </section> : null}
    </main>
  );
}
