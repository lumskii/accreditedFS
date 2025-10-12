import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

type Tier = {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  description: string;
  features: string[];
  expandedFeatures: string[];
  cta: string;
  recommended?: boolean;
};

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string
);

async function handleCheckout(plan: string, mode: "full" | "monthly") {
  // Use VITE_API_BASE when set (e.g. https://accreditedfs.vercel.app) so
  // deployed frontend can call the Vercel backend. Fall back to relative
  // path for local dev or when the API is served from the same origin.
  // Use provided VITE_API_BASE when set. In development use relative paths so
  // the local dev server works. In production, if no VITE_API_BASE is set,
  // default to the Vercel backend URL.
  const envApiBase = import.meta.env.VITE_API_BASE;
  const isDev = import.meta.env.MODE === "development";
  const defaultProdApi = "https://accreditedfs.vercel.app";
  const apiBase = envApiBase || (isDev ? "" : defaultProdApi);
  const endpoint = apiBase
    ? `${apiBase.replace(/\/$/, "")}/api/create-checkout-session`
    : "/api/create-checkout-session";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, mode }),
  });

  const { id } = await res.json();
  const stripe = await stripePromise;
  if (stripe) {
    await stripe.redirectToCheckout({ sessionId: id });
  }
}

const PricingSection: React.FC = () => {
  // track expanded state per-tier so multiple tiers can be opened independently
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // Check authentication state
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const { getAuth, onAuthStateChanged } = await import('firebase/auth')
        const app = (await import('../firebase')).default
        const auth = getAuth(app)
        
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setIsAuthenticated(!!user)
        })

        return unsubscribe
      } catch (error) {
        console.warn('Auth state check failed', error)
        setIsAuthenticated(false)
      }
    }

    checkAuthState()
  }, [])
  
  const toggleExpand = (tierId: number) => {
    setExpandedMap((prev) => ({ ...prev, [tierId]: !prev[tierId] }));
  };
  const pricingTiers = [
    {
      id: 1,
      name: "Credit Refresh",
      price: "800",
      originalPrice: "1,300",
      description:
        "Perfect for clients who need a quick win and focused cleanup to move closer to approvals. This entry-level package targets the most harmful inaccuracies on your report — without the extras — giving you the foundation to move forward toward your financial goals.",
      features: [
        "Choose Pay-in-Full and unlock Priority Rush Processing — the fastest path to results.",
        "Or $200 Setup Fee + $123/mo for 9 months (total $1,300)",
        "Backed by our 90-Day Money-Back Guarantee",
      ],
      expandedFeatures: [
        "What's Included:",
        "Up to 3 Collections Removed",
        "Up to 2 Late Payments Removed",
        "Up to 6 Hard Inquiries Removed",
        "Full 3-Bureau Cleanup of outdated or inaccurate info",
        "Monthly Progress Check-ins",
      ],
      cta: "Choose Credit Refresh",
    },
    {
      id: 2,
      name: "Credit Rebuild",
      price: "1,200",
      originalPrice: "1,700",
      description:
        "This is the full reset — designed for clients ready to completely restore their credit and aim for the 700+ club. You’ll receive personalized support, monthly progress reviews, and hands-on guidance to keep your credit moving forward.",
      features: [
        "Choose Pay-in-Full and unlock Priority Rush Processing — the fastest path to results.",
        "Or $300 Setup Fee + $156/mo for 9 months (total $1,700)",
        "Backed by our 90-Day Money-Back Guarantee",
      ],
      expandedFeatures: [
        "What's Included:",
        "Full Negative Item Removal (collections, charge-offs, bankruptcies, repos, evictions, student loans, medical bills)",
        "Late Payment Deletions",
        "Hard Inquiry Removal",
        "One-on-One Mentorship Calls with Ola",
        "Monthly Check-ins + Email & Support",
        "Personalized Credit Strategy & Ongoing Guidance",
      ],
      cta: "Choose Credit Rebuild",
      recommended: true,
    },
    {
      id: 3,
      name: "Couples Advantage",
      price: "2,000",
      originalPrice: "2,500",
      description:
        "Designed for couples or partners who are serious about building — or rebuilding — their credit together. This plan includes the full benefits of our premium credit repair program, doubled for both partners, along with personalized guidance to ensure each of you is supported on your financial journey.",
      features: [
        "Choose Pay-in-Full and unlock Priority Rush Processing — the fastest path to results.",
        "Or $450 Setup Fee + $228/mo for 9 months (total $2,500)",
        "Backed by our 90-Day Money-Back Guarantee",
      ],
      expandedFeatures: [
        "What's Included:",
        "Full Negative Item Removal (collections, charge-offs, bankruptcies, repos, evictions, student loans, medical bills)",
        "Late Payment Deletions",
        "Hard Inquiry Removal",
        "One-on-One Mentorship Calls with Ola",
        "Monthly Check-ins + Email & Tech Support",
        "Joint Mentorship Calls + Personalized Guidance",
      ],
      cta: "Choose Couples Advantage",
    },
  ];
  return (
    <section id="pricing" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Transparent Pricing Plans
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600">
            Choose the plan that fits your needs. All plans include our 90-day
            money back guarantee.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier) => (
            <PriceCard
              key={tier.id}
              tier={tier}
              expanded={!!expandedMap[tier.id]}
              onToggle={() => toggleExpand(tier.id)}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
        <div className="mt-16 flex justify-center">
          <div className="max-w-3xl">
            <MoneyBackGuarantee />
          </div>
        </div>
      </div>
    </section>
  );
};
const MoneyBackGuarantee: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex flex-col md:flex-row items-center">
        <div className="md:w-1/3 bg-gradient-to-br from-blue-800 to-blue-900 p-6 flex items-center justify-center">
          <div className="relative">
            {/* Shadow layers for depth */}
            <div className="absolute inset-0 bg-blue-900/30 rounded-full transform rotate-6 translate-x-1 translate-y-1 blur-sm"></div>
            <div className="absolute inset-0 bg-[#f0d541]/20 rounded-full transform rotate-12 scale-105"></div>
            <div className="absolute inset-0 bg-[#f0d541]/20 rounded-full transform -rotate-12 scale-105"></div>
            
            {/* Main stamp */}
            <div className="relative bg-gradient-to-br from-[#f0d541] to-[#e6cb3d] text-blue-800 rounded-full h-40 w-40 flex flex-col items-center justify-center border-4 border-dashed border-blue-800 transform rotate-3 shadow-xl hover:scale-105 transition-transform duration-300">
              {/* Inner circle for extra detail */}
              <div className="absolute inset-2 rounded-full border-2 border-blue-800/30"></div>
              
              {/* Text content */}
              <div className="relative z-10 text-center">
          <span className="text-xs font-bold tracking-wider">90-DAY</span>
          <div className="text-lg font-extrabold leading-tight">MONEY</div>
          <div className="text-lg font-extrabold leading-tight">BACK</div>
          <span className="text-sm font-bold tracking-wide">GUARANTEE</span>
              </div>
              
              {/* Decorative stars */}
              <div className="absolute top-2 left-3 text-blue-800/40 text-xs">★</div>
              <div className="absolute top-3 right-2 text-blue-800/40 text-xs">★</div>
              <div className="absolute bottom-2 left-2 text-blue-800/40 text-xs">★</div>
              <div className="absolute bottom-3 right-3 text-blue-800/40 text-xs">★</div>
            </div>
          </div>
        </div>
        <div className="md:w-2/3 p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Our Risk-Free Guarantee
          </h3>
          <p className="text-gray-600 mb-4">
            We're so confident in our ability to improve your credit that we
            offer a 90-day money back guarantee. If you don't see results, you
            get your money back.
          </p>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center text-blue-700 font-medium hover:text-blue-800 transition-colors"
          >
            {isExpanded ? (
              <>
                <span>Show Less</span>
                <ChevronUp className="h-5 w-5 ml-1" />
              </>
            ) : (
              <>
                <span>Read Guarantee Details</span>
                <ChevronDown className="h-5 w-5 ml-1" />
              </>
            )}
          </button>
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200 animate-fadeIn">
              <h4 className="font-semibold text-gray-800 mb-2">
                Guarantee Terms:
              </h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-blue-700 mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    We stand behind our process 100%. If you do not see
                    meaningful progress within 90 days, we will give you your
                    funds back - no hassle, no excuses.
                  </span>
                </li>
                {/* <li className="flex items-start">
                  <Check className="h-5 w-5 text-blue-700 mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    You must follow all credit specialist recommendations and
                    provide requested documentation in a timely manner.
                  </span>
                </li> */}
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-blue-700 mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    To claim the guarantee, simply provide before and after
                    credit reports showing no improvements.
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default PricingSection;

const PriceCard: React.FC<{
  tier: Tier;
  expanded: boolean;
  onToggle: () => void;
  isAuthenticated: boolean | null;
}> = ({ tier, expanded, onToggle, isAuthenticated }) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [maxH, setMaxH] = useState<string>("0px");

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      if (expanded) {
        setMaxH(`${el.scrollHeight}px`);
      } else {
        setMaxH("0px");
      }
    }
  }, [expanded]);

  // when closed, give all cards a baseline min-height so they line up;
  // make the recommended card taller when closed so it appears longest.
  // baseline closed heights (smaller on mobile, larger on md+)
  const closedBaseMinH = !expanded ? "min-h-[18rem] md:min-h-[22rem]" : "";
  // recommended (middle) card should be clearly taller when closed
  const recommendedClosedMinH =
    !expanded && tier.recommended ? "min-h-[28rem] md:min-h-[40rem]" : "";

  // checkout state and plan mapping
  const planSlug = tier.name.toLowerCase().replace(/\s+/g, "-");
  const priceOptions: Record<
    string,
    { full: string; monthlyDeposit: string; monthlySummary: string }
  > = {
    "credit-refresh": {
      full: "$800",
      monthlyDeposit: "$200",
      monthlySummary: "$123/mo",
    },
    "credit-rebuild": {
      full: "$1,200",
      monthlyDeposit: "$300",
      monthlySummary: "$156/mo",
    },
    "couples-advantage": {
      full: "$2,000",
      monthlyDeposit: "$450",
      monthlySummary: "$228/mo",
    },
  };
  const opts = priceOptions[planSlug] || {
    full: `$${tier.price}`,
    monthlyDeposit: "$0",
    monthlySummary: "Deposit + monthly",
  };

  const navigate = useNavigate();
  const onCheckout = async (mode: "full" | "monthly") => {
    // If not authenticated, redirect to signup/login
    if (isAuthenticated === false) {
      navigate(`/signup?plan=${planSlug}&mode=${mode}`);
      return;
    }
    
    // If authenticated, store plan selection and proceed to payment mode selection
    if (isAuthenticated === true) {
      try {
        // Store the plan selection in the user's flow data
        const { getAuth } = await import('firebase/auth');
        const { ref, set } = await import('firebase/database');
        const app = (await import('../firebase')).default;
        const { database } = await import('../firebase');
        
        const auth = getAuth(app);
        const user = auth.currentUser;
        
        if (user) {
          // Save the selected plan
          await set(ref(database, `users/${user.uid}/flow`), {
            plan: planSlug,
            selectedAt: Date.now()
          });
          
          // Navigate to payment mode selection page
          navigate(`/payment-mode?plan=${planSlug}`);
        } else {
          // User not found, redirect to login
          navigate(`/login`);
        }
      } catch (error) {
        console.error('Failed to save plan selection:', error);
        // Fallback: redirect to signup with plan
        navigate(`/signup?plan=${planSlug}&mode=${mode}`);
      }
      return;
    }
    
    // If authentication state is still loading, wait a bit or default to signup
    navigate(`/signup?plan=${planSlug}&mode=${mode}`);
  };

  return (
    <div
      className={`self-start bg-white rounded-lg shadow-lg overflow-hidden border ${
        tier.recommended ? "border-blue-500" : "border-gray-200"
      } hover:shadow-xl transition-shadow ${closedBaseMinH} ${recommendedClosedMinH}`}
    >
      {tier.recommended && (
        <div className="bg-blue-500 text-white text-center py-2 font-medium">
          Most Popular
        </div>
      )}
      <div className={`p-6 ${tier.recommended ? "bg-blue-50" : ""}`}>
        <div className="w-full mb-4">
          <div className="w-full bg-[#f0d541] text-blue-800 rounded-md px-4 py-3 relative overflow-visible">
            <h3 className="text-2xl font-bold mb-1 text-center">{tier.name}</h3>
            <div className="flex items-baseline justify-center">
              <span className="text-4xl font-bold">${tier.price}</span>
            </div>
            {/* Tag shaped like price tag image: rotated square (hole/clip) + rounded label centered at bottom */}
            <div className="flex justify-center mt-2">
              <div className="inline-flex items-center bg-blue-700 text-[#f0d541] px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
                Pay in full — discounted price
              </div>
            </div>
          </div>
        </div>
        <p className="text-gray-600 mb-6">{tier.description}</p>
        <div className="space-y-3 mb-6">
          {tier.features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <Check className="h-5 w-5 text-blue-700 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center text-blue-700 font-medium hover:text-blue-800 transition-colors py-2 mb-4"
        >
          {expanded ? (
            <>
              <span>Show Less</span>
              <ChevronUp className="h-5 w-5 ml-1" />
            </>
          ) : (
            <>
              <span>Show More</span>
              <ChevronDown className="h-5 w-5 ml-1" />
            </>
          )}
        </button>

        <div
          ref={contentRef}
          className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
          style={{ maxHeight: maxH }}
          aria-hidden={!expanded}
        >
          <div className="space-y-3 mb-6 pt-4 border-t border-gray-200">
            <p className="font-medium text-gray-800 mb-2">
              Additional Features:
            </p>
            {tier.expandedFeatures.map((feature, index) => (
              <div key={index} className="flex items-start">
                <Check className="h-5 w-5 text-blue-700 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Single CTA: route users into the signup / multi-step flow.
            If already logged in, save plan and route to payment-mode so the user can pick Full vs Monthly without bouncing back to Agreement.
        */}
        <div className="">
          <button
            onClick={async () => {
              // If not authenticated, go to signup carrying the plan param
              if (isAuthenticated === false) {
                navigate(`/signup?plan=${planSlug}`)
                return
              }

              // If authenticated, persist plan and go straight to payment selection
              if (isAuthenticated === true) {
                try {
                  const { getAuth } = await import('firebase/auth')
                  const { ref, set } = await import('firebase/database')
                  const app = (await import('../firebase')).default
                  const { database } = await import('../firebase')
                  const auth = getAuth(app)
                  const user = auth.currentUser
                  if (user) {
                    // If admin, skip user flow
                    try {
                      const { get } = await import('firebase/database')
                      const adminSnap = await get(ref(database, `users/${user.uid}/roles/admin`))
                      if (adminSnap.exists() && !!adminSnap.val()) {
                        navigate('/admin/dashboard')
                        return
                      }
                    } catch {}
                    await set(ref(database, `users/${user.uid}/flow`), {
                      plan: planSlug,
                      selectedAt: Date.now()
                    })
                    navigate(`/payment-mode?plan=${planSlug}`)
                    return
                  }
                } catch (e) {
                  console.warn('Failed to persist plan before payment mode:', e)
                }
                // Fallback
                navigate(`/signup?plan=${planSlug}`)
                return
              }

              // Unknown auth state: default to signup
              navigate(`/signup?plan=${planSlug}`)
            }}
            className={`w-full py-3 rounded-md transition-colors flex items-center justify-center ${
              tier.recommended
                ? "bg-[#f0d541] text-blue-800 hover:bg-[#e6cb3d]"
                : "bg-blue-700 text-white hover:bg-blue-800"
            }`}
          >
            <span className="font-semibold mr-1">Get Started</span>
            <span className="text-sm font-normal mx-1">with</span>
            <span className="font-semibold ml-1">{tier.name}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
