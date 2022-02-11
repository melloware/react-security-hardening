import process from "process";

/**
 * Environment specific utilities.
 */
export default class EnvUtils {

    /**
     * Is the application currently running in Dev mode?
     * 
     * @returns true if in Development mode, false if not
     */
    static isDevelopment() {
        return !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
    }

    /**
     * Is the application currently running in Production  mode?
     * 
     * @returns true if in Production mode, false if not
     */
    static isProduction() {
        return !EnvUtils.isDevelopment();
    }

    /**
     * Print this object to the info console only if in DEV mode.
     * 
     * @param {string|object} message the message or json object to print to console
     */
    static debug(message: (string | object)) {
        if (EnvUtils.isDevelopment()) {
            console.debug(message);
        }
    }

    /**
     * Print this object to the info console only if in DEV mode.
     * 
     * @param {string|object} message the message or json object to print to console
     */
    static log(message: (string | object)) {
        if (EnvUtils.isDevelopment()) {
            console.log(message);
        }
    }

    /**
     * Print this object to the warn console only if in DEV mode.
     * 
     * @param {string|object} message the message or json object to print to console
     */
    static warn(message: (string | object)) {
        if (EnvUtils.isDevelopment()) {
            console.warn(message);
        }
    }

    /**
     * Print this object to the info console only if in DEV mode.
     * 
     * @param {string|object} message the message or json object to print to console
     */
    static info(message: (string | object)) {
        if (EnvUtils.isDevelopment()) {
            console.info(message);
        }
    }

    /**
     *  Print this object to the error only if in DEV mode.
     * 
     * @param {string|object} message the message or json object to print to console
     */
    static error(message: (string | object)) {
        if (EnvUtils.isDevelopment()) {
            console.error(message);
        }
    }

    /**
     * Is the code currently running on the server?
     * 
     * @returns true if running on the server, false if running in client
     */
    static isServerSide() {
        return typeof window === "undefined";
    }

    /**
     * Is the code currently running on the client?
     * 
     * @returns true if running on the client, false if running on the server
     */
    static isClientSide() {
        return !this.isServerSide();
    }

    /**
     * Is the browser desktop sized.
     * 
     * @returns true if the browser is desktop sized
     */
    static isDesktop = () => {
        return EnvUtils.isClientSide() && window.innerWidth > 1091;
    };

    /**
     * Is the current browser IE.
     * 
     * @returns true if Internet Exploreer
     */
    static isIE = () => {
        return EnvUtils.isClientSide() && /(MSIE|Trident\/|Edge\/)/i.test(window.navigator.userAgent);
    };

}
