import type { Metadata } from "next";
import { ProfileSettingsView } from "@/components/settings/profile-settings-view";

export const metadata: Metadata = {
  title: "Profile Settings",
};

export default function ProfilePage() {
  return <ProfileSettingsView />;
}
