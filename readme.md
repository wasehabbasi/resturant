Restaurant Management System – Project Status
Current progress

Development ongoing
Order backend setup complete
Frontend dashboard ki actual testing abhi baqi hai.

1. Ab tak complete kiye gaye features
Implemented / configured
Customer side
QR code ke through restaurant table ka menu open hona.

Table QR token verification.

Menu categories aur products display.

Products cart mein add karna.

Cart mein quantity increase/decrease.

Checkout page.

Customer name enter karna.

Guest ID generate karna.

Backend ko order submit karna.

Order successfully place hone ka confirmation.

Same table ke shared orders fetch karne ka backend.

Different browsers (normal/incognito) ke guests ki separate identity.

Backend
Sequelize Order model.

OrderItem model.

RestaurantTable aur Order relationship.

Order aur OrderItem relationship.

Product aur OrderItem relationship.

Shared order placement controller.

Shared orders fetch controller.

Database transaction ke through order placement.

Database se product prices verify karna.

Order total calculate karna.

Order status management ke liye backend controller.

Manager orders fetch API.

Manager order status update API.

JWT authentication middleware.

Manager/admin role authorization.

CORS configuration fix.

API routes registration.

Manager side
Manager login page pehle se project mein maujood hai.

JWT token API requests ke saath attach ho raha hai.

Orders dashboard ke backend routes configure ho gaye hain.

orderController.js create ho gaya hai.