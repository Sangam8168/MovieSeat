import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

// Stripe returns here after checkout; confirms the payment before moving on.
const Loading = () => {
  const { nextUrl } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { axios, getToken } = useAppContext();
  const [message, setMessage] = useState("Confirming your payment...");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    let cancelled = false;

    const go = () => {
      if (!cancelled && nextUrl) navigate("/" + nextUrl);
    };

    if (!sessionId) {
      const t = setTimeout(go, 3000);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }

    const confirm = async (attempt = 0) => {
      try {
        const { data } = await axios.get(`/api/booking/confirm/${sessionId}`, {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });

        if (cancelled) return;

        if (data.success && data.isPaid) return go();

        // Async methods settle a little later
        if (attempt < 5) {
          setMessage("Waiting for payment confirmation...");
          setTimeout(() => confirm(attempt + 1), 2000);
        } else {
          go();
        }
      } catch (error) {
        console.error("Payment confirmation failed:", error);
        if (!cancelled) go();
      }
    };

    confirm();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-4 justify-center items-center h-[80vh]">
      <div className="animate-spin rounded-full h-14 w-14 border-5 border-t-primary" />
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
};

export default Loading;
