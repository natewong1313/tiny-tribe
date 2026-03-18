"use client";

import { memo } from "react";
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
  title: string;
  href: string;
  icon: RemixiconComponentType;
  isSelected?: boolean;
  selectedIcon: RemixiconComponentType;
}

const NavButton = memo(function NavButton(props: NavButtonProps) {
  const className = props.isSelected
    ? "text-tt-green-700 border-tt-green-700"
    : "text-stone-500 hover:bg-stone-200 border-transparent";

  const Icon = props.isSelected ? props.selectedIcon : props.icon;

  return (
    <Link
      href={props.href}
      aria-current={props.isSelected ? "page" : undefined}
      className={cn("items-center justify-center px-2.5 py-2.5 flex flex-col", className)}
    >
      <Icon size={20} />
      <span className="text-xs mt-1">{props.title}</span>
    </Link>
  );
});

const Nav = () => {
  const pathname = usePathname();

  return (
    <div className="px-6 w-full bg-stone-300 flex items-center justify-between border-t border-stone-400/50">
      <NavButton
        title="Home"
        href="/home"
        icon={RiHome2Line}
        selectedIcon={RiHome2Fill}
        isSelected={pathname === "/home"}
      />
      <NavButton
        title="Search"
        href="/explore"
        icon={RiSearchLine}
        selectedIcon={RiSearchLine}
        isSelected={pathname === "/explore"}
      />
      <NavButton
        title="Create"
        href="/create"
        icon={RiAddLargeLine}
        selectedIcon={RiAddLargeFill}
        isSelected={pathname === "/create"}
      />
      <NavButton
        title="You"
        href="/profile"
        icon={RiAccountCircleLine}
        selectedIcon={RiAccountCircleFill}
        isSelected={pathname === "/profile"}
      />
    </div>
  );
};

export default Nav;
