import type { Metadata } from "next";
import ProductPageClient from "./ProductPageClient";
import { API_ENDPOINTS, buildApiUrl } from "../../../utils/api";
import { getImageUrl } from "../../../utils/imageUrl";
import { ImageFolder } from "../../../constants/imageFolders";

const META_URL = process.env.NEXT_PUBLIC_BASE

type ProductImage = {
  url: string;
  is_default?: boolean;
};

type ProductDetailItem = {
  id?: number | string;
  slug?: string;
  name?: string;
  title?: string;
  description?: string;
  sale_price?: string | number;
  price?: string | number;
  quantity?: string | number;
  images?: ProductImage[];
  attributes?: Array<{
    variants?: Array<{
      price?: string | number;
      sale_price?: string | number;
      product_default?: boolean;
    }>;
  }>;
  meta_title?: string;
  meta_description?: string;
  seo_title?: string;
  seo_description?: string;
};

// ── Existing SEO map (unchanged) ─────────────────────────────────────────────
const DEFAULT_META = {
  title: "Luxury Perfumes | Perfumery",
  description:
    "Discover premium luxury perfumes crafted with imported oils for long lasting fragrance performance.",
};

const PRODUCT_SEO_MAP: Record<string, { title: string; description: string }> = {
  "alexa-white": {
    title: "Alexa White - Luxury White Floral Premium Perfume | Perfumery",
    description:
      "Alexa White is a luxury perfume inspired by Jeremy Office For Men Fragrance.One, designed with imported oils to deliver elegant scent and long lasting wear.",
  },
  hurricane: {
    title: "Hurricane - Powerful Long Lasting Luxury Fragrance | Perfumery",
    description:
      "Shop Hurricane inspired by Versace Pour Homme Dylan Blue. Luxury extrait de parfum with rich scent depth and long lasting fragrance performance.",
  },
  "rouge-666": {
    title: "Rouge 666 - Bold Red Luxury Extrait Perfume | Perfumery",
    description:
      "Rouge 666 is a luxury perfume inspired by Baccarat Rouge By MFK, designed with imported oils to deliver elegant scent and long lasting wear.",
  },
  rishikesh: {
    title: "Rishikesh - Spiritual Woody Luxury Fragrance | Perfumery",
    description:
      "Experience Rishikesh perfume inspired by nan. Premium fragrance crafted for Indian weather with smooth and long lasting aroma.",
  },
  imagination: {
    title: "Imagination - Creative Fresh Luxury Perfume | Perfumery",
    description:
      "Discover Imagination, a premium perfume inspired by Imagination Louis Vuitton. Crafted with imported fragrance oils for long lasting performance in Indian climate.",
  },
  "in-da-club-after-party": {
    title: "In Da Club After Party - Nightlife Party Luxury Perfume | Perfumery",
    description:
      "Discover In Da Club After Party, a premium perfume inspired by Club de Nuit Intense Man Armaf. Crafted with imported fragrance oils for long lasting performance in Indian climate.",
  },
  "shiva-sutra": {
    title: "Shiva Sutra - Mystical Oriental High Oil Extrait | Perfumery",
    description:
      "Discover Shiva Sutra, a premium perfume inspired by Black Afgano Nasomatto. Crafted with imported fragrance oils for long lasting performance in Indian climate.",
  },
  "turks-tea": {
    title: "Turk's Tea - Warm Spiced Tea Inspired Luxury Perfume | Perfumery",
    description:
      "Turk's Tea is a luxury perfume inspired by Wulong Cha Nishane, designed with imported oils to deliver elegant scent and long lasting wear.",
  },
  "bonjour-mysore": {
    title: "Bonjour Mysore - Elegant Indian Luxury Fragrance | Perfumery",
    description:
      "Buy Bonjour Mysore inspired by Tam Dao Eau de Parfum Diptyque. High quality extrait de parfum with luxurious scent profile and lasting performance.",
  },
  cheetah: {
    title: "Cheetah - Wild Fresh Energetic Luxury Perfume | Perfumery",
    description:
      "Buy Cheetah inspired by Tygar Bvlgari. High quality extrait de parfum with luxurious scent profile and lasting performance.",
  },
  guevara: {
    title: "Guevara - Bold Rebel Luxury Long Lasting Fragrance | Perfumery",
    description:
      "Shop Guevara inspired by Sauvage Dior. Luxury extrait de parfum with rich scent depth and long lasting fragrance performance.",
  },
  "1987-originale-green-irish": {
    title: "1987 Originale Green Irish - Classic Green Luxury Perfume | Perfumery",
    description:
      "Discover 1987 Originale Green Irish, a premium perfume inspired by Green Irish Tweed Creed. Crafted with imported fragrance oils for long lasting performance in Indian climate.",
  },
  "qc-tobacco": {
    title: "QC Tobacco - Rich Tobacco Premium Extrait Perfume | Perfumery",
    description:
      "Experience QC Tobacco perfume inspired by Tobacco Vanille Tom Ford. Premium fragrance crafted for Indian weather with smooth and long lasting aroma.",
  },
  lhomme: {
    title: "L'Homme - Classic Masculine Luxury Fragrance | Perfumery",
    description:
      "Buy L'Homme inspired by Prada L'Homme Prada. High quality extrait de parfum with luxurious scent profile and lasting performance.",
  },
  "inquilab-elixir": {
    title: "Inquilab Elixir - Revolutionary Bold Extrait Perfume | Perfumery",
    description:
      "Shop Inquilab Elixir inspired by Sauvage Elixir. Luxury extrait de parfum with rich scent depth and long lasting fragrance performance.",
  },
  "king-of-clubs": {
    title: "King of Clubs - Royal Signature Luxury Perfume | Perfumery",
    description:
      "Experience King of Clubs perfume inspired by Ultra Male Jean Paul Gaultier. Premium fragrance crafted for Indian weather with smooth and long lasting aroma.",
  },
  arjuna: {
    title: "Arjuna - Warrior Inspired Woody Luxury Perfume | Perfumery",
    description:
      "Buy Arjuna inspired by Hacivat Nishane. High quality extrait de parfum with luxurious scent profile and lasting performance.",
  },
  nomad: {
    title: "Nomad - Adventurous Fresh Luxury Fragrance | Perfumery",
    description:
      "Nomad is a luxury perfume inspired by Ombre Nomade Louis Vuitton, designed with imported oils to deliver elegant scent and long lasting wear.",
  },
  tdh: {
    title: "TDH - Earthy Citrus Premium Long Lasting Perfume | Perfumery",
    description:
      "Buy TDH inspired by Terre d'Hermes Hermes. High quality extrait de parfum with luxurious scent profile and lasting performance.",
  },
  krishna: {
    title: "Krishna - Divine Sweet Oriental Luxury Perfume | Perfumery",
    description:
      "Krishna is a luxury perfume inspired by Ganymede Marc-Antoine Barrois, designed with imported oils to deliver elegant scent and long lasting wear.",
  },
  saint: {
    title: "SAINT - Pure Elegant Long Lasting Fragrance | Perfumery",
    description:
      "Discover SAINT, a premium perfume inspired by Rasasi Hawas. Crafted with imported fragrance oils for long lasting performance in Indian climate.",
  },
  "yuzu-bomb": {
    title: "Yuzu Bomb - Explosive Citrus Fresh Luxury Perfume | Perfumery",
    description:
      "Yuzu Bomb is a luxury perfume inspired by Issey Miyake Pour Homme, designed with imported oils to deliver elegant scent and long lasting wear.",
  },
  "black-cardamom": {
    title: "Black Cardamom - Spicy Oriental Luxury Extrait | Perfumery",
    description:
      "Black Cardamom is a luxury perfume inspired by La Nuit de l'Homme Yves Saint Laurent, designed with imported oils to deliver elegant scent and long lasting wear.",
  },
  prodigified: {
    title: "Prodigified - Modern Artistic Luxury Fragrance | Perfumery",
    description:
      "Discover Prodigified, a premium perfume inspired by BLEU DE CHANEL. Crafted with imported fragrance oils for long lasting performance in Indian climate.",
  },
  mademoiselle: {
    title: "Mademoiselle - Elegant Feminine Luxury Perfume | Perfumery",
    description:
      "Buy Mademoiselle inspired by Coco Mademoiselle Chanel. High quality extrait de parfum with luxurious scent profile and lasting performance.",
  },
  trl: {
    title: "TRL - Modern Signature Long Lasting Perfume | Perfumery",
    description:
      "Discover TRL, a premium perfume inspired by Tuscan Leather Tom Ford. Crafted with imported fragrance oils for long lasting performance in Indian climate.",
  },
  "aquamen-profumo": {
    title: "Aquamen Profumo - Deep Aquatic Luxury Fragrance | Perfumery",
    description:
      "Buy Aquamen Profumo inspired by Acqua di Gio Profumo Giorgio Armani. High quality extrait de parfum with luxurious scent profile and lasting performance.",
  },
  berrylicious: {
    title: "Berrylicious - Sweet Berry Inspired Premium Perfume | Perfumery",
    description:
      "Berrylicious is a luxury perfume inspired by Loubidoo Christian Louboutin for women, designed with imported oils to deliver elegant scent and long lasting wear.",
  },
  "freshly-intense": {
    title: "Freshly Intense - Fresh Yet Powerful Long Lasting Perfume | Perfumery",
    description:
      "Shop Freshly Intense inspired by Light Blue Eau Intense Pour Homme Dolce and Gabbana. Luxury extrait de parfum with rich scent depth and long lasting fragrance performance.",
  },
  "aqua-nucleus": {
    title: "Aqua Nucleus - Pure Aquatic Core Luxury Fragrance | Perfumery",
    description:
      "Experience Aqua Nucleus perfume inspired by Acqua di Gio Giorgio Armani for men. Premium fragrance crafted for Indian weather with smooth and long lasting aroma.",
  },
  mindfuck: {
    title: "Mindfuck - Bold Experimental Luxury Perfume | Perfumery",
    description:
      "Experience Mindfuck perfume inspired by Fabulous Tom Ford for women and men. Premium fragrance crafted for Indian weather with smooth and long lasting aroma.",
  },
  "aqua-hawas": {
    title: "Aqua Hawas - Sensual Aquatic Long Lasting Fragrance | Perfumery",
    description:
      "Experience Aqua Hawas perfume inspired by Invictus Aqua (2018) Rabanne for men. Premium fragrance crafted for Indian weather with smooth and long lasting aroma.",
  },
  "tribute-to-doga": {
    title: "Tribute to Doga - Powerful Masculine Luxury Perfume | Perfumery",
    description:
      "Buy Tribute to Doga inspired by Kutay Unique'e Luxury for women and men. High quality extrait de parfum with luxurious scent profile and lasting performance.",
  },
  "hey-revolver": {
    title: "Hey Revolver - Edgy Modern Premium Fragrance | Perfumery",
    description:
      "Buy Hey Revolver by Perfumery, a bold spicy woody Eau De Parfum with caramel warmth and long lasting performance. Crafted with imported oils for Indian weather.",
  },
  "principles-of-lust": {
    title: "Principles of Lust - Seductive Oriental Luxury Perfume | Perfumery",
    description:
      "Principles of Lust is a luxury perfume inspired by Enigma Pour Homme Roja Dove for men, designed with imported oils to deliver elegant scent and long lasting wear.",
  },
  ambroxan: {
    title: "AMBROXAN 2.0 - Modern Amber Molecule Luxury Fragrance | Perfumery",
    description:
      "Discover AMBROXAN 2.0, a premium perfume inspired by Molecule 02 Escentric Molecules for women and men. Crafted with imported fragrance oils for long lasting performance in Indian climate.",
  },
  "island-originale-1987": {
    title: "Island Originale 1987 - Tropical Classic Luxury Perfume | Perfumery",
    description:
      "Island Originale 1987 is a luxury perfume inspired by Virgin Island Water 2007 Creed for women and men, designed with imported oils to deliver elegant scent and long lasting wear.",
  },
  "noir-x2": {
    title: "Noir X2 - Dark Intense Premium Extrait Perfume | Perfumery",
    description:
      "Noir X2 is a luxury perfume inspired by Noir Extreme Tom Ford for men, designed with imported oils to deliver elegant scent and long lasting wear.",
  },
  "apple-bergamot": {
    title: "Apple Y Bergamot - Fresh Fruity Citrus Luxury Perfume | Perfumery",
    description:
      "Experience Apple Y Bergamot perfume inspired by Y Eau de Parfum Yves Saint Laurent for men. Premium fragrance crafted for Indian weather with smooth and long lasting aroma.",
  },
  hydrox: {
    title: "HYDRO X - Ultra Fresh Aquatic Luxury Fragrance | Perfumery",
    description:
      "HYDRO X is a luxury perfume inspired by Allure Homme Sport Chanel for men, designed with imported oils to deliver elegant scent and long lasting wear.",
  },
  "red-smaug": {
    title: "Red Smaug - Fiery Bold Luxury Perfume | Perfumery",
    description:
      "Red Smaug is a luxury perfume inspired by MANCERA RED TOBACCO, designed with imported oils to deliver elegant scent and long lasting wear.",
  },
  "instant-rouge-vanilla": {
    title: "Instant Rouge Vanilla - Sweet Vanilla Luxury Perfume | Perfumery",
    description:
      "Shop Instant Rouge Vanilla inspired by Instant Crush Mancera for women and men. Luxury extrait de parfum with rich scent depth and long lasting fragrance performance.",
  },
  "tribute-to-paul": {
    title: "Tribute to Paul - Classic Timeless Premium Fragrance | Perfumery",
    description:
      "Discover Tribute to Paul, a premium perfume inspired by Davidoff Coolwater Vintage Formulation. Crafted with imported fragrance oils for long lasting performance in Indian climate.",
  },
  aquamoss: {
    title: "Aquamoss - Fresh Mossy Aquatic Luxury Perfume | Perfumery",
    description:
      "Aquamoss is a luxury perfume inspired by Aqva Amara Bvlgari for men, designed with imported oils to deliver elegant scent and long lasting wear.",
  },
  "afternoon-xex": {
    title: "Afternoon XeX - Bright Daytime Luxury Fragrance | Perfumery",
    description:
      "Experience Afternoon XeX perfume inspired by Afternoon Swim Louis Vuitton for women and men. Premium fragrance crafted for Indian weather with smooth and long lasting aroma.",
  },
  "hastakshar-oudh": {
    title: "Hastakshar Oudh - Signature Oudh Luxury Extrait | Perfumery",
    description:
      "Experience Hastakshar Oudh perfume inspired by New York Oud Bond No 9 for women and men. Premium fragrance crafted for Indian weather with smooth and long lasting aroma.",
  },
  "asylum-mi2": {
    title: "Asylum MI2 - Dark Mysterious Premium Perfume | Perfumery",
    description:
      "Experience Asylum MI2 perfume inspired by Roja Elysium Parfum. Premium fragrance crafted for Indian weather with smooth and long lasting aroma.",
  },
  "oud-tabacum": {
    title: "OUD TABACUM - Rich Oudh Tobacco Luxury Perfume | Perfumery",
    description:
      "Experience OUD TABACUM perfume inspired by TF TOBACCO OUD. Premium fragrance crafted for Indian weather with smooth and long lasting aroma.",
  },
  "1987-vetiver-origanle": {
    title: "1987 Vetiver Originale - Classic Vetiver Luxury Fragrance | Perfumery",
    description:
      "Shop 1987 Vetiver Origanle inspired by Green Irish Tweed Creed for men. Luxury extrait de parfum with rich scent depth and long lasting fragrance performance.",
  },
  vetivilian: {
    title: "Vetivilian - Deep Vetiver Premium Long Lasting Perfume | Perfumery",
    description:
      "Discover Vetivilian, a premium perfume inspired by Vetiver Guerlain for men. Crafted with imported fragrance oils for long lasting performance in Indian climate.",
  },
  sundance: {
    title: "Sundance - Bright Sunny Fresh Luxury Perfume | Perfumery",
    description:
      "Buy Sundance inspired by Weekend for Women Burberry for women. High quality extrait de parfum with luxurious scent profile and lasting performance.",
  },
  "1000-bhp": {
    title: "1000 BHP - Extreme Power Long Lasting Perfume | Perfumery",
    description:
      "1000 BHP is a luxury perfume inspired by Layton Parfums de Marly for women and men, designed with imported oils to deliver elegant scent and long lasting wear.",
  },
  "idealist-tonka-almond": {
    title: "Idealist - Tonka Almond - Sweet Tonka Almond Luxury Perfume | Perfumery",
    description:
      "Experience Idealist - Tonka Almond perfume inspired by L'Homme Ideal Eau de Parfum Guerlain for men. Premium fragrance crafted for Indian weather with smooth and long lasting aroma.",
  },
  "leben-ist-schon": {
    title: "LEBEN IST SCHON - Elegant European Luxury Fragrance | Perfumery",
    description:
      "LEBEN IST SCHON is a luxury perfume inspired by La Vie Est Belle Lancome, designed with imported oils to deliver elegant scent and long lasting wear.",
  },
  bleecker: {
    title: "Bleecker - Urban Sophisticated Premium Perfume | Perfumery",
    description:
      "Shop Bleecker inspired by Bleecker Street Bond No 9 for women and men. Luxury extrait de parfum with rich scent depth and long lasting fragrance performance.",
  },
  "bitter-cherry": {
    title: "Bitter Cherry - Dark Cherry Luxury Extrait Perfume | Perfumery",
    description:
      "Discover Bitter Cherry, a premium perfume inspired by Lost Cherry Tom Ford for women and men. Crafted with imported fragrance oils for long lasting performance in Indian climate.",
  },
  no5: {
    title: "NO. 5 - Timeless Iconic Luxury Perfume | Perfumery",
    description:
      "Experience NO. 5 perfume inspired by Chanel No. 5 For Women. Premium fragrance crafted for Indian weather with smooth and long lasting aroma.",
  },
  "tribute-to-havane": {
    title: "Tribute to Havane - Rich Cuban Tobacco Luxury Fragrance | Perfumery",
    description:
      "Discover Tribute to Havane, a premium perfume inspired by A*Men Pure Havane Mugler for men. Crafted with imported fragrance oils for long lasting performance in Indian climate.",
  },
};
// ─────────────────────────────────────────────────────────────────────────────

