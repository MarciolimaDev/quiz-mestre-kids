import type { Metadata } from "next";
import { LiveActivity } from "@/components/quiz-control/LiveActivity";
import { MissionControls } from "@/components/quiz-control/MissionControls";
import { MissionHeader } from "@/components/quiz-control/MissionHeader";
import { QuestionPanel } from "@/components/quiz-control/QuestionPanel";
import styles from "@/components/quiz-control/QuizControl.module.css";

export const metadata: Metadata = {
  title: "Dashboard | QuizBlast!",
  description: "Painel do professor para gerenciar e controlar quizzes.",
};

export default function DashboardPage() {
  return (
    <>
      <MissionHeader />
      <div className={styles.dashboardGrid}>
        <QuestionPanel />
        <MissionControls />
      </div>
      <LiveActivity />
    </>
  );
}
