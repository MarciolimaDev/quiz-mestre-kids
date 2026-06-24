"use client";

import NextImage from "next/image";
import { useEffect, useState } from "react";
import { Icon } from "@/components/quiz-control/Icon";
import { apiFetch } from "@/lib/api";
import styles from "./AvatarManager.module.css";

type Avatar = { id: number; nome: string; imagem: string; ativo: boolean; criado_em: string };

const OUTPUT_SIZE = 512;

async function cropAvatar(source: string, originalName: string, zoom: number, positionX: number, positionY: number) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new window.Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Não foi possível processar a imagem."));
    element.src = source;
  });
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("O navegador não conseguiu preparar a imagem.");
  const coverScale = Math.max(OUTPUT_SIZE / image.naturalWidth, OUTPUT_SIZE / image.naturalHeight);
  const scale = coverScale * zoom;
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const x = -(width - OUTPUT_SIZE) * (positionX / 100);
  const y = -(height - OUTPUT_SIZE) * (positionY / 100);
  context.drawImage(image, x, y, width, height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Não foi possível gerar o recorte.")), "image/webp", 0.9);
  });
  const baseName = originalName.replace(/\.[^.]+$/, "") || "avatar";
  return new File([blob], `${baseName}-512.webp`, { type: "image/webp" });
}

export function AvatarManager() {
  const [avatares, setAvatares] = useState<Avatar[]>([]);
  const [nome, setNome] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [ativo, setAtivo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Avatar[]>("/avatares/")
      .then((data) => { if (!cancelled) setAvatares(data); })
      .catch((error: unknown) => { if (!cancelled) setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao carregar avatares." }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function chooseFile(file: File | null) {
    setArquivo(file);
    setPreview(null);
    setZoom(1);
    setPositionX(50);
    setPositionY(50);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }

  async function createAvatar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!arquivo) {
      setMessage({ type: "error", text: "Selecione uma imagem." });
      return;
    }
    try {
      setSaving(true);
      if (!preview) throw new Error("Aguarde a pré-visualização da imagem.");
      const adjustedImage = await cropAvatar(preview, arquivo.name, zoom, positionX, positionY);
      const data = new FormData();
      data.append("nome", nome.trim());
      data.append("imagem", adjustedImage);
      data.append("ativo", String(ativo));
      const created = await apiFetch<Avatar>("/avatares/", { method: "POST", body: data });
      setAvatares((current) => [...current, created].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNome("");
      setArquivo(null);
      setPreview(null);
      setZoom(1);
      setPositionX(50);
      setPositionY(50);
      setFileInputKey((current) => current + 1);
      setAtivo(true);
      setMessage({ type: "success", text: "Avatar adicionado à biblioteca." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao salvar avatar." });
    } finally {
      setSaving(false);
    }
  }

  async function deleteAvatar(avatar: Avatar) {
    if (!window.confirm(`Excluir o avatar “${avatar.nome}”?`)) return;
    try {
      await apiFetch<void>(`/avatares/${avatar.id}/`, { method: "DELETE" });
      setAvatares((current) => current.filter((item) => item.id !== avatar.id));
      setMessage({ type: "success", text: "Avatar excluído." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Erro ao excluir avatar." });
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}><div><span>Personalização</span><h1>Configurações</h1><p>Gerencie as imagens disponíveis para os perfis dos alunos.</p></div><div className={styles.counter}><strong>{avatares.length}</strong><span>avatares</span></div></header>
      {message && <div className={message.type === "success" ? styles.successMessage : styles.errorMessage} role="status">{message.text}</div>}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeading}><div><Icon name="account" size={27} /><div><h2>Biblioteca de avatares</h2><p>Imagens quadradas funcionam melhor no perfil.</p></div></div><span>PNG, JPG, GIF ou WebP · máximo 5 MB</span></div>
        <div className={styles.contentGrid}>
          <form className={styles.uploadForm} onSubmit={createAvatar}>
            <div className={styles.preview}>{preview ? <NextImage alt="Pré-visualização ajustada do avatar" fill src={preview} style={{ objectFit: "cover", objectPosition: `${positionX}% ${positionY}%`, transform: `scale(${zoom})` }} unoptimized /> : <><Icon name="add" size={34} /><span>Pré-visualização</span></>}</div>
            {preview && <div className={styles.editorControls}>
              <label>Zoom <b>{zoom.toFixed(1)}×</b><input max={3} min={1} onChange={(event) => setZoom(Number(event.target.value))} step={0.1} type="range" value={zoom} /></label>
              <label>Horizontal<input max={100} min={0} onChange={(event) => setPositionX(Number(event.target.value))} type="range" value={positionX} /></label>
              <label>Vertical<input max={100} min={0} onChange={(event) => setPositionY(Number(event.target.value))} type="range" value={positionY} /></label>
              <small>O arquivo será salvo em 512×512 px.</small>
            </div>}
            <label>Nome do avatar<input maxLength={80} onChange={(event) => setNome(event.target.value)} placeholder="Ex.: Astronauta azul" required value={nome} /></label>
            <label className={styles.fileInput}><span>Selecionar imagem</span><input accept="image/png,image/jpeg,image/gif,image/webp" key={fileInputKey} onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} required type="file" />{arquivo && <small>{arquivo.name}</small>}</label>
            <label className={styles.activeToggle}><input checked={ativo} onChange={(event) => setAtivo(event.target.checked)} type="checkbox" /> Disponível para seleção</label>
            <button disabled={saving} type="submit">{saving ? "Enviando..." : "Adicionar avatar"}<Icon name="check" size={20} /></button>
          </form>
          <div className={styles.avatarLibrary}>{loading ? <p className={styles.empty}>Carregando avatares...</p> : avatares.length === 0 ? <p className={styles.empty}>Nenhum avatar cadastrado.</p> : <div className={styles.avatarGrid}>{avatares.map((avatar) => <article key={avatar.id}><div style={{ backgroundImage: `url(${JSON.stringify(avatar.imagem)})` }} /><h3>{avatar.nome}</h3><span className={avatar.ativo ? styles.active : styles.inactive}>{avatar.ativo ? "Disponível" : "Inativo"}</span><button onClick={() => deleteAvatar(avatar)} type="button">Excluir</button></article>)}</div>}</div>
        </div>
      </section>
    </div>
  );
}
