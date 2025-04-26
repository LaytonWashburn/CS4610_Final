import React, { useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import "../../index.css";

interface MyTokenPayload {
    userId: number;
}

interface UserInfo {
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl: string | null;
}

export const Profile = () => {
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      const decoded = jwtDecode<MyTokenPayload>(authToken);
      setUserId(decoded.userId);
      fetchUserInfo(decoded.userId);
      fetchProfilePicture(decoded.userId);
    }
  }, []);

  const fetchUserInfo = async (id: number) => {
    try {
      const response = await fetch(`/profile/info/${id}`);
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchProfilePicture = async (id: number) => {
    try {
      const response = await fetch(`/profile/picture/${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.imageData) {
          setPreviewUrl(data.imageData);
        }
      }
    } catch (error) {
      console.error('Error fetching profile picture:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadedFileName(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!profilePicture) {
      setError("Please select a file first.");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', profilePicture);

    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Not authenticated');
      }

      const decoded = jwtDecode<MyTokenPayload>(authToken);
      const userId = decoded.userId;
      formData.append('userId', userId.toString());

      const response = await fetch('/profile/upload/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload the image.');
      }

      const data = await response.json();
      setUploadedFileName(data.fileName);
      
      if (userId) {
        fetchProfilePicture(userId);
      }

    } catch (error: any) {
      setError(error.message || 'An error occurred while uploading.');
      console.error('Error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-8 md:space-y-0 md:space-x-8">
              {/* Profile Picture Section */}
              <div className="w-full md:w-1/3 text-center">
                <div className="relative mx-auto w-48 h-48 mb-4">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile Preview"
                      className="w-full h-full rounded-full object-cover border-4 border-indigo-500 shadow-lg"
                      onError={(e) => {
                        console.error('Image failed to load:', e);
                        const img = e.target as HTMLImageElement;
                        console.log('Failed image src:', img.src);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center border-4 border-dashed border-gray-300">
                      <span className="text-gray-400 text-lg">No Image</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <input
                    type="file"
                    name="file"
                    id="profile-picture-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />

                  <button
                    onClick={() => document.getElementById('profile-picture-upload')?.click()}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <span className="material-symbols-outlined mr-2">add</span>
                    Select New Picture
                  </button>

                  <button
                    onClick={handleUpload}
                    disabled={uploading || !profilePicture}
                    className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                      uploading || !profilePicture
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      'Upload Profile Picture'
                    )}
                  </button>
                </div>
              </div>

              {/* User Information Section */}
              <div className="w-full md:w-2/3">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Profile Information</h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded-md">
                        <p className="text-gray-900">{userInfo?.firstName || 'Loading...'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded-md">
                        <p className="text-gray-900">{userInfo?.lastName || 'Loading...'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md">
                      <p className="text-gray-900">{userInfo?.email || 'Loading...'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Messages */}
            <div className="mt-8">
              {error && (
                <div className="p-4 bg-red-50 rounded-md">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {uploadedFileName && (
                <div className="p-4 bg-green-50 rounded-md">
                  <p className="text-sm text-green-700">Successfully uploaded: {uploadedFileName}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



// import React, { useState } from 'react';
// import "../../index.css";

// export const Profile = () => {
//   const [profilePicture, setProfilePicture] = useState<File | null>(null);
//   const [uploading, setUploading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);

//   // Handle file selection
//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       setProfilePicture(file);
//     }
//   };

//   // Handle upload to the server
//   const handleUpload = async () => {
//     if (!profilePicture) {
//       alert("Please select a file first.");
//       return;
//     }

//     setUploading(true);
//     setError(null);

//     // Prepare FormData to send the file to the server
//     const formData = new FormData();
//     formData.append('profilePicture', profilePicture);

//     try {
//         console.log(formData)
// ;      // Replace with your actual upload endpoint
//       const response = await fetch('/profile/upload/', {
//         method: 'POST',
//         body: formData,
//       });

//       if (!response.ok) {
//         throw new Error('Failed to upload the image.');
//       }

//       const data = await response.json();
//       console.log('Image uploaded successfully:', data);
//       alert('Profile picture uploaded successfully!');

//     } catch (error) {
//       setError(error.message);
//       console.error(error);
//     } finally {
//       setUploading(false);
//     }
//   };

//   return (
//     <div>
//       <input
//         type="file"
//         id="profile-picture-upload"
//         style={{ display: 'none' }}
//         accept="image/*"
//         onChange={handleFileChange}
//       />

//       <button
//         onClick={() => document.getElementById('profile-picture-upload')?.click()}
//         className="upload-button"
//       >
//         <span className="material-symbols-outlined">
//           add
//         </span>
//       </button>

//       {profilePicture ? (
//         <div style={{ marginTop: '20px', textAlign: 'center' }}>
//           <h3>Profile Picture Preview:</h3>
//           <img
//             src={URL.createObjectURL(profilePicture)}
//             alt="Profile Preview"
//             style={{
//               width: '150px',
//               height: '150px',
//               borderRadius: '50%', // Make it round
//               objectFit: 'cover', // Crop the image to fit the circle
//               border: '2px solid #4CAF50', // Border color for emphasis
//             }}
//           />
//         </div>
//       ) : (
//         <div style={{ marginTop: '20px', textAlign: 'center' }}>
//           <h3>Profile Picture Preview:</h3>
//           <div
//             style={{
//               width: '150px',
//               height: '150px',
//               borderRadius: '50%',
//               backgroundColor: '#f0f0f0', // Light grey background
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               border: '2px dashed #4CAF50', // Dotted border
//               color: '#999',
//             }}
//           >
//             No Image
//           </div>
//         </div>
//       )}

//       {uploading ? (
//         <p>Uploading...</p>
//       ) : (
//         <button onClick={handleUpload} disabled={!profilePicture} style={{ marginTop: '10px' }}>
//           Upload Profile Picture
//         </button>
//       )}

//       {error && <p style={{ color: 'red' }}>{error}</p>}
//     </div>
//   );
// };
