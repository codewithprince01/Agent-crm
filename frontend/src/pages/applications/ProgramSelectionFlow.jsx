import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronRight, ChevronLeft, Search, GraduationCap, Building2,
    Globe, BookOpen, Layers, CheckCircle, AlertCircle,
    RefreshCw, Filter, ArrowRight, Star, Clock, Sparkles
} from 'lucide-react';
import externalSearchService from '../../services/externalSearchService';
import studentService from '../../services/studentService';
import applicationService from '../../services/applicationService';
import { useToast } from '../../components/ui/toast';
import './ProgramSelection.css';

const ProgramSelectionFlow = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const { success, error: showError } = useToast();

    // Flow State
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [student, setStudent] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Selections
    const [selections, setSelections] = useState({
        country: null,
        university: null,
        level: null,
        category: null,
        specialization: null,
        program: null
    });

    // Data lists
    const [data, setData] = useState({
        countries: [],
        universities: [],
        levels: [],
        categories: [],
        specializations: [],
        programs: []
    });

    // Final selected program for review step
    const [previewProgram, setPreviewProgram] = useState(null);

    // Progress percentage
    const progress = (step / 6) * 100;

    // Load initial data
    useEffect(() => {
        const init = async () => {
            try {
                setLoading(true);
                const [studentRes, countriesRes] = await Promise.all([
                    studentService.getStudentById(studentId),
                    externalSearchService.getCountries()
                ]);

                const studentData = studentRes.data?.student || studentRes.data;
                const countries = countriesRes.data || [];

                setStudent(studentData);
                setData(prev => ({ ...prev, countries }));

                // Handle no countries (Access Control)
                if (countries.length === 0) {
                    // We stay on step 1 but nothing will be shown except empty state
                    setLoading(false);
                    return;
                }

                // Auto-skip logic for initial load
                let currentStep = 1;
                let currentSelections = {
                    country: null,
                    university: null,
                    level: null,
                    category: null,
                    specialization: null,
                    program: null
                };
                let currentData = { countries, universities: [], levels: [], categories: [], specializations: [], programs: [] };

                const autoSkip = async (s) => {
                    if (s === 1) {
                        if (countries.length === 1) {
                            currentSelections.country = countries[0];
                            return await autoSkip(2);
                        }
                    } else if (s === 2) {
                        const res = await externalSearchService.getUniversities({
                            country: currentSelections.country.website || currentSelections.country.name
                        });
                        const univs = res.data || [];
                        currentData.universities = univs;
                        if (univs.length === 1) {
                            currentSelections.university = univs[0];
                            return await autoSkip(3);
                        }
                    } else if (s === 3) {
                        const res = await externalSearchService.getLevels(currentSelections.university.id);
                        const levels = res.data || [];
                        currentData.levels = levels;
                        if (levels.length === 1) {
                            currentSelections.level = typeof levels[0] === 'string' ? levels[0] : levels[0].level;
                            return await autoSkip(4);
                        }
                    } else if (s === 4) {
                        const res = await externalSearchService.getCategories(currentSelections.university.id, currentSelections.level);
                        const categories = res.data || [];
                        currentData.categories = categories;
                        if (categories.length === 1) {
                            currentSelections.category = categories[0];
                            return await autoSkip(5);
                        }
                    } else if (s === 5) {
                        const res = await externalSearchService.getSpecializations(
                            currentSelections.university.id,
                            currentSelections.level,
                            currentSelections.category.id
                        );
                        const specs = res.data || [];
                        currentData.specializations = specs;
                        if (specs.length === 0) {
                            return await autoSkip(6);
                        }
                    } else if (s === 6) {
                        console.log("Step 6 Init - Fetching programs with:", {
                            university_id: currentSelections.university.id,
                            level: currentSelections.level,
                            course_category_id: currentSelections.category?.id,
                            specialization_id: currentSelections.specialization?.id
                        });
                        const programsRes = await externalSearchService.getPrograms({
                            university_id: currentSelections.university.id,
                            level: currentSelections.level,
                            course_category_id: currentSelections.category?.id,
                            specialization_id: currentSelections.specialization?.id
                        });
                        const programs = programsRes.data || [];
                        console.log("Step 6 Init - Programs result:", programs);
                        currentData.programs = programs;

                        // Auto-select program if only one exists
                        if (programs.length === 1) {
                            console.log("Step 6 Init - Auto-selecting:", programs[0]);
                            setPreviewProgram(programs[0]);
                        }
                    }
                    return s;
                };

                const finalStep = await autoSkip(1);
                setSelections(currentSelections);
                setData(currentData);
                setStep(finalStep);
            } catch (err) {
                console.error("Init error:", err);
                showError("Failed to initialize selection flow");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [studentId]);

    // Reset search term when step changes
    useEffect(() => {
        setSearchTerm('');
    }, [step]);

    // Filtered data based on search
    const filteredItems = useMemo(() => {
        const term = searchTerm.toLowerCase();
        let items = [];
        switch (step) {
            case 1: items = data.countries; break;
            case 2: items = data.universities; break;
            case 3: items = data.levels.map(l => ({ name: typeof l === 'string' ? l : l.level, value: typeof l === 'string' ? l : l.level })); break;
            case 4: items = data.categories; break;
            case 5: items = data.specializations; break;
            case 6: items = data.programs; break;
            default: items = [];
        }
        return items.filter(item => {
            const name = item.name || item.program_name || item.course_name || item.category_name || item.specialization_name || '';
            return name.toLowerCase().includes(term);
        });
    }, [step, data, searchTerm]);

    // Step Transition Handlers
    const handleNext = async () => {
        try {
            setLoading(true);
            let currentStep = step;
            let currentSelections = { ...selections };
            let currentData = { ...data };

            const processStep = async (nextStep) => {
                let finalNextStep = nextStep;

                if (nextStep === 2) {
                    const res = await externalSearchService.getUniversities({
                        country: currentSelections.country.website || currentSelections.country.name
                    });
                    const univs = res.data || [];
                    currentData.universities = univs;

                    if (univs.length === 1) {
                        currentSelections.university = univs[0];
                        return await processStep(3);
                    }
                } else if (nextStep === 3) {
                    const res = await externalSearchService.getLevels(currentSelections.university.id);
                    const levels = res.data || [];
                    currentData.levels = levels;

                    if (levels.length === 1) {
                        const levelVal = typeof levels[0] === 'string' ? levels[0] : levels[0].level;
                        currentSelections.level = levelVal;
                        return await processStep(4);
                    }
                } else if (nextStep === 4) {
                    const res = await externalSearchService.getCategories(currentSelections.university.id, currentSelections.level);
                    const categories = res.data || [];
                    currentData.categories = categories;

                    if (categories.length === 1) {
                        currentSelections.category = categories[0];
                        return await processStep(5);
                    } else if (categories.length === 0) {
                        // If no categories, try to jump to programs? 
                        // Usually implies no programs or direct programs.
                        return await processStep(6);
                    }
                } else if (nextStep === 5) {
                    const res = await externalSearchService.getSpecializations(
                        currentSelections.university.id,
                        currentSelections.level,
                        currentSelections.category.id
                    );
                    const specs = res.data || [];
                    currentData.specializations = specs;

                    if (specs.length === 0) {
                        // No specializations, jump straight to programs
                        return await processStep(6);
                    }
                } else if (nextStep === 6) {
                    console.log("Step 6 Next - Fetching programs with:", {
                        university_id: currentSelections.university.id,
                        level: currentSelections.level,
                        course_category_id: currentSelections.category?.id,
                        specialization_id: currentSelections.specialization?.id
                    });
                    const res = await externalSearchService.getPrograms({
                        university_id: currentSelections.university.id,
                        level: currentSelections.level,
                        course_category_id: currentSelections.category?.id,
                        specialization_id: currentSelections.specialization?.id
                    });
                    const programs = res.data || [];
                    console.log("Step 6 Next - Programs result:", programs);
                    currentData.programs = programs;

                    // Auto-select if only one program
                    if (programs.length === 1) {
                        console.log("Step 6 Next - Auto-selecting:", programs[0]);
                        setPreviewProgram(programs[0]);
                    }
                }

                return { finalNextStep, currentSelections, currentData };
            };

            const result = await processStep(step + 1);

            setSelections(result.currentSelections);
            setData(result.currentData);
            setStep(result.finalNextStep);

            // Reset preview when moving steps (unless we just auto-selected)
            if (result.finalNextStep !== 6) {
                setPreviewProgram(null);
            }

        } catch (err) {
            console.error("Transition error:", err);
            showError("Failed to load options for next step. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (program) => {
        try {
            setLoading(true);
            const payload = {
                studentId,
                programId: program.id || program.course_id,
                programSnapshot: {
                    programName: program.course_name || program.name || program.program_name,
                    universityName: selections.university.name,
                    countryName: selections.country.name,
                    level: selections.level,
                    duration: program.duration || 'N/A',
                    category: selections.category.name || selections.category.category_name,
                    specialization: selections.specialization.name || selections.specialization.specialization_name
                },
                notes: `Applied via Specialized Program Selector for ${student.firstName}`
            };

            await applicationService.createApplication(payload);
            success("Your application has been successfully queued!");
            navigate('/applied-students');
        } catch (err) {
            showError(err.response?.data?.message || "Application submission encountered an issue.");
        } finally {
            setLoading(false);
        }
    };

    const SelectionCard = ({ item, label, isActive, onClick, icon: Icon }) => {
        const name = item.course_name || item.name || item.program_name || item.category_name || item.specialization_name || '';

        return (
            <motion.button
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02, translateY: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClick}
                className={`
                    group relative flex flex-col p-6 rounded-[32px] border-2 transition-all duration-500 overflow-hidden text-left
                    ${isActive
                        ? 'border-primary-500 bg-white shadow-2xl shadow-primary-500/20'
                        : 'border-white bg-white/60 hover:border-primary-200 hover:shadow-xl hover:bg-white'
                    }
                `}
            >
                <div className={`
                    h-14 w-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500
                    ${isActive ? 'bg-primary-600 text-white rotate-6' : 'bg-gray-50 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-500'}
                `}>
                    <Icon size={28} />
                </div>

                <div className="w-full">
                    <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 mb-1 leading-none">{label}</p>
                    <h4 className={`text-lg font-black leading-tight transition-colors ${isActive ? 'text-indigo-950' : 'text-gray-700 group-hover:text-primary-700'}`}>
                        {name}
                    </h4>
                </div>

                {isActive && (
                    <div className="absolute top-6 right-6 h-6 w-6 bg-primary-600 rounded-full flex items-center justify-center text-white scale-110 shadow-lg shadow-primary-500/40">
                        <CheckCircle size={14} />
                    </div>
                )}
            </motion.button>
        );
    };

    if (!student && !loading) return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="text-center p-12 glass-card rounded-[48px] max-w-lg mx-auto">
                <div className="h-20 w-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Access Restricted</h2>
                <p className="text-gray-500 font-medium mt-4">We couldn't retrieve the student record. The ID may be invalid or you may not have sufficient permissions.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-10 px-10 py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-600/10 hover:bg-primary-700 transition-all active:scale-95"
                >
                    Return to Dashboard
                </button>
            </div>
        </div>
    );

    // Permission Not Assigned View for agents
    if (!loading && student && data.countries.length === 0 && step === 1) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center p-12 glass-card rounded-[48px] max-w-lg mx-auto">
                    <div className="h-20 w-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Filter size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Permission not assigned</h2>
                    <p className="text-gray-500 font-medium mt-4">No countries or universities have been assigned to your account by the administrator. Please contact support to get access.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-10 px-10 py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-600/10 hover:bg-primary-700 transition-all active:scale-95"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="program-selection-container p-4 md:p-12 max-w-[1500px] mx-auto min-h-screen bg-[#F8FAFC]">
            <div className="hero-glow"></div>

            {/* Nav Header */}
            <div className="mb-12 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6 w-full lg:w-auto">
                    <button
                        onClick={() => step > 1 ? (setStep(step - 1), setPreviewProgram(null)) : navigate(-1)}
                        className="p-5 glass-card rounded-2xl text-gray-500 hover:text-primary-600 hover:border-primary-200 transition-all active:scale-90 group border-none shadow-sm"
                    >
                        <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary-500 mb-1">
                            <Sparkles size={12} fill="currentColor" />
                            <span>University Selection</span>
                        </div>
                        <h1 className="text-4xl font-black text-indigo-950 tracking-tighter">
                            Student: <span className="text-primary-600 underline decoration-primary-200 decoration-8 underline-offset-4">{student?.firstName} {student?.lastName}</span>
                        </h1>
                    </div>
                </div>

                {/* Progress Visualizer */}
                <div className="flex items-center gap-4 bg-white/50 backdrop-blur-xl p-2 pl-6 rounded-[32px] border border-white shadow-xl shadow-black/[0.02] w-full lg:w-auto">
                    <div className="flex -space-x-3 overflow-hidden">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <motion.div
                                key={i}
                                animate={{ scale: step === i ? 1.2 : 1, zIndex: step === i ? 10 : 0 }}
                                className={`
                                    w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs border-2 transition-all duration-500
                                    ${step === i ? 'bg-primary-600 text-white border-primary-400 shadow-xl shadow-primary-500/40 translate-y--1' :
                                        step > i ? 'bg-green-500 text-white border-green-400' : 'bg-gray-100 text-gray-300 border-white'}
                                `}
                            >
                                {step > i ? <CheckCircle size={16} /> : i}
                            </motion.div>
                        ))}
                    </div>
                    <div className="pr-6 pl-2 hidden sm:block">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Phase</p>
                        <p className="text-[11px] font-black text-indigo-950">Step 0{step} of 06</p>
                    </div>
                </div>
            </div>

            {/* Header / Selection Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mb-12 overflow-hidden rounded-[50px] premium-gradient p-12 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-3xl"
            >
                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-10 right-10 w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl"></div>
                </div>

                <div className="flex-1 text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start space-x-4 mb-6">
                        <span className="px-5 py-2 bg-white/10 text-white border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">Phase_0{step}</span>
                        <div className="h-px w-8 bg-white/20"></div>
                        <span className="text-white/80 font-bold tracking-widest uppercase text-xs italic">Step Progress Registry</span>
                    </div>
                    <h2
                        className="text-4xl md:text-5xl !text-white tracking-tight leading-tight mb-6"
                        style={{ color: 'white' }}
                    >
                        {step === 1 && 'Define Destination'}
                        {step === 2 && 'Institutional Alignment'}
                        {step === 3 && 'Academic Tier Selection'}
                        {step === 4 && 'Discipline Domain'}
                        {step === 5 && 'Specialization Path'}
                        {step === 6 && (previewProgram ? 'Review Application' : 'Final Selection')}
                    </h2>
                    <p className="text-white font-medium max-w-xl text-lg lg:text-base leading-relaxed opacity-90">
                        {step === 1 && 'Select the sovereign nation where the student intends to maximize their academic potential.'}
                        {step === 2 && `Browsing distinguished academic institutions currently operating in ${selections.country?.name}.`}
                        {step === 3 && 'Specify the hierarchical level of the desired academic credential.'}
                        {step === 4 && 'Isolate specific areas of study to refine the search for perfect-match programs.'}
                        {step === 5 && 'Select the precise specialization to ensure career-aligned academic focus.'}
                        {step === 6 && (previewProgram
                            ? `Verify all details for ${student?.firstName} and the selected course before finalizing.`
                            : `Choose the definitive program for ${student?.firstName} from the filtered results.`)}
                    </p>
                </div>

                <div className="w-full lg:w-[400px] relative">
                    <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-white/30" size={24} />
                    <input
                        type="text"
                        placeholder="Live Search Registry..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-16 pr-8 py-7 bg-white/10 border border-white/5 rounded-[32px] text-white font-bold placeholder:text-white/20 focus:bg-white/15 focus:border-primary-500/50 transition-all outline-none backdrop-blur-xl text-lg shadow-2xl"
                    />
                </div>
            </motion.div>

            {/* Selection Grid */}
            <div className="min-h-[500px] mb-32">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loader"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-[500px] glass-card rounded-[60px] border-dashed border-2 border-gray-100"
                        >
                            <div className="relative">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    className="w-24 h-24 border-[6px] border-primary-100 border-t-primary-600 rounded-full"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="text-primary-600 animate-pulse" size={32} />
                                </div>
                            </div>
                            <p className="mt-8 text-sm font-black uppercase tracking-[0.5em] text-gray-400">Synchronizing Data...</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`step-${step}`}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.5, ease: "circOut" }}
                        >
                            {step < 6 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                    {filteredItems.map((item, idx) => (
                                        <SelectionCard
                                            key={idx}
                                            item={item}
                                            label={
                                                step === 1 ? 'Market' :
                                                    step === 2 ? 'Institution' :
                                                        step === 3 ? 'Credential' :
                                                            step === 4 ? 'Discipline' : 'Focus Area'
                                            }
                                            isActive={
                                                (step === 1 && selections.country?.id === item.id) ||
                                                (step === 2 && selections.university?.id === item.id) ||
                                                (step === 3 && selections.level === (item.value || item.name)) ||
                                                (step === 4 && selections.category?.id === item.id) ||
                                                (step === 5 && selections.specialization?.id === item.id)
                                            }
                                            onClick={() => {
                                                const key = step === 1 ? 'country' :
                                                    step === 2 ? 'university' :
                                                        step === 3 ? 'level' :
                                                            step === 4 ? 'category' : 'specialization';

                                                const val = step === 3 ? (item.value || item.name) : item;
                                                setSelections(prev => ({ ...prev, [key]: val }));
                                            }}
                                            icon={
                                                step === 1 ? Globe :
                                                    step === 2 ? Building2 :
                                                        step === 3 ? GraduationCap :
                                                            step === 4 ? Layers : BookOpen
                                            }
                                        />
                                    ))}

                                    {filteredItems.length === 0 && (
                                        <div className="col-span-full py-40 flex flex-col items-center text-center">
                                            <div className="h-32 w-32 bg-gray-50 rounded-[40px] flex items-center justify-center text-gray-200 mb-8 border border-gray-100 shadow-inner rotate-3 transition-transform hover:rotate-6">
                                                <Search size={48} />
                                            </div>
                                            <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Registry Search Failed</h3>
                                            <p className="text-gray-400 font-medium max-w-xs mx-auto text-lg leading-relaxed">No active records match the current search filters. Try a broader search term.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* STEP 6: SIMPLIFIED PROFESSIONAL LAYOUT */
                                <div className="max-w-[1400px] mx-auto">


                                    {/* Main Content Area */}
                                    <AnimatePresence mode="wait">
                                        {previewProgram ? (
                                            /* Program Review Details */
                                            <motion.div
                                                key="review"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                className="space-y-6"
                                            >
                                                {/* Student Info & Selection Summary - Side by Side */}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {/* Student Information Card */}
                                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Student Information</h3>

                                                        <div className="flex items-center gap-4 mb-6">
                                                            <div className="h-14 w-14 bg-indigo-600 rounded-lg flex items-center justify-center text-xl font-bold text-white">
                                                                {student?.firstName?.[0]}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-lg font-bold text-gray-900">{student?.firstName} {student?.lastName}</h4>
                                                                <p className="text-xs text-gray-500">ID: {studentId.slice(-8).toUpperCase()}</p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <p className="text-xs text-gray-500 mb-1">Nationality</p>
                                                                <p className="font-semibold text-gray-900">{student?.nationality || 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500 mb-1">Phone</p>
                                                                <p className="font-semibold text-gray-900">{student?.phone || 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500 mb-1">Passport</p>
                                                                <p className="font-semibold text-gray-900">{student?.passportNumber || 'N/A'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-500 mb-1">City</p>
                                                                <p className="font-semibold text-gray-900">{student?.city || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Selection Summary Card */}
                                                    <div className="bg-indigo-600 p-6 rounded-xl shadow-sm text-white">
                                                        <p className="text-xl text-white font-bold uppercase tracking-wider text-indigo-100 mb-4">Selection Summary</p>

                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div>
                                                                <p className="text-xs text-indigo-200 mb-1">Country</p>
                                                                <p className="font-semibold">{selections.country?.name}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-indigo-200 mb-1">Level</p>
                                                                <p className="font-semibold uppercase">{selections.level}</p>
                                                            </div>
                                                            <div className="col-span-2">
                                                                <p className="text-xs text-indigo-200 mb-1">University</p>
                                                                <p className="font-semibold">{selections.university?.name}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-indigo-200 mb-1">Category</p>
                                                                <p className="font-semibold">{selections.category?.name || selections.category?.category_name}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-indigo-200 mb-1">Specialization</p>
                                                                <p className="font-semibold truncate">{selections.specialization?.name || selections.specialization?.specialization_name || 'General'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Course Details Section */}
                                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                                                    {/* Header with Program Name */}
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                                        <div>
                                                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Selected Program</span>
                                                            <h3 className="text-2xl font-bold text-gray-900 mt-2">
                                                                {previewProgram.course_name || previewProgram.name || previewProgram.program_name || 'Selected Course'}
                                                            </h3>
                                                        </div>
                                                        <button
                                                            onClick={() => setPreviewProgram(null)}
                                                            className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-semibold transition-colors"
                                                        >
                                                            Change Selection
                                                        </button>
                                                    </div>

                                                    {/* Program Details Grid */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {/* Duration */}
                                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                            <p className="text-xs text-gray-500 mb-2">Duration</p>
                                                            <div className="flex items-center gap-3">
                                                                <Clock size={20} className="text-indigo-600" />
                                                                <p className="text-lg font-bold text-gray-900">{previewProgram.duration?.trim() || 'N/A'}</p>
                                                            </div>
                                                        </div>

                                                        {/* Study Mode */}
                                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                            <p className="text-xs text-gray-500 mb-2">Study Mode</p>
                                                            <div className="flex items-center gap-3">
                                                                <BookOpen size={20} className="text-indigo-600" />
                                                                <p className="text-lg font-bold text-gray-900">{previewProgram.study_mode || 'Full-time'}</p>
                                                            </div>
                                                        </div>

                                                        {/* Tuition */}
                                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                            <p className="text-xs text-gray-500 mb-2">Tuition Fee</p>
                                                            <div className="flex items-center gap-3">
                                                                <Layers size={20} className="text-indigo-600" />
                                                                <p className="text-lg font-bold text-gray-900">{previewProgram.tuition_fee || 'Variable'}</p>
                                                            </div>
                                                        </div>

                                                        {/* Intakes */}
                                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 lg:col-span-2">
                                                            <p className="text-xs text-gray-500 mb-3">Available Intakes</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {(previewProgram.intake?.split(',') || ['Flexible']).map((m, i) => (
                                                                    <span key={i} className="px-3 py-1 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-700">{m.trim()}</span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Academic Info */}
                                                        <div className="p-4 bg-indigo-600 rounded-lg text-white">
                                                            <p className="text-xs text-white mb-3">Academic Details</p>
                                                            <div className="space-y-3">
                                                                <div className="flex items-center gap-3">
                                                                    <Layers size={16} className="text-white" />
                                                                    <div>
                                                                        <p className="text-xs text-white">Category</p>
                                                                        <p className="text-sm font-semibold">{previewProgram.course_category?.name || selections.category?.name || selections.category?.category_name}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <BookOpen size={16} className="text-white" />
                                                                    <div>
                                                                        <p className="text-xs text-white">Specialization</p>
                                                                        <p className="text-sm font-semibold">{previewProgram.course_specialization?.name || selections.specialization?.name || selections.specialization?.specialization_name || 'General'}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Apply Button */}
                                                <button
                                                    onClick={() => handleApply(previewProgram)}
                                                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-base hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-lg"
                                                >
                                                    <CheckCircle size={24} />
                                                    Confirm & Submit Application
                                                </button>
                                            </motion.div>
                                        ) : filteredItems.length > 0 ? (
                                            /* PHASE 1: PROGRAM LIST */
                                            <motion.div
                                                key="list"
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -30 }}
                                                className="grid grid-cols-1 gap-6"
                                            >
                                                <div className="flex items-center justify-between mb-4 px-4">
                                                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400">Identify Program Registry</h3>
                                                    <span className="text-[10px] font-black text-primary-500 bg-primary-50 px-3 py-1 rounded-full">{filteredItems.length} Records Found</span>
                                                </div>

                                                {filteredItems.map((p, idx) => (
                                                    <motion.div
                                                        key={idx}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                        onClick={() => setPreviewProgram(p)}
                                                        className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl hover:shadow-2xl hover:border-primary-200 hover:scale-[1.01] transition-all duration-500 cursor-pointer group flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden"
                                                    >
                                                        <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                                                            <Sparkles size={24} />
                                                        </div>

                                                        <div className="flex-1 text-center sm:text-left">
                                                            <h4 className="text-xl font-black text-indigo-950 mb-3 group-hover:text-primary-600 transition-colors leading-snug">
                                                                {p.course_name || p.name || p.program_name || 'Untitled Course'}
                                                            </h4>
                                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-8">
                                                                <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest gap-2">
                                                                    <Clock size={12} className="text-primary-500" />
                                                                    {p.duration || 'N/A'}
                                                                </div>
                                                                <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest gap-2">
                                                                    <Star size={12} className="text-orange-500" />
                                                                    {p.intake || 'Flexible'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="h-14 px-8 rounded-2xl bg-gray-50 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-indigo-950 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                                                            Analyze Setup
                                                            <ArrowRight size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        ) : (
                                            /* PHASE 3: EMPTY RESULTS - Refined for compact space */
                                            <motion.div
                                                key="empty"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="flex flex-col items-center justify-center text-center bg-white rounded-[50px] border-2 border-dashed border-gray-100 p-20 py-32 shadow-xl"
                                            >
                                                <div className="h-24 w-24 bg-gray-50 rounded-[35px] flex items-center justify-center text-gray-200 mb-8 border border-gray-100 rotate-3 transition-transform hover:rotate-6">
                                                    <Search size={40} />
                                                </div>
                                                <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">No Specific Programs Found</h3>
                                                <p className="text-gray-400 font-medium max-w-md mx-auto text-lg leading-relaxed mb-10">
                                                    No specific programs are listed for <span className="text-indigo-950 font-bold">{selections.university?.name}</span> + <span className="text-indigo-950 font-bold">{selections.level}</span>
                                                    {selections.specialization && <> + <span className="text-indigo-950 font-bold">{selections.specialization.name || selections.specialization.specialization_name}</span></>}.
                                                </p>
                                                <button
                                                    onClick={() => setStep(step - 1)}
                                                    className="px-12 py-5 bg-gray-100 text-gray-700 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-200 transition-all shadow-lg active:scale-95"
                                                >
                                                    Apply for {selections.course_name}
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Premium Sticky Action Bar */}
            <AnimatePresence>
                {step < 6 && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[95%] lg:w-[1200px] z-50"
                    >
                        <div className="bg-white/90 backdrop-blur-3xl flex flex-col md:flex-row items-center justify-between p-6 lg:p-7 px-10 rounded-3xl shadow-2xl shadow-primary-900/10 border border-gray-100">
                            <div className="hidden lg:flex items-center space-x-8">
                                <div className="flex -space-x-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className={`h-10 w-10 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white ${i === 1 ? 'bg-indigo-400' : i === 2 ? 'bg-primary-500' : 'bg-blue-400'}`}>0{i}</div>
                                    ))}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-0.5">Application Progress</p>
                                    <p className="text-sm font-black text-indigo-950 uppercase tracking-widest">
                                        {step < 3 ? 'Selection' : step < 5 ? 'Preferences' : 'Finalize'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center gap-10 w-full md:w-auto">
                                {(
                                    (step === 1 && selections.country) ||
                                    (step === 2 && selections.university) ||
                                    (step === 3 && selections.level) ||
                                    (step === 4 && selections.category) ||
                                    (step === 5 && selections.specialization)
                                ) && (
                                        <div className="text-center md:text-right hidden sm:block">
                                            <div className="inline-flex items-center space-x-2 mb-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse"></div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selection Locked</p>
                                            </div>
                                            <p className="text-lg font-black text-indigo-950 truncate max-w-[300px] tracking-tight">
                                                {step === 1 ? selections.country.name :
                                                    step === 2 ? selections.university.name :
                                                        step === 3 ? selections.level :
                                                            step === 4 ? (selections.category.name || selections.category.category_name) :
                                                                (selections.specialization.name || selections.specialization.specialization_name)}
                                            </p>
                                        </div>
                                    )}

                                <button
                                    onClick={handleNext}
                                    disabled={
                                        (step === 1 && !selections.country) ||
                                        (step === 2 && !selections.university) ||
                                        (step === 3 && !selections.level) ||
                                        (step === 4 && !selections.category)
                                    }
                                    className={`
                                        group relative px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center shadow-lg active:scale-95 w-full md:w-auto justify-center
                                        ${!((step === 1 && !selections.country) || (step === 2 && !selections.university) || (step === 3 && !selections.level) || (step === 4 && !selections.category))
                                            ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-600/20'
                                            : 'bg-gray-100 text-gray-300 border border-gray-100 cursor-not-allowed shadow-none'}
                                    `}
                                >
                                    Proceed to Step 0{step + 1}
                                    <ArrowRight size={22} className="ml-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default ProgramSelectionFlow;
