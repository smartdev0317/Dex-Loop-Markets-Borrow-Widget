import { useState, createContext, useContext } from "react";
import {
    useWallet,
    useConnectedWallet,
    NetworkInfo,
    WalletStatus,
    ConnectType,
  } from '@terra-money/wallet-provider';

import {
    Network,
    DEFAULT_NETWORK,
} from '../constant/constants';

type ContextType = {
    address: string | undefined
    network: NetworkInfo
    networkType: Network
}

const defaultContext = {
    address: undefined,
    network: DEFAULT_NETWORK,
    networkType: Network.MAINNET,
}

export const UserContext = createContext<ContextType>(defaultContext)

export const TerraWebappProvider = ({ children }) => {
    const { network } = useWallet();
    const networkType = network.name === 'mainnet' ? Network.MAINNET : Network.TESTNET;
    const connectedWallet = useConnectedWallet();
    const address = connectedWallet?.terraAddress || '';
    const contextValue = {
        address,
        network,
        networkType
    };

    return (
        <UserContext.Provider value={contextValue}>
          { children }
        </UserContext.Provider>
    );
}

export const useTerraWebapp = () =>
  useContext(UserContext);