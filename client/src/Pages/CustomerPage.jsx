import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/CustomerComponents/Header";
import Banner from "../components/CustomerComponents/Banner";
import Products from "../components/CustomerComponents/Products";
import Footer from "../components/CustomerComponents/Footer";
import CustomerLogin from "../components/Authentication/CustomerLogin";
import CustomerRegister from "../components/Authentication/CustomerRegister";
import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";

function decodeCustomerId(encodedId) {
  try {
    return atob(encodedId);
  } catch {
    console.error("Error decoding customerId:", encodedId);
    return null;
  }
}

export default function CustomerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const encodedCustomerId = searchParams.get("customerId");
  const customerId = decodeCustomerId(encodedCustomerId);

  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(null);
  const [modalAnimation, setModalAnimation] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartAnimation, setCartAnimation] = useState("");

  useEffect(() => {
    console.log("CustomerPage useEffect triggered", { location: location.pathname, encodedCustomerId, customerId });
    const token = localStorage.getItem("customerToken");
    const storedCustomerId = localStorage.getItem("customerId");
    console.log("LocalStorage check", { token, storedCustomerId });

    if (location.pathname.startsWith("/customer") && (!token || !storedCustomerId)) {
      console.log("No token or customerId, redirecting to root");
      navigate("/", { replace: true });
      return;
    }

    if (!token || !storedCustomerId) {
      if (location.pathname !== "/") {
        console.log("Invalid path for guest, redirecting to root");
        navigate("/", { replace: true });
        return;
      }
      setVerified(true);
      setLoading(false);
      return;
    }

    if (token && storedCustomerId && encodedCustomerId) {
      const decodedId = decodeCustomerId(encodedCustomerId);
      if (decodedId !== storedCustomerId) {
        console.log("CustomerId mismatch, updating URL");
        const correctEncodedId = btoa(storedCustomerId);
        navigate(`/customer?customerId=${correctEncodedId}`, { replace: true });
        return;
      }
    }

    if (token && storedCustomerId && !encodedCustomerId) {
      console.log("No customerId in URL, adding encoded ID");
      const encodedId = btoa(storedCustomerId);
      navigate(`/customer?customerId=${encodedId}`, { replace: true });
      return;
    }

    if (token && storedCustomerId && encodedCustomerId) {
      const verifyCustomer = async () => {
        try {
          console.log("Fetching profile...");
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
          console.log("Profile fetch status", response.status);
          if (response.ok) {
            const data = await response.json();
            console.log("Profile data", data);
            setCustomerData(data);
            setVerified(true);
            fetchCart();
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
          console.log("Loading set to false");
        }
      };
      verifyCustomer();
    } else {
      setLoading(false);
    }
  }, [encodedCustomerId, navigate, location.pathname]);

  const fetchCart = async () => {
    if (customerId) {
      try {
        const response = await fetch(`http://localhost:5000/api/customer/cart?customerId=${customerId}`, {
          headers: { "Origin": "http://localhost:5173" },
        });
        const data = await response.json();
        console.log("Cart data fetched", data);
        setCartItems(data || []);
      } catch (error) {
        console.error("Failed to fetch cart:", error);
      }
    }
  };

  const handleLoginClick = () => {
    setModalAnimation("slide-in");
    setShowAuthModal("login");
  };

  const handleRegisterClick = () => {
    setModalAnimation("slide-in");
    setShowAuthModal("register");
  };

  const handleCloseModal = () => {
    setModalAnimation("slide-out");
    setTimeout(() => {
      setShowAuthModal(null);
      setModalAnimation("");
    }, 300);
  };

  const handleAuthSwitch = (mode) => {
    setModalAnimation("fade-out");
    setTimeout(() => {
      setShowAuthModal(mode);
      setModalAnimation("fade-in");
    }, 300);
  };

  const handleCartClick = () => {
    console.log("Cart icon clicked, opening modal");
    setCartAnimation("slide-in");
    setShowCartModal(true);
  };

  const handleCloseCart = () => {
    setCartAnimation("slide-out");
    setTimeout(() => {
      setShowCartModal(false);
      setCartAnimation("");
    }, 300);
  };

  const updateQuantity = (productId, change) => {
    const item = cartItems.find((item) => item.product_id === productId);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + change);
      fetch(`http://localhost:5000/api/customer/cart`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Origin": "http://localhost:5173",
        },
        body: JSON.stringify({ customerId, productId, quantity: newQuantity }),
      })
        .then(() => fetchCart())
        .catch((err) => console.error("Failed to update quantity:", err));
    }
  };

  const handleRemoveItem = (productId) => {
    if (!customerId) {
      console.error("No customerId available");
      return;
    }
    console.log("Attempting to remove item", { customerId, productId });
    fetch(`http://localhost:5000/api/customer/cart?customerId=${customerId}&productId=${productId}`, {
      method: "DELETE",
      headers: { "Origin": "http://localhost:5173" },
    })
      .then((response) => {
        console.log("Delete response", response.status);
        if (response.ok) {
          fetchCart(); // Refresh cart on success
        } else {
          console.error("Delete request failed", response.statusText);
        }
      })
      .catch((err) => console.error("Failed to remove item:", err));
  };

  if (loading) {
    console.log("Rendering loading state");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading fresh groceries...</p>
        </div>
      </div>
    );
  }

  if (!verified && location.pathname.startsWith("/customer")) {
    console.log("Not verified, returning null");
    return null;
  }

  console.log("Rendering main content", { verified, customerData, cartItems });

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
      <main className="flex-1 bg-gray-50 pt-20">
        <Banner />
        <div className="md:px-8">
          <Products
            isLoggedIn={!!customerData}
            customerId={customerId}
            cartItems={cartItems}
            setCartItems={setCartItems}
            fetchCart={fetchCart}
          />
        </div>
      </main>
      
      {showAuthModal && (
        <div 
          className={`fixed inset-0 bg-opacity-50 flex z-50 transition-opacity duration-300 ${modalAnimation.includes("in") ? "opacity-100" : "opacity-0"}`}
          onClick={handleCloseModal}
        >
          <div 
            className={`ml-auto h-full w-full sm:w-96 bg-white shadow-xl transform transition-transform duration-300 ${modalAnimation === "slide-in" ? "translate-x-0" : modalAnimation === "slide-out" ? "translate-x-full" : "translate-x-full"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            
            <div className={`transition-opacity duration-300 ${modalAnimation === "fade-in" ? "opacity-100" : modalAnimation === "fade-out" ? "opacity-0" : "opacity-100"}`}>
              {showAuthModal === "login" ? (
                <CustomerLogin 
                  onRegisterClick={() => handleAuthSwitch("register")} 
                  onClose={handleCloseModal}
                />
              ) : (
                <CustomerRegister 
                  onLoginClick={() => handleAuthSwitch("login")} 
                  onClose={handleCloseModal}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {showCartModal && (
        <div 
          className={`fixed inset-0 bg-opacity-50 flex z-50 transition-opacity duration-300 ${cartAnimation.includes("in") ? "opacity-100" : "opacity-0"}`}
          onClick={handleCloseCart}
        >
          <div 
            className="ml-auto h-full w-full sm:w-96 bg-white shadow-lg transform transition-transform duration-300 p-6 overflow-y-auto"
            style={{ transform: cartAnimation === "slide-in" ? "translateX(0)" : cartAnimation === "slide-out" ? "translateX(100%)" : "translateX(100%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseCart}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
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
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Shopping Cart</h2>
            <p className="text-gray-600 mb-4">{cartItems.length} items</p>
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Your cart is empty.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.product_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium truncate">{item.product_name}</p>
                      <p className="text-xs text-gray-600 mt-1">₹{item.price} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product_id, -1)}
                        className="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, 1)}
                        className="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                      >
                        <Plus size={16} />
                      </button>
                      <span className="ml-2 font-medium text-gray-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleRemoveItem(item.product_id)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    <span>₹{cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</span>
                  </div>
                  <button
                    type="button"
                    className="w-full mt-4 bg-green-600 text-white py-2 rounded-md hover:bg-green-700"
                  >
                    Proceed to Checkout
                  </button>
                  <button
                    className="w-full mt-2 text-gray-600 hover:text-gray-800 text-center"
                    onClick={handleCloseCart}
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}