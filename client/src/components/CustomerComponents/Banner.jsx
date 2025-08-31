import React from "react";
import { BadgeCheck, Truck, ShieldCheck, Leaf } from "lucide-react";

export default function Banner() {
  return (
    <section className="w-full bg-gradient-to-br from-green-100 via-green-50 to-green-200 mb-8 flex flex-col lg:flex-row items-center justify-between px-8 py-12 lg:py-16 shadow">
      {/* Left Section */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Tag */}
        <div className="flex items-center mb-4">
          <span className="bg-white font-semibold text-green-600 flex items-center gap-2 px-4 py-2 rounded-lg text-sm shadow">
            <Leaf size={18} className="text-green-500" />
            100% Organic & Fresh
          </span>
        </div>
        {/* Main Heading */}
        <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-2 leading-tight">
          Fresh Groceries<br />
          <span className="text-green-600">Delivered Daily</span>
        </h1>
        {/* Subtext */}
        <p className="text-gray-700 mb-6 text-lg max-w-xl">
          Farm-fresh organic produce, dairy, and pantry essentials delivered straight to your door. Quality you can taste, freshness you can trust.
        </p>
        {/* Buttons */}
        <div className="flex gap-4 mb-10">
          <button className="bg-green-600 hover:bg-green-700 transition text-white px-6 py-3 rounded-md font-semibold flex items-center gap-2 shadow">
            Shop Now
            <BadgeCheck size={20} />
          </button>
          <button className="bg-white hover:bg-green-100 transition text-gray-900 px-6 py-3 rounded-md font-semibold shadow border border-green-200 flex items-center gap-2">
            Browse Categories
          </button>
        </div>
        {/* Features */}
        <div className="flex gap-6 mt-4 flex-wrap">
          <div className="flex flex-col items-center">
            <Truck size={28} className="text-green-500 mb-2" />
            <span className="font-semibold text-gray-900">Free Delivery</span>
            <span className="text-xs text-gray-500">On orders $50+</span>
          </div>
          <div className="flex flex-col items-center">
            <ShieldCheck size={28} className="text-green-500 mb-2" />
            <span className="font-semibold text-gray-900">Quality Guarantee</span>
            <span className="text-xs text-gray-500">100% Fresh</span>
          </div>
          <div className="flex flex-col items-center">
            <Leaf size={28} className="text-green-500 mb-2" />
            <span className="font-semibold text-gray-900">Organic Certified</span>
            <span className="text-xs text-gray-500">Farm Fresh</span>
          </div>
        </div>
      </div>
      {/* Right Section - Image with animation */}
      <div className="flex-1 flex justify-center items-center relative mt-8 lg:mt-0">
        <div
          className="rounded-2xl overflow-hidden shadow-lg animate-banner-bounce"
          style={{ width: "420px", height: "340px" }}
        >
          <img
            src="/Assets/BannerImg.jpg"
            alt="Fresh groceries"
            className="object-cover w-full h-full"
          />
        </div>
        {/* Card over image (bottom-right) */}
        <div className="absolute right-6 bottom-8 bg-white rounded-xl shadow-lg px-6 py-4 flex items-center gap-3">
          <Leaf size={28} className="text-orange-400" />
          <div>
            <div className="font-bold text-gray-900">500+ Products</div>
            <div className="text-sm text-gray-500">Fresh & Organic</div>
          </div>
        </div>
      </div>
      {/* Animation */}
      <style>
        {`
          @keyframes banner-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-18px); }
          }
          .animate-banner-bounce {
            animation: banner-bounce 4s ease-in-out infinite;
          }
        `}
      </style>
    </section>
  );
}
