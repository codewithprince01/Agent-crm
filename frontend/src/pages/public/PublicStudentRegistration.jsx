import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, ArrowRight, Check, User, GraduationCap, FileText, Info, UploadCloud } from 'lucide-react';
import { useToast } from '../../components/ui/toast';
import { getTempStudentId, saveTempStudentId, clearTempStudentId, getDaysUntilExpiry } from '../../utils/draftStorage';
import EmailVerification from '../../components/EmailVerification';
import DocumentUpload from '../../components/common/DocumentUpload';

const PublicStudentRegistration = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [resumingDraft, setResumingDraft] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState({}); // Track files selected for batch upload
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [referralInfo, setReferralInfo] = useState(null);
    const [emailVerified, setEmailVerified] = useState(false); // NEW: Track email verification
    const [errors, setErrors] = useState({}); // Validation errors state

    const generalRef = useRef(null);
    const educationRef = useRef(null);
    const testScoresRef = useRef(null);
    const backgroundRef = useRef(null);
    const documentsRef = useRef(null);

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
        // Step 5: Documents & ID Proof
        identity_type: '',
        identity_number: '',
        documents: [], // Array to store { documentType, documentUrl, documentName }
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
        const { name, value } = e.target;

        // Restrict score fields and grade average to positive numbers and decimals
        if (['listening_score', 'reading_score', 'writing_score', 'speaking_score', 'overall_score', 'grade_average'].includes(name)) {
            // Allow empty, or matching regex for partial decimal (e.g. "10.")
            if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
                return;
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear specific error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Validate current step before saving/proceeding
    const validateCurrentStep = () => {
        const newErrors = {};
        let isValid = true;
        const today = new Date();

        // Helper to set error
        const setError = (field, message) => {
            newErrors[field] = message;
            isValid = false;
        };

        if (currentStep === 1) {
            if (!formData.firstName?.trim()) setError('firstName', 'First Name is required');
            if (!formData.lastName?.trim()) setError('lastName', 'Last Name is required');
            if (!formData.email?.trim()) setError('email', 'Email Address is required');
            if (!formData.mobile?.trim()) setError('mobile', 'Mobile Number is required');
            if (!formData.nationality) setError('nationality', 'Nationality is required');

            // DOB Validation
            if (!formData.dob) {
                setError('dob', 'Date of Birth is required');
            } else {
                const dobDate = new Date(formData.dob);
                const minYear = 1900;
                const maxYear = today.getFullYear();

                if (dobDate > today) setError('dob', 'Date of Birth cannot be in the future');
                else if (dobDate.getFullYear() < minYear) setError('dob', 'Invalid Date of Birth');
                else if (dobDate.getFullYear().toString().length > 4) setError('dob', 'Invalid Year');
            }

            // Passport Expiry Validation (Must be > 6 months from today if provided)
            if (formData.passport_expiry) {
                const expiryDate = new Date(formData.passport_expiry);
                const sixMonthsFuture = new Date();
                sixMonthsFuture.setMonth(sixMonthsFuture.getMonth() + 6);
                const maxExpiryYear = today.getFullYear() + 20; // Reasonable cap (20 years)

                if (expiryDate < today) setError('passport_expiry', 'Passport has expired');
                else if (expiryDate < sixMonthsFuture) setError('passport_expiry', 'Passport must be valid for at least 6 months');
                else if (expiryDate.getFullYear() > maxExpiryYear) setError('passport_expiry', 'Invalid Expiry Date (Year too far in future)');
                else if (expiryDate.getFullYear().toString().length > 4) setError('passport_expiry', 'Invalid Year');
            }

            if (!emailVerified) {
                toast.error('Please verify your email address before proceeding');
                isValid = false;
            }
        }

        if (currentStep === 2) {
            if (!formData.education_country) setError('education_country', 'Country is required');
            if (!formData.highest_level) setError('highest_level', 'Highest Level is required');
            if (!formData.grading_scheme) setError('grading_scheme', 'Grading Scheme is required');
            if (!formData.grade_average?.trim()) setError('grade_average', 'Grade Average is required');
        }

        if (currentStep === 3) {
            if (!formData.exam_type) setError('exam_type', 'Exam Type is required');
            if (!formData.exam_date) {
                setError('exam_date', 'Exam Date is required');
            } else {
                const examDate = new Date(formData.exam_date);
                if (examDate.getFullYear().toString().length > 4) setError('exam_date', 'Invalid Year');
                // Exam date can be slightly in future if booked? Usually score report implies past.
                // But let's just cap the year to reasonable size.
            }

            // Score Validation Helper
            const validateScore = (field, label) => {
                const val = formData[field];
                if (!val) {
                    setError(field, `${label} is required`);
                } else if (isNaN(val) || Number(val) < 0) {
                    setError(field, 'Must be a positive number');
                } else if (!/^\d+(\.\d{1,2})?$/.test(val)) {
                    // Allow 1 or 2 decimal places max, or integer
                    // Actually, usually checks against alphabets are covered by isNaN, but let's be strict
                    setError(field, 'Invalid format (e.g. 7.5)');
                }
            };

            validateScore('listening_score', 'Listening Score');
            validateScore('reading_score', 'Reading Score');
            validateScore('writing_score', 'Writing Score');
            validateScore('speaking_score', 'Speaking Score');
            validateScore('overall_score', 'Overall Score');
        }

        if (currentStep === 4) {
            if (!formData.visa_refusal) setError('visa_refusal', 'Please select an option');
            if (!formData.study_permit) setError('study_permit', 'Please select an option');
        }

        if (currentStep === 5) {
            if (!formData.identity_type) setError('identity_type', 'ID Proof Type is required');
            if (!formData.identity_number?.trim()) setError('identity_number', 'ID Number is required');



            // Document existence check (chk uploaded OR selected)
            const getDoc = (type) => {
                const uploaded = formData.documents?.find(d => d.documentType === type);
                const selected = selectedFiles[type];
                return uploaded || selected;
            };
            const docErrors = [];

            if (!getDoc('photo')) docErrors.push('Student Photo');
            if (!getDoc('identity_proof')) docErrors.push('Identity Proof');
            if (!getDoc('marksheet_10')) docErrors.push('10th Marksheet');
            if (!getDoc('marksheet_12')) docErrors.push('12th Marksheet');
            if (!getDoc('resume')) docErrors.push('Resume');

            if (docErrors.length > 0) {
                toast.error(`Please upload: ${docErrors.join(', ')}`);
                isValid = false;
            }
        }

        setErrors(newErrors);

        // Show generic toast if validation failed
        if (!isValid && Object.keys(newErrors).length > 0) {
            toast.error('Please fix the errors in the form');
        }

        return isValid;
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
        if (currentStep < 5) {
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

            // Upload any pending files first
            if (Object.keys(selectedFiles).length > 0) {
                const uploadSuccess = await uploadAllDocuments(tempId);
                if (!uploadSuccess) return;
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
        { number: 5, title: 'Documents', icon: UploadCloud },
    ];

    // Helper to update document state after upload
    const handleDocumentUpload = (type, documentData) => {
        setFormData(prev => {
            // Remove existing doc of same type if it's a single-file type
            const newDocs = prev.documents ? prev.documents.filter(d => d.documentType !== type) : [];
            return {
                ...prev,
                documents: [...newDocs, documentData]
            };
        });

        // Remove from selectedFiles since it's now uploaded
        setSelectedFiles(prev => {
            const newSelected = { ...prev };
            delete newSelected[type];
            return newSelected;
        });
    };

    const handleFileSelection = (type, file) => {
        setSelectedFiles(prev => ({
            ...prev,
            [type]: file
        }));

        // Also clear error if any
        if (errors[type]) {
            setErrors(prev => ({ ...prev, [type]: '' }));
        }
    };

    const uploadAllDocuments = async (tempId) => {
        try {
            setUploadingFiles(true);
            const formDataUpload = new FormData();

            Object.entries(selectedFiles).forEach(([type, file]) => {
                formDataUpload.append(type, file);
            });

            const response = await axios.post(`http://localhost:5000/api/students/draft/${tempId}/upload-batch`, formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });

            if (response.data.success) {
                // Update formData with the returned documents
                setFormData(prev => {
                    // For each uploaded doc, remove old and add new
                    let updatedDocs = [...(prev.documents || [])];

                    response.data.documents.forEach(doc => {
                        updatedDocs = updatedDocs.filter(d => d.documentType !== doc.documentType);
                        updatedDocs.push(doc);
                    });

                    return { ...prev, documents: updatedDocs };
                });

                setSelectedFiles({}); // Clear selection
                toast.success('Documents uploaded successfully!');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Batch upload error:', error);
            toast.error('Failed to upload documents. Please try again.');
            return false;
        } finally {
            setUploadingFiles(false);
        }
    };

    const getDocumentUrl = (type) => {
        const doc = formData.documents?.find(d => d.documentType === type);
        return doc ? doc.documentUrl : null;
    };

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
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
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
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
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
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
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
                                        />
                                    </div>
                                    {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
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
                                        max="9999-12-31"
                                        name="dob"
                                        value={formData.dob}
                                        onChange={handleChange}
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.dob ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob}</p>}
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
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.nationality ? 'border-red-500' : 'border-gray-300'}`}
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
                                        max="9999-12-31"
                                        name="passport_expiry"
                                        value={formData.passport_expiry}
                                        onChange={handleChange}
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.passport_expiry ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.passport_expiry && <p className="text-red-500 text-xs mt-1">{errors.passport_expiry}</p>}
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
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.education_country ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <option value="">Select country</option>
                                        {countriesData.map((country) => (
                                            <option key={country.code} value={country.name}>
                                                {country.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.education_country && <p className="text-red-500 text-xs mt-1">{errors.education_country}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Highest Level of Education
                                    </label>
                                    <select
                                        name="highest_level"
                                        value={formData.highest_level}
                                        onChange={handleChange}
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.highest_level ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <option value="">Select level</option>
                                        <option>Under-Graduate</option>
                                        <option>Post-Graduate</option>
                                        <option>Diploma</option>
                                    </select>
                                    {errors.highest_level && <p className="text-red-500 text-xs mt-1">{errors.highest_level}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Grading Scheme
                                    </label>
                                    <select
                                        name="grading_scheme"
                                        value={formData.grading_scheme}
                                        onChange={handleChange}
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.grading_scheme ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <option value="">Select scheme</option>
                                        <option>Percentage</option>
                                        <option>CGPA</option>
                                        <option>GPA</option>
                                    </select>
                                    {errors.grading_scheme && <p className="text-red-500 text-xs mt-1">{errors.grading_scheme}</p>}
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
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.grade_average ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.grade_average && <p className="text-red-500 text-xs mt-1">{errors.grade_average}</p>}
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
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.exam_type ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <option value="">Select exam</option>
                                        <option>IELTS</option>
                                        <option>TOEFL</option>
                                        <option>PTE</option>
                                        <option>Duolingo</option>
                                    </select>
                                    {errors.exam_type && <p className="text-red-500 text-xs mt-1">{errors.exam_type}</p>}
                                </div>

                                <div className="col-span-3 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Exam Date
                                    </label>
                                    <input
                                        type="date"
                                        max="9999-12-31"
                                        name="exam_date"
                                        value={formData.exam_date}
                                        onChange={handleChange}
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.exam_date ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.exam_date && <p className="text-red-500 text-xs mt-1">{errors.exam_date}</p>}
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
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.listening_score ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.listening_score && <p className="text-red-500 text-xs mt-1">{errors.listening_score}</p>}
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
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.reading_score ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.reading_score && <p className="text-red-500 text-xs mt-1">{errors.reading_score}</p>}
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
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.writing_score ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.writing_score && <p className="text-red-500 text-xs mt-1">{errors.writing_score}</p>}
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
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.speaking_score ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.speaking_score && <p className="text-red-500 text-xs mt-1">{errors.speaking_score}</p>}
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
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.overall_score ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.overall_score && <p className="text-red-500 text-xs mt-1">{errors.overall_score}</p>}
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
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.visa_refusal ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <option value="">Select</option>
                                        <option value="YES">Yes</option>
                                        <option value="NO">No</option>
                                    </select>
                                    {errors.visa_refusal && <p className="text-red-500 text-xs mt-1">{errors.visa_refusal}</p>}
                                </div>

                                <div>
                                    <label className="block font-medium text-gray-700 mb-2">
                                        Valid Study Permit?
                                    </label>
                                    <select
                                        name="study_permit"
                                        value={formData.study_permit}
                                        onChange={handleChange}
                                        className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.study_permit ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <option value="">Select</option>
                                        <option value="YES">Yes</option>
                                        <option value="NO">No</option>
                                    </select>
                                    {errors.study_permit && <p className="text-red-500 text-xs mt-1">{errors.study_permit}</p>}
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

                    {/* Step 5: Documents */}
                    {currentStep === 5 && (
                        <div ref={documentsRef}>
                            <div className="mb-6">
                                <h3 className="text-2xl font-semibold text-indigo-700 flex items-center gap-2">
                                    <UploadCloud size={28} />
                                    Documents Upload
                                </h3>
                                <p className="text-gray-500 text-sm mt-1">Upload required documents and ID proof</p>
                            </div>

                            {/* ID Details Section */}
                            <div className="bg-indigo-50 rounded-xl p-6 mb-8 border border-indigo-100">
                                <h4 className="text-lg font-semibold text-indigo-900 mb-4">Identity Proof Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            ID Proof Type <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="identity_type"
                                            value={formData.identity_type}
                                            onChange={handleChange}
                                            className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white ${errors.identity_type ? 'border-red-500' : 'border-gray-300'}`}
                                        >
                                            <option value="">Select ID Type</option>
                                            <option value="Aadhaar">Aadhaar Card</option>
                                            <option value="PAN">PAN Card</option>
                                            <option value="Passport">Passport</option>
                                            <option value="Driving License">Driving License</option>
                                        </select>
                                        {errors.identity_type && <p className="text-red-500 text-xs mt-1">{errors.identity_type}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            ID Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="identity_number"
                                            placeholder="Enter ID number"
                                            value={formData.identity_number}
                                            onChange={handleChange}
                                            className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition ${errors.identity_number ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors.identity_number && <p className="text-red-500 text-xs mt-1">{errors.identity_number}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Student Photo */}
                                <DocumentUpload
                                    label="Student Photo"
                                    documentType="photo"
                                    description="Recent passport size photograph (JPG/PNG)"
                                    tempId={getTempStudentId()}
                                    currentUrl={getDocumentUrl('photo')}
                                    onFileSelect={(file) => handleFileSelection('photo', file)}
                                    autoUpload={false}
                                    acceptedTypes="image/*"
                                    required={true}
                                />

                                {/* ID Proof Upload */}
                                <DocumentUpload
                                    label="Identity Proof"
                                    documentType="identity_proof"
                                    description="Scanned copy of the selected ID proof"
                                    tempId={getTempStudentId()}
                                    currentUrl={getDocumentUrl('identity_proof')}
                                    onFileSelect={(file) => handleFileSelection('identity_proof', file)}
                                    autoUpload={false}
                                    acceptedTypes="image/*,.pdf"
                                    required={true}
                                />

                                {/* 10th Marksheet */}
                                <DocumentUpload
                                    label="10th Marksheet"
                                    documentType="marksheet_10"
                                    description="Class 10th marksheet or certificate"
                                    tempId={getTempStudentId()}
                                    currentUrl={getDocumentUrl('marksheet_10')}
                                    onFileSelect={(file) => handleFileSelection('marksheet_10', file)}
                                    autoUpload={false}
                                    acceptedTypes="image/*,.pdf"
                                    required={true}
                                />

                                {/* 12th Marksheet */}
                                <DocumentUpload
                                    label="12th Marksheet"
                                    documentType="marksheet_12"
                                    description="Class 12th marksheet or certificate"
                                    tempId={getTempStudentId()}
                                    currentUrl={getDocumentUrl('marksheet_12')}
                                    onFileSelect={(file) => handleFileSelection('marksheet_12', file)}
                                    autoUpload={false}
                                    acceptedTypes="image/*,.pdf"
                                    required={true}
                                />

                                {/* Resume/CV */}
                                <DocumentUpload
                                    label="Resume / CV"
                                    documentType="resume"
                                    description="Updated resume in PDF format only"
                                    tempId={getTempStudentId()}
                                    currentUrl={getDocumentUrl('resume')}
                                    onFileSelect={(file) => handleFileSelection('resume', file)}
                                    autoUpload={false}
                                    acceptedTypes=".pdf"
                                    required={true}
                                />

                                {/* Degree Certificate (Optional) */}
                                <DocumentUpload
                                    label="Degree Certificate"
                                    documentType="degree_certificate"
                                    description="Bachelor's/Master's certificate (PDF only)"
                                    tempId={getTempStudentId()}
                                    currentUrl={getDocumentUrl('degree_certificate')}
                                    onFileSelect={(file) => handleFileSelection('degree_certificate', file)}
                                    autoUpload={false}
                                    acceptedTypes=".pdf"
                                />
                            </div>
                        </div>
                    )}


                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                        <button
                            onClick={handlePrevious}
                            disabled={currentStep === 1 || loading}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${currentStep === 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <ArrowLeft size={20} />
                            Previous
                        </button>

                        <div className="flex gap-4">
                            <button
                                onClick={handleSaveStep}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all border border-indigo-200"
                            >
                                <Save size={20} />
                                Save Draft
                            </button>

                            {currentStep === 5 ? (
                                <button
                                    onClick={handleFinalSubmit}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 transition-all transform hover:-translate-y-0.5"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Complete Registration
                                            <Check size={20} />
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={handleNext}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Next Step
                                            <ArrowRight size={20} />
                                        </>
                                    )}
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
