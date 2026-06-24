"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Icon } from "./Icon";
import styles from "./QuizControl.module.css";

type Student = {
  id: number;
  name: string;
  avatar: string;
  alt: string;
};

const students: Student[] = [
  { id: 1, name: "Leo", avatar: "/avatars/leo.png", alt: "Avatar do aluno Leo" },
  { id: 2, name: "Sofia", avatar: "/avatars/sofia.png", alt: "Avatar da aluna Sofia" },
  { id: 3, name: "Tiago", avatar: "/avatars/tiago.png", alt: "Avatar do aluno Tiago" },
  { id: 4, name: "Bia", avatar: "/avatars/bia.png", alt: "Avatar da aluna Bia" },
  { id: 5, name: "Hugo", avatar: "/avatars/hugo.png", alt: "Avatar do aluno Hugo" },
];

function randomIndex(length: number) {
  return Math.floor(Math.random() * length);
}

export function MissionControls() {
  const [selectedId, setSelectedId] = useState(2);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  }

  function selectStudent(student: Student) {
    setSelectedId(student.id);
    showToast(`Astronauta ${student.name} selecionado!`);
  }

  function selectRandomStudent() {
    const candidates = students.filter((student) => student.id !== selectedId);
    const selected = candidates[randomIndex(candidates.length)];
    selectStudent(selected);
  }

  return (
    <aside className={styles.controlsColumn} aria-label="Comandos do quiz">
      <section className={styles.actionPanel}>
        <h2><Icon name="rocket" size={24} /> Comandos da missão</h2>
        <button className={`${styles.nextButton} ${styles.pressable}`} onClick={() => showToast("Próxima pergunta iniciada!")} type="button">
          Próxima pergunta <Icon name="play" size={28} />
        </button>
        <button className={styles.timerButton} onClick={() => showToast("30 segundos adicionados!")} type="button">
          <Icon name="timer" size={20} /> Adicionar +30s
        </button>
      </section>

      <section className={`${styles.panel} ${styles.studentsPanel}`}>
        <h2>Selecionar próximo astronauta</h2>
        <div className={styles.studentsGrid}>
          {students.map((student) => {
            const selected = selectedId === student.id;
            return (
              <button
                aria-pressed={selected}
                className={selected ? styles.studentSelected : styles.student}
                key={student.id}
                onClick={() => selectStudent(student)}
                type="button"
              >
                <span className={styles.avatarWrap}>
                  <Image alt={student.alt} fill sizes="64px" src={student.avatar} />
                </span>
                <span>{student.name}{selected ? " (Ativa)" : ""}</span>
              </button>
            );
          })}
          <button className={styles.viewAll} type="button">
            <span className={styles.viewAllCircle}><Icon name="add" size={28} /></span>
            <span>Ver todos</span>
          </button>
        </div>
        <button className={`${styles.randomButton} ${styles.pressable}`} onClick={selectRandomStudent} type="button">
          <Icon name="shuffle" size={20} /> Sorteio aleatório
        </button>
      </section>

      <div aria-live="polite" className={`${styles.toast} ${toast ? styles.toastVisible : ""}`} role="status">
        <Icon name="star" size={22} />
        <span>{toast}</span>
      </div>
    </aside>
  );
}
