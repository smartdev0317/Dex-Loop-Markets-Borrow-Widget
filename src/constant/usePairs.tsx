import {
    LUNA,
    ULUNA,
    UST,
    UUSD,
    ALTE,
    ANC,
    aUST,
    bETH,
    bLUNA,
    DPH,
    HALO,
    KUJI,
    LOOP,
    LOOPR,
    ARTS,
    LOTA,
    LunaX,
    MINE,
    MIR,
    ORION,
    SPEC,
    stLuna,
    STT,
    TWD,
    wBTC,
    wETH,
    wMIM,
    SWAP,
    SMRT,
    SEXY,
    test_ANC,
    test_bLUNA,
    test_DPH,
    test_KUJI,
    test_MINE,
    test_MIR,
    test_SPEC,
    test_TWD,
    test_LOOP,
    test_SPARKT,
    wasAVAX,
    bSOL,
    bATOM
} from "./constants"

import Aut_icon from 'assets/img/coins/aut.svg'
import Cat_icon from 'assets/img/coins/cat.svg'
import Cht_icon from 'assets/img/coins/cht.svg'
import Cnt_icon from 'assets/img/coins/cnt.svg'
import Dkt_icon from 'assets/img/coins/dkt.svg'
import Eut_icon from 'assets/img/coins/eut.svg'
import Gbt_icon from 'assets/img/coins/gbt.svg'
import Hkt_icon from 'assets/img/coins/hkt.svg'
import Idt_icon from 'assets/img/coins/idt.svg'
import Int_icon from 'assets/img/coins/int.svg'
import Jpt_icon from 'assets/img/coins/jpt.svg'
import Krt_icon from 'assets/img/coins/krt.svg'
import Luna_icon from 'assets/img/coins/luna.svg'
import Mnt_icon from 'assets/img/coins/mnt.svg'
import Myt_icon from 'assets/img/coins/myt.svg'
import Not_icon from 'assets/img/coins/not.svg'
import Pht_icon from 'assets/img/coins/pht.svg'
import Sdt_icon from 'assets/img/coins/sdt.svg'
import Set_icon from 'assets/img/coins/set.svg'
import Sgt_icon from 'assets/img/coins/sgt.svg'
import Tht_icon from 'assets/img/coins/tht.svg'
import Twt_icon from 'assets/img/coins/twt.svg'
import Ust_icon from 'assets/img/coins/ust.svg'

import ALTE_icon from 'assets/img/tokens/ALTE.webp'
import aUST_icon from 'assets/img/tokens/aUST.png'
import ANC_icon from 'assets/img/tokens/ANC.png'
import bETH_icon from 'assets/img/tokens/bETH.png'
import bLUNA_icon from 'assets/img/tokens/bLUNA.png'
import DPH_icon from 'assets/img/tokens/DPH.png'
import HALO_icon from 'assets/img/tokens/HALO.png'
import KUJI_icon from 'assets/img/tokens/KUJI.png'
import LOOP_icon from 'assets/img/tokens/LOOP.png'
import LOOPR_icon from 'assets/img/tokens/LOOPR.png'
import ARTS_icon from 'assets/img/tokens/ARTS.svg'
import LOTA_icon from 'assets/img/tokens/LOTA.png'
import MINE_icon from 'assets/img/tokens/MINE.png'
import MIR_icon from 'assets/img/tokens/MIR.png'
import ORION_icon from 'assets/img/tokens/ORION.png'
import WETH_icon from 'assets/img/tokens/WETH.png'
import WMIM_icon from 'assets/img/tokens/WMIM.png'
import LunaX_icon from 'assets/img/tokens/LunaX.png'
import SPEC_icon from 'assets/img/tokens/SPEC.png'
import stLuna_icon from 'assets/img/tokens/stLuna.png'
import STT_icon from 'assets/img/tokens/STT.png'
import TWD_icon from 'assets/img/tokens/TWD.png'
import WBTC_icon from 'assets/img/tokens/WBTC.png'
import SWAP_icon from 'assets/img/tokens/SWAP.svg'
import wasAVAX_icon from 'assets/img/tokens/wasAVAX.svg'
import bSOL_icon from 'assets/img/tokens/bSOL.svg'
import bATOM_icon from 'assets/img/tokens/bATOM.svg'

