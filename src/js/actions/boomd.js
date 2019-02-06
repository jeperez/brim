/* @flow */

import {getCredentials} from "../reducers/boomdCredentials"
import type {Credentials} from "../lib/Credentials"
import type {Thunk} from "../reducers/types"
import {addNotification} from "./notifications"
import {LookytalkVersionError} from "../models/Errors"

export const setBoomdCredentials = (credentials: Credentials) => ({
  type: "BOOMD_CREDENTIALS_SET",
  credentials
})

export const disconnectBoomd = () => ({
  type: "BOOMD_DISCONNECTED"
})

export const connectedBoomd = () => ({type: "BOOMD_CONNECTED"})

export const setBoomdError = (error: string) => ({
  type: "BOOMD_ERROR_SET",
  error
})

export const connectingBoomd = () => ({type: "BOOMD_CONNECTING"})

export const connectBoomd = () => (
  dispatch: Function,
  getState: Function,
  api: Object
) => {
  dispatch(connectingBoomd())
  const credentials = getCredentials(getState())
  return api
    .connect(credentials)
    .then(serverInfo => {
      dispatch(connectedBoomd())
      setTimeout(() => {
        dispatch(checkLookytalkVersion(serverInfo.lookytalk))
      }, 5000)
    })
    .catch(res => {
      if (typeof res === "string") {
        if (res.match(/ENOTFOUND|ECONNREFUSED/)) {
          const {host, port} = credentials
          dispatch(setBoomdError(`No server running at ${host}:${port}`))
        } else if (res.match(/UNAUTHORIZED/))
          dispatch(setBoomdError("Incorrect user and pass combination."))
        else {
          dispatch(setBoomdError("Unknown error, view console for details"))
        }
      } else if (
        res &&
        res.message &&
        typeof res.message === "string" &&
        res.message.match(/boom credentials/)
      ) {
        dispatch(setBoomdError("Host and port are required"))
      } else {
        dispatch(setBoomdError("Unknown error, view console for details"))
        console.error(res)
      }
    })
}

export const checkLookytalkVersion = (serverVersion: string): Thunk => (
  dispatch,
  _getState,
  api
) => {
  const clientVersion = api.info().lookytalk
  if (clientVersion !== serverVersion) {
    dispatch(
      addNotification(
        new LookytalkVersionError("", {
          clientVersion,
          serverVersion
        })
      )
    )
  }
}
