// src/pages/HomeDecider.jsx

import { useAuth } from "../hooks/useAuth";
import Home from "./Home";
import AdminHomePage from "./AdminHomePage";

/**
 * HomeDecider
 *
 * UI komponenta.
 *
 * @param {Object} props vstupní hodnoty komponenty
 */
const HomeDecider = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <p>Načítám uživatele…</p>;
    }
   
    const rawRoles = user?.roles || user?.role || [];
    const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles].filter(Boolean);

    const isAdmin = roles.includes("ROLE_ADMIN");

    if (isAdmin) {
        return <AdminHomePage />;
    }
    return <Home />;
};

export default HomeDecider;
