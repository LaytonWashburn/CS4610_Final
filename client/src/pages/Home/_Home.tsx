import { Link } from "react-router";
import { useEffect } from 'react';


export const Home = () => {


  return (
    <div>
      <h1>Home</h1>

      <div>
        <Link to="/signin">Sign in</Link>
      </div>
      <div>
        <Link to="signup">Sign up</Link>
      </div>
    </div>
  );
}