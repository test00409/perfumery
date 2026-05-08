"use client";

import React, { useEffect, useState } from "react";
import "./globals.css";
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";
import Loader from "../components/common/Loader";
import { Toaster } from "react-hot-toast";
import Header from "../components/global/Header";
import FooterSection from "../components/global/FooterSection";
import Script from "next/script";
import { WishlistProvider } from "./contexts/WishlistContext";
import data from "./data/homepage.json";
import { usePathname } from "next/navigation";

import {
  carlaSansLight,
  carlaSansRegular,
  carlaSansSemibold,
  carlaSansBold,
  outfit,
} from "./fonts";
import { ProductProvider } from "./contexts/productContexts";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const isInvoicePage = pathname.startsWith("/invoice");
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [pathname]);
  const sections = data.sections || [];
  const headerSection = sections.find((s: any) => s.id === "header");
  const footerSection = sections.find((s: any) => s.id === "footer");

  return (
    <html
      lang="en"
      className={`${outfit.variable} ${carlaSansLight.variable} ${carlaSansRegular.variable} ${carlaSansSemibold.variable} ${carlaSansBold.variable}`}
    >
      <head>
        <meta name="google-site-verification" content="ATq_aOOV3QqZwK-PeDqX8g4ZWufAcxFYMZKWELDch98" />
        <meta name="google-site-verification" content="xJiB3CnOQCTcj_gnCXNPBek1BRUc7Kdbj1XeDkXzCj0" />
        <Script async src="https://www.googletagmanager.com/gtag/js?id=AW-18116719073"></Script>
        <Script>
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-633YHH4P2W');
          `}
        </Script>
        <Script>
          {`
            window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'AW-18116719073');

          `}
        </Script>
        <Script>
          {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-KR7XK9WN');
          `}
        </Script>
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1329226642383063');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1329226642383063&ev=PageView&noscript=1"
          />
        </noscript>
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KR7XK9WN"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        <Script
          src="https://sdk.cashfree.com/js/v3/cashfree.js"
          strategy="afterInteractive"
        />
        {loading && <Loader />}
        <WishlistProvider>
          <ProductProvider>
            {!isInvoicePage && headerSection && (
              <Header {...headerSection.props} />
            )}
            <main className="pt-[0px]">
              {children}
            </main>
            {footerSection && <FooterSection {...footerSection.props} />}
          </ProductProvider>
        </WishlistProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,

            style: {
              fontFamily: 'var(--font-outfit-light)',
              background: 'rgba(18, 18, 18, 0.9)',
              color: '#fff',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '14px',
              maxWidth: '400px',
            },
          }}
        />
      </body>
    </html>
  );
}
