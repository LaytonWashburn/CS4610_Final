import { useEffect } from 'react';
import { socket } from "../../socket.ts"
import {jwtDecode } from "jwt-decode";
import {useState } from "react"

interface MyTokenPayload {
    userId: number;
    // Add more fields if your token has them
  }

export const Queue = () => {

    const [queue, setQueue] = useState(false);
    const [matched, setMatched] = useState(false);
    const [tutor, setTutor] = useState(0);
    const [tutorName, setTutorName] = useState("");

    async function getTutorInfo(id:number|string){
        console.log(`In the getTutorInfo for ${id}`);
        try {
            const response = await fetch(`/tutor/tutors/${id}`);

            const body = await response.json();
            console.log(body);
            return body.tutor.user.firstName;
        } catch (error) {
            console.log(`Error occurred for the getting the tutor ${error}`);
        }
    }

    async function joinQueue() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error("User is not logged in");
            return;
        }
        const decoded = jwtDecode<MyTokenPayload>(token);
        const userId = decoded.userId;
        console.log(`Here is the userId: ${userId} ${decoded.isTutor}`);

        try {
            const response = await fetch('/queue/join/', {
                method: 'POST',
                headers : {
                    'Content-Type':'application/json'
                },
                body: JSON.stringify({
                    studentId: userId
                })
            });

            const body = await response.json();
            setQueue(body.result.queue);
            setMatched(body.result.matched);
            if(body.result.matched){
                setTutor(body.result.tutor.id);
                console.log(`Getting info for tutor ${body.result.tutor.id}`);
                setTutorName(getTutorInfo(body.result.tutor.id))
            }
            console.log(body);

        } catch (error) {
            console.log(`Error occurred for the join queue ${error}`);
        }
    }


    return(
        <div className="flex flex-col">
            <div className="flex flex-col">
                {!queue && !matched && (
                    <button
                        onClick={joinQueue}
                        className="flex-end m-4 p-4 font-bold rounded-lg bg-black text-white hover:bg-secondary-yellow hover:text-black shadow-2xl"
                    >
                        Join Queue
                    </button>
                    )}
                    {
                        queue && (
                            <div className="flex justify-center items-center">
                                <p className="font-bold text-2xl">Joined the Queue</p>
                            </div>
                    )}
                    {
                        matched && (
                            <div className="flex justify-center items-center">
                                <p className="font-bold text-2xl">Conected with Tutor { tutorName }</p>
                            </div>
                    )}
            </div>
        </div>
    )
}