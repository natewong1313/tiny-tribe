import { Button } from "@/components/button";

const OnboardingUsernamePage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-stone-200">
      <div className="flex-1 flex bg-cover bg-[url(/nature1.png)]"></div>
      <div className="flex flex-col p-8">
        <h1 className="text-2xl font-semibold mb-2">Welcome to Tiny Tribe</h1>
        <p className="text-neutral-500 mb-6">
          Before you can start using the app, we'll need to get your profile
          setup.
        </p>
        <Button>Continue</Button>
      </div>
    </div>
  );
};
export default OnboardingUsernamePage;
