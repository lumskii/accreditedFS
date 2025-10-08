import React, { useState } from 'react';

const AdminSetup: React.FC = () => {
  const [userEmail, setUserEmail] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [result, setResult] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showResult = (message: string, type: 'success' | 'error' | 'info') => {
    setResult({ message, type });
  };

  const grantAdminRole = async () => {
    if (!userEmail || !adminSecret) {
      showResult('Please fill in all fields', 'error');
      return;
    }

    try {
      showResult('Processing...', 'info');
      
      // Use environment variable for API base URL
      const apiBase = import.meta.env.VITE_API_BASE || 'https://accredited-8w89sev1g-mikes-projects-eb8d5010.vercel.app';
      const response = await fetch(`${apiBase}/api/set-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: userEmail,
          adminSecret: adminSecret
        })
      });

      const data = await response.json();

      if (response.ok) {
        showResult(`Success! Admin role granted to ${userEmail}. You can now login at /admin/login`, 'success');
        
        // Clear the form
        setUserEmail('');
        setAdminSecret('');
      } else {
        showResult(`Error: ${data.error}`, 'error');
      }

    } catch (error) {
      console.error('Setup error:', error);
      showResult(`Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const getResultClasses = () => {
    if (!result) return 'hidden';
    
    const baseClasses = 'mt-4 p-3 rounded-md';
    switch (result.type) {
      case 'success':
        return `${baseClasses} bg-green-100 text-green-700 border border-green-200`;
      case 'error':
        return `${baseClasses} bg-red-100 text-red-700 border border-red-200`;
      case 'info':
        return `${baseClasses} bg-blue-100 text-blue-700 border border-blue-200`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Setup</h1>
          <p className="text-gray-600 mt-2">Grant admin privileges to a user</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
            <input 
              type="email" 
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="Enter email to make admin"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Setup Secret</label>
            <input 
              type="password" 
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              placeholder="Enter admin setup secret"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Contact the developer for the secret key</p>
          </div>

          <button 
            onClick={grantAdminRole}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Grant Admin Role
          </button>
        </div>

        {result && (
          <div className={getResultClasses()}>
            {result.message}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <a href="/admin/login" className="text-blue-600 hover:text-blue-800 text-sm">Go to Admin Login →</a>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;