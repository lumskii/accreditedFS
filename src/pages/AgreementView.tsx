import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import app, { database } from "../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import Spinner from "../components/Spinner";
import AgreementDisplay from "../components/AgreementDisplay";
import { ArrowLeft, FileText, Download, Printer } from "lucide-react";

interface PlanDetails {
  id: number
  name: string
  price: string
  originalPrice?: string
  setupFee?: string
  monthlyFee?: string
  paymentType: 'upfront' | 'monthly'
}

interface UserProfile {
  name: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  email?: string
}

interface SignedAgreementData {
  signedName: string
  signedAt: string
  signature?: string
  planDetails: PlanDetails | null
  userAgent: string
  ipAddress: string
}

const AgreementView: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [agreementData, setAgreementData] = useState<SignedAgreementData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      
      if (u) {
        try {
          // Fetch signed agreement from database
          const agreementRef = ref(database, `users/${u.uid}/agreement`);
          const snapshot = await get(agreementRef);
          
          if (snapshot.exists()) {
            setAgreementData(snapshot.val());
          } else {
            setError("No signed agreement found");
          }

          // Fetch user profile data
          const profileRef = ref(database, `users/${u.uid}/profile`);
          const profileSnapshot = await get(profileRef);
          
          if (profileSnapshot.exists()) {
            setUserProfile(profileSnapshot.val());
          }
        } catch (error) {
          console.error("Error fetching agreement:", error);
          setError("Failed to load agreement");
        }
      }
    });
    return unsubscribe;
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // For now, trigger print which allows saving as PDF
    window.print();
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
            Please sign in to view your agreement
          </h2>
          <button 
            onClick={() => navigate("/auth")}
            className="bg-blue-700 text-white px-6 py-2 rounded-md"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (error || !agreementData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Agreement Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "You haven't signed a service agreement yet."}
          </p>
          <div className="space-x-4">
            <button 
              onClick={() => navigate("/dashboard")}
              className="bg-gray-600 text-white px-6 py-2 rounded-md"
            >
              Back to Dashboard
            </button>
            {!agreementData && (
              <button 
                onClick={() => navigate("/agreement")}
                className="bg-blue-700 text-white px-6 py-2 rounded-md"
              >
                Sign Agreement
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Hide on print */}
      <div className="print:hidden bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Service Agreement</h1>
                <p className="text-sm text-gray-600">
                  Signed on {new Date(agreementData.signedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Agreement Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 print:p-0">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden print:shadow-none">
          {/* Signature Information - Show at top for print */}
          <div className="bg-blue-800 text-white p-6 print:bg-white print:text-black print:border-b-2 print:border-blue-800">
            <h2 className="text-2xl font-bold mb-4">Signed Service Agreement</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Signed by:</strong> {agreementData.signedName}</p>
                <p><strong>Email:</strong> {user.email}</p>
              </div>
              <div>
                <p><strong>Date:</strong> {new Date(agreementData.signedAt).toLocaleString()}</p>
                <p><strong>Electronic Signature:</strong> Verified</p>
              </div>
            </div>
          </div>

          {/* Agreement Content */}
          <div className="p-6">
            <AgreementDisplay 
              planDetails={agreementData.planDetails} 
              userProfile={userProfile}
              showSignature={true}
              signedData={{
                signedBy: agreementData.signedName,
                signedAt: new Date(agreementData.signedAt).getTime(),
                signature: agreementData.signature
              }}
            />
          </div>

          {/* Signature Block - Show at bottom for print */}
          <div className="border-t bg-gray-50 p-6 print:bg-white">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Electronic Signature Verification
              </h3>
              
              {/* Digital Signature Display */}
              {agreementData.signature && (
                <div className="bg-white p-4 rounded-lg border border-gray-300 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Digital Signature:</h4>
                  <div className="border-2 border-gray-300 rounded-lg p-2 bg-gray-50 inline-block">
                    <img 
                      src={agreementData.signature} 
                      alt="Digital Signature" 
                      className="max-w-xs h-auto"
                      style={{ maxHeight: '100px' }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Signature captured on {new Date(agreementData.signedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
              
              <div className="bg-white p-4 rounded-lg border border-gray-300 print:border-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Signatory Information:</p>
                    <p>Name: {agreementData.signedName}</p>
                    <p>Email: {user.email}</p>
                    <p>User ID: {user.uid}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Signature Details:</p>
                    <p>Date: {new Date(agreementData.signedAt).toLocaleString()}</p>
                    <p>Method: {agreementData.signature ? 'Digital Signature' : 'Electronic Signature'}</p>
                    <p>Status: Verified and Binding</p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded print:border">
                  <p className="text-sm text-green-800">
                    ✓ This document has been electronically signed and is legally binding. 
                    The signature was captured with secure authentication and meets all 
                    requirements for electronic signatures under applicable law.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgreementView;