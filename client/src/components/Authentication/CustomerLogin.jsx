// import React, { useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import { User } from "lucide-react";

// export default function CustomerLogin({ onRegisterClick }) {
//   const [form, setForm] = useState({ email: "", password: "" });
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   console.log("CustomerLogin rendered, onRegisterClick:", typeof onRegisterClick);

//   const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

//   const handleSubmit = async e => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);
    
//     try {
//       const res = await axios.post("http://localhost:5000/api/customer/login", form);
      
//       if (!res.data || !res.data.token || !res.data.customerId) {
//         setError("Login failed. Please try again.");
//         setLoading(false);
//         return;
//       }
      
//       localStorage.setItem("customerToken", res.data.token);
//       localStorage.setItem("customerId", res.data.customerId);
//       const encodedCustomerId = btoa(res.data.customerId);
      
//       console.log("Login successful, navigating to customer page");
//       navigate(`/customer?customerId=${encodedCustomerId}`, { replace: true });
      
//     } catch (err) {
//       const errorMessage = err.response?.data?.message || err.message || "Login failed, cannot connect to backend.";
//       console.error("Login error:", errorMessage);
//       setError(errorMessage);
//       setLoading(false);
//     }
//   };

//   const handleRegisterClick = () => {
//     if (typeof onRegisterClick === "function") {
//       console.log("Register here clicked, calling onRegisterClick");
//       onRegisterClick();
//     } else {
//       console.error("onRegisterClick is not a function");
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
//       <form onSubmit={handleSubmit} className="p-8 bg-white rounded shadow-md w-full max-w-md">
//         <h2 className="text-2xl mb-6 flex items-center gap-2 font-semibold">
//           <User className="text-green-600" /> Customer Login
//         </h2>
        
//         <div className="mb-4">
//           <input
//             name="email"
//             type="email"
//             placeholder="Email"
//             value={form.email}
//             onChange={handleChange}
//             required
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
//           />
//         </div>
        
//         <div className="mb-4">
//           <input
//             name="password"
//             type="password"
//             placeholder="Password"
//             value={form.password}
//             onChange={handleChange}
//             required
//             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
//           />
//         </div>
        
//         <button 
//           type="submit" 
//           disabled={loading}
//           className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
//         >
//           {loading ? "Logging in..." : "Login"}
//         </button>
        
//         {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
        
//         <p className="text-gray-600 mt-4 text-center">
//           New customer?{" "}
//           <button
//             type="button"
//             onClick={handleRegisterClick}
//             className="text-blue-600 underline hover:text-blue-800"
//           >
//             Register here
//           </button>
//         </p>
//       </form>
//     </div>
//   );
// }







import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { User, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function CustomerLogin({ onRegisterClick, onClose }) {
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  console.log("CustomerLogin rendered, onRegisterClick:", typeof onRegisterClick, "onClose:", typeof onClose);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      console.log("Submitting login with:", form.login);
      const res = await axios.post("http://localhost:5000/api/customer/login", form);
      
      if (!res.data || !res.data.token || !res.data.customerId) {
        console.error("Login response invalid:", res.data);
        setError("Login failed. Please try again.");
        setLoading(false);
        return;
      }
      
      localStorage.setItem("customerToken", res.data.token);
      localStorage.setItem("customerId", res.data.customerId);
      const encodedCustomerId = btoa(res.data.customerId);
      
      console.log("Login successful, navigating to /customer?customerId=", encodedCustomerId);
      navigate(`/customer?customerId=${encodedCustomerId}`, { replace: true });
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Login failed, cannot connect to backend.";
      console.error("Login error:", errorMessage, err);
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleRegisterClick = () => {
    if (typeof onRegisterClick === "function") {
      console.log("Register here clicked, calling onRegisterClick");
      onRegisterClick();
    } else {
      console.error("onRegisterClick is not a function");
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center p-4 border-b">
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100 mr-2"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-semibold text-gray-800">Welcome Back</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login" className="block text-sm font-medium text-gray-700 mb-1">
              Username or Email
            </label>
            <input
              id="login"
              name="login"
              type="text"
              placeholder="Username or email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              value={form.login}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors pr-12"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} className="text-gray-400" />
                ) : (
                  <Eye size={20} className="text-gray-400" />
                )}
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>
            
            <button type="button" className="text-sm text-green-600 hover:text-green-700">
              Forgot password?
            </button>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : "Sign in"}
          </button>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
        </form>

      </div>
    </div>
  );
}