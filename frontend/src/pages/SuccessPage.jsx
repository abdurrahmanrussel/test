// src/pages/SuccessPage.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const session_id = searchParams.get('session_id');

  // Backend URL from environment
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4242';

  useEffect(() => {
    const fetchSession = async () => {
      if (!session_id) {
        setError('No session ID found.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${backendUrl}/api/checkout-session?sessionId=${session_id}`);
        if (!res.ok) throw new Error(`Server responded with status ${res.status}`);

        const data = await res.json();
        setSession(data);
      } catch (err) {
        console.error('Failed to fetch session info:', err);
        setError('Failed to fetch session info. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [session_id, backendUrl]);

  if (loading) return <p className="text-center mt-16 text-lg">Loading your order details...</p>;
  if (error)
    return (
      <div className="text-center mt-16 text-red-600">
        <p>{error}</p>
        <button
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
          onClick={() => navigate('/')}
        >
          Go Back Home
        </button>
      </div>
    );

  // Extract product info safely
  const productName =
    session.metadata?.productName ||
    session.line_items?.data?.[0]?.description ||
    'Unknown Product';
  const productId = session.metadata?.productId || 'N/A';
  const amountPaid = session.amount_total ? (session.amount_total / 100).toFixed(2) : '0.00';

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Thank you for your order!</h1>
        <p className="mb-4">
          We automatically sent the product and confirmation message to your email.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Order Details:</h2>
        <div className="text-left max-w-md mx-auto space-y-2">
          <p>
            <strong>Customer Name:</strong> {session.customer_details?.name || 'N/A'}
          </p>
          <p>
            <strong>Email:</strong> {session.customer_details?.email || 'N/A'}
          </p>
          <p>
            <strong>Product:</strong> {productName}
          </p>
          <p>
            <strong>Product ID:</strong> {productId}
          </p>
          <p>
            <strong>Amount Paid:</strong> ${amountPaid}
          </p>
        </div>

        <button
          className="mt-8 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    </MainLayout>
  );
}