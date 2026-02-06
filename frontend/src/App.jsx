import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store";
import ProtectedRoute from "./components/route/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import { ROLES } from "./utils/constants";
import { ToastProvider } from "./components/ui/toast";

// Auth Pages
import Login from "./pages/auth/Login";
import RegisterAgent from "./pages/auth/RegisterAgent";
import RegisterStudent from "./pages/auth/RegisterStudent";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import SetupPassword from "./pages/auth/SetupPassword";
import VerifyOTP from "./pages/auth/VerifyOTP";
import StudentSetupPassword from "./pages/auth/student/StudentSetupPassword";
import StudentForgotPassword from "./pages/auth/student/StudentForgotPassword";
import StudentVerifyOTP from "./pages/auth/student/StudentVerifyOTP";
import StudentResetPassword from "./pages/auth/student/StudentResetPassword";
import PartnerApplicationForm from "./pages/public/PartnerApplicationForm";

// Dashboard Pages
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AgentDashboard from "./pages/dashboard/AgentDashboard";
import StudentDashboard from "./pages/dashboard/StudentDashboard";

// Admin Pages
import AdminList from "./pages/admins/AdminList";
import StaffList from "./pages/admin/StaffList";
import StaffForm from "./pages/admin/StaffForm";
import RolesList from "./pages/admin/RolesList";
import RoleForm from "./pages/admin/RoleForm";

// Agent Pages
import AgentList from "./pages/agents/AgentList";
import AgentDetails from "./pages/agents/AgentDetails";
import AgentDetailView from "./pages/agents/AgentDetailView";
import Settings from './pages/admin/Settings';
import PendingAgents from "./pages/agents/PendingAgents";
import AdminCreateAgent from "./pages/agents/AdminCreateAgent";
import AdminEditAgent from "./pages/agents/AdminEditAgent";

// University Pages
import UniversityList from "./pages/universities/UniversityList";
import UniversityForm from "./pages/universities/UniversityForm";
import UniversityDetails from "./pages/universities/UniversityDetails";

// Course Pages
import CourseList from "./pages/courses/CourseList";
import CourseForm from "./pages/courses/CourseForm";
import CourseDetails from "./pages/courses/CourseDetails";

// Student Pages
import StudentList from "./pages/students/StudentList";
import CreateStudent from "./pages/students/CreateStudent";
import StudentForm from "./pages/students/StudentForm";
import StudentDetails from "./pages/students/StudentDetails";

// Public Pages
import StudentTestForm from "./pages/students/StudentTestForm";
import PublicStudentRegistration from "./pages/public/PublicStudentRegistration";
import RegistrationSuccess from "./pages/public/RegistrationSuccess";

// Guards
import RequireReferral from "./components/guards/RequireReferral";

// Application Pages
import ApplicationList from "./pages/applications/ApplicationList";
import ApplicationForm from "./pages/applications/ApplicationForm";
import ApplicationDetails from "./pages/applications/ApplicationDetails";

// Commission Pages
import CommissionList from "./pages/commissions/CommissionList";
import CommissionForm from "./pages/commissions/CommissionForm";

// Payout Pages
import PayoutList from "./pages/payouts/PayoutList";
import PayoutRequests from "./pages/payouts/PayoutRequests";
import AgentEarnings from "./pages/payouts/AgentEarnings";

// Audit Log Pages
import AuditLogList from "./pages/audit-logs/AuditLogList";

// Other Pages
import Profile from "./pages/Profile";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

import { useDispatch } from "react-redux";
import { fetchSettings } from "./store/slices/settingsSlice";
import { useEffect } from "react";


