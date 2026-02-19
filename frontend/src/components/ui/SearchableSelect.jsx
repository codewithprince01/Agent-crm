import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

const SearchableSelect = ({
    options = [],
    value,
    onChange,
    placeholder = "Select an option",
    searchPlaceholder = "Search...",
    className = "",
    disabled = false,
    menuHeight = "max-h-60" // Default height for approx 7-10 items
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredOptions, setFilteredOptions] = useState(options);
    const wrapperRef = useRef(null);
    const searchInputRef = useRef(null);

    // Initial filter when options change
    useEffect(() => {
        setFilteredOptions(options);
    }, [options]);

    // Handle initial value if it's not in options (optional safety)
    const selectedOption = options.find(opt => opt.value === value);

    // Filter logic
    useEffect(() => {
        if (!searchTerm) {
            setFilteredOptions(options);
        } else {
            const lowerSearch = searchTerm.toLowerCase();
            const filtered = options.filter(opt =>
                String(opt.label).toLowerCase().includes(lowerSearch) ||
                String(opt.value).toLowerCase().includes(lowerSearch)
            );
            setFilteredOptions(filtered);
        }
    }, [searchTerm, options]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus input on open
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (option) => {
        onChange(option.value);
        setIsOpen(false);
        setSearchTerm("");
    };

    // Clear selection
    const handleClear = (e) => {
        e.stopPropagation();
        onChange("");
    };

    return (
        <div className={`relative w-full ${className}`} ref={wrapperRef}>
            {/* Trigger Button */}
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-3 py-3 bg-white border rounded-lg cursor-pointer transition-all duration-200 
                    ${isOpen ? 'ring-2 ring-indigo-500/20 border-indigo-500' : 'border-gray-300 hover:border-gray-400'}
                    ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-70' : ''}
                `}
            >
                <span className={`block truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div className="flex items-center gap-2">
                    {value && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </div>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    {/* Search Bar */}
                    <div className="p-2 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <ul className={`${menuHeight} overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent py-1`}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, index) => (
                                <li
                                    key={`${option.value}-${index}`}
                                    onClick={() => handleSelect(option)}
                                    className={`px-3 py-2.5 text-sm cursor-pointer flex items-center justify-between transition-colors
                                        ${option.value === value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}
                                    `}
                                >
                                    <span>{option.label}</span>
                                    {option.value === value && <Check size={14} className="text-indigo-600" />}
                                </li>
                            ))
                        ) : (
                            <li className="px-3 py-8 text-center text-sm text-gray-500 italic">
                                No results found
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
