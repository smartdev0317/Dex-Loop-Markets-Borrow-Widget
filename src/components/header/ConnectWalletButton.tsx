import { useWallet, useConnectedWallet, useLCDClient } from '@terra-money/wallet-provider'
import React, {useEffect, useState} from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import ConnectList from './ConnectList';
import { WALLET_CONNECTED, WALLET_NOT_CONNECTED } from 'constant/constants'
import 'assets/css/button.css';
// import useLCDClient from 'graphql/useLCDClient'

export default function ConnectWalletButton() {
  
  const lcd = useLCDClient()
  // const lcd = useLCDClient()?.terra
  const connectedWallet = useConnectedWallet()

  const {
    status,
    network,
    wallets,
    availableConnectTypes,
    availableInstallTypes,
    availableConnections,
    supportFeatures,
    connect,
    install,
    disconnect,
  } = useWallet();

  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [USTAmount, setUSTAmount] = useState<number>(0)

  useEffect(() => {
    if (status !== WALLET_CONNECTED) return
    lcd.bank.balance(wallets[0].terraAddress).then((res) => {
      setUSTAmount(Number(res[0].get('uusd')?.amount) / Math.pow(10, 6) || 0)
    })
    const timer = setInterval(() => {
      lcd.bank.balance(wallets[0].terraAddress).then((res) => {
        setUSTAmount(Number(res[0].get('uusd')?.amount) / Math.pow(10, 6) || 0)
      })
    }, 5000)
    return () => clearInterval(timer)
  }, [status])

  const showWalletReducedAddress = () => {
    const address = wallets[0].terraAddress
    return `${address.slice(0,6)}...${address.slice(address.length -6)}`
  }

  const openModal = () => {
    setIsOpen(true)
  }

  function _handleClose () {
    setIsOpen(false)
  }

  const walletButton = () => {
    switch (status) {
      case WALLET_NOT_CONNECTED:
        return (
          <button className='connect-wallet-button inactive' onClick={openModal}>CONNECT WALLET</button>
        )
      case WALLET_CONNECTED:
        return (
          <button className='connect-wallet-button inactive' onClick={() => disconnect()}>{showWalletReducedAddress()} <span className='mx-4'>|</span> <span className='bold cyan-color mx-2'>{USTAmount.toFixed(1)}</span> UST</button>
        )
    }
  }
  return (
    <div>
      {walletButton()}
      <Modal
        open={isOpen}
        onClose={_handleClose}
      >
        <Box className='connect-wallet-modal'>
          <ConnectList onClick={_handleClose} />
        </Box>
      </Modal>
    </div>
  )
  // return (
  //   <div>
  //     <Stack spacing={2} direction="row">
  //       {status === "WALLET_NOT_CONNECTED"}
  //       <Button variant="contained" className='connect-wallet-button'></Button>
  //     </Stack>
  //     <h1>Connect Sample</h1>
  //     <section>
  //       <pre>
  //         {JSON.stringify(
  //           {
  //             status,
  //             network,
  //             wallets,
  //             supportFeatures: Array.from(supportFeatures),
  //             availableConnectTypes,
  //             availableInstallTypes,
  //           },
  //           null,
  //           2,
  //         )}
  //       </pre>
  //     </section>

  //     <footer>
  //       {status === WalletStatus.WALLET_NOT_CONNECTED && (
  //         <>
  //           {availableInstallTypes.map((connectType) => (
  //             <button
  //               key={'install-' + connectType}
  //               onClick={() => install(connectType)}
  //             >
  //               Install {connectType}
  //             </button>
  //           ))}
  //           {availableConnectTypes.map((connectType) => (
  //             <button
  //               key={'connect-' + connectType}
  //               onClick={() => connect(connectType)}
  //             >
  //               Connect {connectType}
  //             </button>
  //           ))}
  //           <br />
  //           {availableConnections.map(
  //             ({ type, name, icon, identifier = '' }) => (
  //               <button
  //                 key={'connection-' + type + identifier}
  //                 onClick={() => connect(type, identifier)}
  //               >
  //                 <img
  //                   src={icon}
  //                   alt={name}
  //                   style={{ width: '1em', height: '1em' }}
  //                 />
  //                 {name} [{identifier}]
  //               </button>
  //             ),
  //           )}
  //         </>
  //       )}
  //       {status === WalletStatus.WALLET_CONNECTED && (
  //         <button onClick={() => disconnect()}>Disconnect</button>
  //       )}
  //     </footer>
  //   </div>
  // );
}
