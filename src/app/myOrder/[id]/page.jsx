"use client";

import PrgressIco from "@/components/icon/PrgressIco";
import QueuedIco from "@/components/icon/QueuedIco";
import Navigate from "@/components/shared/Navigate";
import { useParams } from "next/navigation";
import {
  useCancelOrderMutation,
  useGetSingleOrderQuery,
} from "@/redux/Api/stipApi";
import { PageLoader } from "@/components/Loading";
import { handleDeleteConfirm } from "@/components/ConfirmDelete";
import { toast } from "react-toastify";

const REFUND_TEXT = {
  SUCCEEDED:
    "Refunded to your card. It can take 5-10 business days to show on your statement.",
  PENDING: "Your refund is being processed.",
  FAILED: "Your refund is being processed. We will retry automatically.",
};

const SingleOrder = () => {
  const { id } = useParams();
  const { data: singleOrder, isLoading } = useGetSingleOrderQuery(
    { id },
    { pollingInterval: 10000, skipPollingIfUnfocused: true },
  );
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();

  if (isLoading) return <PageLoader></PageLoader>;

  const order = singleOrder?.data;
  const orderColor = order?.colorCode || "#F97316";
  const isCancelled = order?.status === "CANCELLED";
  // only before the bartender starts on it
  const canCancel = order?.status === "QUEUED";

  const statusConfig = {
    QUEUED: {
      text: "Queued",
      subText: "Your order is waiting in queue",
      icon: <QueuedIco />,
    },
    IN_PROGRESS: {
      text: "In Progress",
      subText: "Your drink is being prepared",
      icon: <PrgressIco />,
    },
    READY_FOR_PIC: {
      text: "Ready for pickup",
      subText: "Your order is ready at the bar",
      icon: <PrgressIco />,
    },
    PICKED: {
      text: "Picked up",
      subText: "Enjoy your drink!",
      icon: <PrgressIco />,
    },
    CANCELLED: {
      text: "Cancelled",
      subText:
        REFUND_TEXT[order?.refundStatus] || "This order was cancelled.",
      icon: <QueuedIco />,
    },
  };

  const currentStatus = statusConfig[order?.status] || statusConfig.QUEUED;
  const statusColor = isCancelled ? "#EF4444" : orderColor;

  const handleCancel = () => {
    handleDeleteConfirm({
      title: "Cancel order?",
      content: `Order #${order?.orderCode} will be cancelled and $${Number(
        order?.totalPrice || 0
      ).toFixed(2)} refunded to your card.`,
      onConfirm: async () => {
        try {
          const res = await cancelOrder({ id }).unwrap();
          toast.success(res?.message || "Order cancelled and refunded");
        } catch (err) {
          toast.error(err?.data?.message || "Could not cancel the order");
        }
      },
    });
  };

  return (
    <div className="px-3">
      <div className="flex items-center justify-between relative pt-6 pb-6">
        <Navigate />
        <h1 className="text-[16px] italic">My Order</h1>
        <div></div>
      </div>

      <div>
        <div
          className="p-11 rounded-3xl text-center"
          style={{
            backgroundColor: `${statusColor}1A`,
          }}
        >
          <h1 className={`text-4xl font-bold ${isCancelled ? "line-through" : ""}`}>
            {order?.orderCode || "----"}
          </h1>
          <p className="text-2xl">Order Code</p>
        </div>

        <div
          className="mt-6 flex gap-2 items-center p-3 rounded-xl"
          style={{
            backgroundColor: `${statusColor}1A`,
            border: `1px solid ${statusColor}`,
          }}
        >
          <div
            className="flex justify-center items-center w-[50px] h-[50px] rounded-xl"
            style={{ border: `1px solid ${statusColor}` }}
          >
            {currentStatus.icon}
          </div>

          <div>
            <h1 className="font-semibold" style={{ color: statusColor }}>
              {currentStatus.text}
            </h1>
            <p className="text-[#8C88A3]">{currentStatus.subText}</p>
          </div>
        </div>

        {!isCancelled && (
          <p className="text-center pt-2 text-[#C9C6D6]">
            We&rsquo;ll update you when your order is ready
          </p>
        )}

        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="w-full mt-6 border border-red-500 text-red-400 py-2 rounded-full disabled:opacity-50"
          >
            {isCancelling ? "Cancelling…" : "Cancel order & get refund"}
          </button>
        )}
      </div>
    </div>
  );
};

export default SingleOrder;
