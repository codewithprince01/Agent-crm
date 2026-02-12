import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Globe, GraduationCap, Clock, Banknote, Calendar, CheckCircle2 } from 'lucide-react';

const ProgramDetailsModal = ({ isOpen, onClose, application }) => {
    if (!application) return null;

    const { programSnapshot, stage, applicationNo, createdAt } = application;
    const program = programSnapshot || {};

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-all"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[51] flex items-center justify-center p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                            className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="px-8 py-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-wider">
                                            {applicationNo}
                                        </span>
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-wider ${stage === 'Arrival' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                                            }`}>
                                            {stage}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 leading-tight">
                                        {program.programName || program.program_name || program.course_name}
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-8 space-y-8">
                                {/* University Info Card */}
                                <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 flex items-start gap-5">
                                    <div className="h-16 w-16 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 border border-blue-50 shrink-0">
                                        <Building2 size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                                            {program.universityName}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Globe size={14} className="text-blue-500" />
                                            {program.countryName}
                                        </div>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition-colors group">
                                        <div className="flex items-center gap-3 mb-2 text-gray-500 group-hover:text-blue-600 transition-colors">
                                            <GraduationCap size={18} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Level</span>
                                        </div>
                                        <p className="text-base font-bold text-gray-900">{program.level || 'N/A'}</p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition-colors group">
                                        <div className="flex items-center gap-3 mb-2 text-gray-500 group-hover:text-blue-600 transition-colors">
                                            <Clock size={18} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Duration</span>
                                        </div>
                                        <p className="text-base font-bold text-gray-900">{program.duration || 'N/A'}</p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition-colors group">
                                        <div className="flex items-center gap-3 mb-2 text-gray-500 group-hover:text-blue-600 transition-colors">
                                            <Banknote size={18} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Tuition Fee</span>
                                        </div>
                                        <p className="text-base font-bold text-gray-900">{program.tuition_fee || program.fee || 'Contact for details'}</p>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition-colors group">
                                        <div className="flex items-center gap-3 mb-2 text-gray-500 group-hover:text-blue-600 transition-colors">
                                            <Calendar size={18} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Intakes</span>
                                        </div>
                                        <p className="text-base font-bold text-gray-900">{program.intake || 'Multiple Intakes'}</p>
                                    </div>
                                </div>

                                {/* Additional Info / Footer */}
                                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        <Clock size={14} />
                                        Applied on {new Date(createdAt).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ProgramDetailsModal;
