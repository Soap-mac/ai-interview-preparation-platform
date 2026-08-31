import { useState, useEffect } from "react";
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import api from "./api";
import StartInterview from "./pages/StartInterview";
import InterviewSession from "./pages/InterviewSession";
import InterviewReport from "./pages/InterviewReport";
import AnalyticsDashboard from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/signup";
import CodeEditor from "./pages/codeEditor";
import { createContext } from "react";

const myContext = createContext();

export default function App() {

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    api.get("/auth/me")
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false))
      .finally(() => setAuthLoading(false));
  }, [])
  const router = createBrowserRouter([
    {
      path: "/",
      element: <StartInterview />
    },
    {
      path: "/interview/:id",
      element: <InterviewSession />
    }, {
      path: "/report/:id",
      element: <InterviewReport />
    },
    {
      path: "/dashboard",
      element: <AnalyticsDashboard />
    },
    {
      path: "/login",
      element: <LoginPage />
    }, {
      path: "/register",
      element: <SignupPage />
    }, {
      path: "/editor/:id",
      element: <CodeEditor />
    }
  ]);

  const values = { isLoggedIn, setIsLoggedIn, authLoading };
  return (
    <>
      <myContext.Provider value={values}>
        <RouterProvider router={router} />
      </myContext.Provider>

    </>
  )
}

export { myContext }