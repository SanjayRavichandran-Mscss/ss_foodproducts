import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import DeliveryAddress from "../components/CustomerComponents/DeliveryAddress";
import PaymentMethod from "../components/CustomerComponents/PaymentMethod";
import OrderSummary from "../components/CustomerComponents/OrderSummary";
import Header from "../components/CustomerComponents/Header";
import Cart from "../components/CustomerComponents/Cart";

// Dummy Cart Items for cart flow
const dummyCartItems = [
  {
    product_id: 1,
    product_name: "Wireless Headphones",
    thumbnail_url: "/images/headphones.jpg",
    price: 2999.00,
    quantity: 2,
    stock_quantity: 10,
    unit: "item",
  },
  {
    product_id: 2,
    product_name: "Smartphone Case",
    thumbnail_url: "/images/case.jpg",
    price: 499.00,
    quantity: 1,
    stock_quantity: 20,
    unit: "item",
  },
];

// Dummy Buy Now Item for buy_now flow
const dummyBuyNowItem = {
  product_id: 1,
  product_name: "Wireless Headphones",
  thumbnail_url: "/images/headphones.jpg",
  price: 2999.00,
  quantity: 1,
  stock_quantity: 10,
  unit: "item",
};

function decodeCustomerId(encodedId) {
  try {
    return atob(encodedId);
  } catch {
    console.error("Error decoding customerId:", encodedId);
    return null;
  }
}

