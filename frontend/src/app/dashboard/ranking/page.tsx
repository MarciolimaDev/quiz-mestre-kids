import type { Metadata } from "next";
import { GeneralRanking } from "@/components/ranking/GeneralRanking";

export const metadata: Metadata = {
  title: "Ranking geral | QuizBlast!",
  description: "Classificação acumulada de todas as rodadas.",
};

export default function RankingPage() {
  return <GeneralRanking />;
}
