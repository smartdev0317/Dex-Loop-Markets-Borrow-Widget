import { NetworkInfo } from '@terra-money/wallet-provider';

export enum Network {
  MAINNET,
  TESTNET,
}

export const NetworkConnections: Record<Network, NetworkInfo> = {
  [Network.MAINNET]: {
    name: 'mainnet',
    chainID: 'columbus-5',
    lcd: 'https://lcd.terra.dev',
  },
  [Network.TESTNET]: {
    name: 'testnet',
    chainID: 'bombay-12',
    lcd: 'https://bombay-lcd.terra.dev',
  },
};

export const DEFAULT_NETWORK = NetworkConnections[Network.MAINNET];

export const chainID = {
  main: 'columbus-5',
  test: 'bombay-12'
}

export const RPC = {
  main: 'https://lcd.terra.dev',
  test: 'https://bombay-lcd.terra.dev'
}

export const WALLET_CONNECTED = 'WALLET_CONNECTED'
export const WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED'

export const UUSD = "uusd"
export const ULUNA = "uluna"
export const UKRW = "ukrw"
export const USDR = "usdr"
export const UMNT = "umnt"
export const UAUD = "uaud"
export const UCAD = "ucad"
export const UCHF = "uchf"
export const UCNY = "ucny"
export const UEUR = "ueur"
export const UGBP = "ugbp"
export const UHKD = "uhkd"
export const UINR = "uinr"
export const UJPY = "ujpy"
export const USGD = "usgd"
export const UTHB = "uthb"
export const UST = "UST"
export const KRT = "KRT"
export const SDT = "SDT"
export const MNT = "MNT"
export const LUNA = "LUNA"
export const AUT = "AUT"
export const CAT = "CAT"
export const CHT = "CHT"
export const CNT = "CNT"
export const EUT = "EUT"
export const GBT = "GBT"
export const HKT = "HKT"
export const INT = "INT"
export const JPT = "JPT"
export const SGT = "SGT"
export const THT = "THT"
export const LP = "LP"


//mainnet
export const ALTE = 'terra15tztd7v9cmv0rhyh37g843j8vfuzp8kw0k5lqv'
export const ANC = 'terra14z56l0fp2lsf86zy3hty2z47ezkhnthtr9yq76'
export const aUST = 'terra1hzh9vpxhsk8253se0vv5jj6etdvxu3nv8z07zu'
export const bATOM = 'terra1pw8kuxf3d7xnlsrqr39p29emwvufyr0yyjk3fg'
export const bETH = 'terra1dzhzukyezv0etz22ud940z7adyv7xgcjkahuun'
export const bLUNA = 'terra1kc87mu460fwkqte29rquh4hc20m54fxwtsx7gp'
export const bSOL = 'terra17ewm2qjljcvfpmsnje68fnf7tnxecw4prs84sx'
export const DPH = 'terra17jnhankdfl8vyzj6vejt7ag8uz0cjc9crkl2h7'
export const HALO = 'terra1w8kvd6cqpsthupsk4l0clwnmek4l3zr7c84kwq'
export const KUJI = 'terra1xfsdgcemqwxp4hhnyk4rle6wr22sseq7j07dnn'
export const LunaX = 'terra17y9qkl8dfkeg4py7n0g5407emqnemc3yqk5rup'
export const LOOP = 'terra1nef5jf6c7js9x6gkntlehgywvjlpytm7pcgkn4'
export const LOOPR = 'terra1jx4lmmke2srcvpjeereetc9hgegp4g5j0p9r2q'
export const ARTS = 'terra1g0pm8xm5c2dq4qtv8j9a80hg4mhe5ndy8qad07'
export const LOTA = 'terra1ez46kxtulsdv07538fh5ra5xj8l68mu8eg24vr'
export const MINE = 'terra1kcthelkax4j9x8d3ny6sdag0qmxxynl3qtcrpy'
export const MIR = 'terra15gwkyepfc6xgca5t5zefzwy42uts8l2m4g40k6'
export const ORION = 'terra1mddcdx0ujx89f38gu7zspk2r2ffdl5enyz2u03'
export const SEXY = 'terra1nkultnwfvvue3ch0lfwhsl0pnp3zd9734l3u73'
export const SMRT = 'terra1jz9plajrq6knks3vgv9px4ezwshzaxsr2xz7jn'
export const SPEC = 'terra1s5eczhe0h0jutf46re52x5z4r03c8hupacxmdr'
export const stLuna = 'terra1yg3j2s986nyp5z7r2lvt0hx3r0lnd7kwvwwtsc'
export const STT = 'terra13xujxcrc9dqft4p9a8ls0w3j0xnzm6y2uvve8n'
export const SWAP = 'terra1fy4yf7n076wqmcfhsfh543xu35024lw2wlcxq7'
export const TWD = 'terra19djkaepjjswucys4npd5ltaxgsntl7jf0xz7w6'
export const wBTC = 'terra1aa7upykmmqqc63l924l5qfap8mrmx5rfdm0v55'
export const wETH = 'terra14tl83xcwqjy0ken9peu4pjjuu755lrry2uy25r'
export const wasAVAX = 'terra1z3e2e4jpk4n0xzzwlkgcfvc95pc5ldq0xcny58'
export const wMIM = 'terra15a9dr3a2a2lj5fclrw35xxg9yuxg0d908wpf2y'

