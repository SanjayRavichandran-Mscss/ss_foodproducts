// import React, { useEffect, useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import Header from "../components/CustomerComponents/Header";
// import Banner from "../components/CustomerComponents/Banner";
// import Products from "../components/CustomerComponents/Products";
// import Footer from "../components/CustomerComponents/Footer";
// import CustomerLogin from "../components/Authentication/CustomerLogin";
// import CustomerRegister from "../components/Authentication/CustomerRegister";

// function decodeCustomerId(encodedId) {
//   try {
//     return atob(encodedId);
//   } catch {
//     console.error("Error decoding customerId:", encodedId);
//     return null;
//   }
// }

// export default function CustomerPage() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const searchParams = new URLSearchParams(location.search);
//   const encodedCustomerId = searchParams.get("customerId");
//   const customerId = decodeCustomerId(encodedCustomerId);

//   const [verified, setVerified] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [customerData, setCustomerData] = useState(null);
//   const [showAuthModal, setShowAuthModal] = useState(null); // null, "login", or "register"

//   useEffect(() => {
//     const token = localStorage.getItem("customerToken");
//     const storedCustomerId = localStorage.getItem("customerId");

//     // If accessing /customer path without login, redirect to root
//     if (location.pathname.startsWith("/customer") && (!token || !storedCustomerId)) {
//       console.log("No token or customerId, redirecting to root");
//       navigate("/", { replace: true });
//       return;
//     }

//     // If no token or customerId, user is browsing as guest at root path
//     if (!token || !storedCustomerId) {
//       if (location.pathname !== "/") {
//         console.log("Invalid path for guest, redirecting to root");
//         navigate("/", { replace: true });
//         return;
//       }
//       setVerified(true);
//       setLoading(false);
//       return;
//     }

//     // If URL has different customerId than stored, update URL to match stored credentials
//     if (token && storedCustomerId && encodedCustomerId) {
//       const decodedId = decodeCustomerId(encodedCustomerId);

//       if (decodedId !== storedCustomerId) {
//         console.log("CustomerId mismatch, updating URL");
//         const correctEncodedId = btoa(storedCustomerId);
//         navigate(`/customer?customerId=${correctEncodedId}`, { replace: true });
//         return;
//       }
//     }

//     // If token exists but no encodedCustomerId in URL, redirect with encoded ID
//     if (token && storedCustomerId && !encodedCustomerId) {
//       console.log("No customerId in URL, adding encoded ID");
//       const encodedId = btoa(storedCustomerId);
//       navigate(`/customer?customerId=${encodedId}`, { replace: true });
//       return;
//     }

//     // Verify customer if token exists and URL matches
//     if (token && storedCustomerId && encodedCustomerId) {
//       const decodedId = decodeCustomerId(encodedCustomerId);

//       const verifyCustomer = async () => {
//         try {
//           const response = await fetch(
//             `http://localhost:5000/api/customer/profile?customerId=${storedCustomerId}`,
//             {
//               method: "GET",
//               headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${token}`,
//               },
//             }
//           );

//           if (response.ok) {
//             const data = await response.json();
//             setCustomerData(data);
//             setVerified(true);
//           } else {
//             console.error("Token verification failed, clearing storage");
//             localStorage.removeItem("customerToken");
//             localStorage.removeItem("customerId");
//             navigate("/", { replace: true });
//           }
//         } catch (error) {
//           console.error("Verification error:", error);
//           localStorage.removeItem("customerToken");
//           localStorage.removeItem("customerId");
//           navigate("/", { replace: true });
//         } finally {
//           setLoading(false);
//         }
//       };

//       verifyCustomer();
//     } else {
//       setLoading(false);
//     }
//   }, [encodedCustomerId, navigate, location.pathname]);

//   const handleLoginClick = () => {
//     console.log("Login clicked, setting showAuthModal to 'login'");
//     setShowAuthModal("login");
//   };

//   const handleRegisterClick = () => {
//     console.log("Register clicked, setting showAuthModal to 'register'");
//     setShowAuthModal("register");
//   };

//   const handleCloseModal = () => {
//     console.log("Closing modal");
//     setShowAuthModal(null);
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-100">
//         <div className="text-gray-700 text-xl animate-pulse">Loading...</div>
//       </div>
//     );
//   }

