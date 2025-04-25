import { useEffect } from 'react';
import { socket } from "../../socket.ts"
import {jwtDecode } from "jwt-decode";


interface MyTokenPayload {
    userId: number;
    // Add more fields if your token has them
  }

export const Queue = () => {


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
        } catch (error) {
            console.log(`Error occurred for the join queue ${error}`);
        }
    }


    return(
        <div>
            <button onClick={joinQueue}
                    className="m-4 p-4 font-bold rounded-lg bg-black text-white hover:bg-secondary-yellow hover:text-black shadow-2xl"
            >
                Join Queue
            </button>
        </div>
    )
}