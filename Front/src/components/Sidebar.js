import Image from "next/image";
import { AiOutlineHome } from "react-icons/ai";
import { BsPeople } from "react-icons/bs";
import { FiBell, FiSettings, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import Link from "next/link";
import { useContext } from "react";
import { SidebarContext } from "@/context/SidebarContext";
import { useRouter } from "next/router";

const sidebarItems = [
  {
    name: "Inicio",
    href: "/",
    icon: AiOutlineHome,
  },
  {
    name: "Usuarios",
    href: "/users",
    icon: BsPeople,
  },
  {
    name: "Alertas",
    href: "/alerts",
    icon: FiBell,
  },
];

const Sidebar = () => {
  const router = useRouter();
  const { isCollapsed, toggleSidebarcollapse } = useContext(SidebarContext);

  return (
    <div className="sidebar__wrapper">
      <button
        className="btn btn-sidebar"
        onClick={toggleSidebarcollapse}
        title={
          isCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"
        }
      >
        {isCollapsed ? <FiArrowRight /> : <FiArrowLeft />}
      </button>
      <aside className="sidebar" data-collapse={isCollapsed}>
        <div className="sidebar__top">
          <Image
            priority={true}
            width={80}
            height={80}
            className="sidebar__logo"
            src="/logo.png"
            alt="logo"
          />
          <p className="sidebar__logo-name">Electrodunas</p>
        </div>
        <ul className="sidebar__list">
          {sidebarItems.map(({ name, href, icon: Icon }) => (
            <li className="sidebar__item" key={name}>
              <Link
                className={`sidebar__link ${
                  router.pathname === href ? "sidebar__link--active" : ""
                }`}
                href={href}
              >
                <span className="sidebar__icon">
                  <Icon />
                </span>
                <span className="sidebar__name">{name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
};

export default Sidebar;
