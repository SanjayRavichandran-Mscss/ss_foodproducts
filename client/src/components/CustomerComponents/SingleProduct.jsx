import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, Plus, Minus, Star, Truck, Shield, RotateCcw, ZoomIn, Check } from "lucide-react";

// Below: Pure CSS for magnifier
const magnifierStyles = `
.single-product-magnifier-container {
  position: relative;
  overflow: hidden;
}

.single-product-magnifier-main-img {
  width: 100%;
  height: 24rem; /* 384px */
  object-fit: contain;
  display: block;
}

.single-product-magnifier-lens {
  pointer-events: none;
  position: absolute;
  z-index: 20;
  border-radius: 50%;
  box-shadow: 0 2px 12px 2px #0003;
  width: 160px;
  height: 160px;
  background-repeat: no-repeat;
  background-size: 200% 200%;
  display: none;
}

.single-product-magnifier-container:hover .single-product-magnifier-lens {
  display: block;
}

@media (max-width: 768px) {
  .single-product-magnifier-main-img {
    height: 16rem;
  }
  .single-product-magnifier-lens {
    width: 100px;
    height: 100px;
  }
}
`;

export default function SingleProduct({
  productId,
  isLoggedIn,
  customerId,
  cartItems,
  fetchCart,
  wishlist,
  handleToggleWishlist,
  showMessage,
}) {
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Magnifier State
  const [magnifierVisible, setMagnifierVisible] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });

  const imageRef = useRef(null);

  useEffect(() => {
    if (!productId) {
      setError("Invalid product ID");
      setLoading(false);
      return;
    }
    const idNum = parseInt(productId, 10);
    if (isNaN(idNum)) {
      setError("Invalid product ID");
      setLoading(false);
      return;
    }
    axios
      .get(`http://localhost:5000/api/admin/products/${idNum}`, {
        headers: { Origin: "http://localhost:5173" },
      })
      .then((res) => {
        setProduct({ ...res.data, price: parseFloat(res.data.price) });
        setLoading(false);
      })
      .catch(() => {
        setError("Product not found");
        setLoading(false);
      });
  }, [productId]);

  useEffect(() => {
    if (product) {
      const cartItem = cartItems.find((item) => item.product_id === product.id);
      setQuantity(cartItem ? cartItem.quantity : 1);
    }
  }, [cartItems, product]);

  const handleUpdateQuantity = (change) => {
    if (!isLoggedIn) {
      showMessage("Please login to manage your cart");
      return;
    }
    const newQuantity = Math.max(1, quantity + change);
    if (newQuantity > product.stock_quantity) {
      showMessage(`Only ${product.stock_quantity} items available in stock`);
      return;
    }
    setQuantity(newQuantity);

    const item = cartItems.find((item) => item.product_id === product.id);
    if (item) {
      axios
        .put(
          "http://localhost:5000/api/customer/cart",
          { customerId, productId: product.id, quantity: newQuantity },
          { headers: { Origin: "http://localhost:5173" } }
        )
        .then(() => {
          fetchCart();
          showMessage("Cart updated successfully");
        })
        .catch(() => showMessage("Failed to update cart"));
    } else {
      axios
        .post(
          "http://localhost:5000/api/customer/cart",
          { customerId, productId: product.id, quantity: newQuantity },
          { headers: { Origin: "http://localhost:5173" } }
        )
        .then(() => {
          fetchCart();
          showMessage("Product added to cart");
        })
        .catch(() => showMessage("Failed to add to cart"));
    }
  };

  const handleBuyNow = () => {
    if (!isLoggedIn) {
      showMessage("Please login to proceed with purchase");
      return;
    }
    console.log("order method: buy_now");
    const encodedCustomerId = btoa(customerId);
    const item = cartItems.find((item) => item.product_id === product.id);
    if (!item) {
      axios
        .post(
          "http://localhost:5000/api/customer/cart",
          { customerId, productId: product.id, quantity },
          { headers: { Origin: "http://localhost:5173" } }
        )
        .then(() => {
          fetchCart();
          navigate(`/checkout?customerId=${encodedCustomerId}&identifier=buy_now`, {
            state: { product: { ...product, quantity }, orderMethod: "buy_now" },
          });
        })
        .catch(() => showMessage("Failed to proceed with purchase"));
    } else {
      navigate(`/checkout?customerId=${encodedCustomerId}&identifier=buy_now`, {
        state: { product: { ...product, quantity }, orderMethod: "buy_now" },
      });
    }
  };

  const handleBack = () => {
    const encodedCustomerId = btoa(customerId || "");
    navigate(`/customer?customerId=${encodedCustomerId}`);
  };

  // CSS-only magnifier positioning: show on hover at cursor position
  const handleImageMouseEnter = (e) => {
    setMagnifierVisible(true);
    handleImageMouseMove(e);
  };

  const handleImageMouseMove = (e) => {
    if (!imageRef.current) return;
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    let x = e.clientX - left;
    let y = e.clientY - top;

    // Clamp lens center inside image bounds
    const lensRadius = 80; // lens is 160x160px
    x = Math.max(lensRadius, Math.min(x, width - lensRadius));
    y = Math.max(lensRadius, Math.min(y, height - lensRadius));
    setMagnifierPos({ x, y });
  };

  const handleImageMouseLeave = () => {
    setMagnifierVisible(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }
  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg max-w-md mx-auto">
          {error || "Product not found"}
        </div>
        <button
          onClick={handleBack}
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Back to Products
        </button>
      </div>
    );
  }

  const allImages = [product.thumbnail_url, ...(product.additional_images || [])];
  const isLiked = wishlist.includes(product.id);
  const cartItem = cartItems.find((item) => item.product_id === product.id);
  const inCart = Boolean(cartItem);

  // Lens offset for background position
  const imgSrc = allImages[selectedImage] || "https://via.placeholder.com/600";
  const lensSize = 160; // px (diameter)
  const lensRadius = lensSize / 2;
  const backgroundSize = 2; // 2x zoom
  let bgX = 0, bgY = 0;
  if (imageRef.current) {
    const { width, height } = imageRef.current.getBoundingClientRect();
    bgX = ((magnifierPos.x / width) * 100);
    bgY = ((magnifierPos.y / height) * 100);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Inline magnifier CSS */}
      <style>{magnifierStyles}</style>
      <button
        onClick={handleBack}
        className="mb-6 text-green-600 hover:text-green-800 font-medium flex items-center gap-1 transition-colors"
      >
        &larr; Back to Products
      </button>
      <div className="grid md:grid-cols-2 gap-8 bg-white rounded-xl shadow-md p-6">
        {/* Product Images Section */}
        <div className="relative">
          <div className="flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbnail Images */}
            <div className="flex md:flex-col gap-2 order-2 md:order-1">
              {allImages.map((img, index) => (
                <div
                  key={index}
                  className={`w-16 h-16 border-2 rounded-md overflow-hidden cursor-pointer transition-all ${
                    selectedImage === index ? "border-green-500" : "border-gray-200"
                  }`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img
                    src={img || "https://via.placeholder.com/150"}
                    alt={`${product.name} view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            {/* Main Image + Magnifier */}
            <div
              className="single-product-magnifier-container order-1 md:order-2 flex-1"
              ref={imageRef}
              onMouseEnter={handleImageMouseEnter}
              onMouseMove={handleImageMouseMove}
              onMouseLeave={handleImageMouseLeave}
            >
              <img
                src={imgSrc}
                alt={product.name}
                className="single-product-magnifier-main-img"
              />
              {magnifierVisible && (
                <div
                  className="single-product-magnifier-lens"
                  style={{
                    top: magnifierPos.y - lensRadius,
                    left: magnifierPos.x - lensRadius,
                    backgroundImage: `url(${imgSrc})`,
                    backgroundSize: `${backgroundSize * 100}% ${backgroundSize * 100}%`,
                    backgroundPosition: `${bgX}% ${bgY}%`,
                  }}
                />
              )}
            </div>
          </div>
        </div>
        {/* Product Details Section */}
        <div className="py-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          {/* Ratings */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < 4 ? "fill-current" : ""}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">(42 reviews)</span>
            <span className="text-sm text-green-600 ml-4 font-medium">In Stock</span>
          </div>

          {/* Price */}
          <div className="mb-6">
            <span className="text-3xl font-bold text-green-700">₹{product.price.toLocaleString()}</span>
            {product.original_price && product.original_price > product.price && (
              <>
                <span className="text-lg text-gray-500 line-through ml-2">
                  ₹{product.original_price.toLocaleString()}
                </span>
                <span className="text-sm bg-green-100 text-green-800 font-medium ml-2 px-2 py-1 rounded">
                  {Math.round((1 - product.price / product.original_price) * 100)}% OFF
                </span>
              </>
            )}
          </div>
          {/* Description */}
          <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
          {/* Highlights */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Highlights</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-2"><Check size={14} className="text-green-600" /> Premium quality materials</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-green-600" /> Eco-friendly production</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-green-600" /> 1-year warranty included</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-green-600" /> Free shipping on orders above ₹999</li>
            </ul>
          </div>
          {/* Quantity Selector */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Quantity</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => handleUpdateQuantity(-1)}
                  disabled={quantity <= 1}
                  className={`px-3 py-2 text-gray-600 hover:bg-gray-100 ${quantity <= 1 ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center py-2 text-lg font-medium">{quantity}</span>
                <button
                  onClick={() => handleUpdateQuantity(1)}
                  disabled={quantity >= product.stock_quantity}
                  className={`px-3 py-2 text-gray-600 hover:bg-gray-100 ${quantity >= product.stock_quantity ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <Plus size={16} />
                </button>
              </div>
              <span className="text-sm text-gray-500">{product.stock_quantity} available</span>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={handleBuyNow}
              disabled={!isLoggedIn || product.stock_quantity === 0}
              className={`flex-1 py-3 px-6 rounded-md font-medium transition-colors flex items-center justify-center gap-2
                ${!isLoggedIn || product.stock_quantity === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"}`}
            >
              Buy Now
            </button>
            <button
              onClick={() => handleUpdateQuantity(inCart ? 0 : 1)}
              disabled={!isLoggedIn || product.stock_quantity === 0}
              className={`flex-1 py-3 px-6 rounded-md font-medium transition-colors flex items-center justify-center gap-2 border border-green-600
                ${!isLoggedIn || product.stock_quantity === 0
                  ? "text-gray-500 border-gray-300 cursor-not-allowed"
                  : inCart
                    ? "bg-green-50 text-green-700 hover:bg-green-100"
                    : "bg-white text-green-600 hover:bg-green-50"}`}
            >
              <ShoppingCart size={20} />
              {inCart ? "Added to Cart" : "Add to Cart"}
            </button>
            <button
              onClick={() => handleToggleWishlist(product.id)}
              className="p-3 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
              title={isLiked ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                size={20}
                className={isLiked ? "text-red-500 fill-red-500" : "text-gray-600"}
              />
            </button>
          </div>
          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 border-t border-gray-200 pt-6">
            <div className="text-center">
              <Truck className="mx-auto text-green-600 mb-2" size={24} />
              <p className="text-xs text-gray-600">Free Shipping</p>
            </div>
            <div className="text-center">
              <Shield className="mx-auto text-green-600 mb-2" size={24} />
              <p className="text-xs text-gray-600">Secure Payment</p>
            </div>
            <div className="text-center">
              <RotateCcw className="mx-auto text-green-600 mb-2" size={24} />
              <p className="text-xs text-gray-600">Easy Returns</p>
            </div>
          </div>
        </div>
      </div>
      {/* Additional Information Section */}
      <div className="mt-12 bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Details</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Specifications</h3>
            <table className="w-full text-sm text-gray-600">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2 font-medium">Category</td>
                  <td className="py-2">{product.category_name}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 font-medium">SKU</td>
                  <td className="py-2">PRD-{product.id.toString().padStart(4, "0")}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 font-medium">Weight</td>
                  <td className="py-2">0.5 kg</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 font-medium">Dimensions</td>
                  <td className="py-2">10 × 5 × 3 cm</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Shipping & Returns</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <Truck size={16} className="text-green-600 mt-0.5" />
                <span>Free standard shipping on orders over ₹999</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">•</span>
                <span>Estimated delivery: 3-5 business days</span>
              </li>
              <li className="flex items-start gap-2">
                <RotateCcw size={16} className="text-green-600 mt-0.5" />
                <span>30-day easy returns policy</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}