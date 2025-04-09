

/**
 * Component: Chat Room Information
 * @returns 
 */

export const ChatRoomInformation = () => {



    return (
        <>
          {/* Blurred background */}
          <div className="fixed inset-0 backdrop-blur-sm z-5 bg-opacity-50"></div>
      
          {/* Centered content */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-primary-gray w-[50vw] h-[50vh] mx-auto ">
            <h1 className="text-white text-center">Course:</h1>
          </div>
        </>
      );
      
      

}