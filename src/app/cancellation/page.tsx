// "use client";
import { p } from "framer-motion/client";
import React from "react";

export const metadata = {
  title: "Order Cancellation Policy | Perfumery",
  description:
    "View Perfumery’s cancellation policy for order changes, cancellations, and conditions. Quick support and clear guidelines for a hassle-free experience.",
  // keywords: ["terms", "terms of service", "perfumery terms", "website rules"],
};

const cancellation = () => {
  return (
    <main
      className="bg-[#F8F5F0] min-h-screen pt-32 pb-20 px-4 sm:px-6"
      style={{ fontFamily: '"Outfit", sans-serif' }}
    >
      <div className="max-w-4xl mx-auto">

        <h1 className="text-4xl font-bold text-center mb-10">
          Shipping, Refunds, Cancellation & Privacy Policies
        </h1>

        <section className="space-y-4 mb-16">
          <h2 className="text-3xl font-bold">Refund & Return Policy</h2>

          <p>
            We have a <strong>14-day return policy</strong>, which means you have
            30 days after receiving your item to request a return.
          </p>

          <p>
            To be eligible for a return, your item must be in the same condition
            that you received it, unworn or unused, with tags, and in its original
            packaging. You’ll also need the receipt or proof of purchase.
          </p>

          <p>
            To start a return, you can contact us at{" "}
            <a href="mailto:sales@perfumerykart.com" className="text-blue-600 underline">
              sales@perfumerykart.com
            </a>.
          </p>

          <p>
            If your return is accepted, we’ll send you a return shipping label and
            instructions on how and where to send your package.
            <strong> Items sent back without first requesting a return will not be accepted.</strong>
          </p>

          <h3 className="text-xl font-semibold mt-6">Damages and Issues</h3>
          <p>
            Please inspect your order upon reception and contact us immediately if
            the item is defective, damaged or if you receive the wrong item, so
            that we can evaluate the issue and make it right.
          </p>

          <h3 className="text-xl font-semibold mt-6">Exceptions / Non-returnable Items</h3>
          <p>We cannot accept returns for:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Perishable goods (food, flowers, plants)</li>
            <li>Custom/personalized products</li>
            <li>Personal care items</li>
            <li>Hazardous materials, flammable liquids, gases</li>
          </ul>

          <p className="mt-3 font-semibold">
            We also do not accept returns on sale items or gift cards.
          </p>

          <h3 className="text-xl font-semibold mt-6">Exchanges</h3>
          <p>
            The fastest way is to return the item and once the return is accepted,
            make a separate purchase for the new item .
          </p>

          <h3 className="text-xl font-semibold mt-6">Refunds</h3>
          <p>
            We will notify you once we’ve received and inspected your return. If
            approved, you’ll be automatically refunded to your original payment
            method. Your bank may take additional time to process the refund.
          </p>
        </section>

        <section className="space-y-4 mb-16">
          <h2 className="text-3xl font-bold">Privacy Policy</h2>

          <p className="font-semibold">All Subject to Ahmedabad Jurisdiction</p>

          <p>
            This Privacy Policy describes how perfumerykart.com (the “Site” or “we”)
            collects, uses, and discloses your Personal Information when you visit
            or make a purchase from the Site.
          </p>

          <h3 className="text-xl font-semibold mt-6">Collecting Personal Information</h3>
          <p>
            When you visit the Site, we collect device information, usage data,
            order information, and customer support information necessary for
            processing your purchases and improving our services.
          </p>

          <h4 className="text-lg font-semibold mt-4">Device Information</h4>
          <p>Information collected includes:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Browser version, IP address, time zone</li>
            <li>Cookie/session details</li>
            <li>Pages/products viewed</li>
            <li>Search terms and interactions</li>
          </ul>

          <h4 className="text-lg font-semibold mt-4">Order Information</h4>
          <p>Collected from you directly, including:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Name, billing/shipping address</li>
            <li>Payment details</li>
            <li>Email, phone number</li>
          </ul>

          <h4 className="text-lg font-semibold mt-4">Customer Support Information</h4>
          <p>
            We collect any information you provide during support interactions to
            help assist you.
          </p>

          <h3 className="text-xl font-semibold mt-6">Sharing Personal Information</h3>
          <p>
            We share your information with service providers like Shopify to
            operate our store and fulfill orders. We may also share data to comply
            with legal obligations.
          </p>

          <h3 className="text-xl font-semibold mt-6">Behavioural Advertising</h3>
          <p>
            We may use data to provide targeted ads through Google, Facebook, and
            other platforms.
          </p>

          <h3 className="text-xl font-semibold mt-6">Using Personal Information</h3>
          <p>
            Your information allows us to process orders, deliver products, accept
            payments, and communicate updates/offers.
          </p>

          <h3 className="text-xl font-semibold mt-6">Retention</h3>
          <p>
            We retain your information until you request deletion under applicable
            privacy laws.
          </p>
        </section>

        <section className="space-y-4 mb-16">
          <h2 className="text-3xl font-bold">Terms of Service</h2>

          <p>
            By visiting our site or purchasing from us, you engage in our
            “Service” and agree to be bound by these Terms of Service.
          </p>

          <h3 className="text-xl font-semibold mt-6">Overview</h3>
          <p>
            Perfumery India provides this website and services conditioned on
            acceptance of these terms. Use of the website signifies agreement.
          </p>

          <h3 className="text-xl font-semibold mt-6">Online Store Terms</h3>
          <p>
            You must be of legal age and may not use products for unlawful
            purposes. Violations may result in termination of service.
          </p>

          <h3 className="text-xl font-semibold mt-6">General Conditions</h3>
          <p>
            We reserve the right to refuse service. Content may be transmitted
            unencrypted. You may not copy or exploit the Service without consent.
          </p>

          <h3 className="text-xl font-semibold mt-6">Accuracy and Modifications</h3>
          <p>
            Information may not always be accurate. We may modify content or
            discontinue services without notice.
          </p>

          <h3 className="text-xl font-semibold mt-6">Products and Services</h3>
          <p>
            Some items are exclusive and may have limited quantities. We do not
            guarantee color accuracy or product expectations.
          </p>

          <h3 className="text-xl font-semibold mt-6">Billing Accuracy</h3>
          <p>
            We may limit or cancel orders at our discretion. You must provide
            accurate billing and account details.
          </p>

          <h3 className="text-xl font-semibold mt-6">Third-Party Links</h3>
          <p>
            We are not responsible for third-party websites linked on our site.
          </p>

          <h3 className="text-xl font-semibold mt-6">Disclaimer of Liability</h3>
          <p>
            We are not liable for any indirect, incidental, or consequential
            damages. Your use of the Service is at your own risk.
          </p>

          <h3 className="text-xl font-semibold mt-6">Governing Law</h3>
          <p>These terms are governed by Indian law.</p>
        </section>

        <section className="space-y-4 mb-16">
          <h2 className="text-3xl font-bold">Shipping Policy</h2>

          <p className="font-semibold">Shipping Update!</p>

          <p>
            We use <strong>Bluedart</strong> for domestic shipping and{" "}
            <strong>FedEx / DHL / UPS</strong> for international shipping.
          </p>

          <p>
            Most orders are shipped in <strong>3–7 days</strong>.
            Event categories may have variable delivery time.
          </p>

          <p>
            Orders can now be tracked via Chatbox.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-3xl font-bold">Contact Us</h2>

          <p>
            Email:{" "}
            <a href="mailto:sales@perfumerykart.com" className="text-blue-600 underline">
              sales@perfumerykart.com
            </a>
          </p>

          <p>
            Address: <br />
            <strong>
              27/2, Tejdhra Bungalow,<br />
              Beside Gloria Restaurant,<br />
              Near Prernatirth Derasar Road,<br />
              Prahlad Nagar, Ahmedabad, Gujarat – 380015
            </strong>
          </p>

          <p>
            You can also reach us via Phone Support (footer) or ChatBox.
            Our response time is <strong>24–48 hours.</strong>
          </p>
        </section>

      </div>
    </main>
  );
};

export default cancellation;
