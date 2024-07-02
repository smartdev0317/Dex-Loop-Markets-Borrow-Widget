import { Helmet } from "react-helmet"
import { Grid } from "@material-ui/core"
import { useRecoilState } from 'recoil'

import Tooltip from "../../lang/Tooltip.json"
import {SMALLEST, UST, UUSD} from "../../constants"
import {
    commas, decimal, decimalnPlaces,
    formatAsset,
    formatAssetAmount,
    lookupSymbol,
} from "../../libs/parse"
import { swapAssetState } from 'data/swapAsset'
import { getICon2, MenuKey } from "../../routes"
import Card from "../../components/Card"
import Table from "../../components/Table"
import { Di } from "../../components/Dl"
import { TooltipIcon } from "../../components/Tooltip"
import Delisted from "../../components/Delisted"
import DashboardActions from "../../components/DashboardActions"
import useAddress from "../../hooks/useAddress"
import Connect from "../../layouts/Connect"
import Price from "../../components/Price"
import {bound} from "../../components/Boundary"
import MESSAGE from "../../lang/MESSAGE.json"
import useMyHoldings from "./useMyHoldings"
import { number, div } from "../../libs/math"
import { useProtocol } from "../../data/contract/protocol"
import transakSDK from "@transak/transak-sdk"
import styles from "./Holdings.module.scss"
import connectBtnStyle from "../../components/theme/Menu.module.scss"
// 89c32cc5-ea64-465d-b2c7-438b455ef82b (old)
// 79a79702-8f83-4ab3-a140-b905dc316383 (new)

const settings = {
  apiKey: "79a79702-8f83-4ab3-a140-b905dc316383",
  environment: "PRODUCTION",
  defaultCryptoCurrency: "UST",
  hostURL: window.location.origin,
  widgetHeight: "700px",
  // widgetWidth: "80%",
  networks: "terra",
  // cryptoCurrencyList: "USD, LUNA",
  disableWalletAddressForm: true,
  walletAddress: localStorage.getItem(
    "__terra_chrome_extension_wallet_address__"
  ),
  themeColor: "#2a293e",
}

export const openTransak = () => {
  const transak = new transakSDK(settings)
  transak.init()
}

export enum Type {
  "SWAP" = "Swap",
  "SELL" = "sell",
}

const Holdings = () => {
    const address = useAddress()
    const {totalValue, dataSource } = useMyHoldings()
    const { ibcList } = useProtocol()
  
  const renderTooltip = (value: string, tooltip: string) => (
  //  <TooltipIcon content={tooltip}>
      <Price
        price={commas(decimal(div(value ?? "0", SMALLEST) ?? "0",2))}
        symbol={lookupSymbol(UUSD)}
      />
    // {/* </TooltipIcon> */}
  )
  const [swapAsset, setSwapAsset] = useRecoilState<AssetInfo | NativeInfo>(swapAssetState);

  const dataExists = !!dataSource.length

  const description = (dataExists && !isNaN(number(totalValue))) && (
    <Di
      title="Total Holdings Value"
      className={styles.withDrawableValue}
      content={renderTooltip(totalValue, Tooltip.My.TotalHoldingValue)}
    />
  )

  return (
    <div className="mobile-margin">
      <Grid>
        <Card
          title={"Liquid Tokens"}
          headerClass={styles.header}
          description={bound(description)}
        >
          {!address ? (
            <div className={styles.CzConnectWallet} style={{textAlign: 'center'}}>
              <h6 className={styles.connection_required_info}>
                Connect your wallet to see your Holdings
              </h6>
              <div className={connectBtnStyle.connection_btn}>
                <Connect />
              </div>
            </div>
          ): 
            <Table
              columns={[
                {
                  key: "symbol",
                  title: "Token",
                  render: (symbol, { name, status }) => {
                    const _name = ibcList[name] ? ibcList[name]?.name : name;
                    const _symbol = ibcList[symbol] ? ibcList[symbol]?.symbol : symbol;
                    return(
                      <div className="inline align-center">
                        {status === "DELISTED" && <Delisted />}
                        <img
                          style={{ width: "30px", borderRadius: "25px", opacity: 1, marginRight: "10px" }}
                          src={getICon2(_symbol)}
                          
                          // onClick={() => onClick(item.token ?? '')}
                          alt=" "
                        />
                        {`${_name} (${_symbol})`}
                      </div>
                    )
                  },
                  bold: true,
                },
                {
                  key: "price",
                  render: (value) => `${decimalnPlaces(value, "000")} ${UST}`,
                },
                /*{
                key: "change",
                title: "",
                render: (change: string) => <Change>{change}</Change>,
                narrow: ["left"],
              },*/
                {
                  key: "balance",
                  title: (
                    // <TooltipIcon content={Tooltip.My.Balance}>
                      "Balance"
                    // </TooltipIcon>
                  ),
                  render: (value) => formatAssetAmount(value, UST),
                },
                {
                  key: "value",
                  title: ("Value"
                    // <TooltipIcon content={Tooltip.My.Value}>Value</TooltipIcon>
                  ),
                  render: (value) => commas(formatAsset(value, UST)),
                },
                /*{
                key: "ratio",
                dataIndex: "value",
                title: (
                  <TooltipIcon content={Tooltip.My.PortfolioRatio}>
                    Port. Ratio
                  </TooltipIcon>
                ),
                render: (value) => percent(div(value, totalValue)),
                align: "right",
              },*/
                {
                  key: "actions",
                  dataIndex: "token",
                  render: (token) => {
                    let tokenInfo:AssetInfo | NativeInfo;
                    if (token[0] === 'u') {
                      tokenInfo = {
                        native_token: {
                          denom: token
                        }
                      }
                    } else {
                      tokenInfo = {
                        token: {
                          contract_addr: token
                        }
                      }
                    }
                    return <DashboardActions tokenInfo={tokenInfo} />
                  },
                  align: "right",
                  fixed: "right",
                },
              ]}
              dataSource={dataSource}
              placeholder={!dataExists && (<td colSpan={5} className={styles.description + " " + styles.holdingtext}>
                  {MESSAGE.MyPage.Empty.Holdings}
                  <a
                      href="https://dex.loop.markets"
                      target="_blank"
                      className={styles.tranLink}
                  >
                      credit card here
                  </a>
              </td>)}
            />
          }
        </Card>
      </Grid>
    </div>
  )
}

export default Holdings
