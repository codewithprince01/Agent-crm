import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Globe, GraduationCap, Clock, Banknote, Calendar, CheckCircle2, CreditCard, Activity, Check } from 'lucide-react';

const STAGES = [
    'Pre-Payment',
    'Pre-Submission',
    'Submission',
    'Post-Submission',
    'Admission',
    'Visa-Application',
    'Pre-Arrival',
    'Post-Arrival',
    'Arrival'
];

const ProgramDetailsModal = ({ isOpen, onClose, application }) => {
    if (!application) return null;

    const { programSnapshot, stage, applicationNo, createdAt, applicationStatus, paymentStatus, paymentDate } = application;
    const program = programSnapshot || {};

    const currentStageIdx = STAGES.indexOf(stage);

    const getPaymentColor = (status) => {
        const colors = {
            paid: 'bg-green-50 text-green-700 border-green-200',
            unpaid: 'bg-amber-50 text-amber-700 border-amber-200',
            cancelled: 'bg-red-50 text-red-700 border-red-200',
        };
        return colors[status] || 'bg-gray-50 text-gray-600 border-gray-200';
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-all"
                    />

                    <div className="fixed inset-0 z-[51] flex items-center justify-center p-4 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                            className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl border border-gray-100 overflow-hidden relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="px-8 py-6 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-wider">
                                            {applicationNo}
                                        </span>
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-wider ${stage === 'Arrival' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                            {stage}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 leading-tight">
                                        {program.programName || program.program_name || program.course_name}
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-h-[75vh] overflow-y-auto">
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

                                {/* Program Details Grid (Moved up) */}
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                                        <GraduationCap size={14} /> Program Details
                                    </h4>
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
                                </div>

                                {/* Application Progress — Horizontal Stepper */}
                                <div className="bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-100 overflow-hidden">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                                        <Activity size={14} /> Application Progress
                                    </h4>

                                    <div className="overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0">
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', padding: '0 8px', minWidth: '700px' }}>
                                            {/* Connector line behind circles */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '18px',
                                                left: '24px',
                                                right: '24px',
                                                height: '3px',
                                                background: '#e5e7eb',
                                                zIndex: 0
                                            }} />
                                            {/* Active progress line */}
                                            {currentStageIdx >= 0 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '18px',
                                                    left: '24px',
                                                    width: currentStageIdx === 0 ? '0%' : `${(currentStageIdx / (STAGES.length - 1)) * 100}%`,
                                                    maxWidth: 'calc(100% - 48px)',
                                                    height: '3px',
                                                    background: '#6366f1',
                                                    zIndex: 1,
                                                    transition: 'width 0.5s ease'
                                                }} />
                                            )}

                                            {STAGES.map((s, i) => {
                                                const isCompleted = i < currentStageIdx;
                                                const isCurrent = i === currentStageIdx;

                                                return (
                                                    <div key={s} style={{
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                        position: 'relative', zIndex: 2, flex: '1 1 0', minWidth: 0
                                                    }}>
                                                        <div style={{
                                                            width: '36px', height: '36px', borderRadius: '50%',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '13px', fontWeight: 800,
                                                            transition: 'all 0.3s ease',
                                                            ...(isCompleted ? {
                                                                background: '#6366f1', color: 'white',
                                                                boxShadow: '0 2px 8px rgba(99,102,241,0.3)'
                                                            } : isCurrent ? {
                                                                background: 'white', color: '#6366f1',
                                                                border: '3px solid #6366f1',
                                                                boxShadow: '0 2px 12px rgba(99,102,241,0.25)'
                                                            } : {
                                                                background: 'white', color: '#9ca3af',
                                                                border: '2px solid #d1d5db'
                                                            })
                                                        }}>
                                                            {isCompleted ? <Check size={16} strokeWidth={3} /> : i + 1}
                                                        </div>
                                                        <span style={{
                                                            marginTop: '12px',
                                                            fontSize: '10px',
                                                            fontWeight: isCurrent ? 800 : 600,
                                                            color: isCompleted ? '#6366f1' : isCurrent ? '#4f46e5' : '#9ca3af',
                                                            textAlign: 'center',
                                                            lineHeight: '1.2',
                                                            maxWidth: '70px',
                                                            wordBreak: 'break-word',
                                                            whiteSpace: 'pre-line' /* allows hyphen to break nicely */
                                                        }}>
                                                            {s.replace('-', '\n')}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Details (Moved to bottom) */}
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                                        <CreditCard size={14} /> Payment Details
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Payment Status</div>
                                            <div className={`inline-block px-3 py-1 rounded-full text-xs font-black border ${getPaymentColor(paymentStatus)}`}>
                                                {(paymentStatus || 'unpaid').charAt(0).toUpperCase() + (paymentStatus || 'unpaid').slice(1)}
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Payment Date</div>
                                            <p className="text-sm font-bold text-gray-900">
                                                {paymentDate ? new Date(paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
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
