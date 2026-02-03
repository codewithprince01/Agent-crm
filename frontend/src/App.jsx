import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store";
import ProtectedRoute from "./components/route/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import { ROLES } from "./utils/constants";

// Auth Pages
import Login from "./pages/auth/Login";
import RegisterAgent from "./pages/auth/RegisterAgent";
import RegisterStudent from "./pages/auth/RegisterStudent";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Dashboard Pages
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import AgentDashboard from "./pages/dashboard/AgentDashboard";
import StudentDashboard from "./pages/dashboard/StudentDashboard";

// Admin Pages
import AdminList from "./pages/admins/AdminList";

// Agent Pages
import AgentList from "./pages/agents/AgentList";
import AgentDetails from "./pages/agents/AgentDetails";
import PendingAgents from "./pages/agents/PendingAgents";

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
import StudentForm from "./pages/students/StudentForm";
import StudentDetails from "./pages/students/StudentDetails";

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
import Settings from "./pages/Settings";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register/agent" element={<RegisterAgent />} />
          <Route path="/register/student" element={<RegisterStudent />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

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
              path="agents/pending"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN]}>
                  <PendingAgents />
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

            {/* Profile & Settings */}
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
