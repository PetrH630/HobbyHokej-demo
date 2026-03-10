import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const AnalyticsTracker = () => {
    const location = useLocation();

    useEffect(() => {
        window.gtag("config", "G-ZVEJ41CFB9", {
            page_path: location.pathname,
        });
    }, [location]);

    return null;
};

export default AnalyticsTracker;