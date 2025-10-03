import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import app, { database } from "../firebase";
import { getAuth, sendEmailVerification } from "firebase/auth";
import { ref, set, get } from "firebase/database";
import Toast from "../components/Toast";
import Spinner from "../components/Spinner";

const Agreement: React.FC = () => {
  const auth = getAuth(app);
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [signed, setSigned] = useState(false);
  const [signName, setSignName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const pollingRef = useRef<number | null>(null);
  const autoProceedRef = useRef(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) {
        navigate("/signup");
      } else {
        setUser(u);
      }
    });
    return unsub;
  }, []);

  // Poll auth.currentUser.reload() every few seconds when user exists but is not verified.
  // This lets users click the verification link on another device and return here without
  // having to click the "I verified — continue" button.
  useEffect(() => {
    // clear any existing poll when dependencies change
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (!user) return;

    // If user already verified, nothing to do
    if (user.emailVerified) return;

    // Start polling every 5s
    pollingRef.current = window.setInterval(async () => {
      try {
        if (auth.currentUser) await auth.currentUser.reload();
        const fresh = auth.currentUser;
        if (fresh) setUser(fresh);
        // If verification detected, stop polling and proceed once
        if (fresh && fresh.emailVerified && !autoProceedRef.current) {
          autoProceedRef.current = true;
          // give a tiny delay to let UI update before proceeding
          setTimeout(() => {
            checkVerifiedAndContinue().catch(() => {
              // ignore errors here; UI will show them via existing error state
            });
          }, 200);
          if (pollingRef.current) {
            window.clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch (e) {
        // silent
      }
    }, 5000);

    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [user]);

  const handleSubmit = async () => {
    setError(null);
    if (!signed) {
      setError("You must sign the agreement before continuing");
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      await set(ref(database, `users/${user.uid}/agreement`), {
        agreed: true,
        signedBy: signName || user.displayName || user.email,
        signedAt: Date.now(),
      });
      // read saved flow (plan/mode) and pass as query params to checkout
      try {
        const flowSnap = await get(ref(database, `users/${user.uid}/flow`));
        const flowVal = flowSnap.exists() ? flowSnap.val() : {};
        const planParam = flowVal.plan
          ? `?plan=${encodeURIComponent(flowVal.plan)}`
          : "";
        const modeParam = flowVal.mode
          ? `${planParam ? "&" : "?"}mode=${encodeURIComponent(flowVal.mode)}`
          : "";
        navigate(`/checkout${planParam}${modeParam}`);
      } catch (e) {
        // fallback to plain checkout if RTDB read fails
        navigate("/checkout");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save agreement");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError(null);
    if (!user) return;
    setResendLoading(true);
    try {
      const continueUrl = `${window.location.origin}/verify`;
      const actionCodeSettings = {
        url: continueUrl,
        handleCodeInApp: true,
      };
      await sendEmailVerification(user, actionCodeSettings);
      setToast("Verification email sent — check your inbox (and spam)");
    } catch (err: any) {
      setError(err.message || "Failed to send verification");
    } finally {
      setResendLoading(false);
    }
  };

  const checkVerifiedAndContinue = async () => {
    if (!user) return;
    setLoading(true);
    // reload the user from the auth instance to ensure we have the latest verified state
    try {
      if (auth.currentUser) await auth.currentUser.reload();
    } catch (e) {
      // ignore reload errors, we'll re-check below
    }
    const freshUser = auth.currentUser || user;
    if (freshUser && freshUser.emailVerified) {
      // proceed as if submission happened
      try {
        await set(ref(database, `users/${freshUser.uid}/agreement`), {
          agreed: true,
          signedBy: signName || freshUser.displayName || freshUser.email,
          signedAt: Date.now(),
        });
        // pass plan/mode as query params if available in RTDB
        try {
          const flowSnap = await get(
            ref(database, `users/${freshUser.uid}/flow`)
          );
          const flowVal = flowSnap.exists() ? flowSnap.val() : {};
          const planParam = flowVal.plan
            ? `?plan=${encodeURIComponent(flowVal.plan)}`
            : "";
          const modeParam = flowVal.mode
            ? `${planParam ? "&" : "?"}mode=${encodeURIComponent(flowVal.mode)}`
            : "";
          navigate(`/checkout${planParam}${modeParam}`);
        } catch (e) {
          navigate("/checkout");
        }
      } catch (err: any) {
        setError(err.message || "Failed to save agreement");
      }
    } else {
      setToast(
        "Email still not verified. Check your inbox or resend the verification email."
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-xl font-bold text-blue-800 mb-4">Agreement</h2>
        <div className="prose max-w-none mb-4">
          <h3>Service Agreement</h3>
          <p>
            By using Accredited Financial Services you agree to our terms...
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-2">
            Type your full name to sign
          </label>
          <input
            className="w-full border rounded px-3 py-2"
            value={signName}
            onChange={(e) => setSignName(e.target.value)}
          />
          <label className="inline-flex items-center mt-3">
            <input
              type="checkbox"
              className="mr-2"
              checked={signed}
              onChange={(e) => setSigned(e.target.checked)}
            />{" "}
            I agree and sign
          </label>
        </div>

        {error && <div className="text-red-600 mb-2">{error}</div>}

        {/* If email not verified, show resend UI */}
        {user && !user.emailVerified ? (
          <div className="space-y-3">
            <div className="text-sm text-gray-700">
              Your email is not verified. Please verify before continuing to
              payment.
            </div>
            <div className="text-sm text-gray-600">
              After you click the verification link in your email, return to
              this page and click <strong>“I verified — continue”</strong> to
              proceed. If you opened the verification link on another device,
              wait a minute and then click the button here. Also check your spam
              folder if you don't see the email.
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="bg-yellow-500 text-white px-4 py-2 rounded"
                onClick={handleResendVerification}
                disabled={resendLoading}
              >
                {resendLoading ? (
                  <Spinner size={16} />
                ) : (
                  "Resend verification email"
                )}
              </button>
              <button
                className="bg-blue-700 text-white px-4 py-2 rounded"
                onClick={checkVerifiedAndContinue}
                disabled={loading}
              >
                {loading ? <Spinner size={16} /> : "I verified — continue"}
              </button>
            </div>
          </div>
        ) : (
          <button
            className="bg-blue-700 text-white py-2 px-4 rounded"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <Spinner size={16} /> : "Continue to Payment"}
          </button>
        )}
        <Toast message={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  );
};

export default Agreement;
