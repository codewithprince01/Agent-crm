import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowLeft, Save, ArrowRight, Check } from 'lucide-react';
import { useToast } from '../../components/ui/toast';
import studentService from '../../services/studentService';

const StudentForm = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useSelector((state) => state.auth);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(isEditMode);

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
    if (isEditMode) {
      fetchStudentData();
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        referredBy: user.id || user._id || user.email || 'SELF'
      }));
    }
  }, [id, user]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const response = await studentService.getStudentById(id);
      const student = response?.data?.student || response?.data;

      if (student) {
        setFormData({
          firstName: student.firstName || '',
          lastName: student.lastName || '',
          email: student.email || '',
          mobile: student.phone || student.mobile || '',
          c_code: student.countryCode || student.c_code || '91',
          father: student.fatherName || student.father || '',
          mother: student.motherName || student.mother || '',
          dob: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : (student.dob ? student.dob.split('T')[0] : ''),
          first_language: student.firstLanguage || student.first_language || '',
          nationality: student.nationality || '',
          passport_number: student.passportNumber || student.passport_number || '',
          passport_expiry: student.passportExpiry ? student.passportExpiry.split('T')[0] : (student.passport_expiry ? student.passport_expiry.split('T')[0] : ''),
          marital_status: student.maritalStatus || student.marital_status || 'Single',
          gender: student.gender || 'Male',
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
        });
      }
    } catch (err) {
      console.error('Error fetching student:', err);
      toast.error('Failed to load student data');
      navigate('/students');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveStep = async () => {
    // In edit mode, we can optionally save current step, 
    // but for now let's just toast success as placeholder for progress
    toast.success(`Step ${currentStep} progress saved!`);
  };

  const handleNext = async () => {
    await handleSaveStep();
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmit = async () => {
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
        dateOfBirth: formData.dob,
        firstLanguage: formData.first_language,
        nationality: formData.nationality,
        passportNumber: formData.passport_number,
        passportExpiry: formData.passport_expiry,
        maritalStatus: formData.marital_status,
        gender: formData.gender,
        address: formData.home_address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.zipcode,
        home_contact_number: formData.home_contact_number,
        referredBy: formData.referredBy,
        // Education
        educationCountry: formData.education_country,
        highestLevel: formData.highest_level,
        gradingScheme: formData.grading_scheme,
        gradeAverage: formData.grade_average,
        // Test Scores
        examType: formData.exam_type,
        examDate: formData.exam_date,
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

      if (isEditMode) {
        await studentService.updateStudent(id, submissionData);
        toast.success('Student updated successfully!');
      } else {
        await studentService.createStudent(submissionData);
        toast.success('Student created successfully!');
      }

      setTimeout(() => {
        navigate('/students');
      }, 1500);
    } catch (err) {
      console.error('Submission error:', err);
      toast.error(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} student`);
    }
  };

  // Static data (same as CreateStudent)
  const countriesData = [
    { code: 'IN', name: 'INDIA' },
    { code: 'US', name: 'UNITED STATES' },
    { code: 'GB', name: 'UNITED KINGDOM' },
    { code: 'CA', name: 'CANADA' },
    { code: 'AU', name: 'AUSTRALIA' },
  ];

  const phoneCode = [
    { phonecode: '1' },
    { phonecode: '7' },
    { phonecode: '44' },
    { phonecode: '61' },
    { phonecode: '91' },
  ];

  const steps = [
    { number: 1, title: 'Personal Info', ref: generalRef },
    { number: 2, title: 'Education', ref: educationRef },
    { number: 3, title: 'Test Scores', ref: testScoresRef },
    { number: 4, title: 'Background', ref: backgroundRef },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/students')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Edit Student Details' : 'Create New Student'}
            </h1>
            <p className="text-gray-600 text-sm mt-1 font-medium italic">Step {currentStep} of 4 - {steps[currentStep - 1].title}</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${currentStep > step.number
                  ? 'bg-green-500 text-white'
                  : currentStep === step.number
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-200'
                    : 'bg-gray-200 text-gray-500'
                  }`}>
                  {currentStep > step.number ? <Check size={20} /> : step.number}
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
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  name="email"
                  placeholder="student@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number <span className="text-red-500">*</span></label>
                <div className="flex">
                  <select
                    name="c_code"
                    value={formData.c_code}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-l-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  >
                    {phoneCode.map((code, idx) => (
                      <option key={idx} value={code.phonecode}>+{code.phonecode}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="mobile"
                    placeholder="Enter mobile number"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-r-lg p-3 w-full focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Referral Detail Display */}
              <div className="col-span-1 md:col-span-2 bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 shadow-sm">
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
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
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
                <select
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                >
                  <option value="">Select country</option>
                  {countriesData.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                </select>
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
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
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
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  >
                    <option value="">Select country</option>
                    {countriesData.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                  </select>
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
                <select
                  name="education_country"
                  value={formData.education_country}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                >
                  <option value="">Select country</option>
                  {countriesData.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Highest Level of Education</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Grading Scheme</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Grade Average/Score</label>
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
            <h3 className="text-2xl font-semibold text-indigo-700 mb-6">🎯 Test Scores</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">English Exam Type</label>
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
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Exam Date</label>
                <input
                  type="date"
                  name="exam_date"
                  value={formData.exam_date}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Listening Score</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Reading Score</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Writing Score</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Speaking Score</label>
                <input
                  type="text"
                  name="speaking_score"
                  placeholder="0.0"
                  value={formData.speaking_score}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Overall Score</label>
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
            <h3 className="text-2xl font-semibold text-indigo-700 mb-6">📝 Background</h3>
            <div className="space-y-6">
              <div>
                <label className="block font-medium text-gray-700 mb-2">Visa Refusal History?</label>
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
                <label className="block font-medium text-gray-700 mb-2">Valid Study Permit?</label>
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

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t">
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
          <div className="flex gap-3">
            <button
              onClick={handleSaveStep}
              className="px-6 py-3 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-all flex items-center gap-2"
            >
              <Save size={18} />
              Save Progress
            </button>
            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg"
              >
                Save & Next <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleFinalSubmit}
                className="px-6 py-3 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg"
              >
                <Check size={18} />
                {isEditMode ? 'Update Student' : 'Create Student'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentForm;
