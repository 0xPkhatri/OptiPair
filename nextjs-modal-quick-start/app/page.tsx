/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */

"use client";

// IMP START - Quick Start
import {
  CHAIN_NAMESPACES,
  IAdapter,
  IProvider,
  WEB3AUTH_NETWORK,
} from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { getDefaultExternalAdapters } from "@web3auth/default-evm-adapter";
import { Web3Auth, Web3AuthOptions } from "@web3auth/modal";
// IMP END - Quick Start
import { useEffect, useState } from "react";

// IMP START - Blockchain Calls
import RPC from "./ethersRPC";
// import RPC from "./viemRPC";
// import RPC from "./web3RPC";
// IMP END - Blockchain Calls

// IMP START - Dashboard Registration
const clientId =
  "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ"; // get from https://dashboard.web3auth.io
// IMP END - Dashboard Registration

// IMP START - Chain Config
const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7",
  rpcTarget: "https://rpc.ankr.com/eth_sepolia",
  // Avoid using public rpcTarget in production.
  // Use services like Infura, Quicknode etc
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};
// IMP END - Chain Config

// IMP START - SDK Initialization
const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const web3AuthOptions: Web3AuthOptions = {
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
  privateKeyProvider,
};
const web3auth = new Web3Auth(web3AuthOptions);
// IMP END - SDK Initialization

