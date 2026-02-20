import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectSettings } from "../../store/slices/settingsSlice";
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
  FiLock,
  FiSearch,
  FiHeart,
  FiBookOpen,
  FiChevronUp,
} from "react-icons/fi";
import { FiChevronDown, FiLogOut } from "react-icons/fi";
import { logout } from "../../store/slices/authSlice";
import { authService } from "../../services/authService";
import { ROLES } from "../../utils/constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

const styles = {
  "#custom-h1-class": {
    color: "white",
  },
}

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useSelector((state) => state.auth);
  const settings = useSelector(selectSettings);
  const logoLight = settings?.logo_light;
  const dispatch = useDispatch();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const activeDropdowns = {};
    menuItems.forEach((item) => {
      if (item.subItems && (isSubItemActive(item.subItems) || (item.activePrefixes && item.activePrefixes.some(p => location.pathname.startsWith(p))))) {
        activeDropdowns[item.label] = true;
      }
    });

    setOpenDropdowns((prev) => ({
      ...prev,
      ...activeDropdowns,
    }));
  }, [location.pathname]);

  const toggleDropdown = (label) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      dispatch(logout());
      window.location.href = '/login';
    }
  };

  const getMenuItems = () => {
    switch (user?.role) {
      case ROLES.SUPER_ADMIN:
        return [
          { path: "/dashboard", icon: FiHome, label: "Dashboard" },
          { path: "/admins", icon: FiShield, label: "Admins" },
          {
            label: "Agents Management",
            icon: FiUsers,
            activePrefixes: ["/agents", "/agent-application"],
            subItems: [
              { path: "/agents", label: "All Agents" },
              { path: "/agent-application", label: "Agent Applications" },
            ],
          },
          {
            label: "Students",
            icon: FiUserCheck,
            activePrefixes: ["/applied-students", "/pending-applications"],
            subItems: [
              { path: "/students", label: "Students List" },
              { path: "/applied-students", label: "Applied Students" },
              { path: "/pending-applications", label: "Pending Applications" },
            ],
          },
          {
            label: "Brochure Management",
            icon: FiFileText,
            activePrefixes: ["/brochure"],
            subItems: [
              { path: "/brochure/types", label: "Brochure Types" },
              { path: "/brochure/categories", label: "Brochure Category" },
              { path: "/brochure/university-programs", label: "University and Program" },
            ],
          },
          { path: "/commissions", icon: FiDollarSign, label: "Commissions" },
          { path: "/payouts", icon: FiTrendingUp, label: "Payouts" },
          // { path: "/staff", icon: FiUsers, label: "Staff Management" },
          // { path: "/roles-permissions", icon: FiShield, label: "Roles & Permissions" },
          { path: "/audit-logs", icon: FiShield, label: "Audit Logs" },
          { path: "/admin/mail-signatures", icon: FiFileText, label: "Mail Signatures" },
          { path: "/profile", icon: FiUserCheck, label: "Profile" },
          { path: "/change-password", icon: FiLock, label: "Change Password" },
          { path: "/settings", icon: FiSettings, label: "Settings" },
          { icon: FiLogOut, label: "Logout", onClick: handleLogoutConfirm },
        ];

      case ROLES.ADMIN:
        return [
          { path: "/dashboard", icon: FiHome, label: "Dashboard" },
          {
            label: "Agents Management",
            icon: FiUsers,
            activePrefixes: ["/agents", "/agent-application"],
            subItems: [
              { path: "/agents", label: "All Agents" },
              { path: "/agent-application", label: "Agent Applications" },
            ],
          },
          {
            label: "Student Applications",
            icon: FiUserCheck,
            activePrefixes: ["/applied-students", "/pending-applications"],
            subItems: [
              { path: "/students", label: "Students List" },
              { path: "/applied-students", label: "Applied Students" },
              { path: "/pending-applications", label: "Pending Applications" },
            ],
          },
          {
            label: "Brochure Management",
            icon: FiFileText,
            activePrefixes: ["/brochure"],
            subItems: [
              { path: "/brochure/types", label: "Brochure Types" },
              { path: "/brochure/categories", label: "Brochure Category" },
              { path: "/brochure/university-programs", label: "University and Program" },
            ],
          },
          { path: "/commissions", icon: FiDollarSign, label: "Commissions" },
          { path: "/payouts", icon: FiTrendingUp, label: "Payouts" },
          { path: "/admin/mail-signatures", icon: FiFileText, label: "Mail Signatures" },
          { path: "/profile", icon: FiUserCheck, label: "Profile" },
          { path: "/change-password", icon: FiLock, label: "Change Password" },
          { icon: FiLogOut, label: "Logout", onClick: handleLogoutConfirm },
        ];

      case ROLES.AGENT:
        return [
          { path: "/dashboard", icon: FiHome, label: "Dashboard" },
          { path: "/students", icon: FiUserCheck, label: "My Students" },
          {
            label: "Student Applications",
            icon: FiFileText,
            activePrefixes: ["/applied-students", "/pending-applications"],
            subItems: [
              { path: "/applied-students", label: "Applied Students" },
              { path: "/pending-applications", label: "Pending Applications" },
            ],
          },
          { path: "/earnings", icon: FiDollarSign, label: "Earnings" },
          { path: "/payouts", icon: FiTrendingUp, label: "Payouts" },
          { path: "/agent/brochures", icon: FiBookOpen, label: "Brochure Details" },
          { path: "/profile", icon: FiUserCheck, label: "Profile" },
          { path: "/change-password", icon: FiLock, label: "Change Password" },
          { icon: FiLogOut, label: "Logout", onClick: handleLogoutConfirm },
        ];

      case ROLES.STUDENT:
        return [
          { path: "/dashboard", icon: FiHome, label: "Dashboard" },
          { path: "/my-applications", icon: FiFileText, label: "Applied Colleges" },
          // { onClick: () => { }, icon: FiHeart, label: "Shortlisted Colleges" },
          { path: "/profile", icon: FiUserCheck, label: "Profile" },
          { path: "/change-password", icon: FiLock, label: "Change Password" },
          { icon: FiLogOut, label: "Logout", onClick: handleLogoutConfirm },
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const isSubItemActive = (subItems) => {
    return subItems.some((subItem) =>
      location.pathname === subItem.path ||
      (subItem.path !== '/' && location.pathname.startsWith(subItem.path))
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-primary-600 text-white w-72 transform transition-transform duration-300 ease-in-out z-30
          flex flex-col shadow-2xl
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="h-20 flex items-center px-8 border-b border-primary-500/50 shrink-0">
          {logoLight && !logoError ? (
            <img
              src={logoLight}
              alt="Logo"
              className="max-h-12 w-auto object-contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="flex items-center space-x-3">
              <h1 style={styles["#custom-h1-class"]} className="text-xl font-black tracking-tight text-white uppercase">
                {settings?.platform_name}
              </h1>
            </div>
          )}
        </div>

        {/* Navigation - Fixed height with scroll */}
        <nav className="flex-1 px-4 py-8 overflow-y-auto custom-scrollbar">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.label}>
                {item.subItems ? (
                  <div>
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className={`
                        w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200
                        ${(isSubItemActive(item.subItems) || (item.activePrefixes && item.activePrefixes.some(p => location.pathname.startsWith(p))))
                          ? "bg-primary-500 text-white font-semibold"
                          : openDropdowns[item.label]
                            ? "bg-primary-500/50 text-white font-medium"
                            : "text-primary-100 hover:bg-primary-500/50 hover:text-white"
                        }
                      `}
                    >
                      <div className="flex items-center">
                        <item.icon size={22} className="mr-3 opacity-90" />
                        <span className="text-sm tracking-wide">{item.label}</span>
                      </div>
                      {openDropdowns[item.label] ? (
                        <FiChevronUp size={18} className="opacity-70" />
                      ) : (
                        <FiChevronDown size={18} className="opacity-70" />
                      )}
                    </button>
                    {openDropdowns[item.label] && (
                      <ul className="mt-2 ml-6 space-y-1 border-l-2 border-primary-500/50 pl-4">
                        {item.subItems.map((subItem) => (
                          <li key={subItem.label}>
                            <NavLink
                              to={subItem.path}
                              className={({ isActive }) =>
                                `block px-4 py-2 text-sm rounded-lg transition-all duration-200 ${isActive || (subItem.path !== '/' && location.pathname.startsWith(subItem.path))
                                  ? "bg-white/10 text-white font-bold"
                                  : "text-primary-100 hover:text-white hover:bg-white/5"
                                }`
                              }
                              onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                              {subItem.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : item.onClick ? (
                  <button
                    onClick={() => {
                      item.onClick();
                      window.innerWidth < 1024 && onClose();
                    }}
                    className="w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 text-primary-100 hover:bg-primary-500/50 hover:text-white group"
                  >
                    <item.icon size={22} className="mr-3 opacity-90 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium tracking-wide">{item.label}</span>
                  </button>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                        ? "bg-accent-500 text-white shadow-lg shadow-accent-500/20 font-semibold"
                        : "text-primary-100 hover:bg-primary-500/50 hover:text-white"
                      }`
                    }
                    onClick={() => window.innerWidth < 1024 && onClose()}
                  >
                    <item.icon size={22} className={`mr-3 transition-transform group-hover:scale-110 ${location.pathname === item.path ? 'opacity-100' : 'opacity-90'}`} />
                    <span className="text-sm tracking-wide">{item.label}</span>
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* User info */}
        <div className="p-6 border-t border-primary-500/50 bg-primary-700/30">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
              <span className="text-lg font-black text-white">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || user?.role?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.name || user?.email || 'User'}</p>
              <p className="text-[10px] uppercase font-black tracking-widest text-primary-200 opacity-70 truncate">
                {user?.role?.replace("_", " ")}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation AlertDialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-gray-900">Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to end your session? You'll need credentials to return.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="rounded-xl border-2 px-6">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 rounded-xl px-6 font-bold shadow-lg shadow-red-100"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Sidebar;