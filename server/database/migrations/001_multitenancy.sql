-- 1. Restaurants
CREATE TABLE Restaurants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    logo VARCHAR(500) NULL,
    portalTheme JSON NULL,
    customerTheme JSON NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 2. Branches
CREATE TABLE Branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurantId INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    phone VARCHAR(30) NULL,
    isDefault BOOLEAN NOT NULL DEFAULT FALSE,
    isActive BOOLEAN NOT NULL DEFAULT TRUE,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,

    UNIQUE KEY unique_restaurant_branch_name (restaurantId, name),

    CONSTRAINT fk_branches_restaurant
        FOREIGN KEY (restaurantId)
        REFERENCES Restaurants(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 3. Branch-specific product overrides
CREATE TABLE BranchProducts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branchId INT NOT NULL,
    productId INT NOT NULL,
    priceOverride DECIMAL(10,2) NULL,
    isAvailable BOOLEAN NULL,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,

    UNIQUE KEY unique_branch_product (branchId, productId),

    CONSTRAINT fk_branchproducts_branch
        FOREIGN KEY (branchId)
        REFERENCES Branches(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_branchproducts_product
        FOREIGN KEY (productId)
        REFERENCES Products(id)
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 4. Add restaurant ownership to existing records
ALTER TABLE users
    ADD COLUMN restaurantId INT NULL;

ALTER TABLE Categories
    ADD COLUMN restaurantId INT NULL;

ALTER TABLE Products
    ADD COLUMN restaurantId INT NULL;

ALTER TABLE RestaurantTables
    ADD COLUMN branchId INT NULL;

ALTER TABLE Orders
    ADD COLUMN branchId INT NULL;


-- 5. Create a legacy restaurant for existing data
INSERT INTO Restaurants (
    name,
    slug,
    status,
    createdAt,
    updatedAt
)
VALUES (
    'Existing Restaurant',
    'existing-restaurant',
    'active',
    NOW(),
    NOW()
);

SET @restaurantId = LAST_INSERT_ID();


-- 6. Create its default branch
INSERT INTO Branches (
    restaurantId,
    name,
    isDefault,
    isActive,
    createdAt,
    updatedAt
)
VALUES (
    @restaurantId,
    'Main Branch',
    TRUE,
    TRUE,
    NOW(),
    NOW()
);

SET @branchId = LAST_INSERT_ID();


-- 7. Assign existing data to the legacy restaurant
UPDATE users
SET restaurantId = @restaurantId
WHERE restaurantId IS NULL;

UPDATE Categories
SET restaurantId = @restaurantId
WHERE restaurantId IS NULL;

UPDATE Products
SET restaurantId = @restaurantId
WHERE restaurantId IS NULL;

UPDATE RestaurantTables
SET branchId = @branchId
WHERE branchId IS NULL;

UPDATE Orders
SET branchId = @branchId
WHERE branchId IS NULL;


-- 8. Enforce required ownership
ALTER TABLE users
    MODIFY restaurantId INT NOT NULL;

ALTER TABLE Categories
    MODIFY restaurantId INT NOT NULL;

ALTER TABLE Products
    MODIFY restaurantId INT NOT NULL;

ALTER TABLE RestaurantTables
    MODIFY branchId INT NOT NULL;

ALTER TABLE Orders
    MODIFY branchId INT NOT NULL;


-- 9. Add foreign keys
ALTER TABLE users
    ADD CONSTRAINT fk_users_restaurant
    FOREIGN KEY (restaurantId)
    REFERENCES Restaurants(id)
    ON DELETE RESTRICT;

ALTER TABLE Categories
    ADD CONSTRAINT fk_categories_restaurant
    FOREIGN KEY (restaurantId)
    REFERENCES Restaurants(id)
    ON DELETE RESTRICT;

ALTER TABLE Products
    ADD CONSTRAINT fk_products_restaurant
    FOREIGN KEY (restaurantId)
    REFERENCES Restaurants(id)
    ON DELETE RESTRICT;

ALTER TABLE RestaurantTables
    ADD CONSTRAINT fk_tables_branch
    FOREIGN KEY (branchId)
    REFERENCES Branches(id)
    ON DELETE RESTRICT;

ALTER TABLE Orders
    ADD CONSTRAINT fk_orders_branch
    FOREIGN KEY (branchId)
    REFERENCES Branches(id)
    ON DELETE RESTRICT;