function App() {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [strike1, setStrike1] = useState("");
  const [strike2, setStrike2] = useState("");
  const [optionType, setOptionType] = useState("call");
  const [liquidityAmount, setLiquidityAmount] = useState("");
  const [atmStrike, setAtmStrike] = useState("");
  const [otmStrike, setOtmStrike] = useState("");
  const [lotsize, setLotsize] = useState("");
  const [premium, setPremium] = useState("");
  const [data, setData] = useState({
    lowerStrike: 0,
    higherStrike: 0,
    strikePrice: 3200, // Assuming some default values
    atmStrikePrice: 3200,
    far: 4000,
    low: 3200,
    lotQuantity: 100, // Default lot quantity
  });

  // Updated handler to simulate data fetching/updating
  const handleStrikeChange = () => {
    const strikePriceInput = parseFloat(strike1);
    const lotQuantityInput = parseFloat(strike2);

    if (isNaN(strikePriceInput) || isNaN(lotQuantityInput)) {
      alert("Please enter valid numbers for strike price and lot quantity.");
      return;
    }

    const strikeDiff = strikePriceInput - data.atmStrikePrice;
    const rangeDiff = data.far - data.low;
    const newLowerStrike = (strikeDiff / rangeDiff) * lotQuantityInput;

    const strikeDifffar = data.far - strikePriceInput;
    const newHigherStrike = (strikeDifffar / rangeDiff) * lotQuantityInput;

    setData({
      ...data,
      strikePrice: strikePriceInput,
      lotQuantity: lotQuantityInput,
      lowerStrike: newLowerStrike,
      higherStrike: newHigherStrike,
    });
  };

  useEffect(() => {
    const init = async () => {
      try {
        // IMP START - Configuring External Wallets
        const adapters = await getDefaultExternalAdapters({
          options: web3AuthOptions,
        });
        adapters.forEach((adapter: IAdapter<unknown>) => {
          web3auth.configureAdapter(adapter);
        });
        // IMP END - Configuring External Wallets
        // IMP START - SDK Initialization
        await web3auth.initModal();
        // IMP END - SDK Initialization
        setProvider(web3auth.provider);

        if (web3auth.connected) {
          setLoggedIn(true);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const login = async () => {
    // IMP START - Login
    const web3authProvider = await web3auth.connect();
    // IMP END - Login
    setProvider(web3authProvider);
    if (web3auth.connected) {
      setLoggedIn(true);
    }
  };

  const addLiquidity = async () => {
    if (!provider) {
      uiConsole("provider not initialized yet");
      return;
    }

    const liquidity = parseFloat(liquidityAmount);
    if (isNaN(liquidity) || liquidity <= 0) {
      alert("Please enter a valid liquidity amount.");
      return;
    }

    try {
      uiConsole("Adding Liquidity...");
      // Example blockchain call to add liquidity
      const txReceipt = await RPC.addLiquidity(provider, liquidity);
      uiConsole(txReceipt);
    } catch (error) {
      console.error("Error adding liquidity: ", error);
      alert("Failed to add liquidity");
    }
  };

  const getUserInfo = async () => {
    // IMP START - Get User Information
    const user = await web3auth.getUserInfo();
    // IMP END - Get User Information
    uiConsole(user);
  };

  const logout = async () => {
    // IMP START - Logout
    await web3auth.logout();
    // IMP END - Logout
    setProvider(null);
    setLoggedIn(false);
    uiConsole("logged out");
  };

  function uiConsole(...args: any[]): void {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
      console.log(...args);
      console.log(el);
    }
  }

  const loggedInView = (
    <>
      <div className="flex">
        {/* <div>
          <button onClick={getUserInfo} className="card">
            Get User Info
          </button>
        </div> */}
        <div>
          <button onClick={logout} className="card">
            Log Out
          </button>
        </div>
      </div>
    </>
  );

  const unloggedInView = (
    <button onClick={login} className="card">
      Login
    </button>
  );

  return (
    <div className="container">
      <div>
        {/* navbar */}
        <nav className="bg-gray-800">
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <div className="flex flex-1 items-stretch justify-start">
                <div className="flex shrink-0 items-center text-white text-lg">
                  OptiPair
                </div>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                <div className="grid">
                  {loggedIn ? loggedInView : unloggedInView}
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>

      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}></p>
      </div>
      {/* <div>start main here</div> */}
      <div className="text-sm mb-6">Option voletility premium trading</div>
      <div className="container mx-auto p-6">
        <div className="flex flex-wrap gap-4">
          {/* Left Panel - Strike Selection */}
          <h2 className="text-2xl font-bold mb-4">
            Select Strike Prices Between atm 3200 and otm 4000
          </h2>
          <div className="flex">
            <div className="w-full md:w-1/3 bg-gray-100 p-4 rounded-lg shadow-md">
              <div className="mb-4">
                <label
                  className="block text-gray-700 font-semibold mb-2"
                  htmlFor="optionType"
                >
                  Option Type
                </label>
                <select
                  id="optionType"
                  value={optionType}
                  onChange={(e) => setOptionType(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="call">Call</option>
                  <option value="put">Put</option>
                </select>
              </div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 font-semibold mb-2"
                  htmlFor="strike1"
                >
                  Strike Price
                </label>
                <input
                  type="text"
                  id="strike1"
                  value={strike1}
                  onChange={(e) => setStrike1(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Enter strike price"
                />
              </div>
              <div className="mb-4">
                <label
                  className="block text-gray-700 font-semibold mb-2"
                  htmlFor="strike2"
                >
                  Lot quantity (1 ETH = 10lot)
                </label>
                <input
                  type="text"
                  id="strike2"
                  value={strike2}
                  onChange={(e) => setStrike2(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="lot quantity"
                />
              </div>
              <button
                onClick={handleStrikeChange}
                className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"
              >
                Calculate
              </button>
            </div>

            {/* Right Panel - Data Visualization */}
            <div className="w-full md:w-2/3 bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
              {data ? (
                <div className="grid gap-4">
                  {/* Liquidity Metrics */}
                  <div className="bg-green-100 p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold">Atm buy lots</h3>
                    <p className="text-gray-700">
                      {data.lowerStrike.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold">Otm buy lots</h3>
                    <p className="text-gray-700">
                      {data.higherStrike.toFixed(2)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">
                  Please select strike prices and click "Update Data" to view
                  visualizations.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Add Liquidity Section */}
        <div className="mt-6 bg-gray-100 p-4 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Add Liquidity</h2>
          <div className="mb-4">
            <label
              className="block text-gray-700 font-semibold mb-2"
              htmlFor="liquidityAmount"
            >
              Liquidity Amount (in ETH)
            </label>
            <input
              type="text"
              id="liquidityAmount"
              value={liquidityAmount}
              onChange={(e) => setLiquidityAmount(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="Enter liquidity amount"
            />
          </div>
          <button
            onClick={addLiquidity}
            className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
          >
            Add Liquidity
          </button>
        </div>
        <div className="text-2xl font-bold mb-4 text-red-700 pt-4 mt-4">
          Admin Section
        </div>
        {/* Start Option Contract Section */}
        <div className="mt-6 bg-gray-100 p-4 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Start Option Contract</h2>
          <div className="mb-4">
            <label
              className="block text-gray-700 font-semibold mb-2"
              htmlFor="atmStrike"
            >
              ATM Strike Price
            </label>
            <input
              type="text"
              id="atmStrike"
              value={atmStrike}
              onChange={(e) => setAtmStrike(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="Enter ATM strike price"
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 font-semibold mb-2"
              htmlFor="otmStrike"
            >
              OTM Strike Price
            </label>
            <input
              type="text"
              id="otmStrike"
              value={otmStrike}
              onChange={(e) => setOtmStrike(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="Enter OTM strike price"
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 font-semibold mb-2"
              htmlFor="premium"
            >
              lotsize
            </label>
            <input
              type="text"
              id="premium"
              value={premium}
              onChange={(e) => setLotsize(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="Enter Lots"
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 font-semibold mb-2"
              htmlFor="premium"
            >
              Premium
            </label>
            <input
              type="text"
              id="premium"
              value={premium}
              onChange={(e) => setPremium(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="Enter premium"
            />
          </div>
          <button
            onClick={() => uiConsole("Start Option Contract clicked")}
            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Start Option Contract
          </button>
        </div>

        {/* Settlement Section */}
        <div className="mt-6 bg-gray-100 p-4 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Settlement</h2>
          <div className="flex gap-4">
            <button
              onClick={() => uiConsole("Call Settlement clicked")}
              className="bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
            >
              Call Settlement
            </button>
            <button
              onClick={() => uiConsole("Put Settlement clicked")}
              className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
            >
              Put Settlement
            </button>
          </div>
        </div>
      </div>

      <footer className="footer">
        <a
          href="https://github.com/Web3Auth/web3auth-pnp-examples/tree/main/web-modal-sdk/quick-starts/nextjs-modal-quick-start"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source code
        </a>
        <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FWeb3Auth%2Fweb3auth-pnp-examples%2Ftree%2Fmain%2Fweb-modal-sdk%2Fquick-starts%2Fnextjs-modal-quick-start&project-name=w3a-nextjs-modal&repository-name=w3a-nextjs-modal">
          <img src="https://vercel.com/button" alt="Deploy with Vercel" />
        </a>
      </footer>
    </div>
  );
}

export default App;
