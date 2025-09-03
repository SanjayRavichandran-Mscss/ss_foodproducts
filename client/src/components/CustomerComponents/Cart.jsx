import React, { useState, useEffect } from "react";
import axios from "axios";

const Cart = ({ customerId, cartItems }) => {
  const [loading, setLoading] = useState(false);

  const updateQuantity = (productId, change) => {
    const item = cartItems.find((item) => item.product_id === productId);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + change);
      console.log("Updating quantity", { productId, newQuantity });
      axios
        .put(
          "http://localhost:5000/api/customer/cart",
          { customerId, productId, quantity: newQuantity },
          { headers: { "Origin": "http://localhost:5173" } }
        )
        .then((res) => {
          console.log("Quantity updated", res.data);
          // Parent handles state update
        })
        .catch((err) => console.error("Failed to update quantity:", err));
    }
  };

  if (loading) {
    console.log("Cart loading state");
    return <div className="p-4 text-gray-600">Loading cart...</div>;
  }

  console.log("Rendering cart, items length:", cartItems.length);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-gray-900 flex items-center gap-2">
        <span>
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4"></path>
            <circle cx="7" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
          </svg>
        </span>
        Your Cart
      </h2>

      {cartItems.length === 0 ? (
        <p className="text-center text-gray-500">Your cart is empty.</p>
      ) : (
        <ul className="space-y-4">
          {cartItems.map((item) => (
            <li key={item.product_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-medium truncate">{item.product_name}</p>
                <p className="text-xs text-gray-600 mt-1">₹{Number(item.price).toFixed(2)} each</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateQuantity(item.product_id, -1)}
                  disabled={item.quantity <= 1}
                  className="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  -
                </button>
                <span className="w-8 text-center font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product_id, 1)}
                  className="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  +
                </button>
                <span className="ml-4 font-semibold text-gray-900">
                  ₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}
                </span>
                <button
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {cartItems.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total:</span>
            <span>₹{cartItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0).toFixed(2)}</span>
          </div>
          <button
            className="w-full mt-4 bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
          >
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;