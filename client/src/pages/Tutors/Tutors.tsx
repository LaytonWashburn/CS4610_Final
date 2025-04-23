import { AddTutor } from "./AddTutor";
import {React, useState, useEffect} from "react";
import { TutorCard } from "./TutorCard";

import "../../index.css";

/**
 * @description: Tutor component to add or remove tutors
 * @returns: Tutors component
 */
export const Tutors = () => {

    const [tutors, setTutors] = useState<TutorCard[]>([]);
    const [clicked, setClicked] = useState(false);
  
    const handleClick = () => {
      setClicked(!clicked);
    };

    async function getTutors() {
        const response = await fetch('/tutors');
        const body = await response.json();
        return body.tutors || []; // Ensure empty array if chatRooms is undefined
      }
    
      useEffect(() => {
        async function fetchData() {
          const tutors = await getTutors();
          setTutors(tutors); // Update state with fetched chat rooms
          console.log(tutors);
        }
    
        fetchData(); // Fetch the chat rooms on mount
      }, []);

    function addTutor(newTutor: TutorCard) {
        // Check if the newChatRoom is valid before updating state

      setTutors((prevChats: TutorCard[]) => [...prevChats, newTutor]);
      setClicked(false); // Optionally close the modal after creation

    };
    

    return(
        <main className="flex flex-col w-[100vw] justify-center mb-12">
             {
                    tutors.length > 0 && (
                        <p className="flex h-[2rem] mb-12 items-center justify-center text-white bg-secondary-orange w-[100vw]">Meet Your Tutors</p>
                    )
                }
            <div className="fixed bottom-0 flex justify-between h-[4rem] w-[100vw] bg-secondary-teal">
                <button className="cursor-pointer bg-secondary-yellow hover:font-bold"
                        onClick={handleClick}>
                    Add self
                </button>
                <button className="cursor-pointer bg-secondary-yellow hover:font-bold"
                        onClick={handleClick}>
                    Add Someone
                </button>
            </div>
               
                  {/* Check if chats is an array and contains elements */}
                    {Array.isArray(tutors) && tutors.length > 0 ? (
                        tutors.map((tutor: ChatRoom) => (
                        <div className="flex justify-center w-[100vw]">
                            <TutorCard
                            key={tutor.id}
                            id={tutor.id}
                            firstName={tutor.firstName}
                            lastName={tutor.lastName}
                            email={tutor.email}
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
                                onClick={handleClick} // Close modal when clicking close
                            >
                                close
                            </span>

                            <AddTutor addTutor={addTutor} />
                            </>
            )}
        </main>
    )

}