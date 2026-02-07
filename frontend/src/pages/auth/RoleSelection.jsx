import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShieldAlert, UserCog, UserCheck, GraduationCap, ArrowRight, Users } from 'lucide-react';
import { ROLES } from '../../utils/constants';
import { selectSettings } from '../../store/slices/settingsSlice';

const RoleCard = ({ role, title, description, icon: Icon, color, onClick }) => (
    <button
        onClick={onClick}
        className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border border-gray-100 flex flex-col items-start text-left w-full h-full"
    >
        {/* Background Gradient Effect */}
        <div
            className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-10 transition-all duration-500 group-hover:scale-150"
            style={{ backgroundColor: color }}
        />

        {/* Icon Container */}
        <div
            className="mb-6 rounded-xl p-4 transition-all duration-300 group-hover:scale-110 shadow-sm"
            style={{ backgroundColor: `${color}1A` }} // 1A is 10% opacity in hex
        >
            <Icon size={32} style={{ color: color }} />
        </div>

        {/* Content */}
        <h3 className="mb-2 text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
            {title}
        </h3>
        <p className="mb-6 text-gray-500 leading-relaxed">
            {description}
        </p>

        {/* Action */}
        <div className="mt-auto flex items-center font-semibold text-primary-600 group-hover:gap-2 transition-all">
            <span>Login as {title}</span>
            <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
        </div>

        {/* Bottom Accent Line */}
        <div
            className="absolute bottom-0 left-0 h-1 w-0 transition-all duration-300 group-hover:w-full"
            style={{ backgroundColor: color }}
        />
    </button>
);

const RoleSelection = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state) => state.auth);
    const settings = useSelector(selectSettings);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleRoleSelect = (role) => {
        navigate(`/login?role=${role}`);
    };

    const portalRoles = [
        {
            role: ROLES.SUPER_ADMIN,
            title: 'Super Admin',
            description: 'Full system control, managing configurations, audits, and high-level platform oversight.',
            icon: ShieldAlert,
            color: '#4f46e5', // Indigo 600
        },
        {
            role: ROLES.ADMIN,
            title: 'Admin',
            description: 'Oversee regional operations, manage staff, agents, and maintain system data integrity.',
            icon: UserCog,
            color: '#2563eb', // Blue 600
        },
        {
            role: ROLES.AGENT,
            title: 'Agent',
            description: 'Manage student applications, track commissions, and facilitate global admissions.',
            icon: UserCheck,
            color: '#059669', // Emerald 600
        },
        {
            role: ROLES.STUDENT,
            title: 'Student',
            description: 'Track your application status, upload documents, and manage your academic journey.',
            icon: GraduationCap,
            color: '#d97706', // Amber 600
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Decorative Orbs */}
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary-100 rounded-full blur-[120px] opacity-50" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50" />

            <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-screen">
                {/* Header Section */}
                <div className="text-center mb-16 max-w-3xl">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm font-medium mb-6 animate-fade-in">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                        </span>
                        <span>{settings.platform_name ? `Welcome to ${settings.platform_name} CRM` : 'Welcome to the Portal'}</span>
                    </div>
                    <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight sm:text-6xl mb-6">
                        Choose your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Portal</span>
                    </h1>
                    <p className="text-xl text-gray-600 leading-relaxed">
                        {settings.site_description || "Please select your role below to access your specialized dashboard."}
                    </p>
                </div>

                {/* Roles Grid */}
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 w-full">
                    {portalRoles.map((item) => (
                        <RoleCard
                            key={item.role}
                            {...item}
                            onClick={() => handleRoleSelect(item.role)}
                        />
                    ))}
                </div>

                {/* Become a Partner Section */}
                <div className="mt-20 w-full max-w-4xl animate-fade-in-up">
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                        {/* Decorative background circle */}
                        <div className="absolute top-[-50%] right-[-10%] w-80 h-80 bg-white opacity-10 rounded-full blur-3xl transition-all duration-700 group-hover:scale-110" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="text-center md:text-left">
                                <h2 className="text-3xl font-bold text-white mb-4">Want to Grow with Us?</h2>
                                <p className="text-emerald-50 text-lg max-w-xl">
                                    Join our global network of education partners. Help students achieve their dreams while growing your business{settings.platform_name ? ` with ${settings.platform_name}` : ''}.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/agent-register')}
                                className="whitespace-nowrap px-8 py-4 bg-white text-emerald-700 rounded-2xl font-bold text-lg shadow-lg hover:shadow-emerald-900/40 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                            >
                                <Users size={22} />
                                Become a Partner
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-20 text-center">
                    <p className="text-gray-500 text-sm max-w-lg mx-auto">
                        Authorized access only. By choosing a portal and logging in, you agree to our terms of service and data privacy policies.
                    </p>
                    <div className="mt-8 flex justify-center space-x-6 grayscale opacity-60">
                        {/* Simple logos or text placeholders for branding */}
                        {settings.platform_name && <span className="font-bold text-xl text-gray-400">{settings.platform_name}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoleSelection;
