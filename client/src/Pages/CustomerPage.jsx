import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/CustomerComponents/Header";
import Banner from "../components/CustomerComponents/Banner";
import Products from "../components/CustomerComponents/Products";
import SingleProduct from "../components/CustomerComponents/SingleProduct";
import Footer from "../components/CustomerComponents/Footer";
import CustomerLogin from "../components/Authentication/CustomerLogin";
import CustomerRegister from "../components/Authentication/CustomerRegister";
import Cart from "../components/CustomerComponents/Cart";
import MyOrders from "../components/CustomerComponents/MyOrders";
// import "./CustomerPage.css"; // Import custom CSS

function decodeCustomerId(encodedId) {
  try {
    return atob(encodedId);
  } catch {
    console.error("Error decoding customerId:", encodedId);
    return null;
  }
}

function decodeProductId(encodedId) {
  try {
    const decoded = atob(encodedId);
    const idNum = parseInt(decoded, 10);
    if (isNaN(idNum)) {
      throw new Error("Invalid product ID");
    }
    return idNum.toString();
  } catch {
    console.error("Error decoding productId:", encodedId);
    return null;
  }
}

export default function CustomerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const encodedCustomerId = searchParams.get("customerId");
  const encodedProductId = searchParams.get("productId");
  const customerId = decodeCustomerId(encodedCustomerId);
  const productId = decodeProductId(encodedProductId);

  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(null);
  const [modalAnimation, setModalAnimation] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartAnimation, setCartAnimation] = useState("");
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [ordersAnimation, setOrdersAnimation] = useState("");
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showMessage = (msg) => {
    setMessage(msg);
  };

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
            fetchWishlist();
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

  const fetchWishlist = async () => {
    if (customerId) {
      try {
        const response = await fetch(`http://localhost:5000/api/customer/wishlist?customerId=${customerId}`, {
          headers: { "Origin": "http://localhost:5173" },
        });
        const data = await response.json();
        setWishlist(data.filter(item => item.is_liked === 1).map(item => item.product_id));
      } catch (error) {
        console.error("Failed to fetch wishlist:", error);
      }
    }
  };

  const handleToggleWishlist = (productId) => {
    if (!customerId) {
      console.error("No customerId available");
      return;
    }
    console.log("Toggling wishlist:", productId);
    fetch("http://localhost:5000/api/customer/wishlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": "http://localhost:5173",
      },
      body: JSON.stringify({ customerId, productId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.is_liked === 1) {
          setWishlist((prev) => [...prev, productId]);
        } else {
          setWishlist((prev) => prev.filter((id) => id !== productId));
        }
        showMessage(data.message);
      })
      .catch((err) => console.error("Failed to toggle wishlist:", err));
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

  const handleOrdersClick = () => {
    setOrdersAnimation("slide-in");
    setShowOrdersModal(true);
  };

  const handleCloseOrders = () => {
    setOrdersAnimation("slide-out");
    setTimeout(() => {
      setShowOrdersModal(false);
      setOrdersAnimation("");
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
          fetchCart();
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
    <div className="min-h-screen bg-gray-50 flex flex-col custom-scrollbar">
      <Header
        customerData={customerData}
        onLoginClick={handleLoginClick}
        onRegisterClick={handleRegisterClick}
        cartItems={cartItems}
        customerId={customerId}
        fetchCart={fetchCart}
        onCartClick={handleCartClick}
        onOrdersClick={handleOrdersClick}
      />
      <main className="flex-1 bg-gray-50 pt-20">
        {productId ? (
          <div className="md:px-8">
            <SingleProduct
              productId={productId}
              isLoggedIn={!!customerData}
              customerId={customerId}
              cartItems={cartItems}
              fetchCart={fetchCart}
              wishlist={wishlist}
              handleToggleWishlist={handleToggleWishlist}
              showMessage={showMessage}
            />
          </div>
        ) : (
          <>
            <Banner />
            <div className="md:px-8">
              <Products
                isLoggedIn={!!customerData}
                customerId={customerId}
                cartItems={cartItems}
                setCartItems={setCartItems}
                fetchCart={fetchCart}
                wishlist={wishlist}
                handleToggleWishlist={handleToggleWishlist}
                showMessage={showMessage}
              />
            </div>
          </>
        )}
      </main>
      
      {showAuthModal && (
        <div 
          className={`fixed inset-0 bg-opacity-50 flex z-50 transition-opacity duration-300 ${modalAnimation.includes("in") ? "opacity-100" : "opacity-0"}`}
          onClick={handleCloseModal}
        >
          <div 
            className={`ml-auto h-full w-full sm:w-96 bg-white shadow-xl transform transition-transform duration-300 custom-scrollbar ${modalAnimation === "slide-in" ? "translate-x-0" : modalAnimation === "slide-out" ? "translate-x-full" : "translate-x-full"}`}
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
        <Cart
          customerId={customerId}
          cartItems={cartItems}
          updateQuantity={updateQuantity}
          handleRemoveItem={handleRemoveItem}
          handleCloseCart={handleCloseCart}
          showCartModal={showCartModal}
          cartAnimation={cartAnimation}
        />
      )}

      {showOrdersModal && (
        <MyOrders
          customerId={customerId}
          handleCloseOrders={handleCloseOrders}
          showOrdersModal={showOrdersModal}
          ordersAnimation={ordersAnimation}
        />
      )}
      
      {message && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg">
          {message}
        </div>
      )}
      
      <Footer />
    </div>
  );
}
