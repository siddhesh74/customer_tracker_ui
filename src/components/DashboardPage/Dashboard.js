import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllCustomerByPagination, saveCustomer } from "../../config/api";
import SidebarDrawer from "../SidebarComponent/SidebarDrawer";
import "./Dashboard.css";
import axios from "axios";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadDate, setDownloadDate] = useState(null);
  const [downloadStartDate, setDownloadStartDate] = useState(null);
  const [downloadEndDate, setDownloadEndDate] = useState(null);
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
  const fetchCustomers = async (pageNum = 1) => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");
    try {
      const res = await getAllCustomerByPagination(token, pageNum, limit);
      setCustomers(Array.isArray(res.data.customers) ? res.data.customers : []);
      setTotalPages(res.data.totalPages || 1);
      // setPage(res.data.page || 1);
    } catch {
      setCustomers([]);
      setError("Failed to fetch customers");
    }
  };

  useEffect(() => {
    fetchCustomers(page);
    // eslint-disable-next-line
  }, [page]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddCustomer = async (e) => {
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
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add customer");
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
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:3001/api/customers/download", {
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
  };

  const handleDownloadCSVByDateRange = async () => {
    if (!downloadStartDate && !downloadEndDate) return;
    const token = localStorage.getItem("token");
    const params = [];
    if (downloadStartDate) params.push(`startDate=${downloadStartDate.toISOString().split("T")[0]}`);
    if (downloadEndDate) params.push(`endDate=${downloadEndDate.toISOString().split("T")[0]}`);
    const query = params.length ? `?${params.join("&")}` : "";
    try {
      const response = await fetch(`http://localhost:3001/api/customers/download${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `customers_${params.join("_")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to download CSV");
    }
  };

  return (
    <div className="dashboard-bg" style={{ minHeight: "100vh", position: "relative" }}>
      {/* Hamburger Button */}
      <button className="hamburger-btn" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
        <span />
        <span />
        <span />
      </button>
      {/* Sidebar Drawer */}
      <SidebarDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onLogout={handleLogout} />

      <div style={{ display: "flex", alignItems: "left", padding: "1rem", justifyContent: "space-between" }}>
        <h2 className="dashboard-title">Dashboard</h2>
      </div>
      <div className="dashboard-container">
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", marginLeft: "2.5rem" }}>
          <button
            className="customer-form"
            style={{
              width: "fit-content",
              padding: "0.7rem 1.5rem",
              background: "#3f51b5",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1rem",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(63,81,181,0.06)",
              height: "44px",
              minWidth: "150px",
            }}
            onClick={() => setShowModal(true)}
          >
            + Add Customer
          </button>
          <button
            className="customer-form"
            style={{
              width: "fit-content",
              padding: "0.7rem 1.5rem",
              background: "#388e3c",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1rem",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(63,81,181,0.06)",
              height: "44px",
              minWidth: "150px",
            }}
            onClick={() => setShowDownloadModal(true)}
          >
            Download List
          </button>
        </div>

        {showDownloadModal && (
          <div className="modal-overlay" onClick={() => setShowDownloadModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowDownloadModal(false)} title="Close">
                &times;
              </button>
              <h3>Download Customers by Date</h3>
              <div style={{ marginBottom: "1rem" }}>
                <label>Start Date: </label>
                <ReactDatePicker
                  selected={downloadStartDate}
                  onChange={setDownloadStartDate}
                  dateFormat="yyyy-MM-dd"
                  isClearable
                  placeholderText="Start date"
                  maxDate={downloadEndDate || undefined}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label>End Date: </label>
                <ReactDatePicker
                  selected={downloadEndDate}
                  onChange={setDownloadEndDate}
                  dateFormat="yyyy-MM-dd"
                  isClearable
                  placeholderText="End date"
                  minDate={downloadStartDate || undefined}
                />
              </div>
              <button
                className="customer-form"
                style={{ background: "#388e3c", color: "#fff", minWidth: "120px" }}
                onClick={async () => {
                  await handleDownloadCSVByDateRange();
                  setShowDownloadModal(false);
                }}
                disabled={!downloadStartDate && !downloadEndDate}
              >
                Download
              </button>
            </div>
          </div>
        )}

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
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
