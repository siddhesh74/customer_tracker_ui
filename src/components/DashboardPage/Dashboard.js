import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCustomerByPagination, saveCustomer } from "../../config/api";
import SidebarDrawer from "../SidebarComponent/SidebarDrawer";
import "./Dashboard.css";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function Dashboard() {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const [customers, setCustomers] = useState([]);
  const [downloadStartDate, setDownloadStartDate] = useState(today);
  const [downloadEndDate, setDownloadEndDate] = useState(tomorrow);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    isActive: true,
  });
  const [showModal, setShowModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const navigate = useNavigate();

  // Fetch customers with pagination
  const fetchCustomers = async (pageNum = 1, startDate = today, endDate = tomorrow) => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    try {
      const start = startDate ? startDate.toISOString().split("T")[0] : undefined;
      const end = endDate ? endDate.toISOString().split("T")[0] : undefined;
      const res = await getAllCustomerByPagination(token, pageNum, limit, start, end);
      const data = res.data;
      setCustomers(Array.isArray(data.customers) ? data.customers : []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setCustomers([]);
      setError("Failed to fetch customers");
    }
  };

  useEffect(() => {
    fetchCustomers(page, downloadStartDate, downloadEndDate);
    // eslint-disable-next-line
  }, [page, downloadStartDate, downloadEndDate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddCustomer = async (e) => {
    setDownloading(true);
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");
    try {
      await saveCustomer(form, token);
      await fetchCustomers(page);
      setForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
        isActive: true,
      });
      setShowModal(false);
      setDownloading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add customer");
      setDownloading(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const renderAddress = (address) => {
    if (!address) return "";
    if (typeof address === "string") return address;
    if (typeof address === "object") {
      return [address.street, address.city, address.state, address.postalCode, address.country]
        .filter(Boolean)
        .join(", ");
    }
    return "";
  };

  const handleDownloadCSV = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem("token");
      let params = [];
      if (downloadStartDate) params.push(`startDate=${downloadStartDate.toISOString().split("T")[0]}`);
      if (downloadEndDate) params.push(`endDate=${downloadEndDate.toISOString().split("T")[0]}`);
      params.push(`page=${page}`);
      params.push(`limit=${limit}`);
      const query = params.length ? `?${params.join("&")}` : "";
      const response = await fetch(`http://localhost:3001/api/customer/download${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        alert("Failed to download CSV");
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "customers.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="dashboard-bg" style={{ minHeight: "100vh", position: "relative" }}>
      {downloading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(255,255,255,0.7)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="loader"
            style={{
              border: "6px solid #f3f3f3",
              borderTop: "6px solid #3f51b5",
              borderRadius: "50%",
              width: "60px",
              height: "60px",
              animation: "spin 1s linear infinite",
            }}
          />
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}

      <button className="hamburger-btn" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
        <span />
        <span />
        <span />
      </button>

      <SidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onLogout={handleLogout} />

      <div style={{ display: "flex", alignItems: "left", padding: "1rem", justifyContent: "space-between" }}>
        <h2 className="dashboard-title">Dashboard</h2>
      </div>
      <div className="dashboard-container">
        <div className="date-range-card">
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label className="date-range-label">Start Date</label>
            <ReactDatePicker
              selected={downloadStartDate}
              onChange={setDownloadStartDate}
              dateFormat="yyyy-MM-dd"
              isClearable={false}
              placeholderText="Start date"
              maxDate={downloadEndDate || undefined}
              className="custom-datepicker"
              popperPlacement="bottom"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label className="date-range-label">End Date</label>
            <ReactDatePicker
              selected={downloadEndDate}
              onChange={setDownloadEndDate}
              dateFormat="yyyy-MM-dd"
              isClearable={false}
              placeholderText="End date"
              minDate={downloadStartDate || undefined}
              className="custom-datepicker"
              popperPlacement="bottom"
            />
          </div>
          <button
            className="date-range-reset-btn"
            onClick={() => {
              setDownloadStartDate(today);
              setDownloadEndDate(tomorrow);
            }}
          >
            Reset
          </button>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }} className="button-group">
            <button
              className="customer-form"
              style={{
                width: "200px",
                padding: "0.7rem 1.5rem",
                background: "#388e3c",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "1rem",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(63,81,181,0.06)",
                height: "44px",
                minWidth: "150px",
              }}
              onClick={() => handleDownloadCSV()}
            >
              Download CSV
            </button>
            <button
              className="customer-form"
              style={{
                width: "200px",
                padding: "0.7rem 1.5rem",
                background: "#3f51b5",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "1rem",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(63,81,181,0.06)",
                height: "44px",
                minWidth: "150px",
              }}
              onClick={() => setShowModal(true)}
            >
              + Add Customer
            </button>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowModal(false)} title="Close">
                &times;
              </button>
              <form className="customer-form" onSubmit={handleAddCustomer}>
                <h3>Add Customer</h3>
                <input
                  name="name"
                  placeholder="Name"
                  className="cust-fields"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                <input
                  name="email"
                  className="cust-fields"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
                <input
                  name="phone"
                  className="cust-fields"
                  placeholder="Phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
                <input
                  name="address"
                  className="cust-fields"
                  placeholder="Address"
                  value={form.address}
                  onChange={handleChange}
                />
                <input
                  name="notes"
                  placeholder="Notes"
                  className="cust-fields"
                  value={form.notes}
                  onChange={handleChange}
                />
                <label className="cust-checkbox">
                  <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
                  Active
                </label>
                <button type="submit">Add Customer</button>
              </form>
              {error && <div className="dashboard-error">{error}</div>}
            </div>
          </div>
        )}

        <div className="customer-table-wrapper">
          <table className="customer-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Notes</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#888", fontWeight: "bold" }}>
                    There is no data
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c._id}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone}</td>
                    <td>{renderAddress(c.address)}</td>
                    <td>{c.notes}</td>
                    <td>{c.isActive ? "Yes" : "No"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* Pagination Controls */}
          <div style={{ display: "flex", justifyContent: "center", margin: "1.5rem 0" }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ marginRight: "1rem" }}
            >
              Prev
            </button>
            <span style={{ alignSelf: "center" }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ marginLeft: "1rem" }}
              className="next-button"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
