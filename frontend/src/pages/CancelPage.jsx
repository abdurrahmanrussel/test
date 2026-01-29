// src/pages/CancelPage.jsx
import { useSearchParams, Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

export default function CancelPage() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('product_id');

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold mb-4 text-red-600">Order Canceled</h1>
        <p className="mb-4">Your payment was not completed.</p>

        {productId && (
          <p className="mb-2">
            <strong>Product ID:</strong> {productId}
          </p>
        )}

        <p className="mb-8 text-gray-600">You can try again anytime.</p>

        <Link
          to="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Return to Home Page
        </Link>
      </div>
    </MainLayout>
  );
}
