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
import { Room } from './pages/Chat/Room.tsx'
import { DashboardHome } from './pages/Dashboard/DashboardHome.tsx'; // Import DashboardHome component
import { Queue } from './pages/Queue/Queue.tsx'
import { Profile } from './pages/Profile/Profile.tsx'
import { TutorDashboard } from './pages/Tutor/TutorDashboard'
import { Ai } from './pages/Ai/Ai'

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
            path: "", // Default route for the dashboard
            element: <DashboardHome /> // This will render as the dashboard home page
          },
          {
            path: "/dashboard/tutors",
            element: <Tutors/>
          },
          {
            path: "/dashboard/chat",
            element: <Chat/>
          },
          {
            path: "/dashboard/chat/:id",
            element: <Room />
          },
          {
            path: "/dashboard/queue",
            element: <Queue/>
          },
          {
            path: "/dashboard/profile",
            element: <Profile/>
          },
          {
            path: "/dashboard/tutor",
            element: <TutorDashboard/>
          },
          {
            path: "/dashboard/ai",
            element: <Ai/>
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
