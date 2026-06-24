import type { Metadata } from "next";
import { LiveQuiz } from "@/components/live-quiz/LiveQuiz";

export const metadata: Metadata = {
  title: "Rodada ao vivo | QuizBlast!",
  description: "Tela da rodada de quiz em andamento.",
};

export default function HomePage() {
  return <LiveQuiz />;
}
