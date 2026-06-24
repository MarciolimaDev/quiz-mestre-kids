import type { Metadata } from "next";
import { AvatarManager } from "@/components/avatar-manager/AvatarManager";

export const metadata: Metadata = {
  title: "Configurações | QuizBlast!",
  description: "Configurações e biblioteca de avatares.",
};

export default function SettingsPage() {
  return <AvatarManager />;
}
