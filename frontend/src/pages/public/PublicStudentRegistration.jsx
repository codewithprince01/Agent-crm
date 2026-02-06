import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, ArrowRight, Check, User, GraduationCap, FileText, Info } from 'lucide-react';
import { useToast } from '../../components/ui/toast';
import { getTempStudentId, saveTempStudentId, clearTempStudentId, getDaysUntilExpiry } from '../../utils/draftStorage';
import EmailVerification from '../../components/EmailVerification';

const PublicStudentRegistration = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [resumingDraft, setResumingDraft] = useState(false);
    const [referralInfo, setReferralInfo] = useState(null);
    const [emailVerified, setEmailVerified] = useState(false); // NEW: Track email verification

    const generalRef = useRef(null);
    const educationRef = useRef(null);
    const testScoresRef = useRef(null);
    const backgroundRef = useRef(null);

    const [formData, setFormData] = useState({
        // Step 1: Personal Information
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        c_code: '91',
        father: '',
        mother: '',
        dob: '',
        first_language: '',
        nationality: '',
        passport_number: '',
        passport_expiry: '',
        marital_status: 'Single',
        gender: 'Male',
        home_address: '',
        city: '',
        state: '',
        country: '',
        zipcode: '',
        home_contact_number: '',
        referredBy: '',
        // Step 2: Education
        education_country: '',
        highest_level: '',
        grading_scheme: '',
        grade_average: '',
        // Step 3: Test Scores
        exam_type: '',
        exam_date: '',
        listening_score: '',
        reading_score: '',
        writing_score: '',
        speaking_score: '',
        overall_score: '',
        // Step 4: Background
        visa_refusal: '',
        study_permit: '',
        background_details: '',
    });

    // On component mount: Check for draft or referral
    useEffect(() => {
        const initializeForm = async () => {
            const tempId = getTempStudentId();
            const urlParams = new URLSearchParams(window.location.search);
            const referralCode = urlParams.get('ref');

            if (tempId) {
                // Resume existing draft
                await resumeDraft(tempId);
            } else if (referralCode) {
                // New registration with referral
                setFormData(prev => ({ ...prev, referredBy: referralCode }));
                await fetchReferralInfo(referralCode);
            }
        };

        initializeForm();
    }, []);

    // Fetch referral info to show who referred them
    const fetchReferralInfo = async (referralId) => {
        try {
            // TODO: Add API call to get referrer info
            // const response = await axios.get(`/api/users/${referralId}`);
            // setReferralInfo(response.data);

            // For now, just set the ID
            setReferralInfo({ id: referralId, name: 'Loading...', role: 'admin' });
        } catch (error) {
            console.error('Failed to fetch referral info:', error);
        }
    };

    // Resume draft function
    const resumeDraft = async (tempId) => {
        try {
            setResumingDraft(true);
            const response = await axios.get(`http://localhost:5000/api/students/draft/${tempId}`, {
                withCredentials: true
            });
            const { student } = response.data;

            // Auto-fill form data
            setFormData(student.formData);
            setCurrentStep(student.currentStep);

            if (student.referredBy) {
                await fetchReferralInfo(student.referredBy);
            }

            const daysLeft = getDaysUntilExpiry();
            toast.success(`Welcome back! Your progress has been saved. ${daysLeft} days remaining.`);
        } catch (error) {
            console.error('Failed to resume draft:', error);
            clearTempStudentId();
            toast.error('Failed to resume your application. Starting fresh.');
        } finally {
            setResumingDraft(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Validate current step before saving/proceeding
    const validateCurrentStep = () => {
        switch (currentStep) {
            case 1:
                // Step 1: Personal Information - Required fields
                if (!formData.firstName || !formData.firstName.trim()) { toast.error('First Name is required'); return false; }
                if (!formData.lastName || !formData.lastName.trim()) { toast.error('Last Name is required'); return false; }
                if (!formData.email || !formData.email.trim()) { toast.error('Email Address is required'); return false; }
                if (!formData.mobile || !formData.mobile.trim()) { toast.error('Mobile Number is required'); return false; }
                if (!formData.dob) { toast.error('Date of Birth is required'); return false; }
                if (!formData.nationality) { toast.error('Nationality/Citizenship is required'); return false; }
                if (!emailVerified) { toast.error('Please verify your email address before proceeding'); return false; }
                break;

            case 2:
                // Step 2: Education - Mandatory fields
                if (!formData.education_country) { toast.error('Country of Education is required'); return false; }
                if (!formData.highest_level) { toast.error('Highest Level of Education is required'); return false; }
                if (!formData.grading_scheme) { toast.error('Grading Scheme is required'); return false; }
                if (!formData.grade_average || !formData.grade_average.trim()) { toast.error('Grade Average is required'); return false; }
                break;

            case 3:
                // Step 3: Test Scores - Mandatory fields
                if (!formData.exam_type) { toast.error('English Exam Type is required'); return false; }
                if (!formData.exam_date) { toast.error('Exam Date is required'); return false; }
                if (!formData.listening_score || !formData.listening_score.trim()) { toast.error('Listening Score is required'); return false; }
                if (!formData.reading_score || !formData.reading_score.trim()) { toast.error('Reading Score is required'); return false; }
                if (!formData.writing_score || !formData.writing_score.trim()) { toast.error('Writing Score is required'); return false; }
                if (!formData.speaking_score || !formData.speaking_score.trim()) { toast.error('Speaking Score is required'); return false; }
                if (!formData.overall_score || !formData.overall_score.trim()) { toast.error('Overall Score is required'); return false; }
                break;

            case 4:
                // Step 4: Background - Mandatory fields
                if (!formData.visa_refusal) { toast.error('Visa Refusal history must be specified'); return false; }
                if (!formData.study_permit) { toast.error('Study Permit status is required'); return false; }
                break;

            default:
                break;
        }
        return true;
    };

    // Save current step
    const handleSaveStep = async () => {
        // Validate before saving
        if (!validateCurrentStep()) {
            return;
        }

        try {
            setLoading(true);
            const tempId = getTempStudentId();

            if (currentStep === 1 && !tempId) {
                // First time saving Step 1 - create draft
                const response = await axios.post('http://localhost:5000/api/students/draft/step1', {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    mobile: formData.mobile,
                    c_code: formData.c_code,
                    referredBy: formData.referredBy,
                    father: formData.father,
                    mother: formData.mother,
                    dob: formData.dob,
                    first_language: formData.first_language,
                    nationality: formData.nationality,
                    passport_number: formData.passport_number,
                    passport_expiry: formData.passport_expiry,
                    marital_status: formData.marital_status,
                    gender: formData.gender,
                    home_address: formData.home_address,
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                    zipcode: formData.zipcode,
                }, {
                    withCredentials: true
                });

                saveTempStudentId(response.data.tempStudentId);
                toast.success('Step 1 saved! You can resume anytime.');
            } else if (tempId) {
                // Update existing draft
                await axios.put(`http://localhost:5000/api/students/draft/${tempId}/step/${currentStep}`, {
                    stepData: formData
                }, {
                    withCredentials: true
                });

                toast.success(`Step ${currentStep} saved successfully!`);
            }
        } catch (error) {
            console.error('Failed to save step:', error);
            toast.error('Failed to save progress. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = async () => {
        // Validate before proceeding  
        if (!validateCurrentStep()) {
            return;
        }

        await handleSaveStep();
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleFinalSubmit = async () => {
        try {
            setLoading(true);
            const tempId = getTempStudentId();

            if (!tempId) {
                toast.error('Session expired. Please start again.');
                return;
            }

            // Final step validation
            if (!validateCurrentStep()) {
                return;
            }

            // Set a default password or ask user for password
            const response = await axios.post(`http://localhost:5000/api/students/draft/${tempId}/complete`, {
                finalStepData: formData,
                password: 'Student@123' // TODO: Let user set password
            }, {
                withCredentials: true
            });

            clearTempStudentId();
            toast.success('Registration completed successfully!');

            // Redirect to success page
            setTimeout(() => {
                navigate('/registration-success');
            }, 2000);
        } catch (error) {
            console.error('Registration failed:', error);
            if (error.response?.data?.code === 'EMAIL_EXISTS') {
                toast.error('Email already registered. Please use a different email.');
            } else {
                toast.error('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Static data
    const countriesData = [
        { code: 'IN', name: 'INDIA' },
        { code: 'US', name: 'UNITED STATES' },
        { code: 'GB', name: 'UNITED KINGDOM' },
        { code: 'CA', name: 'CANADA' },
        { code: 'AU', name: 'AUSTRALIA' },
    ];

    const phoneCode = [
        { phonecode: '1' },
        { phonecode: '44' },
        { phonecode: '61' },
        { phonecode: '91' },
    ];

    const steps = [
        { number: 1, title: 'Personal Info', icon: User },
        { number: 2, title: 'Education', icon: GraduationCap },
        { number: 3, title: 'Test Scores', icon: FileText },
        { number: 4, title: 'Background', icon: Info },
    ];

    if (resumingDraft) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your saved application...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-indigo-900 mb-2">Student Registration</h1>
                    <p className="text-gray-600">Complete your profile to get started</p>
                </div>

                {/* Draft Info Banner - Only show draft progress, not referral */}
                {getTempStudentId() && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <Info className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                            <div className="flex-1">
                                <p className="font-semibold text-blue-900">Progress Saved</p>
                                <p className="text-sm text-blue-700">
                                    Your application will be saved automatically. {getDaysUntilExpiry()} days remaining.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress Steps */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <React.Fragment key={step.number}>
                                <div className="flex flex-col items-center">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-semibold transition-all ${currentStep > step.number
                                        ? 'bg-green-500 text-white'
                                        : currentStep === step.number
                                            ? 'bg-indigo-600 text-white ring-4 ring-indigo-200'
                                            : 'bg-gray-200 text-gray-500'
                                        }`}>
                                        {currentStep > step.number ? <Check size={24} /> : <step.icon size={24} />}
                                    </div>
                                    <span className={`text-sm mt-2 font-medium ${currentStep === step.number ? 'text-indigo-600' : 'text-gray-500'
                                        }`}>
                                        {step.title}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 h-1 mx-4 rounded transition-all ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                                        }`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Form Content */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    {/* Step 1: Personal Information */}
                    {currentStep === 1 && (
                        <div ref={generalRef}>
                            <div className="mb-6">
                                <h3 className="text-2xl font-semibold text-indigo-700 flex items-center gap-2">
                                    <User size={28} />
                                    Personal Information
                                </h3>
                                <p className="text-gray-500 text-sm mt-1">Fill in your personal and passport details</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* First Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        placeholder="Enter first name"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                    />
                                </div>

                                {/* Last Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        placeholder="Enter last name"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="student@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                    />
                                </div>

                                {/* Mobile Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mobile Number <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex">
                                        <select
                                            name="c_code"
                                            value={formData.c_code}
                                            onChange={handleChange}
                                            className="border border-gray-300 rounded-l-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                        >
                                            {phoneCode.map((code, idx) => (
                                                <option key={idx} value={code.phonecode}>
                                                    +{code.phonecode}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            name="mobile"
                                            placeholder="Enter mobile number"
                                            value={formData.mobile}
                                            onChange={handleChange}
                                            className="border border-gray-300 rounded-r-lg p-3 w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                        />
                                    </div>
                                </div>

                                {/* Father Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Father's Name
                                    </label>
                                    <input
                                        type="text"
                                        name="father"
                                        placeholder="Enter father's name"
                                        value={formData.father}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>

                                {/* Mother Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mother's Name
                                    </label>
                                    <input
                                        type="text"
                                        name="mother"
                                        placeholder="Enter mother's name"
                                        value={formData.mother}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>

                                {/* Date of Birth */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date of Birth
                                    </label>
                                    <input
                                        type="date"
                                        name="dob"
                                        value={formData.dob}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>

                                {/* First Language */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        First Language
                                    </label>
                                    <input
                                        type="text"
                                        name="first_language"
                                        placeholder="e.g., English, Hindi"
                                        value={formData.first_language}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>

                                {/* Nationality */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Country of Citizenship
                                    </label>
                                    <select
                                        name="nationality"
                                        value={formData.nationality}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                    >
                                        <option value="">Select country</option>
                                        {countriesData.map((country) => (
                                            <option key={country.code} value={country.name}>
                                                {country.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Passport Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Passport Number
                                    </label>
                                    <input
                                        type="text"
                                        name="passport_number"
                                        placeholder="Enter passport number"
                                        value={formData.passport_number}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>

                                {/* Passport Expiry */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Passport Expiry Date
                                    </label>
                                    <input
                                        type="date"
                                        name="passport_expiry"
                                        value={formData.passport_expiry}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>

                                {/* Marital Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Marital Status
                                    </label>
                                    <select
                                        name="marital_status"
                                        value={formData.marital_status}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    >
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Divorced">Divorced</option>
                                    </select>
                                </div>

                                {/* Gender */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Gender
                                    </label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {/* Address Section */}
                                <div className="col-span-2">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Address Details</h4>
                                </div>

                                {/* Home Address */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Home Address
                                    </label>
                                    <input
                                        type="text"
                                        name="home_address"
                                        placeholder="Enter complete address"
                                        value={formData.home_address}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>

                                {/* City */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="Enter city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>

                                {/* State */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        State/Province
                                    </label>
                                    <input
                                        type="text"
                                        name="state"
                                        placeholder="Enter state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>

                                {/* Country */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Country
                                    </label>
                                    <select
                                        name="country"
                                        value={formData.country}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    >
                                        <option value="">Select country</option>
                                        {countriesData.map((country) => (
                                            <option key={country.code} value={country.name}>
                                                {country.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Zipcode */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Postal/Zip Code
                                    </label>
                                    <input
                                        type="text"
                                        name="zipcode"
                                        placeholder="Enter postal code"
                                        value={formData.zipcode}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>
                            </div>

                            {/* NEW: Email Verification Component */}
                            {formData.email && (
                                <EmailVerification
                                    email={formData.email}
                                    onVerified={() => setEmailVerified(true)}
                                />
                            )}
                        </div>
                    )}

                    {/* Step 2: Education - Will continue in next message due to length */}
                    {currentStep === 2 && (
                        <div ref={educationRef}>
                            <div className="mb-6">
                                <h3 className="text-2xl font-semibold text-indigo-700 flex items-center gap-2">
                                    <GraduationCap size={28} />
                                    Education History
                                </h3>
                                <p className="text-gray-500 text-sm mt-1">Provide your education details</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Similar fields as CreateStudent form */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Country of Education
                                    </label>
                                    <select
                                        name="education_country"
                                        value={formData.education_country}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    >
                                        <option value="">Select country</option>
                                        {countriesData.map((country) => (
                                            <option key={country.code} value={country.name}>
                                                {country.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Highest Level of Education
                                    </label>
                                    <select
                                        name="highest_level"
                                        value={formData.highest_level}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    >
                                        <option value="">Select level</option>
                                        <option>Under-Graduate</option>
                                        <option>Post-Graduate</option>
                                        <option>Diploma</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Grading Scheme
                                    </label>
                                    <select
                                        name="grading_scheme"
                                        value={formData.grading_scheme}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    >
                                        <option value="">Select scheme</option>
                                        <option>Percentage</option>
                                        <option>CGPA</option>
                                        <option>GPA</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Grade Average/Score
                                    </label>
                                    <input
                                        type="text"
                                        name="grade_average"
                                        placeholder="e.g., 85%, 8.5 CGPA"
                                        value={formData.grade_average}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Test Scores */}
                    {currentStep === 3 && (
                        <div ref={testScoresRef}>
                            <div className="mb-6">
                                <h3 className="text-2xl font-semibold text-indigo-700 flex items-center gap-2">
                                    <FileText size={28} />
                                    Test Scores
                                </h3>
                                <p className="text-gray-500 text-sm mt-1">Enter English proficiency exam scores</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="col-span-3 md:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        English Exam Type
                                    </label>
                                    <select
                                        name="exam_type"
                                        value={formData.exam_type}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    >
                                        <option value="">Select exam</option>
                                        <option>IELTS</option>
                                        <option>TOEFL</option>
                                        <option>PTE</option>
                                        <option>Duolingo</option>
                                    </select>
                                </div>

                                <div className="col-span-3 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Exam Date
                                    </label>
                                    <input
                                        type="date"
                                        name="exam_date"
                                        value={formData.exam_date}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Listening Score
                                    </label>
                                    <input
                                        type="text"
                                        name="listening_score"
                                        placeholder="0.0"
                                        value={formData.listening_score}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reading Score
                                    </label>
                                    <input
                                        type="text"
                                        name="reading_score"
                                        placeholder="0.0"
                                        value={formData.reading_score}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Writing Score
                                    </label>
                                    <input
                                        type="text"
                                        name="writing_score"
                                        placeholder="0.0"
                                        value={formData.writing_score}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Speaking Score
                                    </label>
                                    <input
                                        type="text"
                                        name="speaking_score"
                                        placeholder="0.0"
                                        value={formData.speaking_score}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>

                                <div className="col-span-3 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Overall Score
                                    </label>
                                    <input
                                        type="text"
                                        name="overall_score"
                                        placeholder="0.0"
                                        value={formData.overall_score}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Background */}
                    {currentStep === 4 && (
                        <div ref={backgroundRef}>
                            <div className="mb-6">
                                <h3 className="text-2xl font-semibold text-indigo-700 flex items-center gap-2">
                                    <Info size={28} />
                                    Background Information
                                </h3>
                                <p className="text-gray-500 text-sm mt-1">Provide additional background details</p>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block font-medium text-gray-700 mb-2">
                                        Visa Refusal History?
                                    </label>
                                    <select
                                        name="visa_refusal"
                                        value={formData.visa_refusal}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    >
                                        <option value="">Select</option>
                                        <option value="YES">Yes</option>
                                        <option value="NO">No</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-medium text-gray-700 mb-2">
                                        Valid Study Permit?
                                    </label>
                                    <select
                                        name="study_permit"
                                        value={formData.study_permit}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    >
                                        <option value="">Select</option>
                                        <option value="YES">Yes</option>
                                        <option value="NO">No</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-medium text-gray-700 mb-2">
                                        Additional Details
                                    </label>
                                    <textarea
                                        name="background_details"
                                        rows="4"
                                        placeholder="Any additional information about your background..."
                                        value={formData.background_details}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t">
                        <button
                            onClick={handlePrevious}
                            disabled={currentStep === 1}
                            className={`px-6 py-3 rounded-lg font-medium transition-all ${currentStep === 1
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                                }`}
                        >
                            <ArrowLeft size={18} className="inline mr-2" />
                            Previous
                        </button>

                        <div className="flex gap-3">
                            <button
                                onClick={handleSaveStep}
                                disabled={loading || (currentStep === 1 && !emailVerified)}
                                className="px-6 py-3 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={18} />
                                {loading ? 'Saving...' : 'Save Progress'}
                            </button>

                            {currentStep < 4 ? (
                                <button
                                    onClick={handleNext}
                                    disabled={loading || (currentStep === 1 && !emailVerified)}
                                    className="px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={currentStep === 1 && !emailVerified ? 'Please verify your email to continue' : ''}
                                >
                                    Save & Next
                                    <ArrowRight size={18} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleFinalSubmit}
                                    disabled={loading}
                                    className="px-6 py-3 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                                >
                                    <Check size={18} />
                                    {loading ? 'Submitting...' : 'Complete Registration'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicStudentRegistration;
