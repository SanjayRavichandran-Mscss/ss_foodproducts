// import React, { useState } from "react";
// import axios from "axios";
// import { UserPlus } from "lucide-react";

// export default function CustomerRegister({ onLoginClick }) {
//   const [form, setForm] = useState({
//     username: "",
//     email: "",
//     password: "",
//     full_name: "",
//     phone: ""
//   });
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

//   console.log("CustomerRegister rendered, onLoginClick:", typeof onLoginClick);

//   const handleSubmit = async e => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");
//     try {
//       await axios.post("http://localhost:5000/api/customers/register", form);
//       setSuccess("Registration successful! Please login.");
//       setTimeout(() => {
//         if (typeof onLoginClick === "function") {
//           console.log("Registration successful, calling onLoginClick");
//           onLoginClick();
//         } else {
//           console.error("onLoginClick is not a function");
//         }
//       }, 1500);
//     } catch (err) {
//       const errorMessage = err.response?.data?.message || "Registration failed";
//       console.error("Registration error:", errorMessage);
//       setError(errorMessage);
//     }
//   };

//   const handleLoginClick = () => {
//     if (typeof onLoginClick === "function") {
//       console.log("Login here clicked, calling onLoginClick");
//       onLoginClick();
//     } else {
//       console.error("onLoginClick is not a function");
//     }
//   };

//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
//       <form onSubmit={handleSubmit} className="p-8 bg-white rounded shadow-md w-full max-w-md">
//         <h2 className="text-2xl mb-6 flex items-center gap-2 font-semibold">
//           <UserPlus className="text-purple-600" /> Customer Register
//         </h2>
//         <input
//           name="username"
//           type="text"
//           placeholder="Username"
//           className="input input-bordered w-full mb-2 p-2 border rounded"
//           value={form.username}
//           onChange={handleChange}
//           required
//           maxLength={50}
//         />
//         <input
//           name="email"
//           type="email"
//           placeholder="Email"
//           className="input input-bordered w-full mb-2 p-2 border rounded"
//           value={form.email}
//           onChange={handleChange}
//           required
//         />
//         <input
//           name="password"
//           type="password"
//           placeholder="Password (min 6 chars)"
//           className="input input-bordered w-full mb-2 p-2 border rounded"
//           value={form.password}
//           onChange={handleChange}
//           required
//           minLength={6}
//         />
//         <input
//           name="full_name"
//           type="text"
//           placeholder="Full Name"
//           className="input input-bordered w-full mb-2 p-2 border rounded"
//           value={form.full_name}
//           onChange={handleChange}
//           required
//           maxLength={100}
//         />
//         <input
//           name="phone"
//           type="text"
//           placeholder="Phone Number"
//           className="input input-bordered w-full mb-2 p-2 border rounded"
//           value={form.phone}
//           onChange={handleChange}
//           required
//         />
//         <button type="submit" className="btn w-full mt-4 bg-purple-600 text-white rounded p-2">
//           Register
//         </button>
//         {error && <p className="text-red-600 mt-2">{error}</p>}
//         {success && <p className="text-green-600 mt-2">{success}</p>}
//         <p className="text-gray-600 mt-4">
//           Already registered?{" "}
//           <button
//             type="button"
//             onClick={handleLoginClick}
//             className="text-blue-600 underline hover:text-blue-800"
//           >
//             Login here
//           </button>
//         </p>
//       </form>
//     </div>
//   );
// }






// CustomerRegister.jsx
import React, { useState } from "react";
import axios from "axios";
import { UserPlus, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function CustomerRegister({ onLoginClick, onClose }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    phone: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    
    try {
      await axios.post("http://localhost:5000/api/customer/register", form);
      setSuccess("Registration successful! Please login.");
      setTimeout(() => {
        if (typeof onLoginClick === "function") {
          onLoginClick();
        }
      }, 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Registration failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
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
        <h2 className="text-xl font-semibold text-gray-800">Create Account</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
      
        
       
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              value={form.full_name}
              onChange={handleChange}
              required
              maxLength={100}
            />
          </div>
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Choose a username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              value={form.username}
              onChange={handleChange}
              required
              maxLength={50}
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="your.email@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              value={form.email}
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
                placeholder="Minimum 6 characters"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors pr-12"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
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
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              placeholder="Your contact number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              value={form.phone}
              onChange={handleChange}
              required
            />
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
                Creating Account...
              </span>
            ) : "Create Account"}
          </button>
          
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}
        </form>
      

      </div>
    </div>
  );
}