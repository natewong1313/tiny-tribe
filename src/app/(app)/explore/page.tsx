"use client";

import { Input } from "@/components/input";
import { RiSearchLine } from "@remixicon/react";
import ShapeSvg from "@/assets/shape1.svg?react";

export default function ExplorePage() {
  return (
    <div className="flex flex-col items-center">
      <div className="px-6 w-full py-6 divide-y divide-stone-400/60">
        <Input
          name="search"
          value=""
          placeholder="Search"
          icon={<RiSearchLine size={20} />}
          onChange={() => {}}
          onBlur={() => {}}
          className="w-full"
        />
      </div>

      <div className="text-tt-green-600 flex flex-col justify-center items-center mt-36">
        <ShapeSvg className="w-24 h-24 text-tt-green-500 [&>*]:!fill-current" />
        <p className="text-lg mt-3">Search for users or posts</p>
      </div>
    </div>
  );
}
