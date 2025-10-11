import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import app, { database } from "../firebase";
import { getAuth, sendEmailVerification } from "firebase/auth";
import { get, ref } from "firebase/database";
import { loadStripe } from "@stripe/stripe-js";
import Toast from "../components/Toast";
import Spinner from "../components/Spinner";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string
);

const Checkout: React.FC = () => {
  const auth = getAuth(app);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const plan = params.get("plan") || "";
  const mode = params.get("mode") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setError(null);
      const user = auth.currentUser;
      if (!user) {
        navigate("/signup");
        return;
      }

      // Try to refresh the user's local state (verification may have happened in another tab)
      try {
        if (auth.currentUser) await auth.currentUser.reload();
      } catch (e) {
        // ignore reload errors
      }
      const freshUser = auth.currentUser || user;
      // Ensure email verified and agreement exists
      if (!freshUser || !freshUser.emailVerified) {
        setError("Please verify your email before continuing to payment.");
        setLoading(false);
        return;
      }

      try {
        console.log('Checking agreement for user:', user.uid);
        const agrSnap = await get(ref(database, `users/${user.uid}/agreement`));
        console.log('Agreement snapshot exists:', agrSnap.exists());
        console.log('Agreement data:', agrSnap.exists() ? agrSnap.val() : null);
        
        if (!agrSnap.exists() || !agrSnap.val().agreed) {
          console.log('Agreement not found or not agreed, redirecting to agreement page');
          setError("You must sign the agreement before proceeding to payment.");
          setLoading(false);
          return;
        }
        
        const agreementData = agrSnap.val();
        console.log('Agreement verified, proceeding to checkout...');

        // Get plan and mode from URL params or from signed agreement
        let finalPlan = plan;
        let finalMode = mode;
        
        // If URL params are missing but we have plan details in agreement, use those
        if ((!plan || !mode) && agreementData.planDetails) {
          const planDetails = agreementData.planDetails;
          
          // Map plan names to API format
          const planNameMap: Record<string, string> = {
            "Credit Refresh": "credit-refresh",
            "Credit Rebuild": "credit-rebuild", 
            "Couples Advantage": "couples-advantage"
          };
          
          finalPlan = finalPlan || planNameMap[planDetails.name as string] || "";
          
          // Determine mode from plan details
          if (!finalMode) {
            finalMode = planDetails.paymentType === 'upfront' ? 'full' : 'monthly';
          }
        }
        
        // Validate we have required parameters
        if (!finalPlan || !finalMode) {
          setError("Missing payment plan information. Please select a plan again.");
          setLoading(false);
          return;
        }

        console.log('Using plan:', finalPlan, 'mode:', finalMode);

        // Force a refreshed ID token so server sees updated emailVerified claim
        const idToken = await freshUser.getIdToken(true);
        
        // API endpoint configuration - use custom domain directly for production
        const isDev = import.meta.env.DEV;
        const apiBase = isDev 
          ? '' // Use relative URL for proxy in dev
          : 'https://api.accreditedfs.com'; // Use stable custom domain
        const endpoint = `${apiBase}/api/create-checkout-session`;
        
        console.log('API endpoint:', endpoint); // Debug log

        const body: Record<string, any> = {
          plan: finalPlan,
          mode: finalMode
        };

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || "Failed to create checkout session");
        }

        const { id } = await res.json();
        const stripe = await stripePromise;
        if (!stripe) throw new Error("Stripe not configured");
        await stripe.redirectToCheckout({ sessionId: id });
      } catch (err: any) {
        setError(err.message || "Checkout failed");
        setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  const handleResend = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setResendLoading(true);
    try {
      // include actionCodeSettings so link returns to our verify handler
      const continueUrl =
        (import.meta.env.NEXT_PUBLIC_SITE_URL || "") + "/verify";
      const actionCodeSettings = { url: continueUrl, handleCodeInApp: false };
      await sendEmailVerification(user, actionCodeSettings);
      setToast("Verification email sent — check your inbox");
    } catch (err: any) {
      setError(err.message || "Failed to send verification");
    } finally {
      setResendLoading(false);
    }
  };

  if (loading && !error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Starting checkout…
      </div>
    );
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 bg-white rounded shadow w-full max-w-md">
        {error ? (
          <div>
            <p className="text-red-600 mb-2">{error}</p>
            <div className="flex items-center space-x-2">
              <button
                className="bg-blue-700 text-white px-4 py-2 rounded"
                onClick={() => navigate("/agreement")}
              >
                Back to Agreement
              </button>
              <button
                className="bg-yellow-500 text-white px-4 py-2 rounded"
                onClick={handleResend}
                disabled={resendLoading}
              >
                {resendLoading ? (
                  <Spinner size={16} />
                ) : (
                  "Resend verification email"
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Spinner size={20} />
            <div>Preparing your checkout…</div>
          </div>
        )}
        <Toast message={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  );
};

export default Checkout;
