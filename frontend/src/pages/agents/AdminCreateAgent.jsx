import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { useToast } from '../../components/ui/toast';
import agentService from '../../services/agentService';

const AdminCreateAgent = () => {
    const navigate = useNavigate();
    const toast = useToast();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        alternatePhone: '',
        companyName: '',
        companyType: '',
        registrationNumber: '',
        establishedYear: '',
        website: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        designation: '',
        experience: '',
        qualification: '',
        specialization: [],
        currentStudents: '',
        annualRevenue: '',
        teamSize: '',
        servicesOffered: [],
        partnershipType: '',
        expectedStudents: '',
        marketingBudget: '',
        references: '',
        whyPartner: '',
        additionalInfo: '',
        termsAccepted: true,
        dataConsent: true
    });

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});

    const totalSteps = 5;

    // Real-time Validation Logic (same as before, styled for standard UI)
    const validate = (data) => {
        const newErrors = {};
        if (currentStep >= 1) {
            if (!data.firstName?.trim()) newErrors.firstName = 'First name is required';
            if (!data.lastName?.trim()) newErrors.lastName = 'Last name is required';
            if (!data.email?.trim()) {
                newErrors.email = 'Email is required';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
                newErrors.email = 'Enter a valid email address';
            }
            if (!data.phone?.trim()) {
                newErrors.phone = 'Phone number is required';
            } else if (!/^\d{10,}$/.test(data.phone.replace(/\D/g, ''))) {
                newErrors.phone = 'Minimum 10 digits required';
            }
        }
        if (currentStep >= 2) {
            if (!data.companyName?.trim()) newErrors.companyName = 'Company name is required';
            if (!data.companyType) newErrors.companyType = 'Type is required';
            if (!data.establishedYear) {
                newErrors.establishedYear = 'Year is required';
            } else {
                const year = parseInt(data.establishedYear);
                const currentYear = new Date().getFullYear();
                if (year > currentYear) {
                    newErrors.establishedYear = `Cannot be in the future (max ${currentYear})`;
                } else if (year < 1900) {
                    newErrors.establishedYear = 'Enter a valid year';
                }
            }
            if (!data.address?.trim()) newErrors.address = 'Address is required';
        }
        if (currentStep >= 3) {
            if (data.specialization.length === 0) newErrors.specialization = 'Select at least one';
        }
        if (currentStep >= 4) {
            if (!data.partnershipType) newErrors.partnershipType = 'Required';
            if (!data.whyPartner?.trim()) newErrors.whyPartner = 'Motivation is required';
        }
        return newErrors;
    };

    useEffect(() => {
        setErrors(validate(formData));
    }, [formData, currentStep]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleArrayChange = (field, value, checked) => {
        const updated = checked
            ? [...formData[field], value]
            : formData[field].filter(item => item !== value);
        setFormData(prev => ({ ...prev, [field]: updated }));
    };

    const canMoveToNextStep = () => {
        const stepErrors = validate(formData);
        const currentStepFields = {
            1: ['firstName', 'lastName', 'email', 'phone'],
            2: ['companyName', 'companyType', 'establishedYear', 'address'],
            3: ['specialization'],
            4: ['partnershipType', 'whyPartner'],
            5: []
        };

        const stepFields = currentStepFields[currentStep];
        const hasErrors = stepFields.some(field => stepErrors[field]);

        if (hasErrors) {
            const newTouched = { ...touched };
            stepFields.forEach(f => newTouched[f] = true);
            setTouched(newTouched);
            toast.error("Please fill required fields");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (currentStep !== totalSteps) {
            if (canMoveToNextStep()) nextStep();
            return;
        }

        setIsSubmitting(true);
        try {
            await agentService.createAgent(formData);
            toast.success("Agent created successfully!");
            navigate('/agents');
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to create agent.';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
            window.scrollTo(0, 0);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo(0, 0);
        }
    };

    const steps = [
        { number: 1, title: 'Personal Info' },
        { number: 2, title: 'Company Info' },
        { number: 3, title: 'Specialization' },
        { number: 4, title: 'Partnership' },
        { number: 5, title: 'Confirmation' }
    ];

    const states = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
        'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
        'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
        'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
    ];

    const specializationOptions = [
        'MBBS Admissions', 'Medical Counseling', 'Visa Assistance', 'International Admissions',
        'Student Support', 'Career Guidance', 'NEET Coaching', 'Abroad Studies'
    ];

    // Helper to render input matching StudentForm style
    const renderField = (label, name, type = 'text', required = true) => (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                name={name}
                value={formData[name]}
                onChange={(e) => handleInputChange(name, e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, [name]: true }))}
                className={`w-full border rounded-lg p-3 outline-none transition ${touched[name] && errors[name]
                    ? 'border-red-500 ring-1 ring-red-200'
                    : 'border-gray-300 focus:ring-2 focus:ring-indigo-500'
                    }`}
            />
            {touched[name] && errors[name] && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors[name]}
                </p>
            )}
        </div>
    );

    return (
        <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/agents')}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={24} className="text-gray-700" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Create New Agent</h1>
                        <p className="text-gray-600 text-sm mt-1 font-medium italic">
                            Step {currentStep} of {totalSteps} - {steps[currentStep - 1].title}
                        </p>
                    </div>
                </div>
            </div>

            {/* Progress Steps (StudentForm Style) */}
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
                                <span className={`text-sm mt-2 font-medium ${currentStep === step.number ? 'text-indigo-600' : 'text-gray-500'}`}>
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
                <form onSubmit={handleSubmit}>
                    {currentStep === 1 && (
                        <div>
                            <h3 className="text-2xl font-semibold text-indigo-700 mb-6">👤 Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderField('First Name', 'firstName')}
                                {renderField('Last Name', 'lastName')}
                                {renderField('Email Address', 'email', 'email')}
                                {renderField('Phone Number', 'phone', 'tel')}
                                {renderField('Designation', 'designation')}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                                    <select
                                        value={formData.experience}
                                        onChange={(e) => handleInputChange('experience', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="">Select</option>
                                        <option value="1-2 years">1-2 years</option>
                                        <option value="3-5 years">3-5 years</option>
                                        <option value="6-10 years">6-10 years</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div>
                            <h3 className="text-2xl font-semibold text-indigo-700 mb-6">🏢 Company Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {renderField('Company Name', 'companyName')}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Type</label>
                                    <select
                                        value={formData.companyType}
                                        onChange={(e) => handleInputChange('companyType', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="">Select</option>
                                        <option value="Private Limited">Private Limited</option>
                                        <option value="Proprietorship">Proprietorship</option>
                                        <option value="Partnership">Partnership</option>
                                    </select>
                                </div>
                                {renderField('Established Year', 'establishedYear', 'number')}
                                {renderField('Website', 'website', 'url')}
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Office Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div>
                            <h3 className="text-2xl font-semibold text-indigo-700 mb-6">🎯 Specialization</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {specializationOptions.map(spec => (
                                    <label key={spec} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.specialization.includes(spec)}
                                            onChange={(e) => handleArrayChange('specialization', spec, e.target.checked)}
                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                                        />
                                        <span className="ml-3 text-sm font-medium text-gray-700">{spec}</span>
                                    </label>
                                ))}
                            </div>
                            {touched.specialization && errors.specialization && (
                                <p className="text-xs text-red-500 mt-2">{errors.specialization}</p>
                            )}
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div>
                            <h3 className="text-2xl font-semibold text-indigo-700 mb-6">🤝 Partnership</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Partnership Type</label>
                                    <select
                                        value={formData.partnershipType}
                                        onChange={(e) => handleInputChange('partnershipType', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="">Select</option>
                                        <option value="Authorized Representative">Authorized Representative</option>
                                        <option value="Franchise Partner">Franchise Partner</option>
                                    </select>
                                </div>
                                {renderField('Expected Students (Annual)', 'expectedStudents', 'number')}
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Why partner with us?</label>
                                <textarea
                                    value={formData.whyPartner}
                                    onChange={(e) => handleInputChange('whyPartner', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 5 && (
                        <div>
                            <h3 className="text-2xl font-semibold text-indigo-700 mb-6">✅ Review and Confirm</h3>
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Primary Contact</h4>
                                        <p className="text-lg font-bold text-gray-900">{formData.firstName} {formData.lastName}</p>
                                        <p className="text-gray-600">{formData.email}</p>
                                        <p className="text-gray-600">{formData.phone}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Organization</h4>
                                        <p className="text-lg font-bold text-gray-900">{formData.companyName}</p>
                                        <p className="text-gray-600">{formData.partnershipType}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                                <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                                <p className="text-sm text-blue-800">
                                    By clicking "Create Agent", an account will be created and login credentials will be sent to the email address provided.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation (StudentForm Style) */}
                    <div className="flex justify-between mt-8 pt-6 border-t font-medium">
                        <button
                            type="button"
                            onClick={prevStep}
                            disabled={currentStep === 1 || isSubmitting}
                            className={`px-8 py-3 rounded-lg transition-all ${currentStep === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Previous
                        </button>
                        <div className="flex gap-3">
                            {currentStep < 5 ? (
                                <button
                                    type="button"
                                    onClick={() => canMoveToNextStep() && nextStep()}
                                    className="px-10 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-lg flex items-center gap-2"
                                >
                                    Save & Next <ArrowRight size={18} />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-12 py-3 rounded-lg text-white font-bold shadow-lg flex items-center gap-2 transition-all ${isSubmitting
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                >
                                    <Check size={18} />
                                    {isSubmitting ? 'Creating...' : 'Create Agent'}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminCreateAgent;
