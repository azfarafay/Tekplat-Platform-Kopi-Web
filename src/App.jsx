import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SelectRoastery from "./pages/SelectRoastery";
import Catalog from "./pages/Catalog";
import MyTransactions from "./pages/MyTransactions";
import IncomingOrders from "./pages/IncomingOrders";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Roastery */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/incoming-orders" element={<IncomingOrders />} />
        {/* Coffee Shop */}
        <Route path="/select-roastery" element={<SelectRoastery />} />
        <Route path="/catalog/:roasteryId" element={<Catalog />} />
        <Route path="/my-transactions" element={<MyTransactions />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
