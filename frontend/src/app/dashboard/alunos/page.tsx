import type { Metadata } from "next";
import { StudentManager } from "@/components/student-manager/StudentManager";

export const metadata: Metadata = {
  title: "Alunos | QuizBlast!",
  description: "Cadastro e gerenciamento dos alunos por turma.",
};

export default function StudentsPage() {
  return <StudentManager />;
}
