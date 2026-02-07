import { useSelector } from 'react-redux';
import { ROLES } from '../utils/constants';
import StudentProfile from './profiles/StudentProfile';
import AdminProfile from './profiles/AdminProfile';
import AgentProfile from './profiles/AgentProfile';

const RoleBasedProfile = () => {
    const { user } = useSelector((state) => state.auth);

    // Show role-specific profile based on user role
    if (user?.role === ROLES.STUDENT) {
        return <StudentProfile />;
    }

    if (user?.role === ROLES.AGENT) {
        return <AgentProfile />;
    }

    if (user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN) {
        return <AdminProfile />;
    }

    // Fallback - should not reach here if auth is working correctly
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Available</h2>
                <p className="text-gray-500">Unable to load profile for your role.</p>
            </div>
        </div>
    );
};

export default RoleBasedProfile;
