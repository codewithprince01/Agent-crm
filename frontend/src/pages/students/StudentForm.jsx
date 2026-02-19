import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Save, ArrowRight, Check, Loader2 } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { useToast } from '../../components/ui/toast';
import studentService from '../../services/studentService';
import StudentDocumentUpload from '../../components/students/StudentDocumentUpload';
import { ROLES, REQUIRED_STUDENT_DOCUMENTS } from '../../utils/constants';

import useCountries from '../../hooks/useCountries';
import {
  validateRequired,
  validateEmail,
  validateMobile,
  validateDate,
  validateNumber
} from '../../utils/validation';

const StudentForm = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useSelector((state) => state.auth);

  // Use custom hook for countries and phone codes
  const { countries: countriesData, phoneCodes: phoneCode, loading: countriesLoading } = useCountries();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(isEditMode);
  const [errors, setErrors] = useState({});
  const [studentId, setStudentId] = useState(id || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentDataForDocs, setStudentDataForDocs] = useState(null);

  // State for manual document upload (before student creation)
  const [pendingDocs, setPendingDocs] = useState([]);

  const generalRef = useRef(null);
  const educationRef = useRef(null);
  const testScoresRef = useRef(null);
  const backgroundRef = useRef(null);

  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    c_code: '',
    father: '',
    mother: '',
    dob: '',
    first_language: '',
    nationality: '',
    passport_number: '',
    passport_expiry: '',
    marital_status: '',
    gender: '',
    home_address: '',
    city: '',
    state: '',
    country: '',
    zipcode: '',
    home_contact_number: '',
    referredBy: '',
    // Education
    education_country: '',
    highest_level: '',
    grading_scheme: '',
    grade_average: '',
    // Test Scores
    exam_type: '',
    exam_date: '',
    listening_score: '',
    reading_score: '',
    writing_score: '',
    speaking_score: '',
    overall_score: '',
    // Background
    visa_refusal: '',
    study_permit: '',
    background_details: '',
  });

  // Fetch data if in edit mode
  useEffect(() => {
    const initData = async () => {
      try {
        if (isEditMode) {
          setLoading(true);
          await fetchStudentData();
        } else if (user) {
          setFormData(prev => ({
            ...prev,
            referredBy: user.id || user._id || user.email || 'SELF'
          }));
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing form:', err);
        toast.error('Failed to load initial data');
        setLoading(false);
      }
    };

    initData();
  }, [id, user, isEditMode]);

  const fetchStudentData = async () => {
    try {
      // setLoading(true); // Handled in initData
      const response = await studentService.getStudentById(id);
      const student = response?.data?.student || response?.data;

      if (student) {
        setStudentDataForDocs(student);
        const fetchedData = {
          firstName: student.firstName || '',
          lastName: student.lastName || '',
          email: student.email || '',
          mobile: student.phone || student.mobile || '',
          c_code: student.countryCode || student.c_code || '',
          father: student.fatherName || student.father || '',
          mother: student.motherName || student.mother || '',
          dob: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : (student.dob ? student.dob.split('T')[0] : ''),
          first_language: student.firstLanguage || student.first_language || '',
          nationality: student.nationality || '',
          passport_number: student.passportNumber || student.passport_number || '',
          passport_expiry: student.passportExpiry ? student.passportExpiry.split('T')[0] : (student.passport_expiry ? student.passport_expiry.split('T')[0] : ''),
          marital_status: student.maritalStatus || student.marital_status || '',
          gender: student.gender || '',
          home_address: student.address || student.home_address || '',
          city: student.city || '',
          state: student.state || '',
          country: student.country || '',
          zipcode: student.postalCode || student.zipcode || '',
          home_contact_number: student.home_contact_number || '',
          referredBy: student.referredBy || '',
          // Education
          education_country: student.educationCountry || student.education_country || '',
          highest_level: student.highestLevel || student.highest_level || '',
          grading_scheme: student.gradingScheme || student.grading_scheme || '',
          grade_average: student.gradeAverage || student.grade_average || '',
          // Test Scores
          exam_type: student.examType || student.exam_type || '',
          exam_date: student.examDate ? student.examDate.split('T')[0] : (student.exam_date ? student.exam_date.split('T')[0] : ''),
          listening_score: student.listeningScore || student.listening_score || '',
          reading_score: student.readingScore || student.reading_score || '',
          writing_score: student.writingScore || student.writing_score || '',
          speaking_score: student.speakingScore || student.speaking_score || '',
          overall_score: student.overallScore || student.overall_score || '',
          // Background
          visa_refusal: student.visaRefusal || student.visa_refusal || '',
          study_permit: student.studyPermit || student.study_permit || '',
          background_details: student.backgroundDetails || student.background_details || '',
        };
        setFormData(fetchedData);
      }
    } catch (err) {
      console.error('Error fetching student:', err);
      toast.error('Failed to load student data');
      navigate('/students');
    } finally {
      // setLoading(false); // Handled in initData
    }
  };

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'firstName':
        error = validateRequired(value, 'First name');
        break;
      case 'lastName':
        error = validateRequired(value, 'Last name');
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'mobile':
        error = validateMobile(value);
        break;
      case 'dob':
        error = validateDate(value, { past: true, label: 'Date of Birth' });
        if (!error && value) {
          const year = new Date(value).getFullYear();
          if (year < 1900) error = 'Please enter a valid birth year';
        }
        break;
      case 'passport_expiry':
        if (!value) {
          error = 'Passport expiry date is required';
        } else {
          error = validateDate(value, { label: 'Passport' });
          if (!error) {
            const date = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const sixMonthsFuture = new Date();
            sixMonthsFuture.setMonth(today.getMonth() + 6);
            sixMonthsFuture.setHours(0, 0, 0, 0);

            if (date < sixMonthsFuture) error = 'Passport must be valid for at least 6 months';
            if (date.getFullYear() > 2100) error = 'Please enter a realistic expiry year';
          }
        }
        break;
      case 'education_country':
        error = validateRequired(value, 'Education country');
        break;
      case 'highest_level':
        error = validateRequired(value, 'Highest level');
        break;
      case 'grading_scheme':
        error = validateRequired(value, 'Grading scheme');
        break;
      case 'grade_average':
        error = validateRequired(value, 'Grade average/score');
        break;
      case 'visa_refusal':
        error = validateRequired(value, 'Visa refusal status');
        break;
      case 'study_permit':
        error = validateRequired(value, 'Study permit status');
        break;
      // Step 3: Test Scores Validation
      case 'exam_type':
        error = validateRequired(value, 'Exam type');
        break;
      case 'exam_date':
        if (!value) {
          error = 'Exam date is required';
        } else {
          error = validateDate(value, { past: true, label: 'Exam date' });
          if (!error) {
            const year = new Date(value).getFullYear();
            if (year < 1990) error = 'Please enter a valid exam year (1990-Present)';
          }
        }
        break;
      case 'listening_score':
      case 'reading_score':
      case 'writing_score':
      case 'speaking_score':
      case 'overall_score':
        error = validateNumber(value, { positive: true, label: 'Score' });
        break;
      // Optional fields that might need validation if provided
      case 'passport_number':
        error = validateRequired(value, 'Passport Number');
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Live Validation
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};
    const stepFields = {
      1: ['firstName', 'lastName', 'email', 'mobile', 'dob', 'passport_expiry'],
      2: ['education_country', 'highest_level', 'grading_scheme', 'grade_average'],
      3: ['exam_type', 'exam_date', 'listening_score', 'reading_score', 'writing_score', 'speaking_score', 'overall_score'],
      4: ['visa_refusal', 'study_permit']
    };

    const fieldsToCheck = stepFields[step] || [];

    fieldsToCheck.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveStep = async () => {
    // In edit mode, we can optionally save current step, 
    // but for now let's just toast success as placeholder for progress
    toast.success(`Step ${currentStep} progress saved!`);
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      }
    } else {
      toast.error('Please fix the errors before proceeding');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmit = async (shouldNavigate = true) => {
    if (!shouldNavigate && !validateStep(currentStep)) {
      toast.error('Please fix the errors before proceeding');
      return;
    }

    // New Logic: If creating student, we only create at Step 5 (shouldNavigate=true)
    // If shouldNavigate is false (Step 4 "Save & Next"), we just proceed to step 5 without API call
    if (!isEditMode && !shouldNavigate) {
      if (validateStep(4)) {
        setCurrentStep(5);
        window.scrollTo(0, 0);
        return;
      } else {
        toast.error('Please fix the errors before proceeding');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Map frontend fields to backend expected fields
      const submissionData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.mobile,
        countryCode: formData.c_code,
        fatherName: formData.father,
        motherName: formData.mother,
        // Send null for empty dates to avoid Mongoose CastError
        dateOfBirth: formData.dob || null,
        nationality: formData.nationality,
        passportNumber: formData.passport_number,
        passportExpiry: formData.passport_expiry || null,
        maritalStatus: formData.marital_status || 'Single',
        gender: formData.gender || null, // Send null if empty to avoid enum validation error
        address: formData.home_address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.zipcode,
        homeContactNumber: formData.home_contact_number,
        referredBy: formData.referredBy,
        // Education
        educationCountry: formData.education_country,
        highestLevel: formData.highest_level,
        gradingScheme: formData.grading_scheme,
        gradeAverage: formData.grade_average,
        // Test Scores
        examType: formData.exam_type,
        examDate: formData.exam_date || null,
        listeningScore: formData.listening_score,
        readingScore: formData.reading_score,
        writingScore: formData.writing_score,
        speakingScore: formData.speaking_score,
        overallScore: formData.overall_score,
        // Background
        visaRefusal: formData.visa_refusal,
        studyPermit: formData.study_permit,
        backgroundDetails: formData.background_details,
      };

      let response;
      let newStudentId = studentId;

      if (isEditMode) {
        response = await studentService.updateStudent(id, submissionData);
      } else {
        // Create student only on Final Submit
        response = await studentService.createStudent(submissionData);
        newStudentId = response?.data?.student?._id || response?.data?.student?.id || response?.data?._id || response?.data?.id;

        // Upload pending documents if any
        if (newStudentId && pendingDocs.length > 0) {
          for (const doc of pendingDocs) {
            try {
              const docFormData = new FormData();
              docFormData.append('documentName', doc.key || doc.label);
              docFormData.append('file', doc.file);
              await studentService.uploadDocument(newStudentId, docFormData);
            } catch (docErr) {
              console.error(`Failed to upload ${doc.label}:`, docErr);
              // We continue uploading other docs even if one fails
            }
          }
        }
      }

      toast.success(`Student ${isEditMode ? 'updated' : 'created'} successfully!`);
      setTimeout(() => {
        navigate('/students');
      }, 1500);

    } catch (err) {
      console.error('Submission error:', err);
      toast.error(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} student`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Removed static countriesData and phoneCode arrays as they are now state variables

  const steps = [
    { number: 1, title: 'Personal Info', ref: generalRef },
    { number: 2, title: 'Education', ref: educationRef },
    { number: 3, title: 'Test Scores', ref: testScoresRef },
    { number: 4, title: 'Background', ref: backgroundRef },
    { number: 5, title: 'Documents', ref: null },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Dashboard', link: '/dashboard' },
          { label: 'Students', link: '/students' },
          { label: isEditMode ? 'Edit Student' : 'Create Student' }
        ]}
      />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Student Details' : 'Create New Student'}
        </h1>
        <p className="text-gray-600 text-sm mt-1 font-medium italic">Step {currentStep} of 5 - {steps[currentStep - 1].title}</p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-6 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[300px] md:min-w-0">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center min-w-[80px]">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-semibold transition-all ${currentStep > step.number
                  ? 'bg-green-500 text-white'
                  : currentStep === step.number
                    ? 'bg-indigo-600 text-white ring-2 md:ring-4 ring-indigo-200'
                    : 'bg-gray-200 text-gray-500'
                  }`}>
                  {currentStep > step.number ? <Check size={16} /> : step.number}
                </div>
                <span className={`text-xs md:text-sm mt-2 font-medium text-center ${currentStep === step.number ? 'text-indigo-600' : 'text-gray-500'
                  }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`hidden md:block flex-1 h-1 mx-2 md:mx-4 rounded transition-all ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8">
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div ref={generalRef}>
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-indigo-700">👤 Personal Information</h3>
              <p className="text-gray-500 text-sm mt-1">Fill in the student's personal and passport details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.firstName && <p className="text-red-500 text-[10px] mt-1 font-bold italic uppercase">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.lastName && <p className="text-red-500 text-[10px] mt-1 font-bold italic uppercase">{errors.lastName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  name="email"
                  placeholder="student@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.email && <p className="text-red-500 text-[10px] mt-1 font-bold italic uppercase">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <div className="w-[110px] md:w-[140px]">
                    <SearchableSelect
                      options={phoneCode.map(c => ({ label: `+${c.phonecode}`, value: c.phonecode }))}
                      value={formData.c_code}
                      onChange={(val) => handleChange({ target: { name: 'c_code', value: val } })}
                      placeholder="+91"
                      searchPlaceholder="Search code..."
                    />
                  </div>
                  <input
                    type="text"
                    name="mobile"
                    placeholder="Enter mobile number"
                    value={formData.mobile}
                    onChange={handleChange}
                    className={`border rounded-lg p-3 w-full focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.mobile ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                </div>
                {errors.mobile && <p className="text-red-500 text-[10px] mt-1 font-bold italic uppercase">{errors.mobile}</p>}
              </div>

              {/* Referral Detail Display */}
              <div className="hidden md:block col-span-1 md:col-span-2 bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block mb-2">Referral Tracking</label>
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-medium text-gray-600">Student is referred by:</p>
                      <span className="text-lg font-bold text-indigo-700">{formData.referredBy === (user?.id || user?._id) ? (user?.name || user?.email || 'SELF') : (formData.referredBy || 'Direct')}</span>
                    </div>
                    {isEditMode && <p className="text-[10px] text-gray-400 mt-2 font-medium">* Referral source cannot be changed manually after creation</p>}
                  </div>
                  <div className="bg-indigo-600 text-white rounded-full px-4 py-1.5 text-xs font-bold shadow-md">
                    {formData.referredBy === (user?.id || user?._id) ? 'INTERNAL' : 'EXTERNAL'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Father's Name</label>
                <input
                  type="text"
                  name="father"
                  placeholder="Enter father's name"
                  value={formData.father}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mother's Name</label>
                <input
                  type="text"
                  name="mother"
                  placeholder="Enter mother's name"
                  value={formData.mother}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.dob ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.dob && <p className="text-red-500 text-[10px] mt-1 font-bold italic uppercase">{errors.dob}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Language</label>
                <input
                  type="text"
                  name="first_language"
                  placeholder="e.g., English, Hindi"
                  value={formData.first_language}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country of Citizenship</label>
                <SearchableSelect
                  options={countriesData.map(c => ({ label: c.name, value: c.name }))}
                  value={formData.nationality}
                  onChange={(val) => handleChange({ target: { name: 'nationality', value: val } })}
                  placeholder="Select country"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passport Number</label>
                <input
                  type="text"
                  name="passport_number"
                  placeholder="Enter passport number"
                  value={formData.passport_number}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Passport Expiry Date</label>
                <input
                  type="date"
                  name="passport_expiry"
                  value={formData.passport_expiry}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.passport_expiry ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.passport_expiry && <p className="text-red-500 text-[10px] mt-1 font-bold italic uppercase">{errors.passport_expiry}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marital Status</label>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
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
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <h3 className="text-xl font-semibold text-indigo-700 mb-4">📍 Address Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Home Address</label>
                  <input
                    type="text"
                    name="home_address"
                    placeholder="Enter complete address"
                    value={formData.home_address}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="Enter city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
                  <input
                    type="text"
                    name="state"
                    placeholder="Enter state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <SearchableSelect
                    options={countriesData.map(c => ({ label: c.name, value: c.name }))}
                    value={formData.country}
                    onChange={(val) => handleChange({ target: { name: 'country', value: val } })}
                    placeholder="Select country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postal/Zip Code</label>
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
            </div>
          </div>
        )}

        {/* Step 2: Education */}
        {currentStep === 2 && (
          <div ref={educationRef}>
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-indigo-700">🎓 Education History</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country of Education</label>
                <SearchableSelect
                  options={countriesData.map(c => ({ label: c.name, value: c.name }))}
                  value={formData.education_country}
                  onChange={(val) => handleChange({ target: { name: 'education_country', value: val } })}
                  placeholder="Select country"
                  className={errors.education_country ? 'border-red-500 rounded-lg' : ''}
                />
                {errors.education_country && <p className="text-red-500 text-[10px] mt-1 font-bold italic uppercase">{errors.education_country}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Highest Level of Education</label>
                <select
                  name="highest_level"
                  value={formData.highest_level}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.highest_level ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">Select level</option>
                  <option>Under-Graduate</option>
                  <option>Post-Graduate</option>
                  <option>Diploma</option>
                </select>
                {errors.highest_level && <p className="text-red-500 text-[10px] mt-1 font-bold italic uppercase">{errors.highest_level}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grading Scheme</label>
                <select
                  name="grading_scheme"
                  value={formData.grading_scheme}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.grading_scheme ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">Select scheme</option>
                  <option>Percentage</option>
                  <option>CGPA</option>
                  <option>GPA</option>
                </select>
                {errors.grading_scheme && <p className="text-red-500 text-[10px] mt-1 font-bold italic uppercase">{errors.grading_scheme}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grade Average/Score</label>
                <input
                  type="text"
                  name="grade_average"
                  placeholder="e.g., 85%, 8.5 CGPA"
                  value={formData.grade_average}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.grade_average ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.grade_average && <p className="text-red-500 text-[10px] mt-1 font-bold italic uppercase">{errors.grade_average}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Test Scores */}
        {currentStep === 3 && (
          <div ref={testScoresRef}>
            <h3 className="text-2xl font-semibold text-indigo-700 mb-6">🎯 Test Scores</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">English Exam Type</label>
                <select
                  name="exam_type"
                  value={formData.exam_type}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.exam_type ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">Select exam</option>
                  <option>IELTS</option>
                  <option>TOEFL</option>
                  <option>PTE</option>
                  <option>Duolingo</option>
                </select>
                {errors.exam_type && <p className="text-red-500 text-[10px] mt-1 font-bold italic uppercase">{errors.exam_type}</p>}
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Exam Date</label>
                <input
                  type="date"
                  name="exam_date"
                  value={formData.exam_date}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.exam_date ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.exam_date && <p className="text-red-500 text-[10px] mt-1 font-bold italic uppercase">{errors.exam_date}</p>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 col-span-1 md:col-span-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Listening</label>
                  <input
                    type="text"
                    name="listening_score"
                    placeholder="0.0"
                    value={formData.listening_score}
                    onChange={handleChange}
                    className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.listening_score ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {errors.listening_score && <p className="text-red-500 text-[10px] mt-1 font-bold italic uppercase">{errors.listening_score}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reading</label>
                  <input
                    type="text"
                    name="reading_score"
                    placeholder="0.0"
                    value={formData.reading_score}
                    onChange={handleChange}
                    className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.reading_score ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {errors.reading_score && <p className="text-red-500 text-[10px] mt-1 font-bold italic uppercase">{errors.reading_score}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Writing</label>
                  <input
                    type="text"
                    name="writing_score"
                    placeholder="0.0"
                    value={formData.writing_score}
                    onChange={handleChange}
                    className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.writing_score ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {errors.writing_score && <p className="text-red-500 text-[10px] mt-1 font-bold italic uppercase">{errors.writing_score}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Speaking</label>
                  <input
                    type="text"
                    name="speaking_score"
                    placeholder="0.0"
                    value={formData.speaking_score}
                    onChange={handleChange}
                    className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.speaking_score ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {errors.speaking_score && <p className="text-red-500 text-[10px] mt-1 font-bold italic uppercase">{errors.speaking_score}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Overall</label>
                  <input
                    type="text"
                    name="overall_score"
                    placeholder="0.0"
                    value={formData.overall_score}
                    onChange={handleChange}
                    className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.overall_score ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {errors.overall_score && <p className="text-red-500 text-[10px] mt-1 font-bold italic uppercase">{errors.overall_score}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Background */}
        {currentStep === 4 && (
          <div ref={backgroundRef}>
            <h3 className="text-2xl font-semibold text-indigo-700 mb-6">📝 Background</h3>
            <div className="space-y-6">
              <div>
                <label className="block font-medium text-gray-700 mb-2">Visa Refusal History?</label>
                <select
                  name="visa_refusal"
                  value={formData.visa_refusal}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.visa_refusal ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">Select</option>
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </select>
                {errors.visa_refusal && <p className="text-red-500 text-[10px] mt-1 font-bold italic uppercase">{errors.visa_refusal}</p>}
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">Valid Study Permit?</label>
                <select
                  name="study_permit"
                  value={formData.study_permit}
                  onChange={handleChange}
                  className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition ${errors.study_permit ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">Select</option>
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </select>
                {errors.study_permit && <p className="text-red-500 text-[10px] mt-1 font-bold italic uppercase">{errors.study_permit}</p>}
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">Additional Details</label>
                <textarea
                  name="background_details"
                  rows="4"
                  placeholder="Any additional information about the student's background..."
                  value={formData.background_details}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Document Upload */}
        {currentStep === 5 && (
          <div>
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-indigo-700">📂 Document Upload</h3>
              <p className="text-gray-500 text-sm mt-1 italic font-medium">
                Upload student documents for verification.
                {(user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.AGENT) && (
                  <span className="text-indigo-500 block">Note: This step is optional for your role.</span>
                )}
              </p>
            </div>

            {/* In Edit Mode -> Render with live student data */}
            {isEditMode && studentDataForDocs ? (
              <StudentDocumentUpload
                student={studentDataForDocs}
                isAdmin={user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN}
                onUploadSuccess={async () => {
                  const fresh = await studentService.getStudentById(studentId);
                  setStudentDataForDocs(fresh?.data?.student || fresh?.data);
                }}
              />
            ) : !isEditMode ? (
              /* In Create Mode -> Render with pendingDocs state (Client Side) */
              <StudentDocumentUpload
                student={null} // No student yet
                isManualMode={true}
                pendingDocs={pendingDocs}
                setPendingDocs={setPendingDocs}
                isAdmin={user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN}
              />
            ) : (
              <div className="p-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 font-bold uppercase text-xs tracking-widest">Initializing upload system...</p>
              </div>
            )}

            <div className="mt-8 pt-8 border-t flex justify-between">
              {/* Previous Button for Step 5 */}
              <button
                onClick={handlePrevious}
                className="px-6 py-3 bg-gray-300 text-gray-700 hover:bg-gray-400 rounded-lg font-medium transition-all"
              >
                Previous
              </button>

              <button
                onClick={() => handleFinalSubmit(true)}
                disabled={isSubmitting}
                className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:scale-[1.02] active:scale-95 flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {isEditMode ? 'Update & Exit' : 'Create & Exit'}
              </button>
            </div>
          </div>
        )}

        {/* Navigation for Steps 1-4 */}
        {currentStep < 5 && (
          <div className="flex flex-col-reverse md:flex-row justify-between gap-4 mt-8 pt-6 border-t">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${currentStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
            >
              Previous
            </button>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              {/* Removed Save Progress Button */}
              {currentStep < 5 ? (
                <button
                  onClick={currentStep === 4 ? () => handleFinalSubmit(false) : handleNext}
                  className="px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  {currentStep === 4 ? (isSubmitting ? 'Saving...' : 'Next') : 'Save & Next'}
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight size={18} />}
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentForm;
