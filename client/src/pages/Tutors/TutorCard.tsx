import { useState, useEffect } from 'react';

interface ItutorCardProps {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    online?: boolean;
    profilePicture: string;
}

export const TutorCard = ({ id, firstName, lastName, email, online, profilePicture }: ItutorCardProps) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfilePicture = async () => {
            if (profilePicture) {
                try {
                    const response = await fetch(`/profile/picture/${id}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.imageData) {
                            setImageUrl(data.imageData);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching profile picture:', error);
                }
            }
        };

        fetchProfilePicture();
    }, [id, profilePicture]);

    return(
        <div className="w-[80%] max-w-2xl mx-auto my-4 bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="flex p-6">
                {/* Profile Picture */}
                <div className="relative">
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={`${firstName} ${lastName}`}
                            className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                            onError={(e) => {
                                console.error('Image failed to load:', e);
                                const img = e.target as HTMLImageElement;
                                console.log('Failed image src:', img.src);
                            }}
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                            <span className="text-gray-400 text-sm">No Image</span>
                        </div>
                    )}
                    {/* Online Status Indicator */}
                    <div className="absolute bottom-0 right-0">
                        <span className={`w-4 h-4 rounded-full ${online ? 'bg-green-500' : 'bg-gray-400'} border-2 border-white`}></span>
                    </div>
                </div>

                {/* Tutor Information */}
                <div className="ml-6 flex-1">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {firstName} {lastName}
                    </h2>
                    <p className="text-gray-600 mt-1">{email}</p>
                    
                    {/* Status Badge */}
                    <div className="mt-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                            {online ? 'Available for Tutoring' : 'Currently Offline'}
                        </span>
                    </div>

                    {/* Contact Button */}
                    <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300">
                        Contact Tutor
                    </button>
                </div>
            </div>
        </div>
    )
}