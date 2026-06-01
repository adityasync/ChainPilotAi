<p align="center">
  <img src="../frontend/public/favicon.png" alt="ChainPilot Logo" width="80" />
</p>

<h1 align="center">Frontend Guide</h1>

<p align="center">
  React component architecture, patterns, and development conventions.
</p>

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 7.x | Build tool & dev server |
| TailwindCSS | 3.x | Utility-first styling |
| React Router | 6.x | Client-side routing |
| Recharts | 2.x | SVG charts |
| Axios | 1.x | HTTP client |
| Lucide React | — | Icon library |

---

## Project Structure

```
frontend/src/
├── pages/                  # Route-level components
│   ├── LandingPage.tsx     # Marketing landing page
│   ├── LoginPage.tsx       # Authentication
│   ├── RegisterPage.tsx    # Registration
│   ├── DashboardPage.tsx   # KPIs, charts, insights
│   ├── InventoryPage.tsx   # Products & stock management
│   ├── OrdersPage.tsx      # Order CRUD
│   ├── SupplierPage.tsx    # Supplier cards & details
│   ├── DemandPlanningPage.tsx # Forecasting & patterns
│   ├── InsightsPage.tsx    # ML insights & predictions
│   ├── DataUploadPage.tsx  # CSV drag & drop
│   └── SettingsPage.tsx    # Profile & theme
├── components/
│   ├── Skeleton.tsx        # Skeleton loading primitives
│   ├── ProtectedRoute.tsx  # Auth route guard
│   ├── PaginationControls.tsx
│   ├── AskAI.tsx           # AI chat widget
│   ├── ErrorBoundary.tsx   # React error boundary
│   ├── AppLayout.tsx       # Sidebar + main content
│   └── landing/            # Landing page sections
├── context/
│   ├── AuthContext.tsx      # Auth state & JWT
│   └── ThemeContext.tsx     # Dark mode
├── services/
│   └── apiService.ts       # Axios API client
├── hooks/
│   └── usePagination.ts    # Pagination logic
└── styles/
    ├── variables.css       # CSS custom properties
    ├── animations.css      # Keyframes & animation classes
    ├── components.css      # Component styles
    └── index.css           # Global styles
```

---

## Routing

**File**: `src/App.tsx`

```tsx
<Routes>
  {/* Public */}
  <Route path="/" element={<LandingPage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />

  {/* Protected */}
  <Route element={<ProtectedRoute />}>
    <Route element={<AppLayout />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/inventory" element={<InventoryPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/suppliers" element={<SupplierPage />} />
      <Route path="/demand" element={<DemandPlanningPage />} />
      <Route path="/insights" element={<InsightsPage />} />
      <Route path="/upload-data" element={<DataUploadPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Route>
  </Route>

  <Route path="*" element={<Navigate to="/dashboard" />} />
</Routes>
```

---

## Authentication

### AuthContext

**File**: `src/context/AuthContext.tsx`

Provides auth state to the entire app:

```tsx
const { user, token, login, register, logout, isAuthenticated } = useAuth();
```

**Token management:**
- Stored in `localStorage` as `token`
- Attached to all requests via Axios interceptor
- Validated on app load via `GET /auth/me`
- Cleared on 401 response or logout

**Cross-tab sync:**
- Listens for `StorageEvent` to sync logout across browser tabs

### ProtectedRoute

**File**: `src/components/ProtectedRoute.tsx`

- Shows spinner while validating token
- Redirects to `/login` if not authenticated
- Saves intended location for post-login redirect

---

## API Client

**File**: `src/services/apiService.ts`

All API calls are organized by domain:

```tsx
// Auth
authAPI.login(email, password)
authAPI.register(email, password, companyName)
authAPI.getCurrentUser()
authAPI.logout()

// Inventory
inventoryAPI.getProducts(params)
inventoryAPI.createProduct(data)
inventoryAPI.getInventoryItems(params)

// Orders
orderAPI.getOrders(params)
orderAPI.createOrder(data)

// Suppliers
supplierAPI.getSuppliers(params)
supplierAPI.getSupplierDetail(id)

// Demand
demandAPI.getPortfolioSummary(period)
demandAPI.getDemandHistory(productId, period)
demandAPI.getForecastAccuracy(productId)

// ML
mlAPI.getInsights(params)
mlAPI.getActionRequiredInsights()
mlAPI.getInventoryRisk(productId)
mlAPI.getSupplierDelayRisk(supplierId)
mlAPI.runAnalysis()

// AI
aiAPI.chat(question)
aiAPI.generateInsights()
aiAPI.getSupplierNarrative(supplierId)
```