//   // If not verified (shouldn't happen due to redirects, but safety check)
//   if (!verified && location.pathname.startsWith("/customer")) {
//     return null; // Redirect will happen in useEffect
//   }

//   return (
//     <div className="min-h-screen bg-gray-100 flex flex-col">
//       <Header
//         customerData={customerData}
//         onLoginClick={handleLoginClick}
//         onRegisterClick={handleRegisterClick}
//       />
//       <main className="flex-1 bg-gray-100 pt-20">
//         {/* Banner goes full width, no surround padding */}
//         <Banner />
//         {/* Regular content/Products below with side padding */}
//         <div className="px-6">
//           <Products isLoggedIn={!!customerData} />
//         </div>
//       </main>
//       {showAuthModal && (
//         <div className="fixed inset-0 bg-opacity-50 flex justify-end z-50">
//           <div
//             className="w-[40%] h-full shadow-lg transform transition-transform duration-300 ease-in-out"
//             style={{
//               transform: showAuthModal ? "translateX(0)" : "translateX(100%)",
//             }}
//           >
//             <button
//               onClick={handleCloseModal}
//               className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
//             >
//               <svg
//                 className="w-6 h-6"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//                 xmlns="http://www.w3.org/2000/svg"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth="2"
//                   d="M6 18L18 6M6 6l12 12"
//                 />
//               </svg>
//             </button>
//             {showAuthModal === "login" ? (
//               <CustomerLogin onRegisterClick={handleRegisterClick} />
//             ) : (
//               <CustomerRegister onLoginClick={handleLoginClick} />
//             )}
//           </div>
//         </div>
//       )}
//       <Footer />
//     </div>
//   );
// }




// CustomerPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/CustomerComponents/Header";
import Banner from "../components/CustomerComponents/Banner";
import Products from "../components/CustomerComponents/Products";
import Footer from "../components/CustomerComponents/Footer";
import CustomerLogin from "../components/Authentication/CustomerLogin";
import CustomerRegister from "../components/Authentication/CustomerRegister";

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

  useEffect(() => {
    const token = localStorage.getItem("customerToken");
    const storedCustomerId = localStorage.getItem("customerId");

    // If accessing /customer path without login, redirect to root
    if (location.pathname.startsWith("/customer") && (!token || !storedCustomerId)) {
      console.log("No token or customerId, redirecting to root");
      navigate("/", { replace: true });
      return;
    }

    // If no token or customerId, user is browsing as guest at root path
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

    // If URL has different customerId than stored, update URL to match stored credentials
    if (token && storedCustomerId && encodedCustomerId) {
      const decodedId = decodeCustomerId(encodedCustomerId);

      if (decodedId !== storedCustomerId) {
        console.log("CustomerId mismatch, updating URL");
        const correctEncodedId = btoa(storedCustomerId);
        navigate(`/customer?customerId=${correctEncodedId}`, { replace: true });
        return;
      }
    }

    // If token exists but no encodedCustomerId in URL, redirect with encoded ID
    if (token && storedCustomerId && !encodedCustomerId) {
      console.log("No customerId in URL, adding encoded ID");
      const encodedId = btoa(storedCustomerId);
      navigate(`/customer?customerId=${encodedId}`, { replace: true });
      return;
    }

    // Verify customer if token exists and URL matches
    if (token && storedCustomerId && encodedCustomerId) {
      const decodedId = decodeCustomerId(encodedCustomerId);

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
            setVerified(true);
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
    } else {
      setLoading(false);
    }
  }, [encodedCustomerId, navigate, location.pathname]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading fresh groceries...</p>
        </div>
      </div>
    );
  }

  // If not verified (shouldn't happen due to redirects, but safety check)
  if (!verified && location.pathname.startsWith("/customer")) {
    return null; // Redirect will happen in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        customerData={customerData}
        onLoginClick={handleLoginClick}
        onRegisterClick={handleRegisterClick}
      />
      <main className="flex-1 bg-gray-50 pt-20">
        <Banner />
        <div className=" md:px-8">
          <Products isLoggedIn={!!customerData} />
        </div>
      </main>
      
      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div 
          className={`fixed inset-0  bg-opacity-50 flex z-50 transition-opacity duration-300 ${modalAnimation.includes("in") ? "opacity-100" : "opacity-0"}`}
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
      
      <Footer />
    </div>
  );
}