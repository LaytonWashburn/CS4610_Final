import { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { Layout } from './pages/Layout/_Layout.tsx'
import { Signup } from './pages/SignUp/_Signup.tsx'
import { SignIn } from './pages/SignIn/_SignIn.tsx'
import { Home } from './pages/Home/_Home.tsx'
import { Logout } from './pages/Logout/_Logout.tsx'
import { ApiContext } from './lib/api_context.ts'
import { useAuthToken } from './lib/hooks/use_auth_token.ts'
import { Api } from './lib/api.ts'
import { Provider } from 'react-redux'
import store from './store/store.ts'
import { Dashboard } from './pages/Dashboard/_Dashboard.tsx'
import { Tutors } from './pages/Tutors/Tutors.tsx'
import { Chat } from './pages/Chat/Chat.tsx'

const router = createBrowserRouter([
  {
    path: "",
    element: <Layout />,
    children: [{
        path: "",
        element: <Home />
      },
      {
        path: "/signup",
        element: <Signup />
      },
      {
        path: "/signin",
        element: <SignIn />
      },
      {
        path: "/logout",
        element: <Logout />
      },
      {
        path: "/dashboard",
        element: <Dashboard />,
        children: [
          {
            path: "/dashboard/tutors",
            element: <Tutors/>
          },
          {
            path: "/dashboard/chat",
            element: <Chat/>
          }
        ]
      }
    ]
  }
])

const Main = () => {
  const authToken = useAuthToken()
  const apiRef = useRef(new Api(authToken))

  useEffect(() => {
    if(apiRef.current) {
      apiRef.current.authToken = authToken
    }
  }, [authToken])

  return (
    <ApiContext.Provider value={apiRef.current}>
      <RouterProvider router={router} />
    </ApiContext.Provider>
  )
}


createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <Main />
  </Provider>
)
