
interface ItutorCardProps {
    id: Number
    firstName: String
    lastName: String
    email: String
}

export const TutorCard = ({ id, firstName, lastName, email }) : ItutorCardProps => {



    return(
        <main className="flex flex-col w-[50vw] items-center justify-center shadow bg-secondary-pink text-white rounded-2xl m-2 shadow-lg">
            <p>Meet: {firstName } { lastName } </p>
            <p>Email: { email }</p>
        </main>
    )
}