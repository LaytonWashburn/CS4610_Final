import {React, useState} from "react";

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

        } catch (error) {
            
        }

    }

    return (
        <>
          {/* Blurred background */}
          <div className="fixed inset-0 backdrop-blur-sm z-5 bg-opacity-50"></div>
      
          {/* Centered content */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-secondary-orange w-[50vw] h-[50vh] mx-auto px-4 flex flex-col items-center justify-center">
            <form action="" className="relative h-full text-white font-bold flex flex-col items-center justify-center">
              <div className="px-4">
                <label className="px-4">Enter Chat Name: </label>
                <input 
                  type="text" 
                  name="" 
                  id="" 
                  className="bg-white text-black px-4"
                  value={id}
                  onChange={(e) => setId(e.target.value)} 
                />
              </div>
              <button onClick={submit} className="absolute bottom-0 w-full bg-blue-500 text-white p-4 hover:font-bold cursor-pointer" >Create</button>
            </form>
          </div>
        </>
      );
      
      

}