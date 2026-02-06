import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectSettings } from '../../store/slices/settingsSlice';
import {
    User, Building, Mail, Phone, Globe, FileText,
    AlertCircle, Briefcase, GraduationCap, Award,
    Calendar, Target, Send, ChevronRight, ChevronLeft,
    CheckCircle2, ArrowLeft, ShieldCheck, MapPin, Users
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../components/ui/toast';

const PartnerApplicationForm = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const settings = useSelector(selectSettings);
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
        termsAccepted: false,
        dataConsent: false
    });

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const totalSteps = 5;

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleArrayChange = (field, value, checked) => {
        setFormData(prev => ({
            ...prev,
            [field]: checked
                ? [...prev[field], value]
                : prev[field].filter(item => item !== value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const userAgent = window.navigator.userAgent;
        let os = "Unknown OS";
        if (userAgent.indexOf("Windows") !== -1) os = "Windows";
        if (userAgent.indexOf("Mac") !== -1) os = "MacOS";
        if (userAgent.indexOf("Linux") !== -1) os = "Linux";

        const submissionData = {
            ...formData,
            os: os,
            browser: navigator.appName || 'Unknown'
        };

        try {
            const response = await apiClient.post('/inquiry/partner-application', submissionData);
            if (response.data && response.data.success) {
                toast.success(response.data.message || 'Application submitted successfully!');
                navigate('/');
            } else {
                toast.error(response.data?.message || 'Submission failed.');
            }
        } catch (error) {
            console.error("Submission error:", error);
            toast.error(error.response?.data?.message || 'Failed to submit application.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isStepValid = () => {
        switch (currentStep) {
            case 1:
                return formData.firstName && formData.lastName && formData.email &&
                    formData.phone && formData.qualification && formData.designation &&
                    formData.experience;
            case 2:
                return formData.companyName && formData.companyType && formData.establishedYear &&
                    formData.address && formData.city && formData.state && formData.pincode;
            case 3:
                return formData.specialization.length > 0 && formData.servicesOffered.length > 0 &&
                    formData.currentStudents && formData.teamSize;
            case 4:
                return formData.partnershipType && formData.expectedStudents && formData.whyPartner;
            case 5:
                return formData.termsAccepted && formData.dataConsent;
            default:
                return false;
        }
    };

    const nextStep = () => {
        if (currentStep < totalSteps && isStepValid()) {
            // Interactive feedback
            const feedback = {
                1: { title: 'Step 1 Success', next: 'Company details please' },
                2: { title: 'Company Details Saved', next: 'Expertise & Reach details please' },
                3: { title: 'Expertise Acknowledged', next: 'Partnership intent please' },
                4: { title: 'Intent Noted', next: 'Review & Confirmation please' }
            };

            const stepInfo = feedback[currentStep];
            if (stepInfo) {
                toast.success(`${stepInfo.title}! ${stepInfo.next}.`);
            }

            setCurrentStep(currentStep + 1);
        }
    };
    const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }, [currentStep]);

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

    const steps = [
        { id: 1, title: 'Personal', icon: User },
        { id: 2, title: 'Company', icon: Building },
        { id: 3, title: 'Expertise', icon: Target },
        { id: 4, title: 'Partnership', icon: Award },
        { id: 5, title: 'Review', icon: FileText }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
            <div className="w-full max-w-4xl">
                {/* Simplified Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <button onClick={() => navigate('/')} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-emerald-600 mb-4 transition-colors group">
                            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back to Selection
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">Partner Application</h1>
                        <p className="text-gray-500 mt-1">Join our network and help students achieve their medical dreams.</p>
                    </div>
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

                        {steps.map((step) => (
                            <div key={step.id} className="relative z-10 flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${currentStep === step.id ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' :
                                    currentStep > step.id ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-gray-200 text-gray-400'
                                    }`}>
                                    {currentStep > step.id ? <CheckCircle2 size={20} /> : <step.icon size={18} />}
                                </div>
                                <span className={`absolute -bottom-6 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${currentStep === step.id ? 'text-emerald-600' : 'text-gray-400'
                                    }`}>
                                    {step.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-8 md:p-10">
                        {/* Step 1: Personal */}
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="border-b border-gray-100 pb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                                    <p className="text-sm text-gray-500">Provide your official contact details for communication.</p>
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

                        {/* Step 2: Company */}
                        {currentStep === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="border-b border-gray-100 pb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Company Details</h2>
                                    <p className="text-sm text-gray-500">Information about your business or agency.</p>
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
                                        <label className="text-sm font-semibold text-gray-700">Registration Number</label>
                                        <input type="text" value={formData.registrationNumber} onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none transition-all" placeholder="Regn. Id" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Year Established *</label>
                                        <input type="number" required min="1950" max="2024" value={formData.establishedYear} onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none transition-all" placeholder="e.g. 2018" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Company Website</label>
                                        <input type="url" value={formData.website} onChange={(e) => handleInputChange('website', e.target.value)}
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

                        {/* Step 3: Expertise */}
                        {currentStep === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="border-b border-gray-100 pb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Expertise & Reach</h2>
                                    <p className="text-sm text-gray-500">Highlight your specializations and operational scale.</p>
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

                        {/* Step 4: Partnership */}
                        {currentStep === 4 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="border-b border-gray-100 pb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Partnership Intent</h2>
                                    <p className="text-sm text-gray-500">Share your vision for collaborating with us.</p>
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
                                    <label className="text-sm font-semibold text-gray-700">Why do you want to partner with us? *</label>
                                    <textarea required rows={3} value={formData.whyPartner} onChange={(e) => handleInputChange('whyPartner', e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none resize-none" placeholder="Briefly describe your motivation" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Professional References</label>
                                    <textarea rows={2} value={formData.references} onChange={(e) => handleInputChange('references', e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-900 outline-none resize-none" placeholder="Ref contact details" />
                                </div>
                            </div>
                        )}

                        {/* Step 5: Review */}
                        {currentStep === 5 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="border-b border-gray-100 pb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Review & Confirmation</h2>
                                    <p className="text-sm text-gray-500">Verify your details before submitting the application.</p>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div><p className="text-gray-500 font-medium">Applicant Name</p><p className="text-gray-900 font-bold">{formData.firstName} {formData.lastName}</p></div>
                                    <div><p className="text-gray-500 font-medium">Company Name</p><p className="text-gray-900 font-bold">{formData.companyName}</p></div>
                                    <div><p className="text-gray-500 font-medium">Contact Email</p><p className="text-gray-900 font-bold">{formData.email}</p></div>
                                    <div><p className="text-gray-500 font-medium">Partnership Type</p><p className="text-gray-900 font-bold">{formData.partnershipType}</p></div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <label className="flex items-start cursor-pointer group">
                                        <input type="checkbox" required checked={formData.termsAccepted} onChange={(e) => handleInputChange('termsAccepted', e.target.checked)} className="mt-1 mr-3 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                        <span className="text-sm text-gray-600">
                                            I agree to the <Link to="/terms" className="text-emerald-600 font-semibold hover:underline">Terms & Conditions</Link> and certify all info is correct.
                                        </span>
                                    </label>

                                    <label className="flex items-start cursor-pointer group">
                                        <input type="checkbox" required checked={formData.dataConsent} onChange={(e) => handleInputChange('dataConsent', e.target.checked)} className="mt-1 mr-3 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                        <span className="text-sm text-gray-600">
                                            I consent to processing my professional data for evaluation.
                                        </span>
                                    </label>
                                </div>

                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
                                    <AlertCircle className="text-blue-600 flex-shrink-0" size={18} />
                                    <p className="text-[12px] text-blue-800 font-medium">
                                        Review typically takes 3-5 business days. We will reach out via email for the next steps.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Navigation Footer */}
                        <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
                            <button type="button" onClick={prevStep} disabled={currentStep === 1}
                                className={`px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${currentStep === 1 ? 'text-gray-300' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                    }`}>
                                <ChevronLeft size={16} /> Previous
                            </button>

                            {currentStep < totalSteps ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={!isStepValid()}
                                    className={`px-8 py-2.5 rounded-lg font-bold shadow-sm transition-all flex items-center gap-2 ${!isStepValid()
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'
                                        }`}
                                >
                                    Next Step <ChevronRight size={16} />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !isStepValid()}
                                    className={`px-10 py-2.5 rounded-lg font-bold shadow-md transition-all flex items-center gap-2 ${isSubmitting || !isStepValid()
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                                        }`}
                                >
                                    {isSubmitting ? 'Submitting...' : <><Send size={16} /> Submit Application</>}
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Simplified Footer */}
                <div className="mt-12 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} {settings.platform_name || ''} Global CRM &bull; SECURE PORTAL
                </div>
            </div>
        </div>
    );
};

export default PartnerApplicationForm;