export const test_ANC = 'terra1747mad58h0w4y589y3sk84r5efqdev9q4r02pc'
export const test_bLUNA = 'terra1u0t35drzyy0mujj8rkdyzhe264uls4ug3wdp3x'
export const test_DPH = 'terra1jyunclt6juv6g7rw0dltlr0kgaqtpq4quvyvu3'
export const test_KUJI = 'terra1azu2frwn9a4l6gl5r39d0cuccs4h7xlu9gkmtd'
export const test_MINE = 'terra1lqm5tutr5xcw9d5vc4457exa3ghd4sr9mzwdex'
export const test_MIR = 'terra10llyp6v3j3her8u3ce66ragytu45kcmd9asj3u'
export const test_SPEC = 'terra1kvsxd94ue6f4rtchv2l6me5k07uh26s7637cza'
export const test_TWD = 'terra18xfqhtfaz2su55zmurmh02ng9lnhw0xnyplvln'
export const test_LOOP = 'terra1eux993n3l5f77fy0tdlpjeyj5xfasf0sst830t'
export const test_SPARKT = 'terra1lftypms44pxhcged7mxd6p95ksnfutypypfclf'

export const DEXLOOPFACTORY = 'terra16hdjuvghcumu6prg22cdjl96ptuay6r0hc6yns'
export const ANCHO_BLUNA_CASTODY = 'terra1ptjp2vfjrwh0j0faj9r6katm640kgjxnwwq9kn'
export const ANCHO_BETH_CASTODY = 'terra10cxuzggyvvv44magvrh3thpdnk9cmlgk93gmx2'
export const ANCHO_MARKET = 'terra1sepfj7s0aeg5967uxnfk4thzlerrsktkpelm5s'
export const ANCHO_OVERSEER = 'terra1tmnqgvg567ypvsvk6rwsga3srp7e3lg6u0elp8'
export const ORACLE = 'terra1cgg6yef7qcdm070qftghfulaxmllgmvk77nc7t'
export const ANCHO_INTEREST = 'terra1kq8zzq5hufas9t0kjsjc62t2kucfnx8txf547n'

// export const test_TerraSwapFactory = 'terra18qpjm4zkvqnpjpw0zn0tdr8gdzvt8au35v45xf'
// export const test_TerraSwapRouter = 'terra14z80rwpd0alzj4xdtgqdmcqt9wd9xj5ffd60wp'
export const test_DEXLOOPFACTORY = 'terra1xclwtdvzwg4j0s7wlrwz3k4gk42jccgurxwf6r'
export const test_ANCHO_BLUNA_CASTODY = 'terra1ltnkx0mv7lf2rca9f8w740ashu93ujughy4s7p'
export const test_ANCHO_MARKET = 'terra15dwd5mj8v59wpj0wvt233mf5efdff808c5tkal'
export const test_ANCHO_OVERSEER = 'terra1qljxd0y3j3gk97025qvl3lgq8ygup4gsksvaxv'
export const test_ORACLE = 'terra1p4gg3p2ue6qy2qfuxtrmgv2ec3f4jmgqtazum8'
export const test_ANCHO_INTEREST = 'terra1m25aqupscdw2kw4tnq5ql6hexgr34mr76azh5x'


export const NATIVE_TOKENS = [
    ULUNA,
    UUSD,
    UKRW,
    USDR,
    UMNT,
    UEUR,
    UCNY,
    UJPY,
    UGBP,
    UINR,
    UCAD,
    UCHF,
    UAUD,
    USGD,
    UTHB,
    UHKD,
]

export const MAINNET_TOKENS = [
    ALTE,
    aUST,
    ANC,
    bETH,
    bLUNA,
    DPH,
    HALO,
    KUJI,
    LOOP,
    LOOPR,
    ARTS,
    LOTA,
    MINE,
    MIR,
    ORION,
    wETH,
    wMIM,
    LunaX,
    SPEC,
    stLuna,
    STT,
    TWD,
    wasAVAX,
    wBTC,
]

export const getSymbol = (key: string) => {
    switch (key) {
      case LUNA:
        return ULUNA
      case KRT:
        return UKRW
      case SDT:
        return USDR
      case MNT:
        return UMNT
      case UST:
        return UUSD
      case AUT:
        return UAUD
      case CAT:
        return UCAD
      case CHT:
        return UCHF
      case CNT:
        return UCNY
      case EUT:
        return UEUR
      case GBT:
        return UGBP
      case HKT:
        return UHKD
      case INT:
        return UINR
      case JPT:
        return UJPY
      case SGT:
        return USGD
      case THT:
        return UTHB
      default:
        return ""
    }
}

export const treasuryWallet = 'terra1lkkr6d3pde6d700apqslamkkpvftplg6mjrzx9'

export const ASTROPORT_ROUTER = 'terra16t7dpwwgx9n3lq6l6te3753lsjqwhxwpday9zx'

export const COINSWAP = 'COINSWAP'

export const BORROWMAX = 75 //%

export const BORROWRATELIMIT = 0.8

export const PRICEIMPACTMAX = 1 //%

export const defaultSwapCoin = ULUNA

export const TX_POLLING_INTERVAL = 3000; // 3s

export const SWAP_FEE = 0.3 // %

export const STABLE_SWAP_FEE = 0.05 // %

export const TREASURY_FEE = 0.1 // %

export const N_COINS = 2

export const ITERATIONS = 32

export const AMP_PRECISION = 1

export const N_COINS_SQUARED = 4

export const STABLE_SWAP_LIMIT = 3 / 8

export enum STATUS {
  SUCCESS = "success",
  LOADING = "loading",
  FAILURE = "failure",
}

export const defaultPriceImpact = {
  collateral: {
    path: '-',
    impact: undefined
  },
  borrow: {
    path: '-',
    impact: undefined
  }
}