export default function HomePage() {
  return (
    <div className="flex flex-col">
      <div className="px-6 py-6 divide-y divide-stone-400/60">
        <Post />
        <Post />
      </div>
    </div>
  );
}

const Post = () => {
  return (
    <div className="py-6">
      <div className="flex items-center">
        <img
          src="https://avatars.githubusercontent.com/u/39974384?v=4"
          className="h-12 w-12 rounded-full mr-2"
        />
        <div>
          <h1 className="font-semibold -mb-1">Nate Wong</h1>
          <p className="text-sm text-stone-500">@latinalover411</p>
        </div>
        <span className="text-stone-500 text-sm ml-auto">3 hours ago</span>
      </div>
      <div className="mt-2 space-y-3 p-2">
        <p>Yo check out this big fucking goose</p>
        <img
          src="https://www.waterfowl.org.uk/wp-content/uploads/2019/09/african.jpg"
          className="aspect-4/5 object-cover bg-stone-300 mx-auto rounded-md"
        />
      </div>
    </div>
  );
};
