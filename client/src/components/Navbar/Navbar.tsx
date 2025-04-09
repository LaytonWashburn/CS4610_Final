import { Link } from "react-router-dom";
/**
 * Component: Navbar
 * Description: 
 * @return
 */
export const Navbar = () => {

    return (
        <nav className="bg-secondary-blue2 h-[4rem] flex justify-between items-center px-4">
          <div className="flex space-x-4 h-[4rem] items-center">
            <h1 className="font-bold text-2xl text-center">Aggie Tutor</h1>
            <Link className="text-secondary-pink font-bold text-center flex items-center" to={"/dashboard/"}>Home</Link>
            <Link className="text-secondary-pink font-bold text-center flex items-center" to={"/dashboard/tutors/"}>Tutors</Link>
            <Link className="text-secondary-pink font-bold text-center flex items-center" to={"/dashboard/chat/"}>Chat</Link>
            <Link className="text-secondary-pink font-bold text-center flex items-center">Queue</Link>
            <Link className="text-secondary-pink font-bold text-center flex items-center">Profile</Link>
          </div>
          <div className="flex space-x-4 h-[4rem] items-center">
            <Link className="text-secondary-yellow font-bold text-center flex items-center">Help</Link>
            <Link className="text-primary-gray font-bold text-center flex items-center">Logout</Link>
          </div>
        </nav>
      );
      
      
      
}