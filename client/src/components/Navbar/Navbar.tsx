import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import { jwtDecode } from "jwt-decode";
/**
 * Component: Navbar
 * Description: 
 * @return
 */
interface MyTokenPayload {
    isTutor: boolean;
}

export const Navbar = () => {
    const authToken = useSelector((state: RootState) => state.application.authToken);
    const isTutor = authToken ? (jwtDecode(authToken) as MyTokenPayload).isTutor : false;

    return (
        <nav className="sticky top-0 bg-secondary-blue2 h-[4rem] flex justify-between items-center px-4 shadow-lg">
            <div className="flex space-x-4 h-[4rem] items-center">
                <Link 
                    className="font-bold text-2xl text-primary-white hover:text-secondary-grey transition-colors duration-200" 
                    to={"/dashboard/"}>
                    Aggie Tutor
                </Link>
                <Link 
                    className="text-primary-white font-medium hover:text-secondary-grey transition-colors duration-200" 
                    to={"/dashboard/"}>
                    Home
                </Link>
                <Link 
                    className="text-primary-white font-medium hover:text-secondary-grey transition-colors duration-200" 
                    to={"/dashboard/tutors/"}>
                    Tutors
                </Link>
                <Link 
                    className="text-primary-white font-medium hover:text-secondary-grey transition-colors duration-200" 
                    to={"/dashboard/chat/"}>
                    Chat
                </Link>
                <Link 
                    className="text-primary-white font-medium hover:text-secondary-grey transition-colors duration-200" 
                    to={"/dashboard/ai/"}>
                    AI
                </Link>
                <Link 
                    className="text-primary-white font-medium hover:text-secondary-grey transition-colors duration-200" 
                    to={"/dashboard/queue/"}>
                    Queue
                </Link>
                <Link 
                    className="text-primary-white font-medium hover:text-secondary-grey transition-colors duration-200" 
                    to={"/dashboard/profile/"}>
                    Profile
                </Link>
                {isTutor && (
                    <Link 
                        className="text-primary-white font-medium hover:text-secondary-grey transition-colors duration-200" 
                        to={"/dashboard/tutor/"}>
                        Tutor Dashboard
                    </Link>
                )}
            </div>
            <div className="flex h-[4rem] items-center space-x-4">
                <Link 
                    className="text-secondary-yellow font-medium hover:text-primary-white transition-colors duration-200" 
                    to={"/dashboard/help/"}>
                    Help
                </Link>
                <Link 
                    className="text-primary-white font-medium hover:text-secondary-grey transition-colors duration-200" 
                    to={"/logout/"}>
                    Logout
                </Link>
            </div>
        </nav>
    );
};