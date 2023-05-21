/**
 * The 0xFable store manages the game state and ensures that is update consistently.
 * It also manages subscriptions to the chain for keeping the state up to date.
 *
 * This is the top-level store module, the implementation also comprises:
 * - {@link module:store/private} for private primitive atoms
 * - {@link module:store/update} for managing updates and making sure the state is consistent
 * - {@link module:store/subscriptions} to manage on-chain subscriptions and updates
 *
 * @module store
 */

// =================================================================================================

import { atom, getDefaultStore } from "jotai"
import { atomWithStorage } from "jotai/utils"

import { type Address, type FetchedGameData, GameStatus } from "src/types"
import { readOnlyAtom } from "src/utils/react-utils"
import { playerAddress_, gameData_ } from "src/store/private"
import { zeroAddress } from "viem"

export { setupStore, refreshGameData } from "src/store/update"

// =================================================================================================

export const GAME_ID_STORAGE_KEY = "0xFable::gameID"

// -------------------------------------------------------------------------------------------------

/**
 * Direct access to the Jotai store.
 */
export const store = getDefaultStore()

// =================================================================================================
// GAME INFORMATION

/** Player address — the connected wallet address (enforced in logic.ts) */
export const playerAddress = readOnlyAtom<Address>(playerAddress_)

/**
 * ID of the game the player is currently participating in (creating, joined, or playing).
 * This is stored in local storage.
 */
export const gameID = atomWithStorage(GAME_ID_STORAGE_KEY, null as bigint|null)
// atomWithStorage causes the creation of another anonymous atom

/** Static game data (excluding per-player information).  */
export const gameData = readOnlyAtom<FetchedGameData>(gameData_)

/** Lets us load the game board once the game starts, but come back to the main menu later. */
export const hasVisitedBoard = atom(false)

/** Current game status (CREATED, JOINED, STARTED, etc) */
export const gameStatus = atom((get) => {
  const gameData = get(gameData_)
  if (gameData == null || gameData.gameCreator == zeroAddress)
    return GameStatus.UNKNOWN
  else if (gameData.playersLeftToJoin == 0) {
    if (gameData.livePlayers.length <= 1)
      return GameStatus.ENDED
    else
      return GameStatus.STARTED
  } else if (gameData.players.includes(store.get(playerAddress_))) {
    return GameStatus.JOINED
  } else {
    return GameStatus.CREATED
  }
})

/** True if we have created the current game. */
export const isGameCreator = atom ((get) => {
  const address = get(playerAddress)
  return address != null && address === get(gameData)?.gameCreator
})

/** True if we have have joined BUT are not the creator of the current game. */
export const isGameJoiner = atom((get) => {
  const address = get(playerAddress)
  return address != null && !get(isGameCreator) && get(gameData)?.players?.includes(address)
})

// =================================================================================================
// DEBUG LABELS

playerAddress.debugLabel   = "playerAddress"
gameID.debugLabel          = "gameID"
gameData.debugLabel        = "gameData"
gameStatus.debugLabel      = "gameStatus"
hasVisitedBoard.debugLabel = "hasVisitedBoard"
isGameCreator.debugLabel   = "isGameCreator"
isGameJoiner.debugLabel    = "isGameJoiner"

// =================================================================================================
// TODO UNUSED
// =================================================================================================
// Play Areas

export const playerHand      = atom<bigint[]>([])
export const playerBoard     = atom<bigint[]>([])
export const playerGraveyard = atom<bigint[]>([])
export const enemyBoard      = atom<bigint[]>([])
export const enemyGraveyard  = atom<bigint[]>([])

playerHand      .debugLabel = 'playerHand'
playerBoard     .debugLabel = 'playerBoard'
playerGraveyard .debugLabel = 'playerGraveyard'
enemyBoard      .debugLabel = 'enemyBoard'
enemyGraveyard  .debugLabel = 'enemyGraveyard'

// export const addToHand = atom(null, (get, set, card: BigInt) => {
//   set(playerHand, [...get(playerHand), card])
// })
//
// export const addToBoard = atom(null, (get, set, card: BigInt) => {
//   set(playerHand, get(playerHand).filter((c) => c !== card))
//   set(playerBoard, [...get(playerBoard), card])
// })
//
// export const addToEnemyBoard = atom(null, (get, set, card: BigInt) => {
//   set(enemyBoard, [...get(enemyBoard), card])
// })
//
// export const destroyOwnCard = atom(null, (get, set, card: BigInt) => {
//   set(playerBoard, get(playerBoard).filter((c) => c !== card))
//   set(playerGraveyard, [...get(playerGraveyard), card])
// })
//
// export const destroyEnemyCard = atom(null, (get, set, card: BigInt) => {
//   set(enemyBoard, get(enemyBoard).filter((c) => c !== card))
//   set(enemyGraveyard, [...get(enemyGraveyard), card])
// })

// =================================================================================================