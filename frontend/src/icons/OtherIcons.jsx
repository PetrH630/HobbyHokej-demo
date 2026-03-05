import { GiMoneyStack } from "react-icons/gi";
import { ImHappy } from "react-icons/im";
import { RiEmotionSadLine } from "react-icons/ri";

/**
 * OtherIcons
 *
 * Soubor obsahuje sdílené UI pomocné prvky používané napříč aplikací.
 */

export const MoneyIcon = (props) => <GiMoneyStack {...props} />;

export const Happy = ({ className = "", ...props }) => (
    <ImHappy className={`icon-happy ${className}`} {...props} />
);

export const Sad = ({ className = "", ...props }) => (
    <RiEmotionSadLine className={`icon-sad ${className}`} {...props} />
);