const CheckOutPage = () => {
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const encodedCustomerId = searchParams.get("customerId");
  const identifier = searchParams.get("identifier");
  const customerId = decodeCustomerId(encodedCustomerId);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [customerData, setCustomerData] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartAnimation, setCartAnimation] = useState("");

  const isBuyNow = identifier === "buy_now";
  const items = isBuyNow ? [state?.product || dummyBuyNowItem] : cartItems;
  const orderMethod = isBuyNow ? "buy_now" : "cart";

  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  const shipping = subtotal > 999 ? 0 : 100;
  const total = subtotal + shipping;

  useEffect(() => {
    const token = localStorage.getItem("customerToken");
    const storedCustomerId = localStorage.getItem("customerId");

    if (!token || !storedCustomerId || !customerId || !["buy_now", "cart"].includes(identifier)) {
      console.log("Invalid token, customerId, or identifier, redirecting to root");
      navigate("/", { replace: true });
      return;
    }

    if (customerId !== storedCustomerId) {
      console.log("CustomerId mismatch, updating URL");
      const correctEncodedId = btoa(storedCustomerId);
      navigate(`/checkout?customerId=${correctEncodedId}&identifier=${identifier}`, { replace: true });
      return;
    }

    const verifyCustomer = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/customer/profile?customerId=${storedCustomerId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setCustomerData(data);
          await fetchCart();
        } else {
          console.error("Token verification failed, clearing storage");
          localStorage.removeItem("customerToken");
          localStorage.removeItem("customerId");
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Verification error:", error);
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerId");
        navigate("/", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    verifyCustomer();
  }, [customerId, identifier, navigate]);

  const fetchCart = async () => {
    if (!customerId) return;
    try {
      const token = localStorage.getItem("customerToken");
      const response = await fetch(`http://localhost:5000/api/customer/cart?customerId=${customerId}`, {
        headers: {
          "Content-Type": "application/json",
          "Origin": "http://localhost:5173",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setCartItems(data || []);
      // Update navigation state for cart flow
      if (!isBuyNow) {
        navigate(`/checkout?customerId=${btoa(customerId)}&identifier=cart`, {
          state: { cartItems: data || [], orderMethod: "cart" },
          replace: true,
        });
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
      setCartItems([]);
    }
  };

  const updateQuantity = async (productId, change) => {
    const item = cartItems.find((item) => item.product_id === productId);
    if (!item) return;
    const newQuantity = Math.max(1, item.quantity + change);
    try {
      const token = localStorage.getItem("customerToken");
      const response = await fetch(`http://localhost:5000/api/customer/cart`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Origin": "http://localhost:5173",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ customerId, productId, quantity: newQuantity }),
      });
      if (response.ok) {
        await fetchCart();
      } else {
        console.error("Failed to update quantity:", response.statusText);
      }
    } catch (err) {
      console.error("Failed to update quantity:", err);
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!customerId) {
      console.error("No customerId available");
      return;
    }
    try {
      const token = localStorage.getItem("customerToken");
      const response = await fetch(
        `http://localhost:5000/api/customer/cart?customerId=${customerId}&productId=${productId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Origin": "http://localhost:5173",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        await fetchCart();
      } else {
        console.error("Delete request failed:", response.statusText);
      }
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  const handleCartClick = () => {
    setCartAnimation("slide-in");
    setShowCartModal(true);
  };

  const handleCloseCart = () => {
    setCartAnimation("slide-out");
    setTimeout(() => {
      setShowCartModal(false);
      setCartAnimation("");
      fetchCart(); // Ensure cart is refreshed after closing modal
    }, 300);
  };

  const handleLoginClick = () => {
    navigate("/?auth=login");
  };

  const handleRegisterClick = () => {
    navigate("/?auth=register");
  };

  const handleContinue = () => {
    if (currentStep === 1 && selectedAddressId) {
      setCurrentStep(2);
    } else if (currentStep === 2 && !isBuyNow) {
      setCurrentStep(3);
    }
  };

  const handlePlaceOrder = () => {
    if (!selectedAddressId || !selectedPaymentMethodId) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Information",
        text: "Please select a delivery address and payment method.",
      });
      return;
    }
    if (selectedPaymentMethodId === 1) {
      Swal.fire({
        icon: "success",
        title: "Order Placed",
        text: "Your order has been placed and an invoice has been sent to your mail.",
      }).then(() => {
        navigate(`/customer?customerId=${btoa(customerId)}`);
      });
    } else if (selectedPaymentMethodId === 2) {
      Swal.fire({
        icon: "warning",
        title: "Payment Required",
        text: "Please complete the online payment to place your order.",
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const showOrderSummarySidebar = currentStep === 2 && isBuyNow;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        customerData={customerData}
        onLoginClick={handleLoginClick}
        onRegisterClick={handleRegisterClick}
        cartItems={cartItems}
        customerId={customerId}
        fetchCart={fetchCart}
        onCartClick={handleCartClick}
      />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl pt-20">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Checkout</h1>

        <div className="mb-8 overflow-x-auto">
          <div className="flex justify-between items-center mb-4 min-w-max">
            <div
              className={`flex flex-col items-center ${
                currentStep >= 1 ? "text-green-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  currentStep >= 1
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                1
              </div>
              <span className="text-sm mt-2 font-medium">Delivery</span>
            </div>
            <div
              className={`flex-1 h-1 mx-4 ${
                currentStep >= 2 ? "bg-green-600" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`flex flex-col items-center ${
                currentStep >= 2 ? "text-green-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  currentStep >= 2
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                2
              </div>
              <span className="text-sm mt-2 font-medium">
                {isBuyNow ? "Payment" : "Order Summary"}
              </span>
            </div>
            {!isBuyNow && (
              <>
                <div
                  className={`flex-1 h-1 mx-4 ${
                    currentStep >= 3 ? "bg-green-600" : "bg-gray-300"
                  }`}
                ></div>
                <div
                  className={`flex flex-col items-center ${
                    currentStep >= 3 ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                      currentStep >= 3
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    3
                  </div>
                  <span className="text-sm mt-2 font-medium">Payment</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {currentStep === 1 && (
              <div>
                <DeliveryAddress
                  selectedAddressId={selectedAddressId}
                  setSelectedAddressId={setSelectedAddressId}
                />
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleContinue}
                    disabled={!selectedAddressId}
                    className={`px-6 py-3 rounded-lg font-medium transition-all cursor-pointer ${
                      selectedAddressId
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Continue to {isBuyNow ? "Payment" : "Order Summary"}
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && !isBuyNow && (
              <div>
                <OrderSummary
                  items={items}
                  orderMethod={orderMethod}
                  selectedPaymentMethodId={selectedPaymentMethodId}
                  showEditButtons={true}
                  customerId={customerId}
                  fetchCart={fetchCart}
                  updateQuantity={updateQuantity}
                  handleRemoveItem={handleRemoveItem}
                />
                <div className="flex justify-between mt-4 gap-4">
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleContinue}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all cursor-pointer"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {((currentStep === 2 && isBuyNow) || (currentStep === 3 && !isBuyNow)) && (
              <div className="flex flex-col space-y-6 max-w-2xl mx-auto">
                <PaymentMethod
                  selectedPaymentMethodId={selectedPaymentMethodId}
                  setSelectedPaymentMethodId={setSelectedPaymentMethodId}
                />
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex justify-between text-gray-700 mb-2">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={!selectedPaymentMethodId}
                  className={`w-full py-3 rounded-lg font-medium transition-all cursor-pointer ${
                    selectedPaymentMethodId
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Place Order
                </button>
                <div className="flex justify-start mt-4 w-full">
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-all cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>

          {showOrderSummarySidebar && (
            <div className="md:col-span-1">
              <OrderSummary
                items={items}
                orderMethod={orderMethod}
                selectedPaymentMethodId={selectedPaymentMethodId}
                showEditButtons={false}
                customerId={customerId}
                fetchCart={fetchCart}
                updateQuantity={updateQuantity}
                handleRemoveItem={handleRemoveItem}
              />
            </div>
          )}
        </div>

        <button
          className="mt-8 text-green-600 hover:text-green-800 font-medium flex items-center gap-1 transition-all cursor-pointer"
          onClick={() => navigate(`/customer?customerId=${btoa(customerId)}`)}
        >
          &larr; Continue Shopping
        </button>

        {showCartModal && (
          <Cart
            customerId={customerId}
            cartItems={cartItems}
            updateQuantity={updateQuantity}
            handleRemoveItem={handleRemoveItem}
            fetchCart={fetchCart}
            handleCloseCart={handleCloseCart}
            showCartModal={showCartModal}
            cartAnimation={cartAnimation}
          />
        )}
      </main>
    </div>
  );
};

export default CheckOutPage;