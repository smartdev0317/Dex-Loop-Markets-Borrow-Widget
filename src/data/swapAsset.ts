import { atom } from "recoil"
import { AssetInfo, NativeInfo, defaultSwapAssetInfo } from 'constant/usePairs'

export const swapAssetState = atom<AssetInfo | NativeInfo>({
  key: "swapAsset",
  default: defaultSwapAssetInfo,
})
