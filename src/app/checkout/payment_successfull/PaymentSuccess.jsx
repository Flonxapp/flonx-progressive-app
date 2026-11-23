"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import RIghtArray from "@/components/icon/RIghtArray";
import RightMarkIco from "@/components/icon/RightMarkIco";
import { stripePromise } from "@/lib/stripe";

// The order or tip is only confirmed by the server after Stripe's webhook,
// but the PaymentIntent status tells the customer right away whether the
// payment went through.
const RESULT = {
  checking: {
    title: "Checking payment…",
    text: "Please wait a moment.",
  },
  succeeded: {
    title: "Success",
    text: "Payment completed successfully",
  },
  processing: {
    title: "Payment processing",
    text: "Your payment is being processed. Your order will update as soon as it is confirmed.",
  },
  failed: {
    title: "Payment failed",
    text: "Your payment did not go through and you have not been charged. Please try again or use another card.",
  },
  unknown: {
    title: "Payment status unknown",
    text: "We could not confirm your payment. Please check My Orders before paying again.",
  },
};

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientSecret = searchParams.get("payment_intent_client_secret");
  const purpose = searchParams.get("for") === "tip" ? "tip" : "order";
  const [result, setResult] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (!clientSecret || !stripePromise) {
        setResult("unknown");
        return;
      }
      const stripe = await stripePromise;
      let { paymentIntent, error } =
        await stripe.retrievePaymentIntent(clientSecret);

      // saved cards are confirmed on the server; the bank may still ask for
      // 3D Secure, which is completed here
      if (!error && paymentIntent?.status === "requires_action") {
        ({ paymentIntent, error } = await stripe.handleNextAction({
          clientSecret,
        }));
      }
      if (cancelled) return;

      if (error || !paymentIntent) {
        setResult(error?.payment_intent ? "failed" : "unknown");
        return;
      }
      switch (paymentIntent.status) {
        case "succeeded":
          setResult("succeeded");
          break;
        case "processing":
          setResult("processing");
          break;
        case "requires_payment_method":
        case "canceled":
          setResult("failed");
          break;
        default:
          setResult("unknown");
      }
    };

    check().catch(() => !cancelled && setResult("unknown"));
    return () => {
      cancelled = true;
    };
  }, [clientSecret]);

  const view = RESULT[result];
  const isOk = result === "succeeded" || result === "processing";

  return (
    <div className="h-screen bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-center mb-6">
        <h2 className="text-2xl flex gap-1 items-center font-bold text-gray-800">
          <RIghtArray /> {purpose === "tip" ? "Tip" : "Payment"}
        </h2>
      </div>

      <div className="text-center py-6">
        {isOk && (
          <div className="flex justify-center">
            <RightMarkIco />
          </div>
        )}

        <h3
          className={`text-[24px] mt-3 font-bold ${
            result === "failed" ? "text-red-600" : "text-gray-800"
          }`}
        >
          {view.title}
        </h3>

        <p className="text-gray-600 mt-2">
          {result === "succeeded" && purpose === "tip"
            ? "Thank you! Your tip was sent to the bartender."
            : view.text}
        </p>
      </div>

      {result === "failed" ? (
        <button
          onClick={() => router.back()}
          className="w-full bg-[#822CE7] text-white py-3 rounded-lg font-semibold"
        >
          Try again
        </button>
      ) : (
        result !== "checking" && (
          <Link href="/myOrder">
            <button className="w-full bg-[#00D66F] text-black py-3 rounded-lg font-semibold">
              See my orders
            </button>
          </Link>
        )
      )}
    </div>
  );
}
