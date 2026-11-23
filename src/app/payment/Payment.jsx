"use client";

import { useSearchParams } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import CheckoutForm from "./CheckoutForm";

import Navigate from "@/components/shared/Navigate";
import NoData from "@/components/NoData";

const PaymentPage = () => {
  const searchParams = useSearchParams();
  const clientSecret = searchParams.get("clientSecret");
  const purpose = searchParams.get("for") === "tip" ? "tip" : "order";

  if (!clientSecret) return <NoData></NoData>;
  if (!stripePromise) {
    return (
      <p className="p-6 text-center text-red-400">
        Payments are not configured. Please try again later.
      </p>
    );
  }

  return (
    <div className="px-3">
      <div className="flex items-center justify-between relative pt-6 pb-6 ">
        <Navigate />
        <h1 className="text-[16px] italic">
          {purpose === "tip" ? "Tip Payment" : "Payment"}
        </h1>
        <div></div>
      </div>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm clientSecret={clientSecret} purpose={purpose} />
      </Elements>
    </div>
  );
};

export default PaymentPage;
