
import { Plus } from "lucide-react";

const API_SERVER = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

const FoodCard = ({ product, onAdd }) => {
  const imageUrl = product.image
    ? `${API_SERVER}${product.image}`
    : null;

  return (
    <div className="food-card">

      {imageUrl ? (
        <img
          src={imageUrl}
          alt={product.name}
          className="food-image"
        />
      ) : (
        <div className="food-placeholder">
          No Image
        </div>
      )}

      <div className="food-details">
        <h3>{product.name}</h3>

        <p>
          {product.description || "Fresh and delicious food"}
        </p>

        <div className="food-bottom">
          <strong>
            Rs. {Number(product.price).toLocaleString("en-PK")}
          </strong>

          <button onClick={() => onAdd(product)}>
            <Plus size={17} />
            Add
          </button>
        </div>
      </div>

    </div>
  );
};

export default FoodCard;