interface Pairs {
    pairs: Pair[]
}
  
export interface Pair {
  pair: TokenInfo[]
  contract: string
  liquidity_token: string
}
  
export interface TokenInfo {
  symbol: string
  name: string
  contract_addr: string
  decimals: number
  icon: string
  verified: boolean
}

interface PairsResult {
  pairs: PairResult[]
}

export interface AssetInfo {
  token: { contract_addr: string }
}
  
export interface NativeInfo {
  native_token: { denom: string }
}
export interface SwapLiquidity {
  asset: string,
  balance: number
}
  
interface PairResult {
  liquidity_token: string
  contract_addr: string
  asset_infos: (NativeInfo | AssetInfo)[]
}
  
interface TokenResult {
  name: string
  symbol: string
  decimals: number
  total_supply: string
  contract_addr: string
  icon: string
  verified: boolean
}
  
export const coinInfos: Map<string, TokenInfo> = new Map<string, TokenInfo>([
    [
      ULUNA,
      {
        contract_addr: ULUNA,
        symbol: LUNA,
        name: ULUNA,
        decimals: 6,
        icon: Luna_icon,
        verified: true,
      },
    ],
    // [
    //   UKRW,
    //   {
    //     contract_addr: UKRW,
    //     symbol: KRT,
    //     name: UKRW,
    //     decimals: 6,
    //     icon: Krt_icon,
    //     verified: true,
    //   },
    // ],
    // [
    //   UMNT,
    //   {
    //     contract_addr: UMNT,
    //     symbol: MNT,
    //     name: UMNT,
    //     decimals: 6,
    //     icon: Mnt_icon,
    //     verified: true,
    //   },
    // ],
    // [
    //   USDR,
    //   {
    //     contract_addr: USDR,
    //     symbol: SDT,
    //     name: USDR,
    //     decimals: 6,
    //     icon: Sdt_icon,
    //     verified: true,
    //   },
    // ],
    [
      UUSD,
      {
        contract_addr: UUSD,
        symbol: UST,
        name: UUSD,
        decimals: 6,
        icon: Ust_icon,
        verified: true,
      },
    ],
    // [
    //   UAUD,
    //   {
    //     contract_addr: UAUD,
    //     symbol: AUT,
    //     name: UAUD,
    //     decimals: 6,
    //     icon: Aut_icon,
    //     verified: true,
    //   },
    // ],
    // [
    //   UCAD,
    //   {
    //     contract_addr: UCAD,
    //     symbol: CAT,
    //     name: UCAD,
    //     decimals: 6,
    //     icon: Cat_icon,
    //     verified: true,
    //   },
    // ],
    // [
    //   UCHF,
    //   {
    //     contract_addr: UCHF,
    //     symbol: CHT,
    //     name: UCHF,
    //     decimals: 6,
    //     icon: Cht_icon,
    //     verified: true,
    //   },
    // ],
    // [
    //   UCNY,
    //   {
    //     contract_addr: UCNY,
    //     symbol: CNT,
    //     name: UCNY,
    //     decimals: 6,
    //     icon: Cnt_icon,
    //     verified: true,
    //   },
    // ],
    // [
    //   UEUR,
    //   {
    //     contract_addr: UEUR,
    //     symbol: EUT,
    //     name: UEUR,
    //     decimals: 6,
    //     icon: Eut_icon,
    //     verified: true,
    //   },
    // ],
    // [
    //   UGBP,
    //   {
    //     contract_addr: UGBP,
    //     symbol: GBT,
    //     name: UGBP,
    //     decimals: 6,
    //     icon: Gbt_icon,
    //     verified: true,
    //   },
    // ],
    // [
    //   UHKD,
    //   {
    //     contract_addr: UHKD,
    //     symbol: HKT,
    //     name: UHKD,
    //     decimals: 6,
    //     icon: Hkt_icon,
    //     verified: true,
    //   },
    // ],
    // [
    //   UINR,
    //   {
    //     contract_addr: UINR,
    //     symbol: INT,
    //     name: UINR,
    //     decimals: 6,
    //     icon: Int_icon,
    //     verified: true,
    //   },
    // ],
    // [
    //   UJPY,
    //   {
    //     contract_addr: UJPY,
    //     symbol: JPT,
    //     name: UJPY,
    //     decimals: 6,
    //     icon: Jpt_icon,
    //     verified: true,
    //   },
    // ],
    // [
    //   USGD,
    //   {
    //     contract_addr: USGD,
    //     symbol: SGT,
    //     name: USGD,
    //     decimals: 6,
    //     icon: Sgt_icon,
    //     verified: true,
    //   },
    // ],
    // [
    //   UTHB,
    //   {
    //     contract_addr: UTHB,
    //     symbol: THT,
    //     name: UTHB,
    //     decimals: 6,
    //     icon: Tht_icon,
    //     verified: true,
    //   },
    // ],
])

