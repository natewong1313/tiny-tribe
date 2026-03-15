import { RiCake2Line, RiMapPinLine } from "@remixicon/react";

const AboutDetails = () => (
  <div className="space-x-2 flex justify-end items-center">
    <span className="bg-stone-400/30 text-tt-green-500 py-0.5 px-2 text-sm rounded-full flex items-center w-fit h-fit">
      <RiCake2Line size={12} className="mr-1" />
      22
    </span>
    <span className="bg-stone-400/30 text-tt-green-500 py-0.5 px-2 text-sm rounded-full flex items-center w-fit h-fit truncate">
      <RiMapPinLine size={12} className="mr-1" />
      Austin, Texas
    </span>
  </div>
);

const Posts = () => (
  <div className="grid grid-cols-3 gap-3">
    <img
      alt="Post 1"
      className="aspect-4/5 object-cover w-full bg-stone-300 rounded-md"
      src="https://plus.unsplash.com/premium_photo-1697730030250-e89c608af43c?q=80&w=2664&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    />
    <img
      alt="Post 2"
      className="aspect-4/5 object-cover w-full bg-stone-300 rounded-md"
      src="https://plus.unsplash.com/premium_photo-1730828573985-7ee6669033f2?q=80&w=1587&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    />
    <img
      alt="Post 3"
      className="aspect-4/5 object-cover w-full bg-stone-300 rounded-md"
      src="https://images.unsplash.com/photo-1664231978322-4d0b45c7027b?q=80&w=1227&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    />
  </div>
);

const Profile = () => (
  <div className="min-h-screen bg-stone-200 flex flex-col">
    <div className="bg-tt-green-500 w-full h-20 p-6 relative">
      <img
        alt="User avatar"
        src="https://pbs.twimg.com/profile_images/2000073180698853380/Pe4qpC_W_400x400.jpg"
        className="w-24 h-24 rounded-full border-2 border-tt-green-200 absolute mt-3"
      />
    </div>
    <div className="mt-14 px-6 space-y-4">
      <div className="grid grid-cols-2">
        <div className="">
          <h1 className="-mb-1 truncate">Nate Wong</h1>
          <p className="text-tt-green-600 -mb-2 truncate">@natewong</p>
        </div>
        <AboutDetails />
      </div>
      <Posts />
    </div>
  </div>
);

export default Profile;
