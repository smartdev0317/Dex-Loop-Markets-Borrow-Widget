import { atom } from "recoil"
import { AssetInfo, NativeInfo, defaultBorrowAssetInfo } from 'constant/usePairs'

export const collateralAssetState = atom<AssetInfo | NativeInfo>({
  key: "collateralAsset",
  default: defaultBorrowAssetInfo,
})
