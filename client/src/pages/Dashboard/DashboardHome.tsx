import { useState, useEffect } from 'react';

export const DashboardHome = () => {
  const [onlineTutors, setOnlineTutors] = useState<number | null>(null);

  useEffect(() => {
    const fetchOnlineTutors = async () => {
      try {
        const response = await fetch('/tutors/online');
        const data = await response.json();
        setOnlineTutors(data.onlineTutors);
      } catch (error) {
        console.error('Failed to fetch online tutors:', error);
      }
    };

    fetchOnlineTutors();
  }, []);

  return (
    <div className="relative p-5">
      <h2 className="mb-8">Hello From Dashboard Home</h2>
      {onlineTutors !== null ? (
        <div className="absolute top-5 right-5 bg-gray-100 p-5 rounded-lg shadow-lg w-48 text-center text-lg font-bold">
          <div className="flex justify-center items-center mb-2">
            <span
              className={`w-3 h-3 rounded-full ${
                onlineTutors > 0 ? 'bg-green-500' : 'bg-gray-500'
              }`}
            ></span>
            <h3 className="ml-2">Tutors Online: {onlineTutors}</h3>
          </div>
        </div>
      ) : (
        <div>Loading online tutors...</div>
      )}
    </div>
  );
};
