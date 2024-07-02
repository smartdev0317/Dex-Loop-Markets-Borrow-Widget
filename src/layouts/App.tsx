import { useStatsState, StatsProvider } from "../statistics/useStats"
import "./App.scss"
import { useInitAddress, useInitNetwork, useLocationKey } from "./init"
import useLocalStorage from "../libs/useLocalStorage"

import { useEffect, useState } from "react"
import Cookies from "js-cookie"
import { css } from "@emotion/react"
import {useListedPairAddrs} from "../data/stats/contracts"
import {useNativeBalances, useRawPairs, useTokenBalances} from "../data/contract/normalize"
import {usePoolingPriceInitialize} from "../data/app"

const App = () => {
  const override = css`
    display: block;
    margin: 0 auto;
    border-color: white;
  `
  const stats = useStatsState()
  usePoolingPriceInitialize()
  // usePollingPrices()
  console.log("address")
  useLocationKey()
  useInitAddress()
  useInitNetwork()
  const [isOpen, setIsOpen] = useLocalStorage("hideMenu", false)
  /*const [menuCollapsedState, setMenuCollapsedState] =
    useRecoilState(menuCollapsed)*/
  const [scrolled, setScrolled] = useState("")
  const [popUpStatus, setPopUpStatus] = useState(false)
  localStorage.getItem("moduleLoad")
  useListedPairAddrs()
  useRawPairs()
  useTokenBalances()
  useNativeBalances()

  // const setPopup = () => {
  //   console.log(Cookies.get("popUp"))
  //   if (Cookies.get("popUp") === "true") {
  //     setPopUpStatus(false)
  //   } else {
  //     setPopUpStatus(true)
  //     Cookies.set("popUp", "true", { path: "/", expires: 86400000 })
  //   }
  // }

  // setPopup()

  /*window.setTimeout(() => {
    if (Cookies.get("popUp") === "true") {
      setPopUpStatus(false)
    } else {
      setPopUpStatus(true)
    }
  })*/

  const toggleSidebar = (status: boolean) => {
    // setMenuCollapsedState(status)
    setIsOpen(status)
  }

  const hidePopUp = () => {
    Cookies.set("popUp", "true", { path: "/", expires: 86400000 })
    setPopUpStatus(false)
  }

  const handleScroll = () => {
    const offset = window.scrollY
    if (offset > 30) {
      setScrolled("onscroll")
    } else {
      setScrolled("")
    }
  }

  useEffect(() => {
    window.addEventListener("scroll", handleScroll)
  })

  return (
      <>
        <StatsProvider value={stats}>
          <div
              className={
                popUpStatus ? "CzmainOverlay CzmainOverlayShow" : "CzmainOverlay "
              }
          >
            <div className="CzmainPopup">
              <div className="CzmainPopupClose"></div>
              <h3>
                Welcome to The <b>Loop DEX</b>
              </h3>
              <div className="Loopbeta">
                <p>Please be careful after the col-5 migration!</p>
                <p>Some graphs may not be accurate at times</p>
              </div>
              {/*<p className="LoopBetaTags">
                Warning: prices will be volatile due to the recent launch and
                low liquidity... Don't trade large amounts. Tokens can also be
                purchased on
                <a
                  href="https://gateway.pylon.money/tokens/loop"
                  target={"_blank"}
                  rel="noreferrer"
                >
                  Pylon
                </a>
                now and soon on Starterra
                 <a
                  href="https://app.starterra.io/project/loop"
                  target={"_blank"}
                  rel="noreferrer"
                >
                 Starterra
                 </a> - more info
                <a
                  href="https://www.loop.markets/loop-token-sale-and-airdrop/"
                  target={"_blank"}
                  rel="noreferrer"
                >
                  here
                </a>
              </p>*/}
              <span>
                <a
                    href="https://t.me/loopfinance"
                    target={"_blank"}
                    rel="noreferrer"
                >
                  <img src="telegram.svg" alt={"telegram.svg"} />
                </a>
                <a
                    href="https://twitter.com/loop_finance"
                    target={"_blank"}
                    rel="noreferrer"
                >
                  <img src="twitter.svg" alt={"twitter.svg"} />
                </a>
                <a
                    href="https://discord.gg/g9vaGdTaNP"
                    target={"_blank"}
                    rel="noreferrer"
                >
                  <img
                      src="discord.png"
                      alt={"discord.png"}
                      className="discordImg"
                  />
                </a>
              </span>
              <button className="CzLetsdo" onClick={hidePopUp}>
                I Agree!
              </button>
            </div>
          </div>
          {/*<Airdrop />*/}
        </StatsProvider>
      </>
  )
}

export default App
