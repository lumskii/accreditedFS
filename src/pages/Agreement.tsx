import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import app, { database } from "../firebase";
import { getAuth, sendEmailVerification, reload, onAuthStateChanged } from "firebase/auth";
import { ref, push, get, set } from "firebase/database";
import Toast from "../components/Toast";
import Spinner from "../components/Spinner";
import AgreementDisplay from "../components/AgreementDisplay";
import { CheckCircle } from "lucide-react";

interface PlanDetails {
  id: number
  name: string
  price: string
  originalPrice?: string
  setupFee?: string
  monthlyFee?: string
  paymentType: 'upfront' | 'monthly'
}

const Agreement: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signed, setSigned] = useState(false);
  const [signName, setSignName] = useState("");
  const [error, setError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = getAuth(app);

  // Plan definitions matching PricingSection.tsx
  const availablePlans: PlanDetails[] = [
    {
      id: 1,
      name: "Credit Refresh",
      price: "800",
      setupFee: "0",
      monthlyFee: "0",
      paymentType: 'upfront'
    },
    {
      id: 2,
      name: "Credit Rebuild",
      price: "1,200",
      setupFee: "200",
      monthlyFee: "150",
      paymentType: 'monthly'
    },
    {
      id: 3,
      name: "Couples Advantage",
      price: "2,000",
      setupFee: "300",
      monthlyFee: "200",
      paymentType: 'monthly'
    }
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      
      if (u) {
        setSignName(u.displayName || u.email || "");
        
        // Fetch selected plan from database
        try {
          const flowSnap = await get(ref(database, `users/${u.uid}/flow`));
          if (flowSnap.exists()) {
            const flowData = flowSnap.val();
            const selectedPlan = flowData.plan;
            const selectedMode = flowData.mode; // 'upfront' or 'monthly'
            
            if (selectedPlan) {
              const plan = availablePlans.find(p => p.name.toLowerCase().replace(/\s+/g, '-') === selectedPlan);
              if (plan) {
                setPlanDetails({
                  ...plan,
                  paymentType: selectedMode === 'upfront' ? 'upfront' : 'monthly'
                });
              }
            }
          }
        } catch (error) {
          console.warn('Failed to fetch plan details:', error);
        }
      }
    });
    return unsubscribe;
  }, []);

  const handleResendVerification = async () => {
    if (!user) return;
    setResendLoading(true);
    try {
      await sendEmailVerification(user);
      setToast("Verification email sent! Check your inbox.");
    } catch (err: any) {
      setToast("Failed to send verification email. Try again.");
    }
    setResendLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !signed || !signName.trim()) {
      setError("Please complete the signature fields");
      return;
    }

    setSubmitLoading(true);
    setError("");

    try {
      // Save agreement to database under user's path
      await set(ref(database, `users/${user.uid}/agreement`), {
        agreed: true,
        signedName: signName,
        signedAt: new Date().toISOString(),
        ipAddress: "user-ip-placeholder",
        userAgent: navigator.userAgent,
        planDetails: planDetails || null,
      });

      // Navigate to checkout
      try {
        let finalPlan = searchParams.get("plan");
        let finalMode = searchParams.get("mode");
        
        // If URL params are missing, derive them from plan details
        if ((!finalPlan || !finalMode) && planDetails) {
          // Map plan names to API format
          const planNameMap: Record<string, string> = {
            "Credit Refresh": "credit-refresh",
            "Credit Rebuild": "credit-rebuild", 
            "Couples Advantage": "couples-advantage"
          };
          
          finalPlan = finalPlan || planNameMap[planDetails.name] || "";
          finalMode = finalMode || (planDetails.paymentType === 'upfront' ? 'full' : 'monthly');
        }
        
        const planParam = finalPlan ? `?plan=${finalPlan}` : "";
        const modeParam = finalMode ? `${planParam ? "&" : "?"}mode=${finalMode}` : "";
        navigate(`/checkout${planParam}${modeParam}`);
      } catch (e) {
        // Fallback - the checkout component will handle missing params
        navigate("/checkout");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save agreement");
    }
    setSubmitLoading(false);
  };

  const checkVerifiedAndContinue = async () => {
    if (!user) return;
    setSubmitLoading(true);
    setError("");

    try {
      await reload(user);
      if (user.emailVerified) {
        await handleSubmit();
      } else {
        setToast(
          "Email still not verified. Check your inbox or resend the verification email."
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify email");
    }
    setSubmitLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Please sign in to continue
          </h2>
          <button 
            onClick={() => navigate("/login")}
            className="bg-blue-700 text-white px-6 py-2 rounded-md"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Check if user has selected a plan
  if (!planDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Plan Selection Required
          </h2>
          <p className="text-gray-600 mb-6">
            You must select a credit repair plan before viewing the service agreement. 
            Please return to the pricing page to choose your plan.
          </p>
          <button 
            onClick={() => {
              // Navigate to home page and scroll to pricing section
              navigate("/");
              setTimeout(() => {
                const pricingElement = document.getElementById('pricing');
                if (pricingElement) {
                  pricingElement.scrollIntoView({ behavior: 'smooth' });
                }
              }, 100);
            }}
            className="bg-blue-700 text-white px-6 py-2 rounded-md hover:bg-blue-800 transition-colors"
          >
            Select a Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-800 text-white p-6">
            <h1 className="text-2xl font-bold flex items-center">
              <CheckCircle className="w-6 h-6 mr-2" />
              Service Agreement
            </h1>
            <p className="mt-2 text-blue-100">
              Please review your selected plan details and the complete service agreement below
            </p>
          </div>

          {/* Agreement Content */}
          <div className="p-6">
            <AgreementDisplay planDetails={planDetails} />
          </div>

          {/* Signature Section */}
          <div className="border-t bg-gray-50 p-6">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Electronic Signature
              </h3>
              
              <div className="bg-white p-4 rounded-lg border mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type your full name to electronically sign this agreement
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={signName}
                  onChange={(e) => setSignName(e.target.value)}
                  placeholder="Enter your full legal name"
                />
              </div>

              <label className="inline-flex items-start mt-4">
                <input
                  type="checkbox"
                  className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={signed}
                  onChange={(e) => setSigned(e.target.checked)}
                />
                <span className="text-sm text-gray-700">
                  I have read and agree to the terms of this Service Agreement. 
                  By checking this box and typing my name above, I acknowledge that 
                  this constitutes my electronic signature and has the same legal 
                  effect as a handwritten signature.
                </span>
              </label>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Email Verification or Continue Button */}
              <div className="mt-6">
                {user && !user.emailVerified ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                      <h4 className="text-sm font-medium text-yellow-800 mb-2">
                        Email Verification Required
                      </h4>
                      <p className="text-sm text-yellow-700 mb-3">
                        Your email address must be verified before you can proceed to payment.
                      </p>
                      <p className="text-sm text-yellow-600">
                        After clicking the verification link in your email, return here and 
                        click "I verified — continue". Check your spam folder if you don't 
                        see the email.
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-md font-medium transition-colors disabled:opacity-50"
                        onClick={handleResendVerification}
                        disabled={resendLoading}
                      >
                        {resendLoading ? (
                          <div className="flex items-center justify-center">
                            <Spinner size={16} />
                            <span className="ml-2">Sending...</span>
                          </div>
                        ) : (
                          "Resend Verification Email"
                        )}
                      </button>
                      
                      <button
                        className="flex-1 bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-md font-medium transition-colors disabled:opacity-50"
                        onClick={checkVerifiedAndContinue}
                        disabled={submitLoading || !signName.trim() || !signed}
                      >
                        {submitLoading ? (
                          <div className="flex items-center justify-center">
                            <Spinner size={16} />
                            <span className="ml-2">Verifying...</span>
                          </div>
                        ) : (
                          "I Verified — Continue"
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 px-6 rounded-md font-medium text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSubmit}
                    disabled={submitLoading || !signName.trim() || !signed}
                  >
                    {submitLoading ? (
                      <div className="flex items-center justify-center">
                        <Spinner size={20} />
                        <span className="ml-3">Processing...</span>
                      </div>
                    ) : (
                      "Continue to Payment"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <Toast message={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  );
};

export default Agreement;