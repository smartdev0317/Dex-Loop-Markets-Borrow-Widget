import { SMALLEST, UST } from "../../constants"
import Tooltip from "../../lang/Tooltip.json"
import Table from "../../components/Table"
import { TooltipIcon } from "../../components/Tooltip"
import styles from "./TopTrading.module.scss"
import {
  commas,
  decimal,
  formatAssetAmount,
  lookupSymbol,
  niceNumber,
} from "../../libs/parse"
import { getICon2 } from "../../routes"
import { bound } from "../../components/Boundary"
import { ApyTooltipIcon } from "../../components/ApyToolTip"
import FarmApyTooltipContent from "../../components/FarmApyTooltipContent"
import { gt, lt, multiple, number, plus } from "../../libs/math"
import { useState } from "react"
import { useRecoilValue } from "recoil"
import { tradingListStore } from "../../data/API/dashboard"

const PairTVLList = ({ tokens }: { tokens?: string[] }) => {
  const list = useRecoilValue(tradingListStore)

  // const dataSource = useFarmsList().filter((item)=> {
  //   const split = item.symbol.split(' - ')
  //   console.log("split", {split, tokens})
  //   return tokens && tokens.length > 0 ? (tokens.includes(split[0].toUpperCase()) || tokens.includes(split[1].toUpperCase())) : true
  // }).filter((li) => gt(li.total_fee, 0) && gt(li.total_locked, 0))
  //     .sort((a, b) => (lt(a.total_fee, b.total_fee) ? 1 : -1))

  const dataSource =
    list && list.length > 0
      ? list
          ?.filter(
            (item) =>
              !["terra10mkke9qfhdjgkaq32sjd3ll9ccscjd03xn9gc9"].includes(
                item.lpToken
              )
          )
          .filter((item) => {
            const split = item.symbol.split("_")
            return tokens && tokens.length > 0
              ? tokens.includes(lookupSymbol(split[0]).toUpperCase()) ||
                  tokens.includes(lookupSymbol(split[1]).toUpperCase())
              : true
          })
          .filter((li) => gt(li.sevenDayFee, 0) && gt(li.totalLocked, 0))
          .sort((a, b) => (lt(a.sevenDayFee, b.sevenDayFee) ? 1 : -1))
      : []

  const [isExpand, setIsExpand] = useState(false)
  console.log(dataSource)

  return (
    <>
      <Table
        columns={[
          /* {
              key: "rank",
              title: "No.",
              render: (_value, _record, index) => index + 1,
          },*/
          {
            key: "symbol",
            title: "Ticker",
            render: (_value, _record, index) => {
              const split = _value?.split("_").map((item) => lookupSymbol(item))

              return (
                <div className={styles.icontable}>
                  <div className={styles.icontableHub}>
                    <img
                      style={{ width: "30px", borderRadius: "25px" }}
                      src={getICon2(_value.split("_")[0].trim().toUpperCase())}
                      alt=" "
                    />
                    <img
                      style={{ width: "30px", borderRadius: "25px" }}
                      src={getICon2(_value.split("_")[1].trim().toUpperCase())}
                      alt=" "
                    />
                  </div>
                  <p style={{ display: "block" }}>{split?.join(" - ")}</p>
                </div>
              )
            },
            bold: true,
          },
          {
            key: "totalLocked",
            title: (
              <TooltipIcon content={Tooltip.TopTrading.Liquidity}>
                Total Locked
              </TooltipIcon>
            ),
            render: (value) =>
              bound(
                `$${formatAssetAmount(multiple(value, SMALLEST), UST)}`,
                "Loading..."
              ),
          },
          /*{
          key: "volume",
          title: (
            <TooltipIcon content={Tooltip.TopTrading.Volume7day}>
              7 day Volume
            </TooltipIcon>
          ),
          render: (value) => `$${formatAssetAmount(value, UST)}`,
        },*/
          {
            key: "sevenDayFee",
            title: (
              <TooltipIcon content={Tooltip.TopTrading.Fee7day}>
                7 day trading fee
              </TooltipIcon>
            ),
            render: (value) =>
              bound(`$${commas(decimal(value, 3))}`, "fetching..."),
          },
          /*{
          key: "7dayFee",
          title: (
            <TooltipIcon content={Tooltip.TopTrading.Fee7day}>
              7 day trading fee
            </TooltipIcon>
          ),
          render: (value, { volume }) => {
            const val = multiple(div(volume, 100), 0.3)
            return bound(`$${formatAssetAmount(gt(val, "5000000000") ? div(val, "2") : val, UST)}`, "$0")
          },
        },*/
          /*{
          key: "apr2",
          title: <TooltipIcon content={"APR"}>APR</TooltipIcon>,
          render: (value) =>
            bound(
              <LinkButton
                className={styles.simpleLink}
                to={getPath(MenuKey.FARMBETA)}
              >
                {value}{" "}
                <img
                  height={"10px"}
                  style={{ marginLeft: 3 }}
                  src={topRightIcon}
                  alt={"link"}
                />
              </LinkButton>,
              "COMING SOON..."
            ),
        },*/
          {
            key: "APY",
            title: "Combined APY",
            render: (value, { APR, TxFee, symbol, Rewards }) =>
              bound(
                <ApyTooltipIcon
                  content={
                    <>
                      <FarmApyTooltipContent
                        symbol={symbol}
                        apy={value}
                        tx_fee_apy={TxFee}
                        rewards={Rewards}
                        apr={APR}
                        isSimplified={true}
                      />
                    </>
                  }
                >
                  <span className={styles.blue}>
                    {bound(
                      `${
                        gt(value, "50000")
                          ? "50,001"
                          : commas(
                              decimal(
                                isFinite(number(niceNumber(value)))
                                  ? niceNumber(
                                      symbol == "LunaX_uluna"
                                        ? plus(11.6, value)
                                        : value
                                    )
                                  : "0",
                                2
                              )
                            )
                      }%`,
                      "fetching..."
                    )}
                  </span>{" "}
                </ApyTooltipIcon>,
                "fetching..."
              ),
          },
        ]}
        dataSource={isExpand ? dataSource : dataSource.slice(0, 10)}
      />
      {!isExpand && dataSource.length > 0 && (
        <div className={styles.expandBtn} onClick={() => setIsExpand(true)}>
          Expand All
        </div>
      )}
    </>
  )
}

export default PairTVLList
