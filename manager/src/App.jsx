import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";

import Products from "./pages/Products";
import Categories from "./pages/Categories";

import Tables from "./pages/Tables";

const Placeholder = ({ title }) => (
  <div style={{ padding: "20px" }}>
    <h1>{title}</h1>
    <p>This section will be developed in upcoming steps.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          }
        />

        <Route
          path="/orders"
          element={
            <DashboardLayout>
              <Placeholder title="Orders Management" />
            </DashboardLayout>
          }
        />

        <Route
          path="/products"
          element={
            <DashboardLayout>
              <Products />
            </DashboardLayout>
          }
        />

        <Route
          path="/categories"
          element={
            <DashboardLayout>
              <Categories />
            </DashboardLayout>
          }
        />

        <Route
          path="/tables"
          element={
            <DashboardLayout>
              <Tables />
            </DashboardLayout>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
