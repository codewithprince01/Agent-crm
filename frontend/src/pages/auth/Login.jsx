import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "../../store/slices/authSlice";
import authService from "../../services/authService";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import Select from "../../components/common/Select";
import Alert from "../../components/common/Alert";
import { ROLES } from "../../utils/constants";
import { selectSettings } from "../../store/slices/settingsSlice";
import { useToast } from "../../components/ui/toast";
import { Mail, Lock, UserCircle, ArrowLeft, ShieldCheck, ChevronRight } from "lucide-react";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { loading, error } = useSelector((state) => state.auth);
  const settings = useSelector(selectSettings);
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || "";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: initialRole,
  });

  // Sync role if query parameter changes
  useEffect(() => {
    if (initialRole) {
      setFormData(prev => ({ ...prev, role: initialRole }));
    }
  }, [initialRole]);

  const roleOptions = [
    { value: ROLES.SUPER_ADMIN, label: "Super Admin" },
    { value: ROLES.ADMIN, label: "Admin" },
    { value: ROLES.AGENT, label: "Agent" },
    { value: ROLES.STUDENT, label: "Student" },
  ];

  const currentRoleLabel = roleOptions.find(r => r.value === formData.role)?.label || "User";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());

    try {
      const response = await authService.login(formData);
      dispatch(loginSuccess(response));
      toast.success("Successfully Login");
      navigate("/dashboard");
    } catch (err) {
      dispatch(loginFailure(err.response?.data?.message || "Login failed"));
    }
  };

  // Role-specific theme colors
  const roleColors = {
    [ROLES.SUPER_ADMIN]: 'from-indigo-600 to-indigo-800',
    [ROLES.ADMIN]: 'from-blue-600 to-blue-800',
    [ROLES.AGENT]: 'from-emerald-600 to-emerald-800',
    [ROLES.STUDENT]: 'from-amber-500 to-amber-700',
    'default': 'from-primary-600 to-indigo-600'
  };

  const currentGradient = roleColors[formData.role] || roleColors['default'];

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${currentGradient} py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-all duration-700`}>
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-[100px] animate-pulse-slow delay-700" />
      </div>

      <div className="max-w-md w-full relative z-10 transition-all duration-500 hover:scale-[1.01]">
        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden border border-white/20">
          {/* Header Section */}
          <div className={`p-8 pb-4 text-center text-white bg-gradient-to-r ${currentGradient} relative`}>
            <h1 style={{ color: "white" }} className="text-3xl tracking-tighter mb-1 uppercase">
              {settings.platform_name || ''} <span className="font-light opacity-80 uppercase text-sm tracking-widest block mt-1 text-white">Global Education Portal</span>
            </h1>
            <div className="absolute bottom-[-24px] left-1/2 transform -translate-x-1/2 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center text-primary-600 border border-gray-100">
              <ShieldCheck size={24} />
            </div>
          </div>

          <div className="p-8 pt-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                {formData.role ? `${currentRoleLabel} Login` : "Secure Sign In"}
              </h2>
              <p className="text-gray-500 mt-2 text-sm font-medium leading-relaxed">
                {settings.site_description || `Access your personal dashboard and manage your operations${settings.platform_name ? ` with ${settings.platform_name}` : ''}.`}
              </p>
            </div>

            {error && <Alert type="error" message={error} className="mb-6 rounded-2xl animate-shake" />}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Only show role selection if NOT provided in URL */}
              {!initialRole && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700 ml-1">Login As</label>
                  <div className="relative group">
                    <UserCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white transition-all outline-none appearance-none font-medium text-gray-700 hover:border-gray-300"
                    >
                      <option value="">Select your role</option>
                      {roleOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@company.com"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white transition-all outline-none font-medium text-gray-700 hover:border-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="block text-sm font-bold text-gray-700">Password</label>
                  <Link to={`/forgot-password${formData.role ? `?role=${formData.role}` : ''}`} size="sm" className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white transition-all outline-none font-medium text-gray-700 hover:border-gray-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-2xl font-black text-white shadow-xl transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${loading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : `bg-gradient-to-r ${currentGradient} hover:shadow-[0_10px_20px_rgba(0,0,0,0.15)] hover:-translate-y-0.5`
                  }`}
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Enter Portal</span>
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100">
              {initialRole ? (
                <div className="text-center">
                  <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-primary-600 transition-colors group"
                  >
                    <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Not a {currentRoleLabel}? Change Role
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <p className="text-sm text-gray-500 font-medium">New to the Portal?</p>
                  <div className="flex justify-center">
                    <Link to="/agent-register" className="text-sm font-bold text-primary-600 hover:text-primary-700 px-6 py-3 bg-primary-50 rounded-xl transition-colors w-full sm:w-auto text-center">
                      Agent Registration
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-center mt-8 text-white/70 text-sm font-medium">
          &copy; {new Date().getFullYear()} {settings.platform_name || ''}. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
