import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';

const PageHeader = ({ breadcrumbs }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                {/* Left Side: Back Button (Hidden on Mobile) */}
                <div className="hidden md:flex items-center gap-4 w-full md:w-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-600 font-bold hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-300 group border border-gray-100 hover:border-indigo-100 cursor-pointer"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back</span>
                    </button>
                </div>

                {/* Right Side: Breadcrumbs */}
                <div className="flex items-center justify-center md:justify-end gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && <ChevronRight size={10} />}
                            {crumb.link ? (
                                <Link to={crumb.link} className="hover:text-indigo-600 transition-colors">
                                    {crumb.label}
                                </Link>
                            ) : (
                                <span className={index === breadcrumbs.length - 1 ? "text-indigo-500" : ""}>
                                    {crumb.label}
                                </span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PageHeader;