export const testnet_tokenInfos: Map<string, TokenInfo> = new Map<string, TokenInfo>([
  // [
  //   test_ANC,
  //   {
  //     contract_addr: test_ANC,
  //     symbol: 'ANC',
  //     name: 'Anchor Token',
  //     decimals: 6,
  //     icon: ANC_icon,
  //     verified: true,
  //   }
  // ],
  [
    test_bLUNA,
    {
      contract_addr: test_bLUNA,
      symbol: 'BLUNA',
      name: 'Bonded Luna',
      decimals: 6,
      icon: bLUNA_icon,
      verified: true,
    }
  ],
  // [
  //   test_DPH,
  //   {
  //     contract_addr: test_DPH,
  //     symbol: 'DPH',
  //     name: 'Digipharm',
  //     decimals: 6,
  //     icon: DPH_icon,
  //     verified: true,
  //   }
  // ],
  // [
  //   test_KUJI,
  //   {
  //     contract_addr: test_KUJI,
  //     symbol: 'KUJI',
  //     name: 'Kuji',
  //     decimals: 6,
  //     icon: KUJI_icon,
  //     verified: true,
  //   }
  // ],
  // [
  //   test_MINE,
  //   {
  //     contract_addr: test_MINE,
  //     symbol: 'MINE',
  //     name: 'Pylon MINE Token',
  //     decimals: 6,
  //     icon: MINE_icon,
  //     verified: true,
  //   }
  // ],
  // [
  //   test_MIR,
  //   {
  //     contract_addr: test_MIR,
  //     symbol: 'MIR',
  //     name: 'Mirror',
  //     decimals: 6,
  //     icon: MIR_icon,
  //     verified: true,
  //   }
  // ],
  // [
  //   test_SPEC,
  //   {
  //     contract_addr: test_SPEC,
  //     symbol: 'SPEC',
  //     name: 'Spectrum token',
  //     decimals: 6,
  //     icon: SPEC_icon,
  //     verified: true,
  //   }
  // ],
  // [
  //   test_TWD,
  //   {
  //     contract_addr: test_TWD,
  //     symbol: 'TWD',
  //     name: 'Terra World Token',
  //     decimals: 6,
  //     icon: TWD_icon,
  //     verified: true,
  //   }
  // ],
  [
    test_LOOP,
    {
      contract_addr: test_LOOP,
      symbol: 'LOOP',
      name: 'LOOP',
      decimals: 6,
      icon: LOOP_icon,
      verified: true,
    }
  ],
  [
    test_SPARKT,
    {
      contract_addr: test_SPARKT,
      symbol: 'SparkT',
      name: 'SparkT',
      decimals: 6,
      icon: '',
      verified: true,
    }
  ],
])

