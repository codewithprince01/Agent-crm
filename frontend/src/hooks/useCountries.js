import { useState, useEffect } from 'react';
import studentService from '../services/studentService';
import { useToast } from '../components/ui/toast'; // Assuming toast is available or passed in, but hooks usually don't consume UI components directly best practice. 
// However, looking at StudentForm, it uses a custom useToast. 
// Ideally, data fetching hooks should return error state and let component handle UI.

const useCountries = () => {
    const [countries, setCountries] = useState([]);
    const [phoneCodes, setPhoneCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                setLoading(true);
                const response = await studentService.getCountries();
                const rawCountries = response?.data || [];

                // Transform for dropdowns
                const formattedCountries = rawCountries.map(c => ({
                    code: c.code,
                    name: c.name
                }));

                const formattedPhoneCodes = rawCountries.flatMap(c =>
                    c.phone?.map(p => ({ phonecode: p.toString() })) || []
                ).filter((v, i, a) => a.findIndex(t => t.phonecode === v.phonecode) === i); // Unique

                setCountries(formattedCountries);
                setPhoneCodes(formattedPhoneCodes);
            } catch (err) {
                console.error('Error fetching countries:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCountries();
    }, []);

    return { countries, phoneCodes, loading, error };
};

export default useCountries;
