# Shopping List API

A Node.js Express application with MongoDB for managing shopping lists. Users can register, login, create multiple shopping lists, and manage products within those lists.

## Features

- User registration and authentication (JWT)
- MongoDB database in Docker (custom port 27018)
- Mongo Express for database management
- Create multiple shopping lists per user
- Add products to lists with optional images
- Update and delete products
- Delete entire shopping lists
- Image upload support for products

## Prerequisites

- Node.js (v14 or higher)
- Docker and Docker Compose
- npm or yarn

## Installation

1. Clone the repository and navigate to the project directory

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file from the example:

```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration (especially JWT_SECRET)

5. Start the Express server:

```bash
npm start
```

For development with auto-reload (automatically starts Docker Compose):

```bash
npm run dev
```

**Note:** The `npm run dev` command automatically starts MongoDB and Mongo Express using Docker Compose. If you're using `npm start`, make sure Docker containers are already running by executing `docker-compose up -d` separately.

## Environment Variables

The `.env` file contains the following variables:

- `PORT` - Server port (default: 3000)
- `MONGO_URI` - MongoDB connection string
- `MONGO_ROOT_USERNAME` - MongoDB root username
- `MONGO_ROOT_PASSWORD` - MongoDB root password
- `MONGO_EXPRESS_USERNAME` - Mongo Express username
- `MONGO_EXPRESS_PASSWORD` - Mongo Express password
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRE` - JWT token expiration time
- `UPLOAD_PATH` - Directory for uploaded images
- `MAX_FILE_SIZE` - Maximum file size for uploads (in bytes)

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Shopping Lists

- `GET /api/shopping-lists` - Get all shopping lists (protected)
- `GET /api/shopping-lists/:id` - Get single shopping list (protected)
- `POST /api/shopping-lists` - Create new shopping list (protected)
- `DELETE /api/shopping-lists/:id` - Delete shopping list (protected)

### Products

- `POST /api/shopping-lists/:listId/products` - Add product to list (protected)
- `PUT /api/shopping-lists/:listId/products/:productId` - Update product (protected)
- `DELETE /api/shopping-lists/:listId/products/:productId` - Delete product (protected)

## Testing

Use the `request.rest` file with REST Client extension in VS Code, or import it into Postman/Insomnia.

1. First, register a user or login to get a JWT token
2. Copy the token and replace `{{token}}` in the request.rest file
3. Use the list and product IDs from responses to test other endpoints

## Database Access

- MongoDB: `localhost:27018` (custom port to avoid conflict with local MongoDB)
- Mongo Express: `http://localhost:8081` (web interface for viewing data)

## Project Structure

```
.
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   └── shoppingListController.js  # Shopping list logic
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   └── upload.js            # File upload middleware
├── models/
│   ├── User.js              # User model
│   └── ShoppingList.js      # Shopping list model
├── routes/
│   ├── authRoutes.js        # Authentication routes
│   └── shoppingListRoutes.js # Shopping list routes
├── uploads/                 # Uploaded images (created automatically)
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore file
├── docker-compose.yml       # Docker configuration
├── package.json             # Dependencies
├── request.rest             # API testing file
├── server.js                # Main server file
└── README.md                # This file
```

## Notes

- The MongoDB container uses port 27018 on the host to avoid conflicts with a local MongoDB installation
- Images are stored in the `uploads/` directory
- JWT tokens are used for authentication
- All shopping list and product routes require authentication
