export const trackEvent = (eventName, params = {}) => {
    if (window.gtag) {
        window.gtag("event", eventName, params);
    }
};