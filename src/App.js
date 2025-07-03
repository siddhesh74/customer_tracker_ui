import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/LoginPage/Login";
import Register from "./components/RegisterPage/Register";
import Dashboard from "./components/DashboardPage/Dashboard";
import PrivateRoute from "./config/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
