import { cn } from "@/lib/cn";
import {
  RemixiconComponentType,
  RiAccountCircleFill,
  RiAccountCircleLine,
  RiAddFill,
  RiAddLine,
  RiHome2Fill,
  RiHome2Line,
} from "@remixicon/react";
import Link from "vinext/shims/link";

export default function Nav() {
  return (
    <div className="py-1 px-6 w-full bg-stone-300 flex items-center justify-between">
      <NavButton
        href="/"
        icon={RiHome2Line}
        selectedIcon={RiHome2Fill}
        isSelected
      />
      <NavButton href="/" icon={RiAddLine} selectedIcon={RiAddFill} />
      <NavButton
        href="/"
        icon={RiAccountCircleLine}
        selectedIcon={RiAccountCircleFill}
      />
    </div>
  );
}

type NavButtonProps = {
  href: string;
  icon: RemixiconComponentType;
  isSelected?: boolean;
  selectedIcon: RemixiconComponentType;
};
const NavButton = (props: NavButtonProps) => {
  return (
    <Link
      href={props.href}
      className={cn(
        "rounded-md h-10 w-10 items-center justify-center flex",
        props.isSelected
          ? "text-tt-green-700 bg-stone-200"
          : "text-stone-500 hover:bg-stone-200",
      )}
    >
      {props.isSelected ? (
        <props.selectedIcon size={32} />
      ) : (
        <props.icon size={32} />
      )}
    </Link>
  );
};
