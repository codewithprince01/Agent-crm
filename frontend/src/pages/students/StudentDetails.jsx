import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { User, UserCircle2, Home, GraduationCap, MessageSquare, Lock, Edit, ChevronLeft, Globe, MapPin, Phone, Mail, Calendar, FileText, CheckCircle2, LogOut, KeyRound } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import studentService from '../../services/studentService';
import agentService from '../../services/agentService';
import { REQUIRED_STUDENT_DOCUMENTS, ROLES } from '../../utils/constants';
import StudentDocumentUpload from '../../components/students/StudentDocumentUpload';
import ProgramDetailsModal from '../../components/students/ProgramDetailsModal';
import { AlertCircle, Shield, ExternalLink, Download, Trash2, Loader2, Save, CheckCircle2 as CheckCircle } from 'lucide-react';

const StudentDetails = ({ studentId: explicitId, forceReadOnly = false }) => {
  const { id: paramId } = useParams();
  const id = explicitId || paramId;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const generalRef = useRef(null);
  const educationRef = useRef(null);
  const testScoresRef = useRef(null);
  const backgroundRef = useRef(null);
  const uploadRef = useRef(null);
  const profileRef = useRef(null);
  const applicationsRef = useRef(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [missingDocs, setMissingDocs] = useState([]);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const isAdmin = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role);
  const isStudent = user?.role === 'student' || user?.role === ROLES.STUDENT;
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const [studentData, setStudentData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    c_code: "91",
    father: "",
    mother: "",
    dob: "",
    first_language: "",
    nationality: "",
    passport_number: "",
    passport_expiry: "",
    marital_status: "Single",
    gender: "Male",
    home_address: "",
    city: "",
    state: "",
    country: "",
    zipcode: "",
    home_contact_number: "",
    referredBy: "",
    // Extra fields from record
    isEmailVerified: false,
    emailVerifiedAt: "",
    tempStudentId: "",
    currentStep: 1,
    isCompleted: false,
    isDraft: true,
    lastSavedStep: 0,
    status: "",
    createdAt: "",
    updatedAt: "",
    // Academic
    academicLevel: "",
    educationCountry: "",
    highestLevel: "",
    gradingScheme: "",
    gradeAverage: "",
    // Test Scores
    examType: "",
    examDate: "",
    listeningScore: "",
    readingScore: "",
    writingScore: "",
    speakingScore: "",
    overallScore: "",
    // Background
    visaRefusal: "",
    studyPermit: "",
    backgroundDetails: "",
    documents: {},
    applications: [] // Added applications array
  });

  const [referrerName, setReferrerName] = useState("");
  const [referrerRole, setReferrerRole] = useState("");

  // Fetch student data on component mount
  useEffect(() => {
    fetchStudentData();
  }, [id]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const response = await studentService.getStudentById(id);

      // The API returns student data in response.data.data.student
      const studentInfo = response?.data?.data?.student || response?.data?.student || response?.data;

      if (studentInfo) {
        setStudentData({
          firstName: studentInfo.firstName || "",
          lastName: studentInfo.lastName || "",
          email: studentInfo.email || "",
          mobile: studentInfo.phone || studentInfo.mobile || "",
          c_code: studentInfo.countryCode || studentInfo.c_code || "91",
          father: studentInfo.fatherName || studentInfo.father || "",
          mother: studentInfo.motherName || studentInfo.mother || "",
          dob: studentInfo.dateOfBirth || studentInfo.dob || "",
          first_language: studentInfo.firstLanguage || studentInfo.first_language || "",
          nationality: studentInfo.nationality || "",
          passport_number: studentInfo.passportNumber || studentInfo.passport_number || "",
          passport_expiry: studentInfo.passportExpiry || studentInfo.passport_expiry || "",
          marital_status: studentInfo.maritalStatus || studentInfo.marital_status || "Single",
          gender: studentInfo.gender || "Male",
          home_address: studentInfo.address || studentInfo.home_address || "",
          city: studentInfo.city || "",
          state: studentInfo.state || "",
          country: studentInfo.country || "",
          zipcode: studentInfo.postalCode || studentInfo.zipcode || "",
          home_contact_number: studentInfo.home_contact_number || "",
          referredBy: studentInfo.referredBy || "",
          // Extra fields mapping
          isEmailVerified: studentInfo.isEmailVerified || false,
          emailVerifiedAt: studentInfo.emailVerifiedAt || "",
          tempStudentId: studentInfo.tempStudentId || "",
          currentStep: studentInfo.currentStep || 1,
          isCompleted: studentInfo.isCompleted || false,
          isDraft: studentInfo.isDraft || false,
          lastSavedStep: studentInfo.lastSavedStep || 0,
          status: studentInfo.status || "",
          createdAt: studentInfo.createdAt || "",
          updatedAt: studentInfo.updatedAt || "",
          // Academic
          academicLevel: studentInfo.academicLevel || "",
          educationCountry: studentInfo.educationCountry || studentInfo.country || "",
          highestLevel: studentInfo.highestLevel || "",
          gradingScheme: studentInfo.gradingScheme || "",
          gradeAverage: studentInfo.gradeAverage || "",
          // Test Scores
          examType: studentInfo.examType || "",
          examDate: studentInfo.examDate || "",
          listeningScore: studentInfo.listeningScore || "",
          readingScore: studentInfo.readingScore || "",
          writingScore: studentInfo.writingScore || "",
          speakingScore: studentInfo.speakingScore || "",
          overallScore: studentInfo.overallScore || "",
          // Background
          visaRefusal: studentInfo.visaRefusal || "",
          studyPermit: studentInfo.studyPermit || "",
          backgroundDetails: studentInfo.backgroundDetails || "",
          documents: studentInfo.documents || {},
          applications: studentInfo.applications || [] // Map applications from API response
        });

        // Set Referrer Info from backend data
        setReferrerName(studentInfo.referredByName || "Direct");
        setReferrerRole(studentInfo.referredByRole || "");
      }
    } catch (err) {
      console.error('Error fetching student:', err);
      setError('Failed to load student data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Current Student Data State:', studentData);
    console.log('Documents Object:', studentData.documents);
  }, [studentData]);

  // Calculate missing documents
  useEffect(() => {
    if (studentData && studentData.documents) {
      console.log('Syncing Student Documents:', studentData.documents);
      const uploadedKeys = Object.keys(studentData.documents).filter(key => studentData.documents[key]);
      console.log('Uploaded Keys:', uploadedKeys);
      const missing = REQUIRED_STUDENT_DOCUMENTS.filter(doc => !uploadedKeys.includes(doc.key)).map(d => d.label);
      setMissingDocs(missing);
    }
  }, [studentData]);

  // Construct backend URL helper
  const getFullUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    if (url.startsWith('http')) return url;
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    // Remove leading slash from url if present
    const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    return `${backendUrl}/${cleanUrl}`;
  };

  const handleTabClick = (tab, ref) => {
    setActiveTab(tab);
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [qualifications, setQualifications] = useState({
    gre: false,
    gmat: false,
    sat: false,
  });

  const toggle = (key) => {
    setQualifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Static country data
  const countriesData = [
    { code: "IN", name: "INDIA" },
    { code: "US", name: "UNITED STATES" },
    { code: "GB", name: "UNITED KINGDOM" },
    { code: "CA", name: "CANADA" },
    { code: "AU", name: "AUSTRALIA" },
  ];

  const phoneCode = [
    { phonecode: "1" },
    { phonecode: "7" },
    { phonecode: "44" },
    { phonecode: "61" },
    { phonecode: "91" },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100">
        <div className="text-red-600 text-xl font-semibold mb-4">{error}</div>
        <button
          onClick={() => navigate('/students')}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Back to Students
        </button>
      </div>
    );
  }

  return (
    <>
      {!explicitId && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/students')}
              className="flex items-center gap-2 group text-gray-600 hover:text-blue-600 transition-colors font-medium bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100"
            >
              <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              Back to Student List
            </button>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100 uppercase tracking-wider">
                Active Profile
              </span>
            </div>
          </div>
        </div>
      )}
      {/* Top Section - Navigation Pills (Outside max-w container for proper sticky) */}
      <div className="sticky top-[64px] z-40 bg-gray-50/95 backdrop-blur-md py-4 transition-all border-b border-gray-200 shadow-sm w-full px-4 md:px-8">
        <div className="flex flex-nowrap gap-4 md:justify-center justify-start overflow-x-auto pb-2 no-scrollbar w-full">
          {[
            { id: "general", label: "General Information", ref: generalRef },
            { id: "education", label: "Education History", ref: educationRef },
            { id: "testScores", label: "Test Scores", ref: testScoresRef },
            { id: "backgroundInfo", label: "Background Info", ref: backgroundRef },
            { id: "uploadDocs", label: "Documents", ref: uploadRef },
            { id: "applications", label: "Applied Programs", ref: applicationsRef },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id, tab.ref)}
              className={`px-2.5 justify-around py-2.5 rounded-full text-sm font-semibold transition-all duration-300 shadow-sm border ${activeTab === tab.id
                ? "bg-blue-600 text-white border-blue-600 shadow-blue-200"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-6 mt-6">
        {/* Missing Documents Alert - Same as Agent Profile */}
        {missingDocs.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="p-2 bg-amber-100 rounded-full text-amber-600 shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-amber-900 mb-1">Action Required: Complete Student Profile</h4>
              <p className="text-sm text-amber-700 mb-2">This student profile is missing required documents. Please upload them to ensure full verification and application readiness.</p>
              <div className="flex flex-wrap gap-2">
                {missingDocs.map(doc => (
                  <span key={doc} className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-md border border-amber-200 uppercase tracking-tighter">
                    {doc}
                  </span>
                ))}
              </div>
              <button
                onClick={() => handleTabClick('uploadDocs', uploadRef)}
                className="mt-3 text-sm font-bold text-amber-800 hover:text-amber-900 underline decoration-2 underline-offset-2"
              >
                Jump to Documents Section &rarr;
              </button>
            </div>
          </div>
        )}


        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Profile Card */}
          <div ref={profileRef} className="lg:w-1/3 xl:w-1/4 scroll-mt-40">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden sticky top-36">
              <div className="h-24 bg-gradient-to-r from-blue-700 to-blue-900"></div>
              <div className="px-6 pb-8">
                <div className="relative flex justify-center -mt-12 mb-4">
                  <div className="p-1 bg-white rounded-full shadow-lg">
                    <div className="bg-blue-50 rounded-full w-24 h-24 overflow-hidden flex items-center justify-center border-2 border-white">
                      {(() => {
                        const docs = studentData.documents || {};
                        // Robust check: find any key that includes 'photo' and has a value
                        const photoKey = Object.keys(docs).find(k => k.toLowerCase().includes('photo') && docs[k]);

                        let url = photoKey ? docs[photoKey] : null;

                        // Handle object format (from public uploads) vs string format (from manual uploads)
                        if (url && typeof url === 'object' && url.documentUrl) {
                          url = url.documentUrl;
                        }

                        if (url) {
                          return (
                            <img
                              src={getFullUrl(url)}
                              alt="Profile"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<div class="w-16 h-16 text-blue-600 flex items-center justify-center"><svg class="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>';
                              }}
                            />
                          );
                        }
                        return <UserCircle2 className="w-16 h-16 text-blue-600" />;
                      })()}
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    {studentData.firstName} {studentData.lastName}
                  </h2>
                  <p className="text-gray-500 text-sm overflow-hidden text-ellipsis whitespace-nowrap">{studentData.email}</p>
                  <div className="mt-4 inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                    {explicitId ? 'My Student Profile' : 'Portal Student'}
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" /> Phone
                    </span>
                    <span className="text-gray-900 font-medium font-mono">+{studentData.c_code} {studentData.mobile}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-gray-50 pb-3">
                    <span className="text-gray-500 flex items-center gap-2">
                      <User className="w-3.5 h-3.5" /> Gender
                    </span>
                    <span className="text-gray-900 font-medium">{studentData.gender}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> DOB
                    </span>
                    <span className="text-gray-900 font-medium">{studentData.dob ? new Date(studentData.dob).toLocaleDateString() : "N/A"}</span>
                  </div>
                </div>

                {/* Sidebar Actions: Referral Info (Admin/Agent) OR Student Actions (Student) */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  {isStudent ? (
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => navigate('/change-password')}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:text-blue-600 transition-all font-semibold shadow-sm group"
                      >
                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        Change Password
                      </button>

                      <button
                        onClick={() => setLogoutConfirm(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-red-100 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all font-semibold shadow-sm group"
                      >
                        <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                          <LogOut className="w-4 h-4" />
                        </div>
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[13px] text-gray-400 font-bold uppercase tracking-wider">Referrer Name</span>
                        <span className="text-sm text-gray-900 font-bold flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          {referrerName}
                          {referrerRole && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 ml-1">
                              {referrerRole}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-2">
                        <span className="text-[13px] text-gray-400 font-bold uppercase tracking-wider">Referral ID</span>
                        <span className="text-[13px] text-blue-600 font-mono break-all bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50 block">
                          {studentData.referredBy || "DIRECT_ENTRY"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {!explicitId && (
                  <div className="mt-8">
                    <button
                      onClick={() => navigate('/students')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold"
                    >
                      <Home className="w-4 h-4" /> Back to Students
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Main Details Content */}
          <div className="lg:w-2/3 xl:w-3/4 space-y-8 pb-20">
            {/* General Information */}
            <div ref={generalRef} className="scroll-mt-40">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <User className="text-blue-600 w-5 h-5" /> Personal Details
                  </h3>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">First Name</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                        {studentData.firstName}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Last Name</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                        {studentData.lastName}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 font-mono"><Mail className="inline w-3 h-3 mr-1" /> Email Address</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                        {studentData.email}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2"><Phone className="inline w-3 h-3 mr-1" /> Contact Number</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                        +{studentData.c_code} {studentData.mobile}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Father Name</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                        {studentData.father || "Not provided"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Mother Name</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                        {studentData.mother || "Not provided"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Marital Status</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                        {studentData.marital_status}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2"><Globe className="inline w-3 h-3 mr-1" /> Nationality</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                        {studentData.nationality || "INDIA"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">First Language</label>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                        {studentData.first_language || "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 pt-6 border-t border-gray-100">
                    <h4 className="text-gray-900 font-bold mb-6 flex items-center gap-2">
                      <FileText className="text-blue-600 w-5 h-5" /> Passport & Verification
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Passport Number</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-mono font-bold tracking-widest">
                          {studentData.passport_number || "N/A"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Passport Expiry</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                          {studentData.passport_expiry ? new Date(studentData.passport_expiry).toLocaleDateString() : "N/A"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Email Verification</label>
                        <div className={`rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2 ${studentData.isEmailVerified ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                          {studentData.isEmailVerified ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          {studentData.isEmailVerified ? "Verified" : "Unverified"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 pt-6 border-t border-gray-100">
                    <h4 className="text-gray-900 font-bold mb-6 flex items-center gap-2">
                      <MapPin className="text-blue-600 w-5 h-5" /> Address Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Residential Address</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 min-h-[60px]">
                          {studentData.home_address || "Address not fully provided"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">City</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                          {studentData.city || "-"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">State / Province</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                          {studentData.state || "-"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Postal Code</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-mono font-medium">
                          {studentData.zipcode || "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 pt-6 border-t border-gray-100 bg-gray-50/30 -mx-8 px-8 pb-4 rounded-b-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Status</label>
                        <div className="text-xs font-bold text-gray-700 uppercase flex items-center justify-center sm:justify-start gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${studentData.status === 'active' ? 'bg-green-500' : 'bg-gray-400'} shadow-sm`}></div>
                          {studentData.status || "N/A"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Profile Step</label>
                        <div className="text-xs font-bold text-gray-700">{studentData.currentStep} of 4</div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Last Updated</label>
                        <div className="text-[10px] font-medium text-gray-500">{studentData.updatedAt ? new Date(studentData.updatedAt).toLocaleString() : "N/A"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Education History */}
            <div ref={educationRef} className="scroll-mt-40">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <GraduationCap className="text-blue-600 w-5 h-5" /> Academic Summary
                  </h3>
                </div>
                <div className="p-8">
                  {studentData.academicLevel || studentData.highestLevel ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Academic Level</label>
                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-3 text-blue-900 font-semibold uppercase tracking-tight">
                          {studentData.academicLevel || "N/A"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Education Country</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                          {studentData.educationCountry || "INDIA"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Highest Education</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                          {studentData.highestLevel || "N/A"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Grading Scheme</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                          {studentData.gradingScheme || "N/A"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Grade Average</label>
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-indigo-900 font-bold text-lg">
                          {studentData.gradeAverage || "N/A"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400 italic">
                      <GraduationCap className="mx-auto w-10 h-10 mb-2 opacity-20" />
                      Academic records not available for this student.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Test Scores */}
            <div ref={testScoresRef} className="scroll-mt-40">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="text-blue-600 w-5 h-5" /> Proficiency Test Scores
                  </h3>
                </div>
                <div className="p-8">
                  {studentData.examType ? (
                    <div className="space-y-8">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold text-lg shadow-md">
                          {studentData.examType}
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <Calendar className="w-4 h-4" /> Exam Date: {studentData.examDate ? new Date(studentData.examDate).toLocaleDateString() : "N/A"}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[
                          { label: "Listening", score: studentData.listeningScore },
                          { label: "Reading", score: studentData.readingScore },
                          { label: "Writing", score: studentData.writingScore },
                          { label: "Speaking", score: studentData.speakingScore },
                        ].map((item, i) => (
                          <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center hover:shadow-md transition-shadow">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</div>
                            <div className="text-xl font-black text-gray-800">{item.score || "-"}</div>
                          </div>
                        ))}
                        <div className="col-span-2 bg-blue-600 rounded-2xl p-4 text-center shadow-lg shadow-blue-200">
                          <div className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mb-1">Overall Band</div>
                          <div className="text-2xl font-black text-white">{studentData.overallScore || "-"}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400 italic">
                      <MessageSquare className="mx-auto w-10 h-10 mb-2 opacity-20" />
                      No proficiency tests taken by this student yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Background Information */}
            <div ref={backgroundRef} className="scroll-mt-40">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="text-blue-600 w-5 h-5" /> Background & Visa History
                  </h3>
                </div>
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <h5 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> Visa Refusal History
                      </h5>
                      <p className="text-gray-700 leading-relaxed min-h-[50px]">
                        {studentData.visaRefusal || "No previous visa refusals reported."}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <h5 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div> Study Permit Details
                      </h5>
                      <p className="text-gray-700 leading-relaxed min-h-[50px]">
                        {studentData.studyPermit || "No previous study permits held."}
                      </p>
                    </div>
                  </div>

                  {studentData.backgroundDetails && (
                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                      <h5 className="text-blue-900 font-bold mb-2">Additional Background Information</h5>
                      <p className="text-blue-800 text-sm leading-relaxed">
                        {studentData.backgroundDetails}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Upload Documents (Parity with Agent Module) */}
            <div ref={uploadRef} className="scroll-mt-40">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="text-blue-600 w-5 h-5" /> Document Verification Vault
                  </h3>
                  {missingDocs.length > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-full border border-amber-200 uppercase tracking-tighter animate-pulse">
                      {missingDocs.length} Pending
                    </span>
                  )}
                </div>
                <div className="p-8">
                  <StudentDocumentUpload
                    student={{ ...studentData, id, _id: id }}
                    onUploadSuccess={fetchStudentData}
                    isAdmin={isAdmin && !forceReadOnly}
                  />
                </div>
              </div>
            </div>
            {/* Applied Programs */}
            <div ref={applicationsRef} className="scroll-mt-40">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 className="text-blue-600 w-5 h-5" /> Applied Programs History
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-black rounded-lg">
                    Total: {studentData.applications?.length || 0}
                  </span>
                </div>
                <div className="p-8">
                  {studentData.applications && studentData.applications.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studentData.applications.map((app, idx) => (
                        <div key={idx} className="p-5 bg-gray-50 border border-gray-100 rounded-3xl hover:bg-white hover:shadow-xl transition-all group border-l-4 border-l-blue-500">
                          <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                              <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100 uppercase tracking-tighter">
                                {app.applicationNo}
                              </span>
                              <h5 className="font-black text-gray-900 leading-tight mt-1">
                                {app.programSnapshot?.programName}
                              </h5>
                              <p className="text-xs font-bold text-gray-500">
                                {app.programSnapshot?.universityName}
                              </p>
                            </div>
                            <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${app.stage === 'Arrival' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                              }`}>
                              {app.stage}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-[10px] font-bold text-gray-500 uppercase">Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                            </div>
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-1"
                            >
                              View Details
                              <Globe className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400 italic bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                      <CheckCircle2 className="mx-auto w-12 h-12 mb-3 opacity-10" />
                      <p className="font-bold text-gray-500">No applications found for this student.</p>
                      {!forceReadOnly && (
                        <button
                          onClick={() => navigate(`/program-selection/${id}`)}
                          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                        >
                          Apply Now
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ProgramDetailsModal
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        application={selectedApp}
      />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutConfirm} onOpenChange={setLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default StudentDetails;
