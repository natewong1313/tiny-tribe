"use client";

import { Button } from "@/components/button";
import { RiArrowRightLine } from "@remixicon/react";
import { motion } from "motion/react";
import { useRouter } from "vinext/shims/navigation";

const WelcomePage = () => {
  const router = useRouter();
  return (
    <>
      <div className="flex-1 flex bg-cover bg-[url(/nature1.png)]" />
      <motion.div
        className="flex flex-col p-8"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.15,
            },
          },
        }}
      >
        <motion.h1
          className="text-2xl font-semibold mb-2"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          Welcome to Tiny Tribe
        </motion.h1>
        <motion.p
          className="text-neutral-500 mb-6"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          Before you can start using the app, we'll need to get your profile setup.
        </motion.p>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <Button onClick={() => router.push("/onboarding/form")}>
            Continue
            <RiArrowRightLine size={18} className="ml-2" />
          </Button>
        </motion.div>
      </motion.div>
    </>
  );
};
export default WelcomePage;
