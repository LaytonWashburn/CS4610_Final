import { Link } from "react-router-dom";
/**
 * Component: Navbar
 * Description: 
 * @return
 */
export const Navbar = () => {




    return(
        <div>
            <Link to={"/dashboard/"}>Home</Link>
            <Link to={"/dashboard/tutors/"}>Tutors</Link>
        </div>
    )
}