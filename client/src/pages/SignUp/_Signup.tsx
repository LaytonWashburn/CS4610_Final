import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router";
import { FormEvent, useState } from "react";
import { useApi } from "../../lib/hooks/use_api";
import { setAuthToken } from "../../store/application_slice";

export const Signup = () => {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailConfirmation, setEmailConfirmation] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const api = useApi();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function signUp(e: FormEvent) {
    e.preventDefault();
    const res = await api.post("/api/users", {
      firstName,
      lastName,
      email,
      password
    });

    if (!res.error && res.authToken) {
      dispatch(setAuthToken(res.authToken))
      navigate("/dashboard");
    } else {
      console.log(res.error)
    }
  }

  return (
    <main >
      <form onSubmit={signUp}>
        <h3>Sign In</h3>
        <div>
          <input
            placeholder="First Name"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
          />
          <div>
        </div>
          <input
            placeholder="Last Name"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
          />
          <div>
        </div>
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div>
          <input
            placeholder="Confirm Email"
            type="email"
            value={emailConfirmation}
            onChange={e => setEmailConfirmation(e.target.value)}
          />
        </div>
        <div>
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <div>
          <input
            placeholder="Confirm Password"
            type="password"
            value={passwordConfirmation}
            onChange={e => setPasswordConfirmation(e.target.value)}
          />
        </div>
        <div>
          <button>Create Account</button>
        </div>
      </form>
      <div>Already have an account? <Link to="/signup">Go to sign in.</Link></div>
    </main>
  )
}