export const mainnet_tokenInfos: Map<string, TokenInfo> = new Map<string, TokenInfo>([
    [
      ALTE,
      {
        contract_addr: ALTE,
        symbol: 'ALTE',
        name: 'altered',
        decimals: 6,
        icon: ALTE_icon,
        verified: true,
      }
    ],
    [
      aUST,
      {
        contract_addr: aUST,
        symbol: 'aUST',
        name: 'Anchor Terra USD',
        decimals: 6,
        icon: aUST_icon,
        verified: true,
      }
    ],
    [
      ANC,
      {
        contract_addr: ANC,
        symbol: 'ANC',
        name: 'Anchor Token',
        decimals: 6,
        icon: ANC_icon,
        verified: true,
      }
    ],
    // [
    //   bATOM,
    //   {
    //     contract_addr: bATOM,
    //     symbol: 'bATOM',
    //     name: 'Bonded ATOM',
    //     decimals: 6,
    //     icon: bATOM_icon,
    //     verified: true,
    //   }
    // ],
    // [
    //   bSOL,
    //   {
    //     contract_addr: bSOL,
    //     symbol: 'bSOL',
    //     name: 'Bonded SOL',
    //     decimals: 6,
    //     icon: bSOL_icon,
    //     verified: true,
    //   }
    // ],
    [
      bETH,
      {
        contract_addr: bETH,
        symbol: 'BETH',
        name: 'Bonded ETH',
        decimals: 6,
        icon: bETH_icon,
        verified: true,
      }
    ],
    [
      bLUNA,
      {
        contract_addr: bLUNA,
        symbol: 'BLUNA',
        name: 'Bonded Luna',
        decimals: 6,
        icon: bLUNA_icon,
        verified: true,
      }
    ],
    [
      DPH,
      {
        contract_addr: DPH,
        symbol: 'DPH',
        name: 'Digipharm',
        decimals: 6,
        icon: DPH_icon,
        verified: true,
      }
    ],
    [
      HALO,
      {
        contract_addr: HALO,
        symbol: 'HALO',
        name: 'Angel Protocol',
        decimals: 6,
        icon: HALO_icon,
        verified: true,
      }
    ],
    [
      KUJI,
      {
        contract_addr: KUJI,
        symbol: 'KUJI',
        name: 'Kuji',
        decimals: 6,
        icon: KUJI_icon,
        verified: true,
      }
    ],
    [
      LOOP,
      {
        contract_addr: LOOP,
        symbol: 'LOOP',
        name: 'LOOP token',
        decimals: 6,
        icon: LOOP_icon,
        verified: true,
      }
    ],
    [
      LOOPR,
      {
        contract_addr: LOOPR,
        symbol: 'LOOPR',
        name: 'LOOPR token',
        decimals: 6,
        icon: LOOPR_icon,
        verified: true,
      }
    ],
    [
      ARTS,
      {
        contract_addr: ARTS,
        symbol: 'ARTS',
        name: 'ARTS token',
        decimals: 6,
        icon: ARTS_icon,
        verified: true,
      }
    ],
    [
      LOTA,
      {
        contract_addr: LOTA,
        symbol: 'LOTA',
        name: 'loterra',
        decimals: 6,
        icon: LOTA_icon,
        verified: true,
      }
    ],
    [
      MINE,
      {
        contract_addr: MINE,
        symbol: 'MINE',
        name: 'Pylon MINE Token',
        decimals: 6,
        icon: MINE_icon,
        verified: true,
      }
    ],
    [
      MIR,
      {
        contract_addr: MIR,
        symbol: 'MIR',
        name: 'Mirror',
        decimals: 6,
        icon: MIR_icon,
        verified: true,
      }
    ],
    [
      wETH,
      {
        contract_addr: wETH,
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 8,
        icon: WETH_icon,
        verified: true,
      }
    ],
    [
      wMIM,
      {
        contract_addr: wMIM,
        symbol: 'WMIM',
        name: 'Magic Internet Money',
        decimals: 8,
        icon: WMIM_icon,
        verified: true,
      }
    ],
    [
      LunaX,
      {
        contract_addr: LunaX,
        symbol: 'LunaX',
        name: 'Stader LunaX Token',
        decimals: 6,
        icon: LunaX_icon,
        verified: true,
      }
    ],
    [
      ORION,
      {
        contract_addr: ORION,
        symbol: 'ORION',
        name: 'Orion Money Token',
        decimals: 8,
        icon: ORION_icon,
        verified: true
      }
    ],
    // [
    //   SEXY,
    //   {
    //     contract_addr: SEXY,
    //     symbol: 'SEXY',
    //     name: 'Sexy Profit',
    //     decimals: 6,
    //     icon: '',
    //     verified: true,
    //   }
    // ],
    // [
    //   SMRT,
    //   {
    //     contract_addr: SMRT,
    //     symbol: 'SMRT',
    //     name: 'SMART TERRA',
    //     decimals: 6,
    //     icon: '',
    //     verified: true,
    //   }
    // ],
    [
      SPEC,
      {
        contract_addr: SPEC,
        symbol: 'SPEC',
        name: 'Spectrum token',
        decimals: 6,
        icon: SPEC_icon,
        verified: true,
      }
    ],
    // [
    //   SWAP,
    //   {
    //     contract_addr: SWAP,
    //     symbol: 'SWAP',
    //     name: 'Coin Swap',
    //     decimals: 6,
    //     icon: SWAP_icon,
    //     verified: true,
    //   }
    // ],
    [
      stLuna,
      {
        contract_addr: stLuna,
        symbol: 'stLuna',
        name: 'Staked Luna',
        decimals: 6,
        icon: stLuna_icon,
        verified: true,
      }
    ],
    [
      STT,
      {
        contract_addr: STT,
        symbol: 'STT',
        name: 'StarTerra Token',
        decimals: 6,
        icon: STT_icon,
        verified: true,
      }
    ],
    [
      TWD,
      {
        contract_addr: TWD,
        symbol: 'TWD',
        name: 'Terra World Token',
        decimals: 6,
        icon: TWD_icon,
        verified: true,
      }
    ],
    [
      wasAVAX,
      {
        contract_addr: wasAVAX,
        symbol: 'wasAvax',
        name: 'Staked AVAX',
        decimals: 6,
        icon: wasAVAX_icon,
        verified: true
      }
    ],
    [
      wBTC,
      {
        contract_addr: wBTC,
        symbol: 'WBTC',
        name: 'Wrapped BTC',
        decimals: 8,
        icon: WBTC_icon,
        verified: true,
      }
    ]
])

