import React, { StrictMode } from "react"
import { render} from "react-dom"
import { BrowserRouter as Router } from "react-router-dom"
import {QueryClient, QueryClientProvider} from "react-query"
import { RecoilRoot } from "recoil"

import Borrow from './pages/Borrow';
import './assets/css/style.css';
import WalletConnectProvider from "./layouts/WalletConnectProvider"
import Boundary from "./components/Boundary"
import Network from "./layouts/Network"
import "./index.scss"

const queryClient = new QueryClient()

render(
    <StrictMode>
      <RecoilRoot>
            <Boundary>
              <Router>
                <QueryClientProvider client={queryClient}>
                  <WalletConnectProvider>
                      <Network>
                          <Borrow />
                      </Network>
                  </WalletConnectProvider>
                </QueryClientProvider>
              </Router>
            </Boundary>
      </RecoilRoot>
    </StrictMode>,
    document.getElementById("root")
  )
