"use client";

import React from "react";
import AnnouncementBar from "./AnnouncementBar";
import HeroSection from "./HeroSection";
import BestsellerSection from "./BestsellerSection";
import ShopByNotes from "../home/ShopByNotes";
import CategorySection from "../home/CategoryCard";
import CrazyDealsSection from "../home/CrazyDealsSection";
import ShopByMood from "../home/ShopByMood";
import LuxuryPerfumeBanner from "../home/LuxuryPerfumeBanner";
import VideoProductGrid from "../home/VideoProductGrid";
import WhyChooseUs from "../home/WhyChooseUs";
import TestimonialsSection from "../home/TestimonialsSection";
import BlogSection from "../home/BlogSection";
import AppOfferBanner from "../home/AppOfferSection";
import Header from "../global/Header";
import FooterSection from "../global/FooterSection";
import ProductDetailSection from "../global/ProductDetailSection";

type Section = {
  id: string | number;
  component?: string;
  order?: number;
  props?: any;
};

const components: Record<string, React.FC<any>> = {
  AnnouncementBar,
  HeroSection,
  BestsellerSection,
  ShopByNotes,
  CategorySection,
  CrazyDealsSection,
  ShopByMood,
  LuxuryPerfumeBanner,
  VideoPerfumeShowcase: VideoProductGrid,
  WhyChooseUs,
  TestimonialsSection,
  BlogSection,
  AppOfferBanner,
  Header,
  FooterSection,
  ProductDetailSection,
};

const SectionRenderer: React.FC<{ section: Section }> = ({ section }) => {
  if (!section.component) return null;
  const Component = components[section.component];
  if (!Component) {
    console.warn(`⚠️ Component "${section.component}" not found`);
    return null;
  }
  const { key, ...propsWithoutKey } = section.props || {};
  return <Component {...propsWithoutKey} />;
};

export default SectionRenderer;
