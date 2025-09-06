import React, { useState } from "react";
import { CreditCard, Shield } from "lucide-react";

// Payment Methods
const paymentMethods = [
  { id: 1, method: "cod", display: "Cash on Delivery" },
  { id: 2, method: "online", display: "Online Payment" },
];

const PaymentMethod = ({ selectedPaymentMethodId, setSelectedPaymentMethodId }) => {
  const [showCardDetails, setShowCardDetails] = useState(false);

  const handleSelectPaymentMethod = (id) => {
    setSelectedPaymentMethodId(id);
    setShowCardDetails(id === 2); // Show card details for Online Payment
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <CreditCard size={24} className="text-green-600" />
        Payment Method
      </h2>
      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
              selectedPaymentMethodId === method.id
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
            onClick={() => handleSelectPaymentMethod(method.id)}
          >
            <p className="font-medium text-gray-900">{method.display}</p>
          </div>
        ))}
        {showCardDetails && (
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Card Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Card Number"
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              />
              <input
                type="text"
                placeholder="Cardholder Name"
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              />
              <input
                type="text"
                placeholder="Expiry Date (MM/YY)"
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              />
              <input
                type="text"
                placeholder="CVV"
                className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              />
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Shield size={16} className="text-green-600" />
          <span>Secure payment processing</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethod;