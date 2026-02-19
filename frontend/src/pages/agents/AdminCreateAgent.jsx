import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, ArrowRight, Check, AlertCircle, Upload, X,
    User, Building, Target, Award, FileText, CheckCircle2
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import { useToast } from '../../components/ui/toast';
import agentService from '../../services/agentService';
import apiClient from '../../services/apiClient';

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
        dataConsent: true,
        documents: {
            idProof: null,
            companyLicence: null,
            agentPhoto: null,
            identityDocument: null,
            companyRegistration: null,
            resume: null,
            companyPhoto: null
        }
    });

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalSteps = 6;

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleArrayChange = (field, value, checked) => {
        const updated = checked
            ? [...formData[field], value]
            : formData[field].filter(item => item !== value);
        setFormData(prev => ({ ...prev, [field]: updated }));
    };

    const handleFileUpload = (fieldName, file) => {
        if (!file) {
            setFormData(prev => ({
                ...prev,
                documents: { ...prev.documents, [fieldName]: null }
            }));
            return;
        }

        // Validate file type
        const isPhoto = ['agentPhoto', 'companyPhoto'].includes(fieldName);
        const allowedTypes = isPhoto
            ? ['image/jpeg', 'image/jpg', 'image/png']
            : ['application/pdf'];

        if (!allowedTypes.includes(file.type)) {
            const allowed = isPhoto ? 'JPG, JPEG, PNG' : 'PDF';
            toast.error(`Invalid file type. Only ${allowed} files allowed.`);
            return;
        }

        // Validate file size
        const maxSize = isPhoto ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > maxSize) {
            const sizeLabel = isPhoto ? '2MB' : '5MB';
            toast.error(`File size exceeds ${sizeLabel} limit`);
            return;
        }

        setFormData(prev => ({
            ...prev,
            documents: { ...prev.documents, [fieldName]: file }
        }));
        toast.success(`${fieldName.replace(/([A-Z])/g, ' $1').trim()} uploaded successfully`);
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 1:
                return formData.firstName && formData.lastName && formData.email &&
                    formData.phone && formData.qualification && formData.designation &&
                    formData.experience;
            case 2:
                const currentYear = new Date().getFullYear();
                const year = parseInt(formData.establishedYear);
                const isYearValid = year && year <= currentYear && year >= 1900;
                // Added registrationNumber and website as required
                return formData.companyName && formData.companyType && isYearValid &&
                    formData.address && formData.city && formData.state && formData.pincode &&
                    formData.registrationNumber && formData.website;
            case 3:
                return formData.specialization.length > 0 && formData.servicesOffered.length > 0 &&
                    formData.currentStudents && formData.teamSize;
            case 4:
                return formData.partnershipType && formData.expectedStudents && formData.whyPartner;
            case 5:
                // Documents are optional for admin
                return true;
            case 6:
                return true;
            default:
                return false;
        }
    };

    const nextStep = () => {
        if (currentStep < totalSteps && isStepValid()) {
            setCurrentStep(currentStep + 1);
            window.scrollTo(0, 0);
        } else if (!isStepValid()) {
            toast.error("Please fill all required fields");
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 1. Create agent first
            let submissionData = { ...formData };
            // Documents are handled separately
            delete submissionData.documents;

            const createResponse = await agentService.createAgent(submissionData);

            if (createResponse.success && createResponse.data?.agent?._id) {
                const newAgentId = createResponse.data.agent._id;
                const hasDocuments = Object.values(formData.documents).some(doc => doc !== null);

                if (hasDocuments) {
                    // 2. Upload documents
                    const docFormData = new FormData();
                    Object.entries(formData.documents).forEach(([key, file]) => {
                        if (file) docFormData.append(key, file);
                    });

                    await agentService.uploadBulkDocuments(newAgentId, docFormData);
                    toast.success("Agent created and documents uploaded!");
                } else {
                    toast.success("Agent created successfully!");
                }
                navigate('/agents');
            } else {
                throw new Error('Failed to create agent');
            }

        } catch (error) {
            const msg = error.response?.data?.message || error.message || 'Failed to create agent.';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        { id: 1, title: 'Personal', icon: User },
        { id: 2, title: 'Company', icon: Building },
        { id: 3, title: 'Expertise', icon: Target },
        { id: 4, title: 'Partnership', icon: Award },
        { id: 5, title: 'Documents', icon: FileText },
        { id: 6, title: 'Review', icon: CheckCircle2 }
    ];

    const states = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat',
        'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
        'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
        'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
    ];

    const specializationOptions = [
        'MBBS Admissions', 'Medical Counseling', 'Visa Assistance', 'International Admissions',
        'Student Support', 'Career Guidance', 'NEET Coaching', 'Abroad Studies', 'Scholarship Guidance',
        'University Partnerships', 'Student Mentoring', 'Documentation', 'Pre-departure Support'
    ];

    const servicesOptions = [
        'Admission Counseling', 'Visa Processing', 'Accommodation Assistance', 'Travel Arrangements',
        'Document Verification', 'Scholarship Guidance', 'Career Counseling', 'Test Preparation',
        'University Selection', 'Application Processing', 'Financial Planning', 'Post-arrival Support'
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
            <div className="w-full max-w-4xl">
                {/* Header */}
                <PageHeader
                    breadcrumbs={[
                        { label: 'Dashboard', link: '/dashboard' },
                        { label: 'Agents', link: '/agents' },
                        { label: 'Create Agent' }
                    ]}
                />

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Create New Agent</h1>
                    <p className="text-gray-500 mt-1">Add a new agent to the system with complete details.</p>
                </div>

                {/* Horizontal Stepper */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center justify-between relative">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
                        <div
                            className="absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
                            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                        />

                        {steps.map((step) => {
                            const StepIcon = step.icon;
                            return (
                                <div key={step.id} className="relative z-10 flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${currentStep === step.id ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' :
                                        currentStep > step.id ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-200 text-gray-400'
                                        }`}>
                                        {currentStep > step.id ? <CheckCircle2 size={20} /> : <StepIcon size={18} />}
                                    </div>
                                    <span className={`absolute -bottom-6 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${currentStep === step.id ? 'text-emerald-600' : 'text-gray-400'
                                        }`}>
                                        {step.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-8 md:p-10">
                        {/* Step 1: Personal Information */}
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="border-b border-gray-100 pb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                                    <p className="text-sm text-gray-500">Provide agent's official contact details.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">First Name *</label>
                                        <input type="text" required value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none transition-all" placeholder="John" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Last Name *</label>
                                        <input type="text" required value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none transition-all" placeholder="Doe" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Email Address *</label>
                                        <input type="email" required value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none transition-all" placeholder="john@example.com" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Phone Number *</label>
                                        <input type="tel" required value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none transition-all" placeholder="+91 00000 00000" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Alternate Phone</label>
                                        <input type="tel" value={formData.alternatePhone} onChange={(e) => handleInputChange('alternatePhone', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none transition-all" placeholder="Optional" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Highest Qualification *</label>
                                        <input type="text" required value={formData.qualification} onChange={(e) => handleInputChange('qualification', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none transition-all" placeholder="e.g. MBA, B.Tech" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Designation *</label>
                                        <input type="text" required value={formData.designation} onChange={(e) => handleInputChange('designation', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none transition-all" placeholder="CEO / Manager" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Years of Experience *</label>
                                        <select required value={formData.experience} onChange={(e) => handleInputChange('experience', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none cursor-pointer">
                                            <option value="">Select experience</option>
                                            <option value="1-2 years">1-2 years</option>
                                            <option value="3-5 years">3-5 years</option>
                                            <option value="6-10 years">6-10 years</option>
                                            <option value="11-15 years">11-15 years</option>
                                            <option value="15+ years">15+ years</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Company Information */}
                        {currentStep === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="border-b border-gray-100 pb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Company Details</h2>
                                    <p className="text-sm text-gray-500">Information about the business or agency.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Legal Company Name *</label>
                                    <input type="text" required value={formData.companyName} onChange={(e) => handleInputChange('companyName', e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none transition-all" placeholder="Enter company name" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Company Type *</label>
                                        <select required value={formData.companyType} onChange={(e) => handleInputChange('companyType', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none">
                                            <option value="">Select type</option>
                                            <option value="Private Limited">Private Limited</option>
                                            <option value="Public Limited">Public Limited</option>
                                            <option value="Partnership">Partnership</option>
                                            <option value="Proprietorship">Proprietorship</option>
                                            <option value="LLP">LLP</option>
                                            <option value="NGO">NGO / Trust</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Registration Number *</label>
                                        <input type="text" required value={formData.registrationNumber} onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none transition-all" placeholder="Regn. Id" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Year Established *</label>
                                        <input type="number" required value={formData.establishedYear} onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                                            className={`w-full px-4 py-3 bg-white border ${formData.establishedYear && (parseInt(formData.establishedYear) > new Date().getFullYear() || parseInt(formData.establishedYear) < 1900) ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-emerald-500'} rounded-lg focus:ring-2 focus:ring-emerald-500/20 text-gray-900 outline-none transition-all`} placeholder="e.g. 2018" />
                                        {formData.establishedYear && parseInt(formData.establishedYear) > new Date().getFullYear() && (
                                            <p className="text-[10px] text-red-500 font-bold">Cannot be in the future</p>
                                        )}
                                        {formData.establishedYear && parseInt(formData.establishedYear) < 1900 && (
                                            <p className="text-[10px] text-red-500 font-bold">Enter a valid year</p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Company Website *</label>
                                        <input type="url" required value={formData.website} onChange={(e) => handleInputChange('website', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none transition-all" placeholder="https://www.example.com" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Office Address *</label>
                                    <textarea required rows={2} value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none transition-all resize-none" placeholder="Full business address" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">City *</label>
                                        <input type="text" required value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none" placeholder="City" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">State *</label>
                                        <select required value={formData.state} onChange={(e) => handleInputChange('state', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none">
                                            <option value="">Select State</option>
                                            {states.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">PIN Code *</label>
                                        <input type="text" required pattern="[0-9]{6}" value={formData.pincode} onChange={(e) => handleInputChange('pincode', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none" placeholder="6-digit PIN" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Expertise & Reach */}
                        {currentStep === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="border-b border-gray-100 pb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Expertise & Reach</h2>
                                    <p className="text-sm text-gray-500">Highlight specializations and operational scale.</p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700">Areas of Specialization *</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {specializationOptions.map(opt => (
                                            <label key={opt} className={`flex items-center p-2.5 rounded-lg border transition-all cursor-pointer ${formData.specialization.includes(opt) ? 'bg-emerald-50 border-emerald-400' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                                }`}>
                                                <input type="checkbox" checked={formData.specialization.includes(opt)} onChange={(e) => handleArrayChange('specialization', opt, e.target.checked)} className="hidden" />
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2.5 ${formData.specialization.includes(opt) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-300'
                                                    }`}>
                                                    {formData.specialization.includes(opt) && <CheckCircle2 size={12} />}
                                                </div>
                                                <span className={`text-[12px] font-medium ${formData.specialization.includes(opt) ? 'text-emerald-900' : 'text-gray-600'}`}>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700">Services Offered *</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {servicesOptions.map(opt => (
                                            <label key={opt} className={`flex items-center p-2.5 rounded-lg border transition-all cursor-pointer ${formData.servicesOffered.includes(opt) ? 'bg-emerald-50 border-emerald-400' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                                                }`}>
                                                <input type="checkbox" checked={formData.servicesOffered.includes(opt)} onChange={(e) => handleArrayChange('servicesOffered', opt, e.target.checked)} className="hidden" />
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2.5 ${formData.servicesOffered.includes(opt) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-300'
                                                    }`}>
                                                    {formData.servicesOffered.includes(opt) && <CheckCircle2 size={12} />}
                                                </div>
                                                <span className={`text-[12px] font-medium ${formData.servicesOffered.includes(opt) ? 'text-emerald-900' : 'text-gray-600'}`}>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Student Base *</label>
                                        <select required value={formData.currentStudents} onChange={(e) => handleInputChange('currentStudents', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 text-sm">
                                            <option value="">Select range</option>
                                            <option value="1-50">1-50 students</option>
                                            <option value="51-100">51-100 students</option>
                                            <option value="101-250">101-250 students</option>
                                            <option value="251-500">251-500 students</option>
                                            <option value="500+">500+ students</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Team Size *</label>
                                        <select required value={formData.teamSize} onChange={(e) => handleInputChange('teamSize', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 text-sm">
                                            <option value="">Select size</option>
                                            <option value="1-5">1-5 members</option>
                                            <option value="6-10">6-10 members</option>
                                            <option value="11-25">11-25 members</option>
                                            <option value="26-50">26-50 members</option>
                                            <option value="50+">50+ members</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Annual Revenue</label>
                                        <select value={formData.annualRevenue} onChange={(e) => handleInputChange('annualRevenue', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 text-sm">
                                            <option value="">Select range</option>
                                            <option value="Under 10 Lakhs">Under ₹10 Lakhs</option>
                                            <option value="10-25 Lakhs">₹10-25 Lakhs</option>
                                            <option value="25-50 Lakhs">₹25-50 Lakhs</option>
                                            <option value="50 Lakhs - 1 Crore">₹50 Lakhs - 1 Crore</option>
                                            <option value="1-5 Crores">₹1-5 Crores</option>
                                            <option value="5+ Crores">₹5+ Crores</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Partnership Intent */}
                        {currentStep === 4 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="border-b border-gray-100 pb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Partnership Intent</h2>
                                    <p className="text-sm text-gray-500">Share the vision for collaboration.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Partnership Type *</label>
                                        <select required value={formData.partnershipType} onChange={(e) => handleInputChange('partnershipType', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900">
                                            <option value="">Select type</option>
                                            <option value="Authorized Representative">Authorized Representative</option>
                                            <option value="Regional Partner">Regional Partner</option>
                                            <option value="Referral Partner">Referral Partner</option>
                                            <option value="Franchise Partner">Franchise Partner</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Students Target/Year *</label>
                                        <select required value={formData.expectedStudents} onChange={(e) => handleInputChange('expectedStudents', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900">
                                            <option value="">Select range</option>
                                            <option value="10-25">10-25 students</option>
                                            <option value="26-50">26-50 students</option>
                                            <option value="51-100">51-100 students</option>
                                            <option value="100+">100+ students</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Annual Marketing Budget</label>
                                        <select value={formData.marketingBudget} onChange={(e) => handleInputChange('marketingBudget', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900">
                                            <option value="">Select budget</option>
                                            <option value="Under 1 Lakh">Under ₹1 Lakh</option>
                                            <option value="1-5 Lakhs">₹1-5 Lakhs</option>
                                            <option value="5-10 Lakhs">₹5-10 Lakhs</option>
                                            <option value="10+ Lakhs">₹10+ Lakhs</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Any Additional Info</label>
                                        <input type="text" value={formData.additionalInfo} onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none" placeholder="Notes..." />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Why partner with us? *</label>
                                    <textarea required rows={3} value={formData.whyPartner} onChange={(e) => handleInputChange('whyPartner', e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none resize-none" placeholder="Briefly describe the motivation" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Professional References</label>
                                    <textarea rows={2} value={formData.references} onChange={(e) => handleInputChange('references', e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none resize-none" placeholder="Ref contact details" />
                                </div>
                            </div>
                        )}

                        {/* Step 5: Documents (Optional for Admin) */}
                        {currentStep === 5 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="border-b border-gray-100 pb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Upload Documents</h2>
                                    <p className="text-sm text-gray-500">All documents are optional. Agent can upload later from their profile if needed.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { key: 'idProof', label: 'ID Proof (Aadhaar/PAN/Passport)', type: 'pdf', hint: 'Max 5MB' },
                                        { key: 'companyLicence', label: 'Company Licence', type: 'pdf', hint: 'Max 5MB' },
                                        { key: 'agentPhoto', label: 'Agent Photo', type: 'image', hint: 'JPG, PNG - Max 2MB' },
                                        { key: 'companyPhoto', label: 'Company Photo', type: 'image', hint: 'JPG, PNG - Max 2MB' },
                                        { key: 'identityDocument', label: 'Identity Document', type: 'pdf', hint: 'Max 5MB' },
                                        { key: 'companyRegistration', label: 'Company Registration', type: 'pdf', hint: 'Max 5MB' },
                                        { key: 'resume', label: 'Resume / CV', type: 'pdf', hint: 'Max 5MB' },
                                    ].map((doc) => (
                                        <div key={doc.key} className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">{doc.label}</label>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept={doc.type === 'image' ? ".jpg,.jpeg,.png" : ".pdf"}
                                                    onChange={(e) => handleFileUpload(doc.key, e.target.files[0])}
                                                    className="hidden"
                                                    id={doc.key}
                                                />
                                                <label htmlFor={doc.key} className={`flex items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${formData.documents[doc.key] ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                                                    }`}>
                                                    <div className="text-center">
                                                        <Upload className={`mx-auto h-8 w-8 mb-2 ${formData.documents[doc.key] ? 'text-emerald-600' : 'text-gray-400'}`} />
                                                        <p className="text-sm text-gray-600 truncate max-w-[200px] mx-auto">
                                                            {formData.documents[doc.key] ? formData.documents[doc.key].name : `Click to upload ${doc.type.toUpperCase()}`}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {formData.documents[doc.key] ? 'File Selected' : doc.hint}
                                                        </p>
                                                    </div>
                                                </label>
                                                {formData.documents[doc.key] && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFileUpload(doc.key, null)}
                                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 6: Review & Confirm */}
                        {currentStep === 6 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="border-b border-gray-100 pb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Review and Confirm</h2>
                                    <p className="text-sm text-gray-500">Please review all details before creating the agent.</p>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Primary Contact</h4>
                                            <p className="text-lg font-bold text-gray-900">{formData.firstName} {formData.lastName}</p>
                                            <p className="text-gray-600">{formData.email}</p>
                                            <p className="text-gray-600">{formData.phone}</p>
                                            {formData.alternatePhone && <p className="text-gray-600">{formData.alternatePhone}</p>}
                                            <p className="text-gray-600 mt-2">{formData.designation}</p>
                                            <p className="text-gray-600">{formData.qualification}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Organization</h4>
                                            <p className="text-lg font-bold text-gray-900">{formData.companyName}</p>
                                            <p className="text-gray-600">{formData.companyType}</p>
                                            <p className="text-gray-600">{formData.partnershipType}</p>
                                            <p className="text-gray-600 mt-2">{formData.city}, {formData.state}</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Documents Uploaded</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {Object.entries(formData.documents).map(([key, file]) => (
                                                <div key={key} className={`text-xs p-2 rounded ${file ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-400'}`}>
                                                    {file ? '✓' : '○'} {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                                    <p className="text-sm text-blue-800">
                                        By clicking "Create Agent", an account will be created and login credentials will be sent to <strong>{formData.email}</strong>.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
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
                                {currentStep < 6 ? (
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="px-10 py-3 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-lg flex items-center gap-2"
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
            </div >
        </div >
    );
};

export default AdminCreateAgent;