const normalizeId = (value: string) => value.toLowerCase().trim();

const parsePrice = (value?: string | number): number | null => {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const resolvePrice = (detail: ProductDetailItem): number => {
  const topLevelSalePrice = parsePrice(detail.sale_price);
  const topLevelPrice = parsePrice(detail.price);
  if (topLevelSalePrice !== null && topLevelSalePrice > 0) return topLevelSalePrice;
  if (topLevelPrice !== null && topLevelPrice > 0) return topLevelPrice;
  const variants = detail.attributes?.flatMap((a) => a.variants || []) || [];
  const defaultVariant = variants.find((v) => v.product_default) || variants[0];
  const variantSalePrice = parsePrice(defaultVariant?.sale_price);
  const variantPrice = parsePrice(defaultVariant?.price);
  if (variantSalePrice !== null && variantSalePrice > 0) return variantSalePrice;
  if (variantPrice !== null) return variantPrice;
  return 0;
};

const selectDefaultImage = (images?: ProductImage[]): string | null => {
  if (!images || images.length === 0) return null;
  const defaultImg = images.find((img) => img.is_default);
  return (defaultImg || images[0])?.url ?? null;
};

async function fetchProductByIdOrSlug(idOrSlug: string): Promise<ProductDetailItem | null> {
  try {
    const listUrl = buildApiUrl(API_ENDPOINTS.productList);
    const response = await fetch(listUrl, { cache: "no-store" });
    if (!response.ok) return null;
    const payload = await response.json();
    const products: ProductDetailItem[] = Array.isArray(payload?.data) ? payload.data : [];
    const target = normalizeId(idOrSlug);
    return (
      products.find((item) => normalizeId(String(item.slug || "")) === target) ||
      products.find((item) => String(item.id || "") === idOrSlug) ||
      null
    );
  } catch {
    return null;
  }
}

// ── JSON-LD server component ──────────────────────────────────────────────────
// Rendered as a real <script> in the SSR'd HTML — fully visible to Meta's crawler.
// Fixes the three Meta errors: id (@id), availability (offers.availability), price (offers.price).
function ProductJsonLd({
  product,
  slug,
}: {
  product: ProductDetailItem | null;
  slug: string;
}) {
  if (!product) return null;
  const mapped = PRODUCT_SEO_MAP[slug];

  const name = product.name || product.title || "";
  const description =
    product?.meta_description ??
    product?.seo_description ??
    mapped?.description ??
    DEFAULT_META.description;
  const rawImageUrl = selectDefaultImage(product.images);
  const image = rawImageUrl ? getImageUrl(ImageFolder.PRODUCT, rawImageUrl) : undefined;
  const price = resolvePrice(product);
  const availability =
    Number(product.quantity) > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";
  const url = `${META_URL}/product/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "@id": String(product.id ?? slug),                         
    name,
    description,
    sku: String(product.id ?? slug),
    mpn: String(product.id ?? slug),
    brand: {
      "@type": "Brand",
      name: "Perfumery",
    },
    ...(image && image.startsWith("https://") ? { image } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: price > 0 ? price : 0,     
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Perfumery",
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProductByIdOrSlug(id);

  const slug = normalizeId(product?.slug || id);
  const mapped = PRODUCT_SEO_MAP[slug];

  const title =
    product?.meta_title ?? product?.seo_title ?? mapped?.title ?? DEFAULT_META.title;

  const description =
    product?.meta_description ??
    product?.seo_description ??
    mapped?.description ??
    DEFAULT_META.description;

  // const rawImageUrl = selectDefaultImage(product?.images);
  // const ogImage = rawImageUrl ? getImageUrl(ImageFolder.PRODUCT, rawImageUrl) : undefined;
  // const ogPrice = product ? resolvePrice(product) : 0;
  // const ogAvailability =
  //   Number(product?.quantity) > 0 ? "in stock" : "out of stock";
  // const ogName = product?.name || product?.title || title;
  // const ogDescription = product?.description || description;
  // const ogUrl = `${META_URL}/product/${slug}`;

  return {
    title,
    description,
    // openGraph: {
    //   title: ogName,
    //   description: ogDescription,
      // url: ogUrl,
    //   ...(ogImage && ogImage.startsWith("https://")
    //     ? { images: [{ url: ogImage }] }
    //     : {}),
    // },
    // other: {
    //   "product:brand": "Perfumery",
    //   "product:availability": ogAvailability,
    //   "product:condition": "new",
    //   ...(ogPrice > 0 ? { "product:price:amount": String(ogPrice) } : {}),
    //   "product:price:currency": "INR",
    //   ...(product?.id ? { "product:retailer_item_id": String(product.id) } : {}),
    //   ...(slug ? { "product:item_group_id": slug } : {}),
    // },
  };
}

// ── Page (now async so it can pass fetched data to ProductJsonLd) ─────────────
const ProductPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const product = await fetchProductByIdOrSlug(id);
  const slug = normalizeId(product?.slug || id);

  return (
    <>
      <ProductJsonLd product={product} slug={slug} />
      <ProductPageClient />
    </>
  );
};

export default ProductPage;