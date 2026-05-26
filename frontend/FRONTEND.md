# Frontend Documentation: Supply Chain Management Platform

## Overview
This document describes the frontend implementation of the ML-powered Supply Chain Management SaaS Platform. The frontend is built with modern React, TypeScript, and Tailwind CSS, consuming the backend APIs to provide a comprehensive user interface for supply chain management.

## Project Structure
```
frontend/
├── src/
│   ├── pages/                 # Individual page components
│   │   ├── LoginPage.tsx     # Authentication login page
│   │   ├── RegisterPage.tsx  # User registration page
│   │   ├── DashboardPage.tsx # Executive dashboard
│   │   ├── InventoryPage.tsx # Inventory management
│   │   ├── DemandPlanningPage.tsx # Demand forecasting
│   │   ├── SupplierPage.tsx  # Supplier management
│   │   ├── InsightsPage.tsx  # ML insights and recommendations
│   │   └── SettingsPage.tsx  # User settings
│   ├── components/            # Reusable UI components
│   │   ├── Button.tsx        # Custom button component
│   │   ├── Card.tsx          # Card UI component
│   │   └── ProtectedRoute.tsx # Authentication guard
│   ├── layouts/               # Layout components
│   │   └── Layout.tsx        # Main application layout
│   ├── context/               # React contexts
│   │   └── AuthContext.tsx   # Authentication context
│   ├── services/              # API services
│   │   └── apiService.ts     # API service layer
│   ├── hooks/                 # Custom React hooks (empty)
│   ├── utils/                 # Utility functions (empty)
│   ├── styles/                # Style files (empty)
│   ├── assets/                # Static assets
│   ├── App.tsx               # Main application component
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── public/                   # Public assets
├── package.json              # Project dependencies
├── tailwind.config.js        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite configuration
```

## Pages & Features

### Authentication Pages
- **Login Page**: Secure login with email/password
- **Register Page**: User registration with company details

### Core Application Pages
- **Dashboard**: Executive view with KPIs and action-required insights
- **Inventory Management**: Product listing with stock level indicators
- **Demand Planning**: Forecasting charts and reorder recommendations
- **Supplier Management**: Supplier list with performance metrics
- **Insights & Recommendations**: ML-generated insights with explanations and actions
- **Settings**: User and company configuration

## API Service Layer

The application uses a centralized API service (`src/services/apiService.ts`) that provides:

### Authentication Endpoints
- `authAPI.login()` - User login
- `authAPI.register()` - User registration
- `authAPI.getCurrentUser()` - Get current user info
- `authAPI.logout()` - User logout

### Inventory Endpoints
- `inventoryAPI.getProducts()` - Get all products
- `inventoryAPI.getProductById()` - Get product by ID
- `inventoryAPI.createProduct()` - Create new product
- `inventoryAPI.updateProduct()` - Update product
- `inventoryAPI.deleteProduct()` - Delete product
- `inventoryAPI.getInventoryItems()` - Get inventory items
- `inventoryAPI.getInventoryItemById()` - Get inventory item by ID
- `inventoryAPI.createInventoryItem()` - Create inventory item
- `inventoryAPI.updateInventoryItem()` - Update inventory item
- `inventoryAPI.deleteInventoryItem()` - Delete inventory item

### Supplier Endpoints
- `supplierAPI.getSuppliers()` - Get all suppliers
- `supplierAPI.getSupplierById()` - Get supplier by ID
- `supplierAPI.createSupplier()` - Create new supplier
- `supplierAPI.updateSupplier()` - Update supplier
- `supplierAPI.deleteSupplier()` - Delete supplier
- `supplierAPI.getShipments()` - Get all shipments
- `supplierAPI.getShipmentById()` - Get shipment by ID
- `supplierAPI.createShipment()` - Create new shipment
- `supplierAPI.updateShipment()` - Update shipment
- `supplierAPI.deleteShipment()` - Delete shipment

### ML Endpoints
- `mlAPI.getInsights()` - Get ML-generated insights
- `mlAPI.getActionRequiredInsights()` - Get urgent insights
- `mlAPI.acknowledgeInsight()` - Acknowledge an insight
- `mlAPI.resolveInsight()` - Mark insight as resolved
- `mlAPI.runAnalysis()` - Run ML analysis
- `mlAPI.getPredictions()` - Get ML predictions
- `mlAPI.getDemandForecast()` - Get demand forecast
- `mlAPI.getInventoryRisk()` - Get inventory risk
- `mlAPI.getSupplierDelayRisk()` - Get supplier delay risk

### Order Endpoints
- `orderAPI.getOrders()` - Get all orders
- `orderAPI.getOrderById()` - Get order by ID
- `orderAPI.createOrder()` - Create new order
- `orderAPI.updateOrder()` - Update order
- `orderAPI.deleteOrder()` - Delete order

### Settings Endpoints
- `settingsAPI.getUserProfile()` - Get user profile
- `settingsAPI.updateProfile()` - Update user profile

## UI Components

### Button Component
Custom button with variants (primary, secondary, danger, ghost) and sizes (sm, md, lg).

### Card Component
Reusable card component for content sections with optional titles.

## Styling
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Lucide React**: Beautiful icon library
- **Recharts**: Declarative charting library for data visualization

## Security Features
- Token-based authentication with automatic refresh
- Protected routes using React Router
- Company-based data isolation enforced by backend
- Secure token storage in localStorage

## Data Flow
1. User authenticates via login/register
2. Authentication token stored in localStorage
3. Token automatically attached to API requests
4. Company-scoped data retrieved from backend
5. ML insights and predictions displayed to user
6. User actions (acknowledge, resolve) sent to backend

## Key Features

### Dashboard
- KPI cards showing total products, stock risks, supplier risks, cost anomalies
- "Action Required Today" section with urgent insights
- Clear call-to-action buttons

### Inventory Management
- Product listing with current stock levels
- Risk indicators (Normal, Overstock, Stockout)
- Drill-down capability to product details

### Demand Planning
- Historical demand vs forecasted demand charts
- Reorder recommendations based on ML predictions
- Lead time warnings

### Insights & Recommendations
- ML-generated insights grouped by category and severity
- Explanations of why insights exist
- Recommended actions to take
- Ability to acknowledge or resolve insights
- Confidence scores and priority levels

## Error Handling
- Network error handling with user-friendly messages
- Loading states during API calls
- Empty state handling for no data scenarios
- Authentication error handling with automatic logout

## Development
- TypeScript for type safety
- React Hooks for state management
- React Router for navigation
- Axios for HTTP requests
- Tailwind CSS for styling
- Vite for fast development server