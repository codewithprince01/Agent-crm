import React from 'react';
import { useSelector } from 'react-redux';
import { ROLES } from '../../utils/constants';
import StudentDetails from '../students/StudentDetails';

const StudentProfile = () => {
    const { user } = useSelector((state) => state.auth);
    const isStudent = user?.role === ROLES.STUDENT;

    // Reuse the StudentDetails structure directly
    // If it's a student viewing their own profile, we pass their ID and force read-only mode.
    // If an Admin somehow uses this path, it will still show the profile of the current user.
    return (
        <StudentDetails
            studentId={user?.id || user?._id}
            forceReadOnly={isStudent}
        />
    );
};

export default StudentProfile;
