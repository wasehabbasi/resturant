
const CategoryBar = ({
  categories,
  activeCategory,
  setActiveCategory,
}) => {
  return (
    <div className="category-bar">
      <button
        className={activeCategory === "all" ? "selected" : ""}
        onClick={() => setActiveCategory("all")}
      >
        All Items
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          className={
            activeCategory === category.id ? "selected" : ""
          }
          onClick={() => setActiveCategory(category.id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryBar;
