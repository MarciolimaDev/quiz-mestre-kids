"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/quiz-control/Icon";
import { apiFetch as api } from "@/lib/api";
import { CreatedQuiz, QuizModal } from "./QuizModal";
import styles from "./QuestionManager.module.css";

type Quiz = {
  id: number;
  titulo: string;
  categoria_nome: string;
  quantidade_perguntas: number;
  ativo: boolean;
};

type Materia = { id: number; nome: string };
type Alternativa = { id?: number; texto: string; correta: boolean; ordem: number };
type Pergunta = {
  id: number;
  quiz: number;
  quiz_titulo: string;
  materia: number;
  materia_nome: string;
  enunciado: string;
  nivel: "facil" | "medio" | "dificil";
  ordem: number;
  ativa: boolean;
  imagem?: string | null;
  alternativas: Alternativa[];
};

const emptyAlternatives = (): Alternativa[] => [
  { texto: "", correta: true, ordem: 1 },
  { texto: "", correta: false, ordem: 2 },
  { texto: "", correta: false, ordem: 3 },
  { texto: "", correta: false, ordem: 4 },
];

export function QuestionManager() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [quizId, setQuizId] = useState("");
  const [materiaId, setMateriaId] = useState("");
  const [novaMateria, setNovaMateria] = useState("");
  const [enunciado, setEnunciado] = useState("");
  const [nivel, setNivel] = useState<Pergunta["nivel"]>("facil");
  const [ativa, setAtiva] = useState(true);
  const [alternativas, setAlternativas] = useState<Alternativa[]>(emptyAlternatives);
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Pergunta | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
        api<Quiz[]>("/quizzes/"),
        api<Materia[]>("/materias/"),
        api<Pergunta[]>("/perguntas/"),
      ])
      .then(([quizData, materiaData, perguntaData]) => {
        if (cancelled) return;
      setQuizzes(quizData);
      setMaterias(materiaData);
      setPerguntas(perguntaData);
      setQuizId((current) => current || String(quizData[0]?.id ?? ""));
      setMateriaId((current) => current || String(materiaData[0]?.id ?? ""));
      })
      .catch((error: unknown) => {
        if (!cancelled) setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao carregar dados." });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredQuestions = useMemo(() => {
    const term = busca.trim().toLocaleLowerCase("pt-BR");
    if (!term) return perguntas;
    return perguntas.filter((question) =>
      `${question.enunciado} ${question.quiz_titulo} ${question.materia_nome}`.toLocaleLowerCase("pt-BR").includes(term),
    );
  }, [busca, perguntas]);

  function updateAlternative(index: number, texto: string) {
    setAlternativas((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, texto } : item));
  }

  function setCorrectAlternative(index: number) {
    setAlternativas((current) => current.map((item, itemIndex) => ({ ...item, correta: itemIndex === index })));
  }

  function resetForm() {
    setEnunciado("");
    setNivel("facil");
    setAtiva(true);
    setAlternativas(emptyAlternatives());
    setImagemFile(null);
    setEditingQuestion(null);
    setFileInputKey((current) => current + 1);
  }

  function startEditQuestion(question: Pergunta) {
    setEditingQuestion(question);
    setQuizId(String(question.quiz));
    setMateriaId(String(question.materia));
    setEnunciado(question.enunciado);
    setNivel(question.nivel);
    setAtiva(question.ativa);
    setAlternativas(
      [...question.alternativas]
        .sort((a, b) => a.ordem - b.ordem)
        .map((alternative) => ({
          id: alternative.id,
          texto: alternative.texto,
          correta: alternative.correta,
          ordem: alternative.ordem,
        })),
    );
    setImagemFile(null);
    setFileInputKey((current) => current + 1);
    setMessage({ type: "success", text: "Modo edição ativado. Altere os dados e salve a pergunta." });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function alternativesPayload() {
    return alternativas.map((alternative) => ({
      id: alternative.id,
      texto: alternative.texto.trim(),
      correta: alternative.correta,
      ordem: alternative.ordem,
    }));
  }

  async function createSubject() {
    if (!novaMateria.trim()) return;
    try {
      const materia = await api<Materia>("/materias/", {
        method: "POST",
        body: JSON.stringify({ nome: novaMateria.trim() }),
      });
      setMaterias((current) => [...current, materia].sort((a, b) => a.nome.localeCompare(b.nome)));
      setMateriaId(String(materia.id));
      setNovaMateria("");
      setMessage({ type: "success", text: "Matéria cadastrada." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao cadastrar matéria." });
    }
  }

  async function submitQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!quizId || !materiaId) {
      setMessage({ type: "error", text: "Selecione um quiz e uma matéria." });
      return;
    }
    if (alternativas.some((alternative) => !alternative.texto.trim())) {
      setMessage({ type: "error", text: "Preencha as quatro alternativas." });
      return;
    }
    try {
      setSaving(true);
      let saved: Pergunta;
      const endpoint = editingQuestion ? `/perguntas/${editingQuestion.id}/` : "/perguntas/";
      const method = editingQuestion ? "PATCH" : "POST";
      if (imagemFile) {
        const form = new FormData();
        form.append("quiz", String(Number(quizId)));
        form.append("materia", String(Number(materiaId)));
        form.append("enunciado", enunciado.trim());
        form.append("nivel", nivel);
        form.append("ativa", String(ativa));
        form.append("imagem", imagemFile);
        form.append(
          "alternativas",
          JSON.stringify(alternativesPayload()),
        );
        saved = await api<Pergunta>(endpoint, {
          method,
          body: form,
        });
      } else {
        saved = await api<Pergunta>(endpoint, {
          method,
          body: JSON.stringify({
            quiz: Number(quizId),
            materia: Number(materiaId),
            enunciado: enunciado.trim(),
            nivel,
            ativa,
            alternativas: alternativesPayload(),
          }),
        });
      }
      setPerguntas((current) => editingQuestion ? current.map((question) => question.id === saved.id ? saved : question) : [...current, saved]);
      resetForm();
      setMessage({ type: "success", text: editingQuestion ? "Pergunta atualizada." : "Pergunta salva no banco de dados." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao salvar pergunta." });
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion(question: Pergunta) {
    if (!window.confirm(`Excluir a pergunta “${question.enunciado}”?`)) return;
    try {
      await api<void>(`/perguntas/${question.id}/`, { method: "DELETE" });
      setPerguntas((current) => current.filter((item) => item.id !== question.id));
      setMessage({ type: "success", text: "Pergunta excluída." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao excluir pergunta." });
    }
  }

  function addCreatedQuiz(quiz: CreatedQuiz) {
    setQuizzes((current) => [quiz, ...current]);
    setQuizId(String(quiz.id));
    setShowQuizModal(false);
    setMessage({ type: "success", text: `Quiz “${quiz.titulo}” criado e selecionado.` });
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span>Banco de conteúdo</span>
          <h1>Perguntas</h1>
          <p>Cadastre as perguntas e indique a única resposta correta.</p>
        </div>
        <div className={styles.headerActions}><button onClick={() => setShowQuizModal(true)} type="button"><Icon name="add" size={19} /> Novo quiz</button><div className={styles.totalCard}><strong>{perguntas.length}</strong><span>perguntas cadastradas</span></div></div>
      </header>

      {message && <div className={message.type === "success" ? styles.successMessage : styles.errorMessage} role="status">{message.text}</div>}

      <div className={styles.contentGrid}>
        <form className={styles.formCard} onSubmit={submitQuestion}>
          <div className={styles.cardTitle}><Icon name="quiz" size={24} /><div><h2>{editingQuestion ? "Editar pergunta" : "Nova pergunta"}</h2><p>{editingQuestion ? "Altere nível, enunciado, imagem e alternativas." : "Os dados serão salvos no Django."}</p></div></div>

          {quizzes.length === 0 && <div className={styles.warning}><span>Nenhum quiz cadastrado.</span><button onClick={() => setShowQuizModal(true)} type="button">Criar primeiro quiz</button></div>}

          <div className={styles.twoColumns}>
            <label>Quiz<select disabled={!quizzes.length} onChange={(event) => setQuizId(event.target.value)} required value={quizId}><option value="">Selecione</option>{quizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.titulo}</option>)}</select></label>
            <label>Nível<select onChange={(event) => setNivel(event.target.value as Pergunta["nivel"])} value={nivel}><option value="facil">Fácil</option><option value="medio">Médio</option><option value="dificil">Difícil</option></select></label>
          </div>

          <label>Matéria<select disabled={!materias.length} onChange={(event) => setMateriaId(event.target.value)} required value={materiaId}><option value="">Selecione</option>{materias.map((materia) => <option key={materia.id} value={materia.id}>{materia.nome}</option>)}</select></label>
          <div className={styles.newSubject}><input aria-label="Nome da nova matéria" onChange={(event) => setNovaMateria(event.target.value)} placeholder="Ou cadastre uma nova matéria" value={novaMateria} /><button onClick={createSubject} type="button"><Icon name="add" size={18} /> Adicionar</button></div>

          <label>Enunciado<textarea maxLength={1000} onChange={(event) => setEnunciado(event.target.value)} placeholder="Digite a pergunta..." required rows={3} value={enunciado} /></label>
          <label>Imagem (opcional)<input key={fileInputKey} onChange={(event) => setImagemFile(event.target.files?.[0] ?? null)} type="file" accept="image/*" />{editingQuestion?.imagem && !imagemFile && <small>Imagem atual mantida se você não escolher outra.</small>}</label>

          <fieldset className={styles.alternatives}>
            <legend>
              Alternativas <small>Selecione a correta</small>
            </legend>
            {alternativas.map((alternative, index) => (
              <label key={alternative.ordem}>
                <input checked={alternative.correta} name="correct-answer" onChange={() => setCorrectAlternative(index)} type="radio" />
                <span>{String.fromCharCode(65 + index)}</span>
                <input aria-label={`Alternativa ${String.fromCharCode(65 + index)}`} onChange={(event) => updateAlternative(index, event.target.value)} placeholder={`Alternativa ${String.fromCharCode(65 + index)}`} required value={alternative.texto} />
              </label>
            ))}
          </fieldset>

          <label className={styles.activeToggle}><input checked={ativa} onChange={(event) => setAtiva(event.target.checked)} type="checkbox" /><span /> Pergunta ativa</label>
          <div className={styles.formFooter}>
            {editingQuestion && <button className={styles.cancelEditButton} onClick={resetForm} type="button">Cancelar edição</button>}
            <button className={styles.saveButton} disabled={saving || !quizzes.length} type="submit">{saving ? "Salvando..." : editingQuestion ? "Atualizar pergunta" : "Salvar pergunta"}<Icon name="check" size={21} /></button>
          </div>
        </form>

        <section className={styles.listCard}>
          <div className={styles.listHeader}>
            <div>
              <h2>Perguntas cadastradas</h2>
              <p>Conteúdo disponível para os quizzes.</p>
            </div>
            <div className={styles.search}><Icon name="quiz" size={18} /><input aria-label="Buscar perguntas" onChange={(event) => setBusca(event.target.value)} placeholder="Buscar..." value={busca} /></div>
          </div>
          {loading ? (
            <p className={styles.empty}>Carregando perguntas...</p>
          ) : filteredQuestions.length === 0 ? (
            <p className={styles.empty}>Nenhuma pergunta encontrada.</p>
          ) : (
            <div className={styles.questionList}>
              {filteredQuestions.map((question) => (
                <article key={question.id}>
                  <div className={styles.questionTop}>
                    <div>
                      <span className={styles.level}>{question.nivel}</span>
                      <span className={question.ativa ? styles.active : styles.inactive}>{question.ativa ? "Ativa" : "Inativa"}</span>
                    </div>
                    <div className={styles.questionActions}>
                      <button aria-label="Editar pergunta" onClick={() => startEditQuestion(question)} type="button">Editar</button>
                      <button aria-label="Excluir pergunta" onClick={() => deleteQuestion(question)} type="button">Excluir</button>
                    </div>
                  </div>
                  <h3>{question.enunciado}</h3>
                  {question.imagem && (
                    <Image alt="Imagem da pergunta" height={140} loader={({ src }) => src} src={question.imagem} style={{ maxWidth: "220px", height: "auto", display: "block", margin: "8px 0" }} unoptimized width={220} />
                  )}
                  <p>{question.quiz_titulo} <span>•</span> {question.materia_nome}</p>
                  <ol>
                    {question.alternativas.map((alternative) => (
                      <li className={alternative.correta ? styles.correctAnswer : undefined} key={alternative.ordem}>
                        <span>{String.fromCharCode(64 + alternative.ordem)}</span>
                        {alternative.texto}
                        {alternative.correta && <Icon name="check" size={16} />}
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      {showQuizModal && <QuizModal onClose={() => setShowQuizModal(false)} onCreated={addCreatedQuiz} />}
    </div>
  );
}
