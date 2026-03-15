import { cn } from "@/lib/cn";
import {
  type RemixiconComponentType,
  RiAccountCircleFill,
  RiAccountCircleLine,
  RiAddFill,
  RiAddLine,
  RiHome2Fill,
  RiHome2Line,
} from "@remixicon/react";
import Link from "vinext/shims/link";

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
    className = "text-tt-green-700 bg-stone-200";
    Icon = props.selectedIcon;
  } else {
    className = "text-stone-500 hover:bg-stone-200";
  }

  return (
    <Link
      href={props.href}
      className={cn("rounded-md h-10 w-10 items-center justify-center flex", className)}
    >
      <Icon size={32} />
    </Link>
  );
};

const Nav = () => {
  return (
    <div className="py-1 px-6 w-full bg-stone-300 flex items-center justify-between">
      <NavButton href="/" icon={RiHome2Line} selectedIcon={RiHome2Fill} isSelected />
      <NavButton href="/" icon={RiAddLine} selectedIcon={RiAddFill} />
      <NavButton href="/" icon={RiAccountCircleLine} selectedIcon={RiAccountCircleFill} />
    </div>
  );
};

export default Nav;
