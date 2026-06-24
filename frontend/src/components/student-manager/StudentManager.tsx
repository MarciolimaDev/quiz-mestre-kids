"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/quiz-control/Icon";
import { apiFetch } from "@/lib/api";
import { AvatarPickerModal, type AvatarOption } from "./AvatarPickerModal";
import styles from "./StudentManager.module.css";

type Turma = {
  id: number;
  serie: string;
  nome: string;
  ano_letivo: number;
  ativa: boolean;
  label: string;
};

type Aluno = {
  id: number;
  pontos?: number;
  nome: string;
  apelido: string;
  avatar: number | null;
  avatar_nome: string | null;
  avatar_imagem: string | null;
  avatar_url: string;
  turma: number;
  turma_label: string;
  ativo: boolean;
};

const CURRENT_YEAR = new Date().getFullYear();

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function StudentManager() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [avatares, setAvatares] = useState<AvatarOption[]>([]);
  const [nome, setNome] = useState("");
  const [apelido, setApelido] = useState("");
  const [avatarId, setAvatarId] = useState<number | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [turmaId, setTurmaId] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [showNewClass, setShowNewClass] = useState(false);
  const [serie, setSerie] = useState("");
  const [nomeTurma, setNomeTurma] = useState("");
  const [anoLetivo, setAnoLetivo] = useState(CURRENT_YEAR);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([apiFetch<Turma[]>("/turmas/"), apiFetch<Aluno[]>("/alunos/"), apiFetch<AvatarOption[]>("/avatares/")])
      .then(([classData, studentData, avatarData]) => {
        if (cancelled) return;
        setTurmas(classData);
        setAlunos(studentData);
        setAvatares(avatarData.filter((avatar) => avatar.ativo));
        setTurmaId(String(classData[0]?.id ?? ""));
      })
      .catch((error: unknown) => {
        if (!cancelled) setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao carregar alunos." });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filteredStudents = useMemo(() => {
    const term = busca.trim().toLocaleLowerCase("pt-BR");
    return alunos.filter((student) => {
      const matchesClass = !filtroTurma || String(student.turma) === filtroTurma;
      const matchesSearch = !term || `${student.nome} ${student.apelido} ${student.turma_label}`.toLocaleLowerCase("pt-BR").includes(term);
      return matchesClass && matchesSearch;
    });
  }, [alunos, busca, filtroTurma]);
  const selectedAvatar = avatares.find((avatar) => avatar.id === avatarId);

  async function createClass(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const created = await apiFetch<Turma>("/turmas/", {
        method: "POST",
        body: JSON.stringify({ serie: serie.trim(), nome: nomeTurma.trim(), ano_letivo: anoLetivo, ativa: true }),
      });
      setTurmas((current) => [created, ...current]);
      setTurmaId(String(created.id));
      setSerie("");
      setNomeTurma("");
      setShowNewClass(false);
      setMessage({ type: "success", text: `Turma “${created.label}” cadastrada e selecionada.` });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao cadastrar turma." });
    }
  }

  async function createStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (!turmaId) {
      setMessage({ type: "error", text: "Selecione ou cadastre uma turma." });
      return;
    }
    try {
      setSaving(true);
      const created = await apiFetch<Aluno>("/alunos/", {
        method: "POST",
        body: JSON.stringify({ nome: nome.trim(), apelido: apelido.trim(), avatar: avatarId, avatar_url: "", turma: Number(turmaId), ativo }),
      });
      setAlunos((current) => [...current, created].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNome("");
      setApelido("");
      setAvatarId(null);
      setAtivo(true);
      setMessage({ type: "success", text: "Aluno salvo no banco de dados." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao cadastrar aluno." });
    } finally {
      setSaving(false);
    }
  }

  async function deleteStudent(student: Aluno) {
    if (!window.confirm(`Excluir o aluno “${student.nome}”?`)) return;
    try {
      await apiFetch<void>(`/alunos/${student.id}/`, { method: "DELETE" });
      setAlunos((current) => current.filter((item) => item.id !== student.id));
      setMessage({ type: "success", text: "Aluno excluído." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao excluir aluno." });
    }
  }

  async function changePoints(student: Aluno, delta: number) {
    try {
      const result = await apiFetch<{ id: number; pontos: number }>(`/alunos/${student.id}/pontos/`, {
        method: "POST",
        body: JSON.stringify({ delta }),
      });
      setAlunos((current) => current.map((s) => (s.id === student.id ? { ...s, pontos: result.pontos } : s)));
      setMessage({ type: "success", text: "Pontos atualizados." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao atualizar pontos." });
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div><span>Gestão da turma</span><h1>Alunos</h1><p>Cadastre os participantes que poderão pontuar nas rodadas.</p></div>
        <div className={styles.stats}><div><strong>{alunos.length}</strong><span>alunos</span></div><div><strong>{turmas.length}</strong><span>turmas</span></div></div>
      </header>

      {message && <div className={message.type === "success" ? styles.successMessage : styles.errorMessage} role="status">{message.text}</div>}

      <div className={styles.contentGrid}>
        <section className={styles.formCard}>
          <div className={styles.cardTitle}><Icon name="group" size={25} /><div><h2>Novo aluno</h2><p>Dados usados no placar da turma.</p></div></div>
          {turmas.length === 0 && <div className={styles.warning}><span>Nenhuma turma cadastrada.</span><button onClick={() => setShowNewClass(true)} type="button">Criar turma</button></div>}

          <form onSubmit={createStudent}>
            <label>Nome completo<input maxLength={150} onChange={(event) => setNome(event.target.value)} placeholder="Ex.: Ana Paula Souza" required value={nome} /></label>
            <div className={styles.twoColumns}>
              <label>Apelido <small>(opcional)</small><input maxLength={50} onChange={(event) => setApelido(event.target.value)} placeholder="Ex.: Ana" value={apelido} /></label>
              <label>Turma<select disabled={!turmas.length} onChange={(event) => setTurmaId(event.target.value)} required value={turmaId}><option value="">Selecione</option>{turmas.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.label}</option>)}</select></label>
            </div>
            <div className={styles.avatarChooser}>
              <div>{selectedAvatar ? <span style={{ backgroundImage: `url(${JSON.stringify(selectedAvatar.imagem)})` }} /> : <span className={styles.avatarChooserEmpty}><Icon name="account" size={28} /></span>}<p><small>Avatar do aluno</small><strong>{selectedAvatar?.nome || "Sem avatar"}</strong></p></div>
              <button disabled={avatares.length === 0} onClick={() => setShowAvatarModal(true)} type="button"><Icon name="account" size={19} /> {selectedAvatar ? "Trocar avatar" : "Escolher avatar"}</button>
              {avatares.length === 0 && <small>Adicione avatares em Configurações.</small>}
            </div>
            <label className={styles.activeToggle}><input checked={ativo} onChange={(event) => setAtivo(event.target.checked)} type="checkbox" /> Aluno ativo</label>
            <div className={styles.formActions}><button onClick={() => setShowNewClass((current) => !current)} type="button"><Icon name="add" size={18} /> Nova turma</button><button disabled={saving || !turmas.length} type="submit">{saving ? "Salvando..." : "Salvar aluno"}<Icon name="check" size={20} /></button></div>
          </form>

          {showNewClass && <form className={styles.classForm} onSubmit={createClass}><div><strong>Cadastrar turma</strong><button aria-label="Fechar cadastro de turma" onClick={() => setShowNewClass(false)} type="button">×</button></div><div className={styles.classFields}><label>Série<input maxLength={50} onChange={(event) => setSerie(event.target.value)} placeholder="4º ano" required value={serie} /></label><label>Turma<input maxLength={50} onChange={(event) => setNomeTurma(event.target.value)} placeholder="A" required value={nomeTurma} /></label><label>Ano<input min={2000} max={2100} onChange={(event) => setAnoLetivo(Number(event.target.value))} required type="number" value={anoLetivo} /></label></div><button type="submit">Cadastrar e selecionar</button></form>}
        </section>

        <section className={styles.listCard}>
          <div className={styles.listHeader}><div><h2>Alunos cadastrados</h2><p>Participantes disponíveis para as rodadas.</p></div><div className={styles.filters}><input aria-label="Buscar alunos" onChange={(event) => setBusca(event.target.value)} placeholder="Buscar aluno..." value={busca} /><select aria-label="Filtrar por turma" onChange={(event) => setFiltroTurma(event.target.value)} value={filtroTurma}><option value="">Todas as turmas</option>{turmas.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.label}</option>)}</select></div></div>
          {loading ? <p className={styles.empty}>Carregando alunos...</p> : filteredStudents.length === 0 ? <p className={styles.empty}>Nenhum aluno encontrado.</p> : <div className={styles.studentGrid}>{filteredStudents.map((student) => { const image = student.avatar_imagem || student.avatar_url; return <article key={student.id}><div className={styles.avatar} style={image ? { backgroundImage: `url(${JSON.stringify(image)})` } : undefined}>{!image && initials(student.nome)}</div><div className={styles.studentInfo}><div><h3>{student.nome}</h3><span className={student.ativo ? styles.active : styles.inactive}>{student.ativo ? "Ativo" : "Inativo"}</span></div><p>{student.apelido || "Sem apelido"}</p><small>{student.turma_label}</small><div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}><button onClick={() => changePoints(student, -1)} type="button">−</button><strong style={{ minWidth: 36, textAlign: "center" }}>{student.pontos ?? 0}</strong><button onClick={() => changePoints(student, 1)} type="button">+</button></div></div><button aria-label={`Excluir ${student.nome}`} onClick={() => deleteStudent(student)} type="button">Excluir</button></article>; })}</div>}
        </section>
      </div>
      {showAvatarModal && <AvatarPickerModal avatars={avatares} onClose={() => setShowAvatarModal(false)} onConfirm={(selectedId) => { setAvatarId(selectedId); setShowAvatarModal(false); }} selectedId={avatarId} />}
    </div>
  );
}
