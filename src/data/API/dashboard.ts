
import {  selector } from "recoil"
import { apiURLQuery } from "../network"
import { fetchAPI } from "../../libs/fetchApi"

export const unitPricesStore = selector({
    key: "unitPricesStore",
    get: async ({ get }) => {
        const fetchAPIQ = get(fetchAPIQuery)
        return fetchAPIQ({name: 'getUnitPrices'})
    },
})

export const tradingListStore = selector({
    key: "tradingListStore",
    get: async ({ get }) => {
        const fetchAPIQ = get(fetchAPIQuery)
        return fetchAPIQ({name: 'tradingData'})
    },
})

export const cardsStore = selector({
    key: "cardsStore",
    get: async ({ get }) => {
        const fetchAPIQ = get(fetchAPIQuery)
        return fetchAPIQ({name: 'dashboardCard'})
    },
})

/* native */
export const fetchAPIQuery = selector({
    key: "fetchAPIQuery",
    get: ({ get }) => {
        const url = get(apiURLQuery)
        return async({ name }: { name: string}) => await fetchAPI(`${url}/v1/contracts/` + name)
    },
})

export const statsStore = selector({
    key: "statsStore",
    get: async ({ get }) => {
        const fetchAPIQ = get(fetchAPIQuery)
        return fetchAPIQ({name: 'statsData'})
    },
})
