import { useWallet } from "@terra-money/wallet-provider"
import styles from "assets/scss/ConnectList.module.scss"

// const size = { width: 24, height: 24 }

const ConnectList = ({onClick}: {onClick: Function}) => {
  const { connect,availableConnections,availableInstallations } =
    useWallet()

  // type Button = { label: string; image: ReactNode; onClick: () => void }
  // const buttons = ([] as Button[])

  
    // .concat(
    //   availableInstallTypes.includes(ConnectType.CHROME_EXTENSION)
    //     ? {
    //         label: "Terra Station Extension",
    //         image: <Terra {...size} />,
    //         onClick: () => install(ConnectType.CHROME_EXTENSION),
    //       }
    //     : []
    // )
  //   .concat(
  //     availableConnectTypes.includes(ConnectType.WEBEXTENSION)
  //       ? {
  //           label: "Terra Station Extension",
  //           image: <Terra {...size} />,
  //           onClick: () => connect(ConnectType.WEBEXTENSION),
  //         }
  //       : availableConnectTypes.includes(ConnectType.CHROME_EXTENSION)
  //       ? {
  //           label: "Terra Station Extension ",
  //           image: <Terra {...size} />,
  //           onClick: () => connect(ConnectType.CHROME_EXTENSION),
  //         }
  //       : []
  //   )
  //   .concat(
  //     availableConnectTypes.includes(ConnectType.WALLETCONNECT)
  //       ? {
  //           label: "Terra Station Mobile",
  //           image: <img src={WalletConnect} {...size} alt="WalletConnect" />,
  //           onClick: () => connect(ConnectType.WALLETCONNECT),
  //         }
  //       : []
  //   )
  const handleClick = (type: any, identifier: any) => {
    connect(type, identifier)
    onClick()
  }

  return (
    <article className={styles.component}>
    {/* <article> */}
      <h1 className={styles.title}>Connect to a wallet</h1>
      {/* <h1>Connect to a wallet</h1> */}
      <section>
      {availableConnections
          .filter((wallet) => {
            return !availableInstallations.some(
              (i) => i.identifier === wallet.identifier
            );
          })
          .map(({ type, identifier, name, icon }, i) => (
            // type === 'READONLY' ? '' : <button key={identifier} onClick={() => connect(type, identifier)}>
            type === 'READONLY' ? '' : <button className={styles.button} onClick={() => handleClick(type, identifier)} key={`connect-wallet-${i}`}>
              <img
                src={icon}
                alt={name}
              />
              Connect {name}
            </button>
          ))}
        {availableInstallations.map(({ type, identifier, name, icon, url }, i) => (
          <button className={styles.button} onClick={() => (window.location.href = url)} key={`install-wallet-${i}`}>
          {/* <button key={identifier} onClick={() => (window.location.href = url)}> */}
            <img
              src={icon}
              alt={name}
            />
            Install {name}
          </button>
        ))}
        
      </section>
    </article>
  )
}

export default ConnectList
{/* {Object.entries(buttons).map(([key, { label, image, onClick }]) => (
          <button className={styles.button} onClick={onClick} key={key}>
            {label}
            {image}
          </button>
        ))} */}