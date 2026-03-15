"use client";

import { cn } from "@/lib/cn";
import {
  type RemixiconComponentType,
  RiAccountCircleFill,
  RiAccountCircleLine,
  RiAddLargeFill,
  RiAddLargeLine,
  RiHome2Fill,
  RiHome2Line,
  RiSearchLine,
} from "@remixicon/react";
import Link from "vinext/shims/link";
import { usePathname } from "vinext/shims/navigation";

interface NavButtonProps {
  href: string;
  icon: RemixiconComponentType;
  isSelected?: boolean;
  selectedIcon: RemixiconComponentType;
}

const NavButton = (props: NavButtonProps) => {
  let className = "";
  let Icon = props.icon;

  if (props.isSelected) {
    className = "text-tt-green-700 border-tt-green-700";
    Icon = props.selectedIcon;
  } else {
    className = "text-stone-500 hover:bg-stone-200 border-transparent";
  }

  return (
    <Link
      href={props.href}
      className={cn(
        "items-center justify-center flex px-2.5 py-2.5",
        className,
      )}
    >
      <Icon size={24} />
    </Link>
  );
};

const Nav = () => {
  const pathname = usePathname();

  return (
    <div className="px-6 w-full bg-stone-300 flex items-center justify-between border-t border-stone-400/50">
      <NavButton
        href="/home"
        icon={RiHome2Line}
        selectedIcon={RiHome2Fill}
        isSelected={pathname === "/home"}
      />
      <NavButton
        href="/explore"
        icon={RiSearchLine}
        selectedIcon={RiSearchLine}
        isSelected={pathname === "/explore"}
      />
      <NavButton
        href="/create"
        icon={RiAddLargeLine}
        selectedIcon={RiAddLargeFill}
        isSelected={pathname === "/create"}
      />
      <NavButton
        href="/profile"
        icon={RiAccountCircleLine}
        selectedIcon={RiAccountCircleFill}
        isSelected={pathname === "/profile"}
      />
    </div>
  );
};

export default Nav;
