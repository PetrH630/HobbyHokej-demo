import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import { AiOutlineClose } from "react-icons/ai";
import { useAuth } from "../hooks/useAuth";
import { PlayerIcon, UserIcon, AdminIcon } from "../icons";
import { useCurrentPlayer } from "../hooks/useCurrentPlayer";
import RoleGuard from "./RoleGuard";
import NotificationBell from "./notifications/NotificationBell";
import AdminNotificationBell from "./notifications/AdminNotificationBell";

import "./Navbar.css";

/**
 * Navbar
 *
 * Navigační lišta aplikace včetně ovládání mobilního menu
 * a přepínání mezi hráčskou a správcovskou částí aplikace.
 *
 * Administrátor vidí přímo odkazy správy bez přepínacího tlačítka.
 * Manager může mezi režimy přepínat.
 *
 * @returns {JSX.Element} navigační lišta aplikace
 */
const Navbar = () => {
    const { user, logout } = useAuth();

    const isAdmin =
        user?.roles?.includes("ROLE_ADMIN") || user?.role === "ROLE_ADMIN";

    const isManager =
        !isAdmin &&
        (user?.roles?.includes("ROLE_MANAGER") || user?.role === "ROLE_MANAGER");

    const [showMenu, setShowMenu] = useState(false);
    const [mobileShowAdmin, setMobileShowAdmin] = useState(isAdmin);

    const {
        currentPlayer,
        players = [],
        changeCurrentPlayer,
        loading: playerLoading,
    } = useCurrentPlayer();

    const navigate = useNavigate();
    const location = useLocation();

    const isAdminSection = location.pathname.startsWith("/app/admin");

    /**
     * Přepíná stav mobilního menu.
     */
    const toggleMenu = () => {
        setShowMenu((prev) => !prev);
    };

    /**
     * Zavře mobilní menu.
     */
    const closeMenu = () => {
        setShowMenu(false);
    };

    /**
     * Odhlásí uživatele a přesměruje ho na přihlašovací stránku.
     */
    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login", { replace: true });
        } finally {
            closeMenu();
        }
    };

    /**
     * Změní aktuálně zvoleného hráče.
     *
     * @param {React.ChangeEvent<HTMLSelectElement>} e změnová událost selectu
     */
    const handlePlayerChange = async (e) => {
        const value = e.target.value;
        if (!value) return;
        await changeCurrentPlayer(Number(value));
    };

    /**
     * Přepne managera mezi hráčskou a správcovskou částí aplikace.
     */
    const handleAdminToggle = () => {
        closeMenu();

        if (isAdminSection) {
            navigate("/app");
            return;
        }

        navigate("/app/admin");
    };

    /**
     * Přepne režim mobilního menu mezi hráčem a správou.
     */
    const toggleMobileMode = () => {
        setMobileShowAdmin((prev) => !prev);
    };

    const PlayerLinksInline = () => (
        <ul className="navbar-nav flex-row gap-3 mb-0">
            <RoleGuard roles={["ROLE_PLAYER", "ROLE_MANAGER"]}>
                <li className="nav-item">
                    <NavLink
                        to="/app/player"
                        end
                        className={({ isActive }) =>
                            "nav-link" + (isActive ? " activeLink" : "")
                        }
                        onClick={closeMenu}
                    >
                        Přehled
                    </NavLink>
                </li>

                <li className="nav-item">
                    <NavLink
                        to="/app/players"
                        className={({ isActive }) =>
                            "nav-link" + (isActive ? " activeLink" : "")
                        }
                        onClick={closeMenu}
                    >
                        Hráč
                    </NavLink>
                </li>

                <li className="nav-item">
                    <NavLink
                        to="/app/matches"
                        className={({ isActive }) =>
                            "nav-link" + (isActive ? " activeLink" : "")
                        }
                        onClick={closeMenu}
                    >
                        Zápasy
                    </NavLink>
                </li>

                <li className="nav-item">
                    <NavLink
                        to="/app/settings"
                        className={({ isActive }) =>
                            "nav-link" + (isActive ? " activeLink" : "")
                        }
                        onClick={closeMenu}
                    >
                        Nastavení
                    </NavLink>
                </li>

                <li className="nav-item">
                    <NavLink
                        to="/app/my-inactivity"
                        className={({ isActive }) =>
                            "nav-link" + (isActive ? " activeLink" : "")
                        }
                        onClick={closeMenu}
                    >
                        Mimo
                    </NavLink>
                </li>

                <li className="nav-item">
                    <NavLink
                        to="/app/help"
                        className={({ isActive }) =>
                            "nav-link" + (isActive ? " activeLink" : "")
                        }
                        onClick={closeMenu}
                    >
                        Help
                    </NavLink>
                </li>
            </RoleGuard>
        </ul>
    );

    const AdminLinksInline = () => (
        <ul className="navbar-nav flex-row gap-3 mb-0">
            <RoleGuard roles={["ROLE_ADMIN", "ROLE_MANAGER"]}>
                <li className="nav-item">
                    <NavLink
                        to="/app/admin"
                        end
                        className={({ isActive }) =>
                            "nav-link admin-link" + (isActive ? " activeLink" : "")
                        }
                        onClick={closeMenu}
                    >
                        Přehled
                    </NavLink>
                </li>

                <li className="nav-item">
                    <NavLink
                        to="/app/admin/players"
                        className={({ isActive }) =>
                            "nav-link admin-link" + (isActive ? " activeLink" : "")
                        }
                        onClick={closeMenu}
                    >
                        Hráči
                    </NavLink>
                </li>

                <li className="nav-item">
                    <NavLink
                        to="/app/admin/matches"
                        className={({ isActive }) =>
                            "nav-link admin-link" + (isActive ? " activeLink" : "")
                        }
                        onClick={closeMenu}
                    >
                        Zápasy
                    </NavLink>
                </li>

                <li className="nav-item">
                    <NavLink
                        to="/app/admin/seasons"
                        className={({ isActive }) =>
                            "nav-link admin-link" + (isActive ? " activeLink" : "")
                        }
                        onClick={closeMenu}
                    >
                        Sezóny
                    </NavLink>
                </li>

                <li className="nav-item">
                    <NavLink
                        to="/app/admin/inactivity"
                        className={({ isActive }) =>
                            "nav-link admin-link" + (isActive ? " activeLink" : "")
                        }
                        onClick={closeMenu}
                    >
                        Mimo
                    </NavLink>
                </li>

                <RoleGuard roles={["ROLE_ADMIN"]}>
                    <li className="nav-item">
                        <NavLink
                            to="/app/admin/users"
                            className={({ isActive }) =>
                                "nav-link admin-link" + (isActive ? " activeLink" : "")
                            }
                            onClick={closeMenu}
                        >
                            Uživatelé
                        </NavLink>
                    </li>
                </RoleGuard>

                <li className="nav-item">
                    <NavLink
                        to="/app/admin/help"
                        className={({ isActive }) =>
                            "nav-link admin-link" + (isActive ? " activeLink" : "")
                        }
                        onClick={closeMenu}
                    >
                        Help
                    </NavLink>
                </li>
            </RoleGuard>
        </ul>
    );

    /**
     * Odkazy pro hráče v mobilním menu.
     */
    const PlayerLinksMobile = () => (
        <RoleGuard roles={["ROLE_PLAYER", "ROLE_MANAGER"]}>
            <nav className="mb-3">
                <ul className="list-unstyled mb-2">
                    <li>
                        <NavLink
                            to="/app/player"
                            end
                            className={({ isActive }) =>
                                "mobile-link" + (isActive ? " activeLink" : "")
                            }
                            onClick={closeMenu}
                        >
                            Přehled
                        </NavLink>
                    </li>

                    <li>
                        <NavLink
                            to="/app/players"
                            className={({ isActive }) =>
                                "mobile-link" + (isActive ? " activeLink" : "")
                            }
                            onClick={closeMenu}
                        >
                            Hráč
                        </NavLink>
                    </li>

                    <li>
                        <NavLink
                            to="/app/matches"
                            className={({ isActive }) =>
                                "mobile-link" + (isActive ? " activeLink" : "")
                            }
                            onClick={closeMenu}
                        >
                            Zápasy
                        </NavLink>
                    </li>

                    <li>
                        <NavLink
                            to="/app/settings"
                            className={({ isActive }) =>
                                "mobile-link" + (isActive ? " activeLink" : "")
                            }
                            onClick={closeMenu}
                        >
                            Nastavení
                        </NavLink>
                    </li>

                    <li>
                        <NavLink
                            to="/app/my-inactivity"
                            className={({ isActive }) =>
                                "mobile-link" + (isActive ? " activeLink" : "")
                            }
                            onClick={closeMenu}
                        >
                            Mimo
                        </NavLink>
                    </li>

                    <li>
                        <NavLink
                            to="/app/help"
                            className={({ isActive }) =>
                                "mobile-link" + (isActive ? " activeLink" : "")
                            }
                            onClick={closeMenu}
                        >
                            Help
                        </NavLink>
                    </li>
                </ul>
            </nav>
        </RoleGuard>
    );

    /**
     * Odkazy pro administraci v mobilním menu.
     */
    const AdminLinksMobile = () => (
        <RoleGuard roles={["ROLE_ADMIN", "ROLE_MANAGER"]}>
            <nav className="mb-3">
                <ul className="list-unstyled mb-2">
                    <li>
                        <NavLink
                            to="/app/admin"
                            end
                            className={({ isActive }) =>
                                "mobile-link admin-link" +
                                (isActive ? " activeLink" : "")
                            }
                            onClick={closeMenu}
                        >
                            Přehled
                        </NavLink>
                    </li>

                    <li>
                        <NavLink
                            to="/app/admin/players"
                            className={({ isActive }) =>
                                "mobile-link admin-link" +
                                (isActive ? " activeLink" : "")
                            }
                            onClick={closeMenu}
                        >
                            Hráči
                        </NavLink>
                    </li>

                    <li>
                        <NavLink
                            to="/app/admin/matches"
                            className={({ isActive }) =>
                                "mobile-link admin-link" +
                                (isActive ? " activeLink" : "")
                            }
                            onClick={closeMenu}
                        >
                            Zápasy
                        </NavLink>
                    </li>

                    <li>
                        <NavLink
                            to="/app/admin/seasons"
                            className={({ isActive }) =>
                                "mobile-link admin-link" +
                                (isActive ? " activeLink" : "")
                            }
                            onClick={closeMenu}
                        >
                            Sezóny
                        </NavLink>
                    </li>

                    <li>
                        <NavLink
                            to="/app/admin/inactivity"
                            className={({ isActive }) =>
                                "mobile-link admin-link" +
                                (isActive ? " activeLink" : "")
                            }
                            onClick={closeMenu}
                        >
                            Mimo
                        </NavLink>
                    </li>

                    <RoleGuard roles={["ROLE_ADMIN"]}>
                        <li>
                            <NavLink
                                to="/app/admin/users"
                                className={({ isActive }) =>
                                    "mobile-link admin-link" +
                                    (isActive ? " activeLink" : "")
                                }
                                onClick={closeMenu}
                            >
                                Uživatelé
                            </NavLink>
                        </li>
                    </RoleGuard>

                    <li>
                        <NavLink
                            to="/app/admin/help"
                            className={({ isActive }) =>
                                "mobile-link admin-link" +
                                (isActive ? " activeLink" : "")
                            }
                            onClick={closeMenu}
                        >
                            Help
                        </NavLink>
                    </li>
                </ul>
            </nav>
        </RoleGuard>
    );

    return (
        <>
            <nav className="navbar navbar-light bg-light main-navbar">
                <div className="container d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center flex-shrink-0">
                        <NavLink
                            to="/app"
                            className="navbar-brand brand-wrap mb-0"
                            onClick={closeMenu}
                        >
                            <img
                                src="/hockey-clipart.svg"
                                alt="Logo"
                                className="navbar-logo"
                            />
                            <span className="brand-text">HokejApp</span>
                        </NavLink>
                    </div>

                    <div className="d-none d-lg-flex flex-grow-1 justify-content-center">
                        <div className="d-flex align-items-center gap-3">
                            {isManager && (
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm me-2"
                                    onClick={handleAdminToggle}
                                >
                                    {isAdminSection ? "na Hráče" : "na Správce"}
                                </button>
                            )}

                            {isAdmin ? (
                                <AdminLinksInline />
                            ) : isAdminSection ? (
                                <AdminLinksInline />
                            ) : (
                                <PlayerLinksInline />
                            )}
                        </div>
                    </div>

                    {user && (
                        <div className="d-flex d-lg-none flex-column align-items-start mx-2 user-block-small">
                            <div className="d-flex align-items-center">
                                <div className="icon-col me-2">
                                    <RoleGuard roles={["ROLE_PLAYER"]}>
                                        <UserIcon />
                                    </RoleGuard>
                                    <RoleGuard roles={["ROLE_ADMIN", "ROLE_MANAGER"]}>
                                        <AdminIcon />
                                    </RoleGuard>
                                </div>
                                <div>
                                    {user.name} {user.surname}
                                </div>
                            </div>

                            <RoleGuard roles={["ROLE_MANAGER", "ROLE_PLAYER"]}>
                                <div className="d-flex align-items-center mt-1">
                                    <div className="icon-col me-2">
                                        <PlayerIcon />
                                    </div>
                                    <div>
                                        {playerLoading ? (
                                            "Načítám hráče…"
                                        ) : players.length === 0 ? (
                                            "Není vybrán hráč"
                                        ) : players.length === 1 ? (
                                            <>
                                                {players[0].name} {players[0].surname}
                                            </>
                                        ) : (
                                            <select
                                                className="form-select form-select-sm player-select"
                                                value={currentPlayer?.id ?? ""}
                                                onChange={handlePlayerChange}
                                            >
                                                <option value="">Vyber hráče…</option>
                                                {players.map((p) => (
                                                    <option
                                                        key={p.id}
                                                        value={p.id}
                                                        title={`${p.name} ${p.surname}`}
                                                    >
                                                        {p.name} {p.surname}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </RoleGuard>
                        </div>
                    )}

                    <div className="d-flex flex-column flex-lg-row align-items-center flex-shrink-0">
                        {user && (
                            <div className="d-none d-lg-flex align-items-center gap-3 user-block me-2">
                                <div className="d-flex flex-column gap-1">
                                    <div className="d-flex align-items-center user-line">
                                        <div className="icon-col me-2">
                                            <RoleGuard roles={["ROLE_PLAYER"]}>
                                                <UserIcon />
                                            </RoleGuard>
                                            <RoleGuard roles={["ROLE_ADMIN", "ROLE_MANAGER"]}>
                                                <AdminIcon />
                                            </RoleGuard>
                                        </div>
                                        <div>
                                            {user.name} {user.surname}
                                        </div>
                                    </div>

                                    <RoleGuard roles={["ROLE_MANAGER", "ROLE_PLAYER"]}>
                                        <div className="d-flex align-items-center player-line">
                                            <div className="icon-col me-2">
                                                <PlayerIcon />
                                            </div>
                                            <div>
                                                {playerLoading ? (
                                                    "Načítám hráče…"
                                                ) : players.length === 0 ? (
                                                    "Není vybrán hráč"
                                                ) : players.length === 1 ? (
                                                    <>
                                                        {players[0].name} {players[0].surname}
                                                    </>
                                                ) : (
                                                    <select
                                                        className="form-select form-select-sm player-select"
                                                        value={currentPlayer?.id ?? ""}
                                                        onChange={handlePlayerChange}
                                                    >
                                                        <option value="">Vyber hráče…</option>
                                                        {players.map((p) => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.name} {p.surname}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                    </RoleGuard>
                                </div>

                                {isAdminSection ? (
                                    <AdminNotificationBell />
                                ) : (
                                    <NotificationBell />
                                )}

                                <button
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={handleLogout}
                                >
                                    Odhlásit
                                </button>
                            </div>
                        )}

                        {user && (
                            <div className="d-inline-flex d-lg-none mb-1">
                                {isAdminSection ? (
                                    <AdminNotificationBell />
                                ) : (
                                    <NotificationBell />
                                )}
                            </div>
                        )}

                        <button
                            className="navbar-toggler d-lg-none"
                            type="button"
                            aria-label="Toggle navigation"
                            aria-expanded={showMenu ? "true" : "false"}
                            onClick={toggleMenu}
                        >
                            {showMenu ? <AiOutlineClose /> : <GiHamburgerMenu />}
                        </button>
                    </div>
                </div>
            </nav>

            <div
                className={"mobile-menu-overlay" + (showMenu ? " show" : "")}
                onClick={closeMenu}
            />

            <div className={"mobile-menu" + (showMenu ? " open" : "")}>
                <div className="mobile-menu-inner">
                    {isManager && (
                        <button
                            type="button"
                            className="btn btn-outline-secondary w-100 mb-3"
                            onClick={toggleMobileMode}
                        >
                            {mobileShowAdmin ? "na Hráče" : "na Správce"}
                        </button>
                    )}

                    {isAdmin ? (
                        <AdminLinksMobile />
                    ) : mobileShowAdmin ? (
                        <AdminLinksMobile />
                    ) : (
                        <PlayerLinksMobile />
                    )}

                    {user && (
                        <button
                            className="btn btn-outline-danger w-100 mt-3"
                            onClick={handleLogout}
                        >
                            Odhlásit
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default Navbar;