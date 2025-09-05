import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, Plus, Minus } from "lucide-react";

export default function Products({ isLoggedIn, customerId, cartItems, setCartItems, fetchCart, wishlist, handleToggleWishlist, showMessage }) {
  const [products, setProducts] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    console.log("Products useEffect triggered");
    axios
      .get("http://localhost:5000/api/admin/products", {
        headers: { "Origin": "http://localhost:5173" },
      })
      .then((res) => {
        console.log("Products data fetched", res.data);
        setProducts(res.data || []);
        const uniqueCategories = [...new Set(res.data.map((product) => product.category_name))];
        setCategories([{ label: "All Products", value: "all" }, ...uniqueCategories.map(cat => ({
          label: cat,
          value: cat.toLowerCase()
        }))]);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Products fetch error", error);
        setErr("Failed to load products");
        setLoading(false);
      });
  }, []);

  const handleAddToCart = (productId, quantity = 1) => {
    if (!isLoggedIn) {
      return;
    }
    if (!customerId) {
      console.error("No customerId available");
      return;
    }
    console.log("Adding to cart", { customerId, productId, quantity });
    axios
      .post(
        "http://localhost:5000/api/customer/cart",
        { customerId, productId, quantity },
        { headers: { "Origin": "http://localhost:5173" } }
      )
      .then(() => {
        console.log("Added to cart successfully");
        fetchCart();
      })
      .catch((err) => console.error("Failed to add to cart:", err));
  };

  const updateQuantity = (productId, change) => {
    const item = cartItems.find((item) => item.product_id === productId);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + change);
      axios
        .put(
          "http://localhost:5000/api/customer/cart",
          { customerId, productId, quantity: newQuantity },
          { headers: { "Origin": "http://localhost:5173" } }
        )
        .then(() => fetchCart())
        .catch((err) => console.error("Failed to update quantity:", err));
    } else {
      handleAddToCart(productId, 1); // Add new item if not in cart
    }
  };

  const filteredProducts = products
    .filter(product =>
      category === "all" || product.category_name.toLowerCase() === category
    )
    .filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  console.log("Filtered products length", filteredProducts.length);

  if (loading) {
    console.log("Products loading state");
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-600">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <section id="shop-by-category">
        <h2 className="text-2xl font-bold mb-5 mt-4">Shop by Category</h2>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search for fresh groceries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2 lg:w-1/3 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex flex-wrap gap-4 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold shadow-sm text-md transition
                ${category === cat.value ? "bg-green-600 text-white" : "bg-white text-gray-800 border"}
                hover:bg-green-400 hover:text-white`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isLoggedIn={isLoggedIn}
                customerId={customerId}
                cartItems={cartItems}
                updateQuantity={updateQuantity}
                handleToggleWishlist={handleToggleWishlist}
                wishlist={wishlist}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-600 col-span-4">
              No products available in this category or search.
            </div>
          )}
        </div>
      </section>
      {err && <p className="text-red-500 text-center mt-8 mb-4">{err}</p>}
    </div>
  );
}

function ProductCard({
  product,
  isLoggedIn,
  customerId,
  cartItems,
  updateQuantity,
  handleToggleWishlist,
  wishlist
}) {
  const navigate = useNavigate();
  const cartItem = cartItems.find((item) => item.product_id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const isLiked = wishlist.includes(product.id);

  const handleViewProduct = () => {
    const encodedCustomerId = btoa(customerId || "");
    const encodedProductId = btoa(product.id.toString());
    navigate(`/customer?customerId=${encodedCustomerId}&productId=${encodedProductId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top after navigation
  };

  // Show badge for stock left if 5 or fewer items remain and it's not 0
  const showLowStockBadge = product.stock_quantity > 0 && product.stock_quantity <= 5;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200">
      <div className="relative">
        <img
          src={product.thumbnail_url || "https://via.placeholder.com/300"}
          alt={product.name}
          className="w-full h-48 object-cover cursor-pointer"
          onClick={handleViewProduct}
        />
        <button
          onClick={() => handleToggleWishlist(product.id)}
          className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors z-10"
          title="Toggle wishlist"
        >
          <Heart size={16} className={isLiked ? "text-red-500 fill-red-500" : "text-gray-600"} />
        </button>
        {showLowStockBadge && (
          <span className="absolute top-2 left-2 bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full shadow z-10 border border-red-300 animate-pulse">
            {product.stock_quantity} left
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="uppercase text-xs text-gray-500 font-semibold">
          {product.category_name || "Category"}
        </p>
        <h3
          className="text-lg font-medium text-gray-900 mb-2 cursor-pointer"
          onClick={handleViewProduct}
        >
          {product.name}
        </h3>
        <span className="font-bold text-green-600 text-xl mb-1 block">
          ₹{product.price}
        </span>
        {/* Description intentionally removed */}
        {isLoggedIn && product.stock_quantity > 0 ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateQuantity(product.id, -1)}
              disabled={quantity <= 0}
              className={`px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 ${quantity <= 0 ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center">{quantity}</span>
            <button
              onClick={() => updateQuantity(product.id, 1)}
              disabled={quantity >= product.stock_quantity}
              className={`px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 ${quantity >= product.stock_quantity ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <Plus size={16} />
            </button>
            <span className="ml-2 font-bold">
              ₹{(product.price * quantity).toFixed(2)}
            </span>
          </div>
        ) : (
          <button
            disabled={!isLoggedIn || product.stock_quantity === 0}
            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors mt-2
              ${!isLoggedIn || product.stock_quantity === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"}`}
          >
            <ShoppingCart size={16} />
            {!isLoggedIn
              ? "Login to Add"
              : product.stock_quantity === 0
              ? "Out of Stock"
              : "Add to Cart"}
          </button>
        )}
      </div>
    </div>
  );
}