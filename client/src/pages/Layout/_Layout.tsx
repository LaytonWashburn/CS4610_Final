import { Outlet } from "react-router"
import { Error } from "../../components/common/Error"


export const Layout = () => {
  return (
    <>
      <Error />  
      <Outlet />
    </>
  );
}