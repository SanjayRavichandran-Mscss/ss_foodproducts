import React, { useState } from "react";
import axios from "axios";
import { UserPlus, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function CustomerRegister({ onLoginClick, onClose }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    phone: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const getPasswordStrength = (password) => {
    if (password.length < 6) return { level: "Weak", color: "text-red-500" };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength < 3) return { level: "Weak", color: "text-red-500" };
    if (strength < 5) return { level: "Medium", color: "text-yellow-500" };
    return { level: "Strong", color: "text-green-500" };
  };

  const strength = getPasswordStrength(form.password);
  const passwordsMatch = form.password === form.confirmPassword && form.password.length >= 6;

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    
    try {
      const { confirmPassword, ...registerData } = form;
      await axios.post("http://localhost:5000/api/customer/register", registerData);
      setSuccess("Registration successful! Please login.");
      setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          if (typeof onLoginClick === "function") {
            onLoginClick();
          }
          onClose();
          setIsClosing(false);
        }, 300); // Matches the animation duration
      }, 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Registration failed";
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
   <div className={`h-full flex flex-col bg-white transition-all duration-300 ease-in-out transform ${isClosing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
      <div className="flex items-center p-4 border-b">
        <button 
          onClick={() => {
            setIsClosing(true);
            setTimeout(() => {
              onClose();
              setIsClosing(false);
            }, 300);
          }}
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
                onCopy={e => e.preventDefault()}
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
            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm_password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors pr-12"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                onPaste={e => e.preventDefault()}
                onCopy={e => e.preventDefault()}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} className="text-gray-400" />
                ) : (
                  <Eye size={20} className="text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {form.password.length > 0 && (
              <p className={`text-sm font-medium ${strength.color}`}>
                Password Strength: {strength.level}
              </p>
            )}
            {form.confirmPassword.length > 0 && form.password !== form.confirmPassword && (
              <p className="text-sm text-red-500">
                Passwords do not match
              </p>
            )}
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
            disabled={loading || !passwordsMatch}
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