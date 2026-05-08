import localFont from "next/font/local";
import { Outfit } from "next/font/google";

export const outfit = Outfit({
  subsets: ["latin"],           
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

export const carlaSansLight = localFont({
  src: "./fonts/carla_sans/CarlaSansLight.ttf",
  weight: "300",
  variable: "--font-carlasans-light",
  display: "swap",
});

export const carlaSansRegular = localFont({
  src: "./fonts/carla_sans/CarlaSansRegular.ttf",
  weight: "400",
  variable: "--font-carlasans-regular",
  display: "swap",
});

export const carlaSansSemibold = localFont({
  src: "./fonts/carla_sans/CarlaSansSemibold.ttf",
  weight: "600",
  variable: "--font-carlasans-semibold",
  display: "swap",
});

export const carlaSansBold = localFont({
  src: "./fonts/carla_sans/CarlaSansBold.ttf",
  weight: "700",
  variable: "--font-carlasans-bold",
  display: "swap",
});
