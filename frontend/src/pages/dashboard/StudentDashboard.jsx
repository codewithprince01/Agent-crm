import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FileText,
  User,
  CheckCircle,
  Clock,
  Upload,
  Plus,
  UserCheck,
  Phone,
  ArrowRight,
  GraduationCap,
  MapPin,
  Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '../../services/apiClient';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    profile: null,
    applications: [],
    stats: {
      totalApplications: 0,
      profileCompletion: 0,
      documentsUploaded: 0,
      pendingReviews: 0
    }
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch student profile
      const profileRes = await apiClient.get('/students/me');

      // Try multiple possible response structures (data.data.student is the correct one!)
      const profile = profileRes.data?.data?.student || profileRes.data?.student || profileRes.data?.data || profileRes.data;
      // Calculate profile completion with detailed breakdown
      const completionData = calculateProfileCompletion(profile);

      // Fetch applications (if endpoint exists)
      let applications = [];
      try {
        const appsRes = await apiClient.get('/applications');
        applications = appsRes.data.data || appsRes.data || [];
      } catch {
        // Applications endpoint might not exist yet
        applications = [];
      }

      const stats = {
        totalApplications: applications.length,
        profileCompletion: completionData.overall,
        profileCompletionData: completionData,
        documentsUploaded: profile.documents?.length || 0,
        pendingReviews: applications.filter(app => app.applicationStatus === 'submitted').length
      };

      setDashboardData({ profile, applications: applications.slice(0, 5), stats });

    } catch (error) {

      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = (profile) => {
    const sections = {
      personal: {
        weight: 30,
        fields: ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'gender', 'nationality', 'maritalStatus'],
        completed: 0,
        total: 8
      },
      address: {
        weight: 15,
        fields: ['address', 'city', 'state', 'country', 'postalCode'],
        completed: 0,
        total: 5
      },
      passport: {
        weight: 10,
        fields: ['passportNumber', 'passportExpiry'],
        completed: 0,
        total: 2
      },
      education: {
        weight: 25,
        fields: ['highestLevel', 'academicLevel', 'schoolsAttended'],
        completed: 0,
        total: 3
      },
      testScores: {
        weight: 15,
        fields: ['examType', 'overallScore'],
        completed: 0,
        total: 2
      },
      documents: {
        weight: 5,
        fields: ['documents'],
        completed: 0,
        total: 1
      }
    };

    // Calculate completion for each section
    Object.keys(sections).forEach(sectionKey => {
      const section = sections[sectionKey];
      section.fields.forEach(field => {
        if (field === 'schoolsAttended') {
          if (profile.schoolsAttended?.length > 0) section.completed++;
        } else if (field === 'documents') {
          if (profile.documents?.length > 0) section.completed++;
        } else {
          if (profile[field]) section.completed++;
        }
      });
    });

    // Calculate weighted overall percentage
    let totalWeightedScore = 0;
    Object.values(sections).forEach(section => {
      const sectionPercentage = (section.completed / section.total) * 100;
      totalWeightedScore += (sectionPercentage * section.weight) / 100;
    });

    return {
      overall: Math.round(totalWeightedScore),
      sections,
      missingCritical: {
        noDocuments: !profile.documents || profile.documents.length === 0,
        noEducation: !profile.schoolsAttended || profile.schoolsAttended.length === 0,
        noTestScores: !profile.examType || !profile.overallScore,
        noPassport: !profile.passportNumber
      }
    };
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: 'bg-blue-100 text-blue-700',
      documents_verified: 'bg-cyan-100 text-cyan-700',
      university_applied: 'bg-indigo-100 text-indigo-700',
      offer_received: 'bg-purple-100 text-purple-700',
      accepted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      enrolled: 'bg-emerald-100 text-emerald-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    return status?.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const { profile, applications, stats } = dashboardData;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 md:p-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.firstName || 'Student'}! 👋
        </h1>
        <p className="text-gray-600 mt-1">Here's your application journey overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Total Applications"
          value={stats.totalApplications}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
          onClick={() => navigate('/my-applications')}
        />
        <StatCard
          icon={CheckCircle}
          label="Profile Completion"
          value={`${stats.profileCompletion}%`}
          bgColor="bg-green-50"
          iconColor="text-green-600"
        />
        <StatCard
          icon={Upload}
          label="Documents Uploaded"
          value={stats.documentsUploaded}
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          icon={Clock}
          label="Pending Reviews"
          value={stats.pendingReviews}
          bgColor="bg-orange-50"
          iconColor="text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <QuickActionButton
                icon={Plus}
                label="New Application"
                onClick={() => navigate('/applications/new')}
                color="blue"
              />
              <QuickActionButton
                icon={User}
                label="Complete Profile"
                onClick={() => navigate('/profile')}
                color="green"
              />
              <QuickActionButton
                icon={Upload}
                label="Upload Documents"
                onClick={() => navigate('/profile')}
                color="purple"
              />
              {profile?.agentId && (
                <QuickActionButton
                  icon={Phone}
                  label="Contact Agent"
                  onClick={() => toast.info('Agent contact feature coming soon')}
                  color="gray"
                />
              )}
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Applications</h2>
              {applications.length > 0 && (
                <button
                  onClick={() => navigate('/my-applications')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  View All <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No applications yet</p>
                <p className="text-sm text-gray-400 mt-1">Start your journey by applying to universities</p>
                <button
                  onClick={() => navigate('/applications/new')}
                  className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  Create Application
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <ApplicationCard key={app._id} application={app} getStatusColor={getStatusColor} getStatusLabel={getStatusLabel} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Profile Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Profile Summary</h2>
            <div className="space-y-3">
              <ProfileField
                icon={User}
                label="Name"
                value={`${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'Not set'}
              />
              <ProfileField
                icon={MapPin}
                label="Location"
                value={profile?.city && profile?.country ? `${profile.city}, ${profile.country}` : 'Not set'}
              />
              <ProfileField
                icon={GraduationCap}
                label="Education Level"
                value={profile?.highestLevel || 'Not set'}
              />
              <ProfileField
                icon={Calendar}
                label="Test Score"
                value={profile?.examType && profile?.overallScore ? `${profile.examType}: ${profile.overallScore}` : 'Not set'}
              />
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="w-full mt-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-900 font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              View Full Profile
            </button>
          </div>

          {/* Dynamic Alerts Based on Missing Info */}
          {/* Profile Completion Alert */}
          {stats.profileCompletion < 100 && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-orange-200 p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm">Complete Your Profile</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Your profile is {stats.profileCompletion}% complete. Fill in more details to improve your application chances.
                  </p>
                  <button
                    onClick={() => navigate('/profile')}
                    className="mt-3 text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    Complete Now <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* No Documents Alert */}
          {stats.profileCompletionData?.missingCritical?.noDocuments && (
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border border-red-200 p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Upload className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm">Upload Documents</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    No documents uploaded yet. Upload your academic certificates, passport, and other required documents.
                  </p>
                  <button
                    onClick={() => navigate('/profile')}
                    className="mt-3 text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    Upload Now <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* No Education Alert */}
          {stats.profileCompletionData?.missingCritical?.noEducation && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm">Add Education History</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Add your academic background including schools, colleges, and degrees to strengthen your profile.
                  </p>
                  <button
                    onClick={() => navigate('/profile')}
                    className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Add Education <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* No Test Scores Alert */}
          {stats.profileCompletionData?.missingCritical?.noTestScores && (
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200 p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm">Add Test Scores</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Add your IELTS, TOEFL, or other English proficiency test scores to complete your profile.
                  </p>
                  <button
                    onClick={() => navigate('/profile')}
                    className="mt-3 text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    Add Scores <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, bgColor, iconColor, onClick }) => (
  <div
    className={`bg-white rounded-xl border border-gray-200 p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  </div>
);

// Quick Action Button Component
const QuickActionButton = ({ icon: Icon, label, onClick, color }) => {
  const colors = {
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700',
    green: 'bg-green-50 hover:bg-green-100 text-green-700',
    purple: 'bg-purple-50 hover:bg-purple-100 text-purple-700',
    gray: 'bg-gray-50 hover:bg-gray-100 text-gray-700'
  };

  return (
    <button
      onClick={onClick}
      className={`${colors[color]} rounded-lg p-4 transition-colors flex flex-col items-center gap-2 font-medium text-sm`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
};

// Application Card Component
const ApplicationCard = ({ application, getStatusColor, getStatusLabel }) => {
  const navigate = useNavigate();
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/applications/${application._id}`)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-sm">{application.programSnapshot?.universityName || 'University Name'}</h3>
          <p className="text-xs text-gray-600 mt-1">{application.programSnapshot?.programName || 'Course Name'}</p>
          <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(application.stage)}`}>
            {getStatusLabel(application.stage)}
          </span>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Profile Field Component
const ProfileField = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon className="w-4 h-4 text-gray-400 mt-0.5" />
    <div className="flex-1">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-sm text-gray-900 font-medium mt-0.5">{value}</p>
    </div>
  </div>
);

export default StudentDashboard;
