import Nav from "@/components/nav";
import { getAuth } from "@/lib/auth-server";
import Link from "vinext/shims/link";
import { headers } from "vinext/shims/headers";

const Home = async () => {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return <LandingPage />;
  }

  return <PostsFeed />;
};

const PostsFeed = () => {
  return (
    <div className="bg-stone-200 min-h-screen flex flex-col">
      <div className="flex-1 divide-y divide-stone-400 overflow-y-auto pb-16">
        <Post />
        <Post />
      </div>
      <div className="fixed bottom-0 left-0 right-0">
        <Nav />
      </div>
    </div>
  );
};

const Post = () => {
  return (
    <div className="px-4 py-2 bg-stone-200 h-fit w-full flex flex-col">
      <div className="flex items-center pb-3">
        <img
          alt="User avatar"
          src="https://pbs.twimg.com/profile_images/2000073180698853380/Pe4qpC_W_400x400.jpg"
          className="w-16 h-16 rounded-full border-2 border-tt-green-200"
        />
        <div className="ml-2">
          <h1 className="-mb-1 truncate">Nate Wong</h1>
          <p className="text-tt-green-600 -mb-2 truncate">@natewong</p>
        </div>
      </div>
      <img
        alt="Post 1"
        className="aspect-4/5 object-cover max-h-96 w-fit bg-stone-300 mx-auto rounded-md"
        src="https://plus.unsplash.com/premium_photo-1697730030250-e89c608af43c?q=80&w=2664&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      />
      <div className="pt-4">
        <p className="line-clamp-3">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
          ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
          ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
          sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
          est laborum.
        </p>
        <p className="text-stone-600">30 minutes ago</p>
      </div>
    </div>
  );
};

const LandingPage = () => {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-stone-300">
      <img alt="Tiny Tribe logo" src="/logo.svg" className="h-12 w-12 rounded-md mb-8" />
      <h1 className="font-semibold text-lg">Welcome to Tiny Tribe</h1>
      <p className="text-tt-green-600">Tiny Tribe is a minmal social network</p>
      <Link className="mt-4 bg-tt-green-600 text-stone-50 rounded-md px-4 py-2" href="/sign-in">
        Sign up
      </Link>
    </div>
  );
};

export default Home;
