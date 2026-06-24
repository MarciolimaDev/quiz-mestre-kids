"use client";

import { useState } from "react";
import { Icon } from "@/components/quiz-control/Icon";
import styles from "./StudentManager.module.css";

export type AvatarOption = { id: number; nome: string; imagem: string; ativo: boolean };

type AvatarPickerModalProps = {
  avatars: AvatarOption[];
  selectedId: number | null;
  onClose: () => void;
  onConfirm: (avatarId: number | null) => void;
};

export function AvatarPickerModal({ avatars, selectedId, onClose, onConfirm }: AvatarPickerModalProps) {
  const [draftId, setDraftId] = useState<number | null>(selectedId);
  const selected = avatars.find((avatar) => avatar.id === draftId);

  return (
    <div className={styles.avatarModalBackdrop}>
      <section aria-labelledby="avatar-modal-title" aria-modal="true" className={styles.avatarModal} role="dialog">
        <header className={styles.avatarModalHeader}>
          <div><span>Perfil do aluno</span><h2 id="avatar-modal-title">Escolha seu astronauta</h2><p>Selecione a imagem que será exibida durante o quiz e no ranking.</p></div>
          <button aria-label="Fechar seleção de avatar" onClick={onClose} type="button">×</button>
        </header>

        <div className={styles.avatarModalGrid}>
          <button aria-pressed={draftId === null} className={draftId === null ? styles.avatarModalSelected : undefined} onClick={() => setDraftId(null)} type="button">
            <span className={styles.avatarModalEmpty}><Icon name="account" size={58} /></span>
            <strong>Sem avatar</strong>
            <small>Usar iniciais</small>
            {draftId === null && <i><Icon name="check" size={19} /> Selecionado</i>}
          </button>
          {avatars.map((avatar) => (
            <button aria-label={`Selecionar ${avatar.nome}`} aria-pressed={draftId === avatar.id} className={draftId === avatar.id ? styles.avatarModalSelected : undefined} key={avatar.id} onClick={() => setDraftId(avatar.id)} type="button">
              <span style={{ backgroundImage: `url(${JSON.stringify(avatar.imagem)})` }} />
              <strong>{avatar.nome}</strong>
              <small>Astronauta</small>
              {draftId === avatar.id && <i><Icon name="check" size={19} /> Selecionado</i>}
            </button>
          ))}
        </div>

        <footer className={styles.avatarModalFooter}>
          <div>{selected ? <><span style={{ backgroundImage: `url(${JSON.stringify(selected.imagem)})` }} /><p><small>Avatar escolhido</small><strong>{selected.nome}</strong></p></> : <><span className={styles.avatarFooterEmpty}><Icon name="account" size={25} /></span><p><small>Avatar escolhido</small><strong>Sem avatar</strong></p></>}</div>
          <div><button onClick={onClose} type="button">Cancelar</button><button onClick={() => onConfirm(draftId)} type="button">Confirmar avatar <Icon name="check" size={21} /></button></div>
        </footer>
      </section>
    </div>
  );
}
