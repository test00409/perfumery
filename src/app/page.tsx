// // "use client";
// import React, { useEffect, useState } from "react";
// import SectionRenderer from "../components/home/SectionRenderer";
// import HomePopup from "../components/common/HomePopup";
// import data from "./data/homepage.json";
// import Loader from "../components/common/Loader";

// const isIOSApp = () =>
//   typeof window !== "undefined" &&
//   (window as any).webkit?.messageHandlers?.iosListener;

// export const metadata = {
//   title: "Buy Premium Perfumes Online, Luxury Fragrances & Scents | Perfumery",
//   description:
//     "Shop luxury perfumes online at Perfumery. Explore designer & niche fragrances at best prices, starting ₹999. COD available with fast delivery.",
// };

// export default function Home() {
//   const [showPopup, setShowPopup] = useState(false);
//   const [loading, setLoading] = useState(true);
//   useEffect(() => {
//     const alreadyShown = localStorage.getItem("homePopupShown");
//     if (!alreadyShown) {
//       setShowPopup(true);
//       localStorage.setItem("homePopupShown", "true");
//     }
//     const timer = setTimeout(() => {
//       setLoading(false);
//     }, 800);
//     return () => clearTimeout(timer);
//   }, []);

//   const excludedComponents = ['FooterSection', 'ProductDetailSection', 'Header'];
//   const sortedSections = data.sections
//     .filter((s) => Number(s.order) > 0 && !excludedComponents.includes(s.component))
//     .sort((a, b) => Number(a.order) - Number(b.order));
//   if (loading) {
//     return <Loader />;
//   }
//   return (
//     <main
//       className={`bg-white w-full relative ${isIOSApp() ? "pt-0" : "pt-[135px]"
//         }`}
//     >
//       {/* {showPopup && <HomePopup onClose={() => setShowPopup(false)} />} */}
//       {sortedSections.map((section) => (
//         <SectionRenderer key={section.id} section={section} />
//       ))}
//     </main>
//   );
// }
import ClientHome from "./ClientHome";

export const metadata = {
  title: "Buy Premium Perfumes Online, Luxury Fragrances & Scents | Perfumery",
  description:
    "Shop luxury perfumes online at Perfumery. Explore designer & niche fragrances at best prices, starting ₹999. COD available with fast delivery.",
};

export default function Page() {
  return <ClientHome />;
}