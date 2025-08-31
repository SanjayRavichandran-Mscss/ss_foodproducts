import React, { useEffect, useState } from "react";
import axios from "axios";
import { ShoppingCart, Heart } from "lucide-react";

export default function Products({ isLoggedIn }) {
  const [products, setProducts] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/admin/products")
      .then((res) => {
        setProducts(res.data);
        // Extract unique categories from the API response
        const uniqueCategories = [
          ...new Set(res.data.map((product) => product.category_name)),
        ];
        setCategories([{ label: "All Products", value: "all" }, ...uniqueCategories.map(cat => ({
          label: cat,
          value: cat.toLowerCase()
        }))]);
        setLoading(false);
      })
      .catch(() => {
        setErr("Failed to load products");
        setLoading(false);
      });
  }, []);

  const handleAddToCart = (productId) => {
    if (!isLoggedIn) {
      alert("Please login to add items to cart");
      return;
    }
    console.log("Add to cart:", productId);
  };

  const handleAddToWishlist = (productId) => {
    if (!isLoggedIn) {
      alert("Please login to add items to wishlist");
      return;
    }
    console.log("Add to wishlist:", productId);
  };

  // Filter products by selected category
  const filteredProducts =
    category === "all"
      ? products
      : products.filter(
          (p) => p.category_name.toLowerCase() === category
        );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-600">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <section>
        <h2 className="text-2xl font-bold mb-5 mt-4">Shop by Category</h2>
        {/* Category Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold shadow-sm text-md transition
                ${category === cat.value ? 'bg-green-500 text-white' : 'bg-white text-gray-800 border'}
                hover:bg-green-100`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {/* Product Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                product={product}
                key={product.id}
                isLoggedIn={isLoggedIn}
                handleAddToCart={handleAddToCart}
                handleAddToWishlist={handleAddToWishlist}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-600 col-span-4">
              No products available in this category.
            </div>
          )}
        </div>
      </section>
      {err && <p className="text-red-500 text-center mt-8 mb-4">{err}</p>}
    </div>
  );
}

function ProductCard({ product, isLoggedIn, handleAddToCart, handleAddToWishlist }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border">
      <div className="relative">
        <img
          src={product.thumbnail_url || "https://via.placeholder.com/300"}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
        <button
          onClick={() => handleAddToWishlist(product.id)}
          className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors z-10"
          title="Add to wishlist"
        >
          <Heart size={16} className="text-gray-600" />
        </button>
      </div>
      <div className="p-4">
        <p className="uppercase text-xs text-gray-500 font-semibold">
          {product.category_name || "Category"}
        </p>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{product.name}</h3>
        <span className="font-bold text-green-600 text-xl mb-1 block">
          ₹{product.price}
        </span>
        <span className="text-xs text-gray-500 block mb-2">
          {product.description || 'per item'}
        </span>
        <button
          onClick={() => handleAddToCart(product.id)}
          disabled={!isLoggedIn || product.stock_quantity === 0}
          className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors mt-2
            ${!isLoggedIn || product.stock_quantity === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'}`}
        >
          <ShoppingCart size={16} />
          {!isLoggedIn ? 'Login to Add' : product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}











