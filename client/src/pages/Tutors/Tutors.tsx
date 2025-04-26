import { AddTutor } from "./AddTutor";
import {React, useState, useEffect} from "react";
import { TutorCard } from "./TutorCard";

import "../../index.css";

interface Tutor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  online?: boolean;
}

/**
 * @description: Tutor component to add or remove tutors
 * @returns: Tutors component
 */
export const Tutors = () => {
    const [tutors, setTutors] = useState<Tutor[]>([]);
    const [clicked, setClicked] = useState(false);
  
    const handleClick = () => {
      setClicked(!clicked);
    };

    async function getTutors() {
        const response = await fetch('/tutor/tutors');
        const body = await response.json();
        return body.tutors || []; // Ensure empty array if tutors is undefined
      }
    
    useEffect(() => {
        async function fetchData() {
          const tutors = await getTutors();
          setTutors(tutors); // Update state with fetched tutors
          console.log(tutors);
        }
    
        fetchData(); // Fetch the tutors on mount
      }, []);

    function addTutor(newTutor: Tutor) {
        setTutors((prevTutors: Tutor[]) => [...prevTutors, newTutor]);
        setClicked(false);
    };
    
    return(
        <main className="flex flex-col w-[100vw] justify-center mb-12">
            {
                tutors.length > 0 && (
                    <p className="flex h-[2rem] mb-12 items-center justify-center text-black font-bold text-2xl w-[100vw]">Meet Your Tutors</p>
                )
            }
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex space-x-4">
                            <button 
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                onClick={handleClick}
                            >
                                <span className="material-symbols-outlined mr-2">person_add</span>
                                Add Self
                            </button>
                            <button 
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                                onClick={handleClick}
                            >
                                <span className="material-symbols-outlined mr-2">group_add</span>
                                Add Someone
                            </button>
                        </div>
                    </div>
                </div>
            </div>
               
            {/* Check if tutors is an array and contains elements */}
            {Array.isArray(tutors) && tutors.length > 0 ? (
                tutors.map((tutor: Tutor) => (
                <div className="flex justify-center w-[100vw]"
                     key={tutor.id}
                 >
                    <TutorCard
                        key={tutor.id}
                        id={tutor.id}
                        firstName={tutor.firstName}
                        lastName={tutor.lastName}
                        email={tutor.email}
                        online={tutor.online}
                        profilePicture={tutor.profilePicture}
                    />
                </div>
                ))
            ) : (
                <div className="w-[65vw] mx-auto flex justify-center items-center mt-4">
                <p className="text-xl">No Tutors in the Database</p> 
                </div>
            )}

            {clicked && ( <>
                            <span
                                className="material-symbols-outlined absolute top-4 right-4 text-white cursor-pointer z-10"
                                onClick={handleClick}
                            >
                                close
                            </span>

                            <AddTutor addTutor={addTutor} />
                            </>
            )}
        </main>
    )
}