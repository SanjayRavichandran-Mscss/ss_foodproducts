import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { LogIn, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function AdminLogin({ onCustomerLoginClick, onClose }) {
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  console.log("AdminLogin rendered, onCustomerLoginClick:", typeof onCustomerLoginClick, "onClose:", typeof onClose);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Submitting admin login with:", form.login);
      const res = await axios.post("http://localhost:5000/api/admin/login", form);

      if (!res.data || !res.data.token || !res.data.adminId) {
        console.error("Admin login response invalid:", res.data);
        setError("Login failed. Please try again.");
        setLoading(false);
        return;
      }

      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminId", res.data.adminId);
      const encodedAdminId = btoa(res.data.adminId);

      console.log("Admin login successful, navigating to /admin/dashboard?adminId=", encodedAdminId);
      navigate(`/admin/dashboard?adminId=${encodedAdminId}`, { replace: true });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Login failed, cannot connect to backend.";
      console.error("Admin login error:", errorMessage, err);
      setError(errorMessage);
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
        <h2 className="text-xl font-semibold text-gray-800">Admin Login</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        <img
          src="/Assets/Suyambu_Eng_logo.png"
          alt="Suyambu Stores Logo"
          className="h-16 w-auto mb-6"
        />
        <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
          <div>
            <label htmlFor="login" className="block text-sm font-medium text-gray-700 mb-1">
              Username or Email
            </label>
            <input
              id="login"
              name="login"
              type="text"
              placeholder="Username or email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12"
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

      

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <LogIn size={18} className="mr-2" />
                Sign in
              </span>
            )}
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