function AppContent() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register/agent" element={<RegisterAgent />} />
      <Route path="/register/student" element={<RegisterStudent />} />
      <Route path="/agent-register" element={<PartnerApplicationForm />} />
      <Route path="/setup-password" element={<SetupPassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Student Specific Auth Routes */}
      <Route path="/student/setup-password" element={<StudentSetupPassword />} />
      <Route path="/student/forgot-password" element={<StudentForgotPassword />} />
      <Route path="/student/verify-otp" element={<StudentVerifyOTP />} />
      <Route path="/student/reset-password" element={<StudentResetPassword />} />

      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Public Student Registration Routes - Requires Valid Referral */}
      <Route path="/student-registration" element={
        <RequireReferral>
          <PublicStudentRegistration />
        </RequireReferral>
      } />
      <Route path="/registration-success" element={<RegistrationSuccess />} />

      {/* 404 Page */}
      <Route path="/404" element={<NotFound />} />

      {/* TEMP Route for testing (old form) */}
      <Route path="/student-test" element={<StudentTestForm />} />






      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Admins */}
        <Route
          path="admins"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <AdminList />
            </ProtectedRoute>
          }
        />

        {/* Staff Management */}
        <Route
          path="staff"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <StaffList />
            </ProtectedRoute>
          }
        />
        <Route
          path="staff/new"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <StaffForm />
            </ProtectedRoute>
          }
        />

        {/* Roles & Permissions */}
        <Route
          path="roles-permissions"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <RolesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="roles-permissions/new"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <RoleForm />
            </ProtectedRoute>
          }
        />

        {/* Agents */}
        <Route
          path="agents"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
              <AgentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="agents/view/:id"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
              <AgentDetailView />
            </ProtectedRoute>
          }
        />
        <Route
          path="agents/pending"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
              <PendingAgents />
            </ProtectedRoute>
          }
        />
        <Route
          path="agents/create"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
              <AdminCreateAgent />
            </ProtectedRoute>
          }
        />
        <Route
          path="agents/edit/:id"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
              <AdminEditAgent />
            </ProtectedRoute>
          }
        />
        <Route
          path="agents/:id"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
              <AgentDetails />
            </ProtectedRoute>
          }
        />


        {/* Universities */}
        <Route
          path="universities"
          element={
            <ProtectedRoute>
              <UniversityList />
            </ProtectedRoute>
          }
        />
        <Route
          path="universities/new"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
              <UniversityForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="universities/:id"
          element={
            <ProtectedRoute>
              <UniversityDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="universities/:id/edit"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
              <UniversityForm />
            </ProtectedRoute>
          }
        />

        {/* Courses */}
        <Route
          path="courses"
          element={
            <ProtectedRoute>
              <CourseList />
            </ProtectedRoute>
          }
        />
        <Route
          path="courses/new"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
              <CourseForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="courses/:id"
          element={
            <ProtectedRoute>
              <CourseDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="courses/:id/edit"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
              <CourseForm />
            </ProtectedRoute>
          }
        />

        {/* Students */}
        <Route
          path="students"
          element={
            <ProtectedRoute>
              <StudentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="students/create"
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.AGENT]}
            >
              <StudentForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="students/new"
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.AGENT]}
            >
              <StudentForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="students/:id"
          element={
            <ProtectedRoute>
              <StudentDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="students/:id/edit"
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.AGENT]}
            >
              <StudentForm />
            </ProtectedRoute>
          }
        />

        {/* Applications */}
        <Route
          path="applications"
          element={
            <ProtectedRoute>
              <ApplicationList />
            </ProtectedRoute>
          }
        />
        <Route
          path="applications/new"
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.AGENT]}
            >
              <ApplicationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="applications/:id"
          element={
            <ProtectedRoute>
              <ApplicationDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="applications/:id/edit"
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.AGENT]}
            >
              <ApplicationForm />
            </ProtectedRoute>
          }
        />

        {/* Commissions */}
        <Route
          path="commissions"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
              <CommissionList />
            </ProtectedRoute>
          }
        />
        <Route
          path="commissions/new"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
              <CommissionForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="commissions/:id/edit"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
              <CommissionForm />
            </ProtectedRoute>
          }
        />

        {/* Payouts */}
        <Route
          path="payouts"
          element={
            <ProtectedRoute>
              <PayoutList />
            </ProtectedRoute>
          }
        />
        <Route
          path="payouts/requests"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
              <PayoutRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="earnings"
          element={
            <ProtectedRoute allowedRoles={[ROLES.AGENT]}>
              <AgentEarnings />
            </ProtectedRoute>
          }
        />

        {/* Audit Logs */}
        <Route
          path="audit-logs"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <AuditLogList />
            </ProtectedRoute>
          }
        />

// Profile & Settings
        <Route path="profile" element={<Profile />} />
        <Route
          path="settings"
          element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ToastProvider>
    </Provider>
  );
}

export default App;
