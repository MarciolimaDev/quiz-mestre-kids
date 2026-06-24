import { BottomNavigation } from "@/components/quiz-control/BottomNavigation";
import { Sidebar } from "@/components/quiz-control/Sidebar";
import { TopHeader } from "@/components/quiz-control/TopHeader";
import styles from "@/components/quiz-control/QuizControl.module.css";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.appShell}>
      <TopHeader />
      <Sidebar />
      <main className={styles.mainContent}>{children}</main>
      <BottomNavigation />
    </div>
  );
}
