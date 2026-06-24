import type { Metadata } from "next";
import { QuestionManager } from "@/components/question-manager/QuestionManager";

export const metadata: Metadata = {
  title: "Perguntas | QuizBlast!",
  description: "Cadastro e gerenciamento das perguntas dos quizzes.",
};

export default function QuestionsPage() {
  return <QuestionManager />;
}
