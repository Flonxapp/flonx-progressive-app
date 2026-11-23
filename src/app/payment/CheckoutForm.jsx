"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { paymentResultPath } from "@/lib/stripe";

const CheckoutForm = ({ clientSecret, purpose = "order" }) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isPaying, setIsPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || isPaying) return;

    setIsPaying(true);
    setErrorMessage("");

    const { error } = await stripe.confirmPayment({
      elements,
      // cards complete here; only a redirect-based method would leave the page
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/checkout/payment_successfull?for=${purpose}`,
      },
    });

    if (error) {
      // card declined, invalid details, failed authentication, ...
      setErrorMessage(error.message || "Payment failed. Please try again.");
      setIsPaying(false);
      return;
    }

    router.replace(paymentResultPath(clientSecret, purpose));
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          paymentMethodOrder: ["card"],
          layout: {
            type: "accordion",
            defaultCollapsed: false,
            radios: "never",
            spacedAccordionItems: false,
          },
        }}
      />

      {errorMessage && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {errorMessage}
        </p>
      )}

      <button
        className="w-full flex justify-center items-center gap-4 py-3 rounded-full
            bg-gradient-to-br from-[#BB82FF] to-[#822CE7]
            shadow-lg mt-3 disabled:opacity-60"
        type="submit"
        disabled={!stripe || isPaying}
      >
        {isPaying ? "Processing..." : "Pay"}
      </button>
    </form>
  );
};

export default CheckoutForm;
