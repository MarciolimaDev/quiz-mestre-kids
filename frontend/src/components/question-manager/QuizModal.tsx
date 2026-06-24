"use client";

import { useState } from "react";
import { Icon } from "@/components/quiz-control/Icon";
import { apiFetch } from "@/lib/api";
import styles from "./QuestionManager.module.css";

export type CreatedQuiz = {
  id: number;
  titulo: string;
  categoria_nome: string;
  quantidade_perguntas: number;
  ativo: boolean;
};

const CURRENT_YEAR = new Date().getFullYear();

type QuizModalProps = {
  onClose: () => void;
  onCreated: (quiz: CreatedQuiz) => void;
};

export function QuizModal({ onClose, onCreated }: QuizModalProps) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [serie, setSerie] = useState("");
  const [turma, setTurma] = useState("");
  const [anoLetivo, setAnoLetivo] = useState(CURRENT_YEAR);
  const [tempo, setTempo] = useState(300);
  const [quantidade, setQuantidade] = useState(10);
  const [pontos, setPontos] = useState(10);
  const [embaralhar, setEmbaralhar] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      setSaving(true);
      const quiz = await apiFetch<CreatedQuiz>("/quizzes/", {
        method: "POST",
        body: JSON.stringify({
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          categoria_nome: categoria.trim(),
          turma_serie: serie.trim(),
          turma_nome: turma.trim(),
          turma_ano_letivo: anoLetivo,
          tempo_limite_segundos: tempo,
          quantidade_perguntas: quantidade,
          embaralhar_perguntas: embaralhar,
          pontos_por_acerto: pontos,
          ativo: true,
        }),
      });
      onCreated(quiz);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível criar o quiz.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section aria-labelledby="new-quiz-title" aria-modal="true" className={styles.modal} role="dialog">
        <div className={styles.modalHeader}>
          <div><span>Configuração inicial</span><h2 id="new-quiz-title">Criar novo quiz</h2><p>Depois você poderá adicionar as perguntas.</p></div>
          <button aria-label="Fechar modal" onClick={onClose} type="button">×</button>
        </div>
        {error && <div className={styles.errorMessage} role="alert">{error}</div>}
        <form onSubmit={submit}>
          <label>Título<input autoFocus maxLength={150} onChange={(event) => setTitulo(event.target.value)} placeholder="Ex.: Missão Espacial: Frações" required value={titulo} /></label>
          <label>Categoria<input maxLength={100} onChange={(event) => setCategoria(event.target.value)} placeholder="Ex.: Matemática" required value={categoria} /></label>
          <div className={styles.turmaSection}>
            <div><strong>Turma do quiz</strong><span>Informe onde esta atividade será aplicada.</span></div>
            <div className={styles.modalNumbers}>
              <label>Série<input maxLength={50} onChange={(event) => setSerie(event.target.value)} placeholder="Ex.: 4º ano" required value={serie} /></label>
              <label>Turma<input maxLength={50} onChange={(event) => setTurma(event.target.value)} placeholder="Ex.: A" required value={turma} /></label>
              <label>Ano letivo<input min={2000} max={2100} onChange={(event) => setAnoLetivo(Number(event.target.value))} required type="number" value={anoLetivo} /></label>
            </div>
          </div>
          <label>Descrição <small>(opcional)</small><textarea onChange={(event) => setDescricao(event.target.value)} placeholder="Objetivo e contexto do quiz" rows={2} value={descricao} /></label>
          <div className={styles.modalNumbers}>
            <label>Tempo total <small>(segundos)</small><input min={1} onChange={(event) => setTempo(Number(event.target.value))} required type="number" value={tempo} /></label>
            <label>Quantidade de perguntas<input min={1} onChange={(event) => setQuantidade(Number(event.target.value))} required type="number" value={quantidade} /></label>
            <label>Pontos por acerto<input min={1} onChange={(event) => setPontos(Number(event.target.value))} required type="number" value={pontos} /></label>
          </div>
          <label className={styles.modalToggle}><input checked={embaralhar} onChange={(event) => setEmbaralhar(event.target.checked)} type="checkbox" /> Embaralhar perguntas sem repetição a cada rodada</label>
          <div className={styles.modalActions}><button onClick={onClose} type="button">Cancelar</button><button disabled={saving} type="submit">{saving ? "Criando..." : "Criar quiz"}<Icon name="check" size={20} /></button></div>
        </form>
      </section>
    </div>
  );
}
