import { useState, useEffect, ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import classNames from "classnames/bind"
import styles from "../AppHeader.module.scss"
import ExtLink from "../ExtLink"
import Menu from "./Menu"
import SocialDropdown from "../SocialDropdown/SocialDropdown"

const cx = classNames.bind(styles)

interface Props {
  logo: string
  // menu: MenuItem[]
  connect: ReactNode
  border?: boolean
  testnet?: boolean
}

const TopHeader = ({ connect, border }: Props) => {
  const { key, pathname } = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const toggle = () => setIsOpen(!isOpen)
  // const hideToggle = menu.every((item) => item.desktopOnly)
  const [exchangeMenu, activeExchangeMenu] = useState(false)

  useEffect(() => {
    setIsOpen(false)
  }, [key])

  const menuActive = () => {
    activeExchangeMenu(!exchangeMenu)
  }

  return (
    <>
      <div
        className={isOpen ? "overlayPop" : "overlayPop1"}
        onClick={toggle}
      ></div>
      <header className={cx(styles.header, { collapsed: !isOpen })}>
        <div className={styles.headContainer}>
          <section className={styles.wrapper}>
            <h1 className={styles.logo}>
              <Link to="/" className={styles.logo_link}>
                {/* <img src={logo} alt={"/"} />
              <img
                className={styles.beta}
                src={betaIcon}
                height={"100%"}
                alt={"/"}
              /> */}
                <img src="../log-loop.png" alt="" />
              </Link>
            </h1>

            {/*{!hideToggle && (*/}
            <button className={styles.toggle} onClick={toggle}>
              {/* <Icon name={!isOpen ? "menu" : "close"} size={24} /> */}
              <img src="../menu.svg" alt="" />
            </button>
            {/*)}*/}
          </section>

          <section className={styles.support}>
            <div className={styles.connectLogo}>
              {!isOpen ? (
                <img src="../log-loop.png" alt="" />
              ) : (
                <div className={styles.mobileConnect}>{connect}</div>
                // <span>
                //   <img src="../logo_lg.svg" alt="" />
                //   <img src="../beta.svg" alt="" />
                // </span>
              )}
            </div>

            <button className={styles.connectLogoClose} onClick={toggle}>
              +
            </button>
            <div className={styles.menu_container}>
              
            </div>

            <div>
              <SocialDropdown />
            </div>

            <div className={styles.connect}>{connect}</div>
          </section>
        </div>

        {border && !isOpen && <hr className={styles.hr} />}
      </header>
    </>
  )
}

export default TopHeader