export const DefaultBorrowDetail = {
    asset: coinInfos.get(LUNA),
    asset_amount: 0,
    asset_slippage: 1,
    collateral: mainnet_tokenInfos.get(bLUNA),
    collateral_amount: 0,
    borrow: mainnet_tokenInfos.get(LOOP),
    borrow_amount: 0
}
  
export let lpTokenInfos: Map<string, TokenInfo[]> = new Map<
    string,
    TokenInfo[]
>()

export interface BorrowInfo {
    asset: TokenInfo | undefined,
    asset_amount: number,
    asset_slippage: number,
    collateral: TokenInfo | undefined,
    collateral_amount: number,
    borrow: TokenInfo | undefined,
    borrow_amount: number
}

export const defaultTokens = [
    ULUNA,
    UUSD,
    aUST,
    LOOP,
    LOOPR,
    bLUNA,
    ANC
]

export const defaultTestnetTokens = [
  ULUNA,
  UUSD,
  test_bLUNA
  // test_ANC
]

export const collateralTokens = [
  bLUNA,
  bETH,
  wasAVAX
]

export const test_collateralTokens = [
  test_bLUNA
]

export const defaultSwapAssetInfo = {
  native_token: {denom: ULUNA}
}

export const defaultCollateralAssetInfo = {
  token: { contract_addr: bLUNA }
}

export const defaultTestnetCollateralAssetInfo = {
  token: { contract_addr: test_bLUNA }
}

export const defaultBorrowAssetInfo = {
  token: { contract_addr: LOOP }
}

export const defaultTestnetBorrowAssetInfo = {
  token: { contract_addr: test_LOOP }
}