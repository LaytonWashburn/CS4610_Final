import React, { useState } from "react";
import { socket } from "../../socket";

/**
 * Component: Add Tutor Component
 * @returns 
 */

interface IaddtutorProps {
    addTutor: (id: number) => void;
}

export const AddTutor = ({addTutor} : {addTutor: ( tutor: IaddtutorProps) =>  void }) =>{
  
    const [id, setId] = useState("");
  
    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        console.log("Hello from submit");

        try {
            console.log(`Sending ${id}`);
            const response = await fetch(`/tutor/tutors/`, {
                method: "POST",
                headers: {
                    "Content-Type" : "application/json",
                },
                body: JSON.stringify({id: id})
            });

            if(!response.ok) {
                alert("Unable to create tutor");
                throw new Error(`Error: ${response.statusText}`);
            }

            const body = await response.json();

            const tutor = body.newTutor;

            addTutor(tutor);
            socket.emit("tutor-status", { 
              userId: parseInt(id),
              action: 'online'
            });

        } catch (error) {
            
        }

    }

    return (
        <>
          {/* Blurred background */}
          <div className="fixed inset-0 backdrop-blur-sm bg-black/30 z-5"></div>
      
          {/* Centered content */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-white w-[90%] max-w-md rounded-lg shadow-xl overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Add New Tutor</h2>
              
              <form action="" className="relative h-full flex flex-col items-center justify-center">
                <div className="w-full space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Enter Tutor ID:
                  </label>
                  <input 
                    type="text" 
                    name="" 
                    id="" 
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={id}
                    onChange={(e) => setId(e.target.value)} 
                  />
                </div>
                <button 
                  onClick={submit} 
                  className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Tutor
                </button>
              </form>
            </div>
          </div>
        </>
      );
}