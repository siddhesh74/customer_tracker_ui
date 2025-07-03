import React from "react";
import "./SidebarDrawer.css";

export default function SidebarDrawer({ open, onClose, onLogout }) {
  return (
    <>
      <div className={`sidebar-drawer ${open ? "open" : ""}`}>
        <div className="sidebar-drawer-title">Menu</div>
        <button className="sidebar-drawer-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
      {open && <div className="sidebar-drawer-backdrop" onClick={onClose}></div>}
    </>
  );
}
