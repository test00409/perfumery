import ProfileSidebar from "./ProfileSidebar";
import { COLORS, FONTS } from "../../constants/colors";
import { UserProfileProvider } from "../contexts/UserProfileContext";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      className="pt-40 sm:pt-40 min-h-screen pb-16 px-4 sm:px-8 lg:px-16"
      style={{
        backgroundColor: COLORS.BgLight,
        fontFamily: FONTS.Primary,
      }}
    >
      <UserProfileProvider>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <ProfileSidebar />

          <div
            className="block w-full rounded-xl p-5 sm:p-5 space-y-1 shadow-sm sm:pt-1"
            style={{
              backgroundColor: COLORS.White,
              fontFamily: FONTS.Primary,
            }}
          >
            {children}
          </div>
        </div>
      </UserProfileProvider>
    </main>
  );
}
