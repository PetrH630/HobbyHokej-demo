import React from 'react'
import Players from "../components/players/Players"
import BackButton from "../components/BackButton";
import PlayerHelpModal from "../components/help/PlayerHelpModal";
import { trackEvent } from "../utils/analytics";
/**
 * PlayersPage
 *
 * UI komponenta.
 *
 * @param {Object} props vstupní hodnoty komponenty
 */
const PlayersPage = () => {

  return (
    <div>
      <Players />
    </div>
    
    
    

  )
}

export default PlayersPage
