
interface ItutorCardProps {
    id: Number
    firstName: String
    lastName: String
    email: String
}

export const TutorCard = ({ id, firstName, lastName, email }) : ItutorCardProps => {



    return(
        <main className="flex flex-col w-[50vw] items-center justify-center shadow bg-secondary-cyan">
            <p>Meet: {firstName } { lastName } </p>
            <p>Email: { email }</p>
        </main>
    )
}