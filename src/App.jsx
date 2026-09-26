import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Budget from "./pages/Budget";
import Funding from "./pages/Funding";
import Plans from "./pages/Plans";
import Help from "./pages/Help";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CurrencyProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/funding" element={<Funding />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/help" element={<Help />} />
            </Route>
          </Routes>
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
