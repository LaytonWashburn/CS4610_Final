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
            <Link className="font-bold text-2xl text-center hover:text-secondary-grey" to={"/dashboard/"}>Aggie Tutor</Link>
              <Link className="text-secondary-pink font-bold text-center flex items-center hover:text-white" to={"/dashboard/"}>Home</Link>
              <Link className="text-secondary-pink font-bold text-center flex items-center hover:text-white" to={"/dashboard/tutors/"}>Tutors</Link>
              <Link className="text-secondary-pink font-bold text-center flex items-center hover:text-white" to={"/dashboard/chat/"}>Chat</Link>
              <Link className="text-secondary-pink font-bold text-center flex items-center hover:text-white" to={"/dashboard/queue/"}>Queue</Link>
              <Link className="text-secondary-pink font-bold text-center flex items-center hover:text-white">Profile</Link>
          </div>
          <div className="flex h-[4rem] items-center">
            <Link className="text-secondary-yellow mr-2  font-bold text-center flex items-center">Help</Link>
            <Link className="text-primary-gray mr-2 font-bold text-center flex items-center" to={"/logout/"}>Logout</Link>
          </div>
        </nav>
      );
      
      
      
}