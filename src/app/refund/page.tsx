// "use client";
import React from "react";

export const metadata = {
  title: "Refund Policy | Perfumery",
  description:
    "Check Perfumery’s refund policy for eligibility, timelines, and process. We ensure a smooth and transparent refund experience for our customers.",
  // keywords: ["terms", "terms of service", "perfumery terms", "website rules"],
};

const RefundPage = () => {
  return (
    <main
      className="bg-[#F8F5F0] min-h-screen pt-32 pb-16 px-4 sm:px-6"
      style={{ fontFamily: '"Outfit", sans-serif' }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-10">Refund Policy</h1>
        <div className="space-y-8 text-[#333] leading-relaxed text-[17px]">
          <section>
            <p>
              We have a <strong>30-day return policy</strong>, which means you have 30 days after receiving your item to request a return.
            </p>
            <p className="mt-3">
              To be eligible for a return, your item must be in the same condition that you received it —
              <strong> unworn or unused, with tags, and in its original packaging.</strong>  
              You’ll also need the receipt or proof of purchase.
            </p>
            <p className="mt-3">
              To start a return, contact us at{" "}
              <a href="mailto:sales@perfumerykart.com" className="text-blue-600 underline">
                sales@perfumerykart.com
              </a>.
            </p>
            <p className="mt-3">
              Returns should be sent to the following address:
              <br /><br />
              <strong>
                27/2, Tejdhra Bungalow,<br />
                Beside Gloria Restaurant,<br />
                Near Prernatirth Derasar Road,<br />
                Prahlad Nagar, Ahmedabad, Gujarat – 380015
              </strong>
            </p>
            <p className="mt-3">
              If your return is accepted, we’ll send you a return shipping label along with instructions. 
              <strong> Items sent back without first requesting a return will not be accepted.</strong>
            </p>
            <p className="mt-3">
              You can always contact us for any return-related question at{" "}
              <a href="mailto:sales@perfumerykart.com" className="text-blue-600 underline">
                sales@perfumerykart.com
              </a>.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold mb-2">Damages and Issues</h2>
            <p>
              Please inspect your order upon reception and contact us immediately if the item is defective, 
              damaged, or if you receive the wrong item, so that we can evaluate the issue and make it right.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold mb-2">Exceptions / Non-returnable Items</h2>
            <p>Certain types of items cannot be returned, such as:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Perishable goods (food, flowers, plants)</li>
              <li>Custom or personalized products</li>
              <li>Personal care goods</li>
              <li>Hazardous materials, flammable liquids, or gases</li>
            </ul>
            <p className="mt-3">
              <strong>We do not accept returns on sale items or gift cards.</strong>
            </p>
            <p className="mt-3">
              If you have questions about a specific item, please contact us.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold mb-2">Exchanges</h2>
            <p>
              The fastest way to ensure you get what you want is to return the item you have. 
              Once the return is accepted, make a separate purchase for the new item.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold mb-2">European Union 14-Day Cooling Off Period</h2>
            <p>
              For merchandise shipped into the European Union, you have the right to cancel or return your order 
              within 14 days for any reason and without justification.
            </p>
            <p className="mt-3">
              Your item must be in the same condition that you received it — unused, with tags, 
              and in its original packaging. You’ll also need the receipt or proof of purchase.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold mb-2">Refunds</h2>
            <p>
              We will notify you once we’ve received and inspected your return and let you know whether 
              the refund was approved.
            </p>
            <p className="mt-3">
              If approved, you’ll receive an automatic refund to your original payment method within 
              <strong> 10 business days.</strong>
            </p>
            <p className="mt-3">
              Please remember it can take time for your bank or credit card company to process and post the refund.
            </p>
            <p className="mt-3">
              If more than <strong>15 business days</strong> have passed since your refund was approved, 
              contact us at{" "}
              <a href="mailto:sales@perfumerykart.com" className="text-blue-600 underline">
                sales@perfumerykart.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
};

export default RefundPage;
