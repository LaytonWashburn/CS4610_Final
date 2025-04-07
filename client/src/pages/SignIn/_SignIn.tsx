import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router"
import { FormEvent, useState } from "react";
import { useApi } from "../../lib/hooks/use_api";
import { setAuthToken } from "../../store/application_slice";

export const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const api = useApi();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function signIn(e: FormEvent) {
    e.preventDefault();
    const res = await api.post("/sessions", {
      email,
      password
    });
    console.log(res);
    if (!res.error && res.authToken) {
      dispatch(setAuthToken(res.authToken))
      navigate("/dashboard");
    } else {
      console.log(res.error)
    }
  }

  return (
    <main>
      <form onSubmit={signIn}>
        <h3>Sign In</h3>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <div>
          <button>Sign In</button>
        </div>
      </form>
      <div>New user? <Link to="/signup">Create an account.</Link></div>
    </main>
  )
}