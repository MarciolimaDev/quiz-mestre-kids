import type { CSSProperties } from "react";
import type { RankingEntry } from "./ranking.types";
import styles from "./GeneralRanking.module.css";

type RankingAvatarProps = {
  entry: RankingEntry;
  className?: string;
};

export function RankingAvatar({ entry, className }: RankingAvatarProps) {
  const avatarStyle: CSSProperties | undefined = entry.avatar
    ? { backgroundImage: `url(${JSON.stringify(entry.avatar)})` }
    : undefined;

  return (
    <span
      aria-label={`Avatar de ${entry.apelido || entry.nome}`}
      className={`${styles.avatar} ${className ?? ""}`}
      role="img"
      style={avatarStyle}
    >
      {!entry.avatar && entry.nome.slice(0, 1).toLocaleUpperCase("pt-BR")}
    </span>
  );
}
