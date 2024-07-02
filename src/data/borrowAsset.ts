import { atom } from "recoil"
import { AssetInfo, NativeInfo, defaultBorrowAssetInfo } from 'constant/usePairs'

export const borrowAssetState = atom<AssetInfo | NativeInfo>({
  key: "borrowAsset",
  default: defaultBorrowAssetInfo,
})
