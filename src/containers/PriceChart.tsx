import { useEffect, useState } from "react"
import classNames from "classnames/bind"
import { useQuery } from "@apollo/client"
import {
  startOfMinute,
  subDays,
  subHours,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns"

import {adjustAmount, commas, decimal, lookupSymbol} from "../libs/parse"
import Change from "../components/Change"
import {
  ASSETPRICE,
  ASSETPRICEAT,
  ASSETPRICEHISTORY,
} from "../statistics/gqldocs"
import useStatsClient from "../statistics/useStatsClient"
import { calcChange } from "../statistics/useYesterday"
import ChartContainer from "./ChartContainer"
import styles from "./PriceChart.module.scss"
import { EXCHANGE_TOKEN } from "../pages/Borrow"
import { useRecoilValue } from "recoil"
import { menuCollapsed } from "../data/app"
import { useTokenMethods } from "../data/contract/info";
import TradingChart from "../components/TradingChart"
import Button from "@material-ui/core/Button"
import Box from "@material-ui/core/Box"
import { bound } from "../components/Boundary"
// import Card from "../components/Card"
// import ProgressLoading from "../components/Static/ProgressLoading"
import LoadingPlaceholder from "../components/static/LoadingPlaceholder"

const cx = classNames.bind(styles)

interface Item {
  timestamp: number
  price: number
}

interface Data {
  price: string
  priceAt: string
  history: Item[]
}

interface Response {
  asset: { prices: Data }
}
interface Props {
  token1: EXCHANGE_TOKEN
  token2?: EXCHANGE_TOKEN
  pool: string | undefined
  mode: Number
  onChangeMode: Function
}
interface History {
  timestamp: number
  price: string
}

const PriceChart = ({ token1, token2, pool, mode, onChangeMode }: Props) => {
  const [_token1, setToken1] = useState<any>({token: undefined, symbol: ''})
  const [_token2, setToken2] = useState<any>({token: undefined, symbol: ''})
  useEffect(() => {
    if (token1.token === 'uusd' && token2.token === 'uusd') return;
    setToken1(token1);
    setToken2(token2);
  }, [token1, token2])
  const now = startOfMinute(new Date())
  const ranges = [
    {
      label: "1h",
      interval: 1, // 1 minute
      from: subHours(now, 1).getTime(),
      fmt: "dd LLL, yy",
    },
    {
      label: "12h",
      interval: 60 / 12, // 5 minutes
      from: subHours(now, 12).getTime(),
      fmt: "dd LLL, yy",
    },
    {
      label: "1d",
      interval: 60 / 4, // 15 minutes
      from: subDays(now, 1).getTime(),
      fmt: "EEE, dd LLL, HH:mm aa",
    },
    {
      label: "1w",
      interval: 60, // 1 hour
      from: subWeeks(now, 1).getTime(),
      fmt: "EEE, dd LLL, HH:mm aa",
    },
    {
      label: "1M",
      interval: 60 * 24, // 1 day
      from: subMonths(now, 1).getTime(),
      fmt: "dd LLL, yy",
    },
    {
      label: "3M",
      interval: 60 * 24 * 3, // 3 day
      from: subMonths(now, 3).getTime(),
      fmt: "dd LLL, yy",
    },
    {
      label: "1y",
      interval: 60 * 24 * 7, // 1 week
      from: subYears(now, 1).getTime(),
      fmt: "dd LLL, yy",
    },
  ]

  /* request */
  const [range, setRange] = useState(ranges[4])
  // const [data, setDate] = useState<Data>()
  // const params = { token: token1.token, ...range, to: now.getTime(), yesterday }
  const historyParams = {
    token: _token1.token,
    ...range,
    to: now.getTime(),
    second_token: _token2?.token,
  }
  const priceParams = { token: _token1.token, second_token: _token2?.token }
  const priceAtParams = {
    token: _token1.token,
    second_token: _token2?.token ?? "",
    timestamp: subDays(now, 1).getTime(),
  }
  const [historyData, setHistoryDate] = useState<History[]>([])
  const [priceData, serPriceData] = useState<string>()
  const [priceAtData, serPriceAtData] = useState<string>()
  const client = useStatsClient()
  const menuCollapsedState = useRecoilValue(menuCollapsed)
  // get history
 
    const { refetch: refetchHistory } = useQuery<{ getHistory: History[] }>(
      ASSETPRICEHISTORY,
      {
        client,
        variables: historyParams,
        skip: !_token1.token || !_token2?.token,
        onCompleted: (data) => {
          data && setHistoryDate(data.getHistory)
        },
      }
  ) 

  // get price
  const { refetch: refetchPrice } = useQuery<{ getPrice: string }>(ASSETPRICE, {
    client,
    variables: priceParams,
    skip: !_token1.token || !_token2?.token,
    onCompleted: (data) => {
      data && serPriceData(data.getPrice)
    },
  })

  // get priceAt
  const { refetch: refetchPriceAt } = useQuery<{ getPriceAt: string }>(
      ASSETPRICEAT,
      {
        client,
        variables: priceAtParams,
        skip: !_token1.token || !_token2?.token,
        onCompleted: (data) => {
          data && serPriceAtData(data.getPriceAt)
        },
      }
  )

  useEffect(() => {
    !historyData && refetchHistory()
    !priceData && refetchPrice()
    !priceAtData && refetchPriceAt()
  }, [_token1, _token2, menuCollapsedState])

  useEffect(() => {
    setInterval(() => {
      refetchHistory()
      refetchPrice()
      refetchPriceAt()
    }, 5000)
  }, [])

  /* render */
  const change = calcChange({
    today: priceData ?? "0",
    yesterday: priceAtData ?? "0",
  })

  const { check8decOper, check8decTokens } = useTokenMethods()
  const bothAreWh = check8decTokens(
      _token1.token,
      _token2?.token
  )

  if (mode === 0) return (
    bound(
      <div className={`${styles.component} mobile-margin`}>
        <section className={`${styles.onlyCustomMobile}`}>
          <Box
            style={{
              // backgroundColor: "#222",
              borderRadius: "20px",
              justifyContent: "space-around",
              width: "100%",
              display: "flex",
              padding: "3px",
              borderBottomLeftRadius: "0",
              borderBottomRightRadius: "0"
            }}
          >
            <Button
              style={{
                // backgroundColor: "rgba(20, 20, 20, 0.6)",
                color: "rgb(20, 200, 20)",
                fontSize: "12px",
                borderRadius: "10px",
                padding: "2px 3px",
                marginLeft: "4px"
              }}
              onClick={() => onChangeMode(0)}
            >
              SIMPLE
            </Button>
            <Button
              style={{
                color: "rgb(200, 200, 200)",
                fontSize: "12px",
                borderRadius: "20px",
              }}
              onClick={() => onChangeMode(1)}
            >
              ADVANCED
            </Button>
          </Box>
        </section>
        <header className={styles.header}>
          <section className={`${styles.token}`}>
            <Change
                className={styles.price}
                price={`${commas(decimal(adjustAmount(bothAreWh,check8decOper(_token2?.token), priceData) ?? "0", 4))} ${lookupSymbol(_token2?.symbol) ?? ""}`}
            >
              {change}
            </Change>
          </section>
          <div className={styles.onlyCustomMobile}>
            <section className={styles.ranges}>
              {ranges.map((r) => (
                  <button
                      type="button"
                      className={cx(styles.button, { active: r.label === range.label })}
                      onClick={() => setRange(r)}
                      key={r.label}
                  >
                    {r.label}
                  </button>
              ))}
            </section>
          </div>
          <div className={`${styles.onlyCustomDesktop} inline align-center`}>
            <section className={styles.rangesNoMargin}>
              {ranges.map((r) => (
                  <button
                      type="button"
                      className={cx(styles.button, { active: r.label === range.label })}
                      onClick={() => setRange(r)}
                      key={r.label}
                  >
                    {r.label}
                  </button>
              ))}
            </section>
            <section>
              <Box
                style={{
                  backgroundColor: "#222",
                  borderRadius: "20px",
                }}
              >
                <Button
                  style={{
                    backgroundColor: "rgba(20, 20, 20, 0.6)",
                    color: "rgb(20, 200, 20)",
                    fontSize: "12px",
                    borderRadius: "10px",
                    padding: "2px 3px",
                    marginLeft: "4px"
                  }}
                  onClick={() => onChangeMode(0)}
                >
                  SIMPLE
                </Button>
                <Button
                  style={{
                    color: "rgb(200, 200, 200)",
                    fontSize: "12px",
                    borderRadius: "20px",
                  }}
                  onClick={() => onChangeMode(1)}
                >
                  ADVANCED
                </Button>
              </Box>
            </section>
          </div>
        </header>
        <ChartContainer
          change={change}
          datasets={historyData?.map(({ timestamp: t, price: y }) => {
            const price = adjustAmount(bothAreWh, check8decOper(_token2?.token), y)
            return { y: price, t }
          })}
          fmt={{ t: range.fmt }}
        />
      </div>,<LoadingPlaceholder size={"sm"} className={styles.loading} color={"lightGrey"} />
    )
  )
  else return (
    <>
      <div className={`${styles.onlyCustomDesktop} tradingChartMargin ${styles.height100}`}>
        { bound(
          <div style={{
            position: 'relative',
            backgroundColor: '#1b1b1b',
            borderRadius: '20px',
            height: "100%"
          }}>
            <Box
              style={{
                borderRadius: "20px",
                position: "absolute",
                top: "3px",
                right: "120px",
                paddingLeft: "5px",
                paddingRight: "5px"
              }}
            >
              <Button
                style={{
                  color: "rgb(200, 200, 200)",
                  fontSize: "12px",
                  borderRadius: "20px",
                }}
                onClick={() => onChangeMode(0)}
              >
                SIMPLE
              </Button>
              <Button
                style={{
                  backgroundColor: "rgba(20, 20, 20)",
                  color: "rgb(20, 200, 20)",
                  fontSize: "12px",
                  borderRadius: "10px",
                  padding: "3px 6px"
                }}
                onClick={() => onChangeMode(1)}
              >
                ADVANCED
              </Button>
            </Box>
            <TradingChart
              change={change}
              period={range.label}
              token1={_token1?.token}
              token2={_token2?.token}
              pool={pool}
            />
          </div>,<LoadingPlaceholder size={"sm"} className={styles.loading} color={"lightGrey"} />
        )}
      </div>
      <div className={`${styles.onlyCustomMobile} tradingChartMargin`}>
        { bound(
        <div style={{
          position: 'relative',
          backgroundColor: '#131722',
          borderRadius: '20px',
          height: '500px'
        }}>
          <Box
            style={{
              // backgroundColor: "#222",
              borderRadius: "20px",
              justifyContent: "space-around",
              width: "100%",
              display: "flex",
              padding: "3px",
              borderBottomLeftRadius: "0",
              borderBottomRightRadius: "0"
            }}
          >
            <Button
              style={{
                color: "rgb(200, 200, 200)",
                fontSize: "12px",
                borderRadius: "20px",
              }}
              onClick={() => onChangeMode(0)}
            >
              SIMPLE
            </Button>
            <Button
              style={{
                // backgroundColor: "rgba(20, 20, 20)",
                color: "rgb(20, 200, 20)",
                fontSize: "12px",
                borderRadius: "10px",
                padding: "3px 6px"
              }}
              onClick={() => onChangeMode(1)}
            >
              ADVANCED
            </Button>
          </Box>
          <TradingChart
            change={change}
            period={range.label}
            token1={_token1?.token}
            token2={_token2?.token}
            pool={pool}
            removeBorderTop={true}
          />          
        </div>
        )}
      </div>
    </>
  )
}

export default PriceChart