---

## Component Patterns

### Skeleton Loading

**File**: `src/components/Skeleton.tsx`

All data-fetching pages use skeleton placeholders instead of spinners:

```tsx
if (loading) {
  return (
    <div className="py-8 space-y-8">
      <SectionTitleSkeleton />
      <KPIGridSkeleton count={4} />
      <ChartSkeleton />
      <TableSkeleton rows={5} cols={5} />
    </div>
  );
}
```

Available skeleton components:
- `KPICardSkeleton` / `KPIGridSkeleton`
- `ChartSkeleton` / `PieSkeleton`
- `TableSkeleton`
- `CardGridSkeleton`
- `SearchSkeleton` / `FilterBarSkeleton`
- `SectionTitleSkeleton`
- `InsightCardSkeleton`
- `Bar` (base shimmer element)

### Floating Labels

Login and register pages use animated floating labels:

```tsx
<div className="relative">
  <label className={`absolute left-5 transition-all duration-200 ${
    focused || value
      ? 'top-1.5 text-xs text-[#0071e3]'
      : 'top-1/2 -translate-y-1/2 text-lg text-[#aeaeb2]'
  }`}>
    Email
  </label>
  <input
    className="w-full px-5 py-4 pt-6 ..."
    onFocus={() => setFocused(true)}
    onBlur={() => setFocused(false)}
  />
</div>
```

### Chart Tooltips

All charts use consistent tooltip styling:

```tsx
<Tooltip
  contentStyle={{
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    fontSize: 13,
    backgroundColor: '#fff',
    color: '#1d1d1f',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
  }}
  labelStyle={{ color: '#1d1d1f', fontWeight: 600, marginBottom: 4 }}
  itemStyle={{ color: '#1d1d1f' }}
/>
```

### KPI Cards

Dashboard and inventory pages use a shared `KPICard` component:

```tsx
<KPICard
  icon={<Package className="w-5 h-5" />}
  label="Total Products"
  value="45"
  subtitle="Tracked in inventory"
  color="text-[#0071e3]"
  bg="bg-blue-50 dark:bg-blue-900/20"
/>
```

---

## Styling

### Design Language

ChainPilot follows an Apple-inspired design:

- **Colors:** `#1d1d1f` (text), `#86868b` (secondary), `#0071e3` (accent), `#fbfbfd` (background)
- **Dark mode:** `#0a0a0a` (background), `#1c1c1e` (cards), `#38383a` (borders)
- **Border radius:** `rounded-xl` (inputs), `rounded-2xl` (cards), `rounded-full` (buttons)
- **Typography:** System font stack, `tracking-tight` on headings

### Dark Mode

**File**: `src/context/ThemeContext.tsx`

- Toggled via settings page or system preference
- Persisted in `localStorage`
- Applied via `dark:` Tailwind prefix

### Animations

**File**: `src/styles/animations.css`

Pre-defined animations:
- `animate-fade-in-up` — page entry
- `animate-shake` — error messages
- `animate-skeleton` — skeleton shimmer
- `animate-spin` — loading spinners
- `animate-pulse` — breathing effect

---

## State Management

No global state library (Redux, Zustand). State is managed locally:

| Scope | Pattern |
|---|---|
| **Auth** | `AuthContext` — user, token, login/logout |
| **Theme** | `ThemeContext` — dark mode toggle |
| **Page data** | `useState` + `useEffect` per page |
| **Pagination** | `usePagination` hook |
| **Modals** | Local boolean state per modal |

### Typical Page Pattern

```tsx
const MyPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await someAPI.getData();
        setData(res.data);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <SkeletonLayout />;

  return (
    <div className="py-8 space-y-8">
      {/* Header */}
      {/* Content */}
    </div>
  );
};
```

---

## Development

### Start Dev Server

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173` with hot module replacement.

### Build for Production

```bash
npm run build
```

Output in `dist/` directory.

### Type Checking

```bash
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

---

## Related Documentation

- [Architecture](architecture.md) — System overview
- [API Reference](api_reference.md) — Backend endpoints
- [Deployment](deployment.md) — Vercel setup
- [ML Integration](ml_integration.md) — Insight display
