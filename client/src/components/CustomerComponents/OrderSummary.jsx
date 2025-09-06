import React, { useState } from "react";
import { ShoppingBag } from "lucide-react";
import Cart from "./Cart";

const OrderSummary = ({
  items,
  orderMethod,
  selectedPaymentMethodId,
  showEditButtons = false,
  customerId,
  fetchCart,
  updateQuantity,
  handleRemoveItem,
}) => {
  const baseUrl = "http://localhost:5000";
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartAnimation, setCartAnimation] = useState("");

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (item.quantity || 1), 0);
  const shipping = subtotal > 999 ? 0 : 100;
  const total = subtotal + shipping;

  const paymentMethodDisplay =
    selectedPaymentMethodId === 1
      ? "Cash on Delivery"
      : selectedPaymentMethodId === 2
      ? "Online Payment"
      : "Not selected";

  const handleEditCart = () => {
    setCartAnimation("slide-in");
    setShowCartModal(true);
  };

  const handleCloseCart = () => {
    setCartAnimation("slide-out");
    setTimeout(() => {
      setShowCartModal(false);
      setCartAnimation("");
      if (orderMethod === "cart") fetchCart();
    }, 300);
  };

  const getImageUrl = (thumbnailUrl) => {
    if (!thumbnailUrl) return "/fallback-image.png";
    if (orderMethod === "buy_now") {
      return thumbnailUrl.startsWith("http") ? thumbnailUrl : `${baseUrl}${thumbnailUrl}`;
    }
    return `${baseUrl}${thumbnailUrl}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag size={24} className="text-green-600" />
          Order Summary
        </h2>
        {showEditButtons && orderMethod === "cart" && (
          <button
            className="text-green-600 hover:text-green-800 font-medium text-sm px-3 py-1 rounded-md bg-green-50 hover:bg-green-100 transition-colors cursor-pointer"
            onClick={handleEditCart}
          >
            Edit Cart
          </button>
        )}
      </div>
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-gray-500 text-center">No items in order</p>
        ) : (
          items.map((item) => {
            const price = parseFloat(item.price) || 0;
            const quantity = item.quantity || 1;
            const productName = item.product_name || "Unknown Product";
            const unit = item.unit || "item";

            return (
              <div key={item.product_id || Math.random()} className="flex items-center gap-4">
                <img
                  src={getImageUrl(item.thumbnail_url)}
                  alt={productName}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-sm"
                  onError={(e) => {
                    e.target.src = "/fallback-image.png";
                  }}
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{productName}</p>
                  <p className="text-sm text-gray-600">Quantity: {quantity}</p>
                  <p className="text-sm text-gray-600">
                    ₹{price.toFixed(2)} per {unit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-green-600">
                    ₹{(price * quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between text-gray-700 mb-2">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-700 mb-2">
            <span>Shipping</span>
            <span>{shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Order Method: {orderMethod === "buy_now" ? "Buy Now" : "Cart"}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Payment Method: {paymentMethodDisplay}
          </p>
        </div>
      </div>

      {showCartModal && (
        <Cart
          customerId={customerId}
          cartItems={items}
          updateQuantity={updateQuantity}
          handleRemoveItem={handleRemoveItem}
          fetchCart={fetchCart}
          handleCloseCart={handleCloseCart}
          showCartModal={showCartModal}
          cartAnimation={cartAnimation}
        />
      )}
    </div>
  );
};

export default OrderSummary;