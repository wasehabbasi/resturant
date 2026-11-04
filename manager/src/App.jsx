// import {
//   BrowserRouter,
//   Routes,
//   Route,
// } from "react-router-dom";

// import DashboardLayout from "./layouts/DashboardLayout";
// import Dashboard from "./pages/Dashboard";

// import Products from "./pages/Products";
// import Categories from "./pages/Categories";

// import Tables from "./pages/Tables";

// const Placeholder = ({ title }) => (
//   <div style={{ padding: "20px" }}>
//     <h1>{title}</h1>
//     <p>This section will be developed in upcoming steps.</p>
//   </div>
// );

// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>

//         <Route
//           path="/"
//           element={
//             <DashboardLayout>
//               <Dashboard />
//             </DashboardLayout>
//           }
//         />

//         <Route
//           path="/orders"
//           element={
//             <DashboardLayout>
//               <Placeholder title="Orders Management" />
//             </DashboardLayout>
//           }
//         />

//         <Route
//           path="/products"
//           element={
//             <DashboardLayout>
//               <Products />
//             </DashboardLayout>
//           }
//         />

//         <Route
//           path="/categories"
//           element={
//             <DashboardLayout>
//               <Categories />
//             </DashboardLayout>
//           }
//         />

//         <Route
//           path="/tables"
//           element={
//             <DashboardLayout>
//               <Tables />
//             </DashboardLayout>
//           }
//         />

//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;





import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Tables from "./pages/Tables";
import Login from "./pages/Login";

const getSession = () => {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  const userData =
    localStorage.getItem("user") ||
    sessionStorage.getItem("user");

  if (!token || !userData) return null;

  try {
    const user = JSON.parse(userData);

    if (!["manager", "admin"].includes(user.role)) {
      return null;
    }

    return { token, user };
  } catch {
    return null;
  }
};

const ProtectedRoute = ({ children }) => {
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const session = getSession();

  if (session) {
    return <Navigate to="/" replace />;
  }

  return children;
};

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
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Placeholder title="Orders Management" />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Products />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Categories />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tables"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Tables />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
