import React from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FiHome,
  FiUsers,
  FiBook,
  FiFileText,
  FiDollarSign,
  FiSettings,
  FiShield,
  FiGrid,
  FiUserCheck,
  FiTrendingUp,
} from "react-icons/fi";
import { ROLES } from "../../utils/constants";

const styles = {
  "#custom-h1-class": {
    color: "white",
  },
}


const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useSelector((state) => state.auth);

  const getMenuItems = () => {
    switch (user?.role) {
      case ROLES.SUPER_ADMIN:
        return [
          { path: "/dashboard", icon: FiHome, label: "Dashboard" },
          { path: "/admins", icon: FiShield, label: "Admins" },
          { path: "/agents", icon: FiUsers, label: "Agents" },
          { path: "/students", icon: FiUserCheck, label: "Students" },
          { path: "/applications", icon: FiFileText, label: "Applications" },
          { path: "/commissions", icon: FiDollarSign, label: "Commissions" },
          { path: "/payouts", icon: FiTrendingUp, label: "Payouts" },
          { path: "/staff", icon: FiUsers, label: "Staff Management" },
          { path: "/roles-permissions", icon: FiShield, label: "Roles & Permissions" },
          { path: "/audit-logs", icon: FiShield, label: "Audit Logs" },
          { path: "/settings", icon: FiSettings, label: "Settings" },
        ];

      case ROLES.ADMIN:
        return [
          { path: "/dashboard", icon: FiHome, label: "Dashboard" },
          { path: "/agents", icon: FiUsers, label: "Agents" },
          { path: "/students", icon: FiUserCheck, label: "Students" },
          { path: "/applications", icon: FiFileText, label: "Applications" },
          { path: "/commissions", icon: FiDollarSign, label: "Commissions" },
          { path: "/payouts", icon: FiTrendingUp, label: "Payouts" },
        ];

      case ROLES.AGENT:
        return [
          { path: "/dashboard", icon: FiHome, label: "Dashboard" },
          { path: "/students", icon: FiUserCheck, label: "My Students" },
          { path: "/applications", icon: FiFileText, label: "Applications" },
          { path: "/earnings", icon: FiDollarSign, label: "Earnings" },
          { path: "/payouts", icon: FiTrendingUp, label: "Payouts" },
        ];

      case ROLES.STUDENT:
        return [
          { path: "/dashboard", icon: FiHome, label: "Dashboard" },
          { path: "/applications", icon: FiFileText, label: "My Applications" },
          { path: "/profile", icon: FiUserCheck, label: "Profile" },
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-primary-600 text-white w-64 transform transition-transform duration-300 z-30
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-primary-500">
          <h1 style={styles["#custom-h1-class"]} className="text-2xl text-white font-bold">UniAdmit CRM</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-lg transition-colors ${isActive
                      ? "bg-accent-500 text-white"
                      : "text-primary-100 hover:bg-primary-500"
                    }`
                  }
                  onClick={() => window.innerWidth < 768 && onClose()}
                >
                  <item.icon size={20} className="mr-3" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-primary-500">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-primary-400 flex items-center justify-center">
              <span className="text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-primary-200 truncate capitalize">
                {user?.role?.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};


export default Sidebar;