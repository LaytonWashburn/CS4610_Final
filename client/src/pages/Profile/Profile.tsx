import React, { useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import "../../index.css";

interface MyTokenPayload {
    userId: number;
    // Add more fields if your token has them
}

export const Profile = () => {
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);



  const fetchProfilePicture = async (id: number) => {
    console.log(`In the fetch user profile with id: ${id}`);
    try {
      console.log('Making request to /profile/picture/${id}');
      const response = await fetch(`/profile/picture/${id}`);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Received image data:', data);
        if (data.imageData) {
          setPreviewUrl(data.imageData);
        }
      } else {
        console.log('Response not OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.log('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching profile picture:', error);
    }
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));  // For preview
      setUploadedFileName(null);  // reset if already uploaded
      setError(null);  // Reset error when a new file is selected
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!profilePicture) {
      setError("Please select a file first.");
      return;
    }

    setUploading(true);  // Start uploading
    setError(null);  // Reset error state

    const formData = new FormData();
    formData.append('file', profilePicture);  // Append the selected file to FormData

    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('Not authenticated');
      }

      const decoded = jwtDecode<MyTokenPayload>(authToken);
      const userId = decoded.userId;
      formData.append('userId', userId.toString());  // Add userId to FormData

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

      const data = await response.json(); // Assuming the server sends a JSON response
      setUploadedFileName(data.fileName);  // Set the uploaded file name if available
      console.log('File uploaded successfully:', data);
      
      // Refresh the profile picture after upload
      if (userId) {
        fetchProfilePicture(userId);
      }

    } catch (error: any) {
      setError(error.message || 'An error occurred while uploading.');
      console.error('Error:', error);
    } finally {
      setUploading(false);  // Reset uploading state
    }
  };

  useEffect(() => {
    // Get userId from JWT token
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      const decoded = jwtDecode<MyTokenPayload>(authToken);
      setUserId(decoded.userId);
      // Fetch existing profile picture
      fetchProfilePicture(decoded.userId);
    }
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <input
        type="file"
        name="file"
        id="profile-picture-upload"
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileChange} // Handle file change
      />

      <button
        onClick={() => document.getElementById('profile-picture-upload')?.click()}
        className="upload-button"
      >
        <span className="material-symbols-outlined">
          add
        </span>
      </button>

      <div style={{ marginTop: '20px' }}>
        <h3>Profile Picture Preview:</h3>
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Profile Preview"
            onError={(e) => {
              console.error('Image failed to load:', e);
              const img = e.target as HTMLImageElement;
              console.log('Failed image src:', img.src);
            }}
            style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #4CAF50',
            }}
          />
        ) : (
          <div
            style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed #4CAF50',
              color: '#999',
            }}
          >
            No Image
          </div>
        )}
      </div>

      <div style={{ marginTop: '10px' }}>
        <button onClick={handleUpload} disabled={uploading || !profilePicture}>
          {uploading ? "Uploading..." : "Upload Profile Picture"}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {uploadedFileName && (
        <p style={{ color: 'green' }}>Uploaded as: {uploadedFileName}</p>
      )}
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
