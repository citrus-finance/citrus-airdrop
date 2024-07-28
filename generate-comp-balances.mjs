import { writeFile } from 'fs/promises'

import ethers, {
    BigNumber
} from 'ethers'

import 'dotenv/config'

const networks = [{
        name: 'ethereum',
        compAddress: '0xc00e94cb662c3520282e6f5717214004a7f26888',
        lensAddress: '0xdCbDb7306c6Ff46f77B349188dC18cEd9DF30299',
        comptrollerAddress: '0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B',
        // fromBlock: 7710671,
        // toBlock: 14340966,
        fromBlock: 9601359,
        toBlock: 9603359,
        rpc: process.env.ETHEREUM_RPC,
        instaDappList: '0x4c8a1BEb8a87765788946D6B19C6C6355194AbEb',
        uniswapV3Position: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
        // uniswapV2Factory: '',
        makerProxyRegistry: '0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4',
        addressesToIgnore: [
            '0x2775b1c75658be0f640272ccb8c72ac986009e38',
            '0x6d903f6003cca6255d85cca4d3b5e5146dc33925',
        ]
    },
    {
        name: 'polygon',
        compAddress: '0x8505b9d2254a7ae468c0e9dd10ccea3a837aef5c',
        fromBlock: 4196299,
        rpc: process.env.POLYGON_RPC,
    },
    {
        name: 'harmony',
        compAddress: '0x32137b9275ea35162812883582623cd6f6950958',
        fromBlock: 5419033,
        rpc: process.env.HARMONY_RPC,
    },
    {
        name: 'avalanche',
        compAddress: '0xc3048e19e76cb9a3aa9d77d8c03c29fc906e2437',
        fromBlock: 4148359,
        rpc: process.env.AVALANCHE_RPC,
    },
    {
        name: 'BSC',
        compAddress: '0x52ce071bd9b1c4b00a0b92d298c512478cad67e8',
        fromBlock: 923336,
        rpc: process.env.BSC_RPC,
    },
    {
        name: 'arbitrum',
        compAddress: '0x354a6da3fcde098f8389cad84b0182725c6c91de',
        fromBlock: 199738,
        rpc: process.env.ARBITRUM_RPC
    },
]

const network = networks[0]

const CompoundLensABI = [{
    "constant": true,
    "inputs": [{
            "internalType": "contract Comp",
            "name": "comp",
            "type": "address"
        },
        {
            "internalType": "contract ComptrollerLensInterface",
            "name": "comptroller",
            "type": "address"
        },
        {
            "internalType": "address",
            "name": "account",
            "type": "address"
        }
    ],
    "name": "getCompBalanceMetadataExt",
    "outputs": [{
        "components": [{
                "internalType": "uint256",
                "name": "balance",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "votes",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "delegate",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "allocated",
                "type": "uint256"
            }
        ],
        "internalType": "struct CompoundLens.CompBalanceMetadataExt",
        "name": "",
        "type": "tuple"
    }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
}, ]

const ComptrollerABI = [{
        "anonymous": false,
        "inputs": [{
                "indexed": false,
                "internalType": "contract CToken",
                "name": "cToken",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "MarketEntered",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [{
                "indexed": true,
                "internalType": "contract CToken",
                "name": "cToken",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "borrower",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "compDelta",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "compBorrowIndex",
                "type": "uint256"
            }
        ],
        "name": "DistributedBorrowerComp",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [{
                "indexed": true,
                "internalType": "contract CToken",
                "name": "cToken",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "supplier",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "compDelta",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "compSupplyIndex",
                "type": "uint256"
            }
        ],
        "name": "DistributedSupplierComp",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [{
                "indexed": false,
                "internalType": "address",
                "name": "recipient",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "CompGranted",
        "type": "event"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "getAllMarkets",
        "outputs": [{
            "internalType": "contract CToken[]",
            "name": "",
            "type": "address[]"
        }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
]

const ERC20ABI = [{
        "anonymous": false,
        "inputs": [{
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{
            "internalType": "string",
            "name": "",
            "type": "string"
        }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{
            "internalType": "address",
            "name": "account",
            "type": "address"
        }],
        "name": "balanceOf",
        "outputs": [{
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
]

const provider = new ethers.providers.JsonRpcProvider(network.rpc)
const lens = new ethers.Contract(network.lensAddress, CompoundLensABI, provider)
const comp = new ethers.Contract(network.compAddress, CompoundLensABI, provider)
const comptroller = new ethers.Contract(network.comptrollerAddress, ComptrollerABI, provider)


const tokenAddresses = await (async () => {
    if (network.comptrollerAddress) {
        const markets = await comptroller.getAllMarkets()

        return [network.compAddress, ...markets]
    } else {
        return [network.compAddress]
    }
})()

const addressSet = new Set()

for (let tokenAddress of tokenAddresses) {
    const token = new ethers.Contract(tokenAddress, ERC20ABI, provider)
    const symbol = await token.symbol()

    let currentFromBlock = network.fromBlock
    while (currentFromBlock < network.toBlock) {
        const toBlock = Math.min(currentFromBlock + 3000, network.toBlock)

        const events = await token.queryFilter(token.filters.Transfer(), currentFromBlock, toBlock)
        events.forEach(x => addressSet.add(x.args.to))

        console.log(`${network.name}:${symbol} ${currentFromBlock}-${toBlock}/${network.toBlock}: ${addressSet.size} addresses found`)

        currentFromBlock = toBlock + 1
    }
}

const balances = await distributeToEOA([...addressSet], network.compAddress, network.rpc)
console.log(balances)

await writeFile('./balances.json', JSON.stringify(balances, null, 2))

async function distributeToEOA(addresses, token, rpc) {
    const balances = {}

    const ZERO = BigNumber.from(0)

    function addBalance(address, balance) {
        if (balance.eq(ZERO)) {
            return
        }

        balances[address] = BigNumber.from(balances[address] || 0).add(balance).toString()
    }

    function transferBalance(from, to, balance) {
        if (balance.eq(ZERO)) {
            return
        }

        balances[from] = BigNumber.from(balances[from]).sub(balance).toString()
        balances[to] = BigNumber.from(balances[to] || 0).add(balance).toString()

        if (balances[from].lt(ZERO)) {
            throw new Error(`Counldn't transfer from ${from} to ${to}`)
        }
    }

    // Calculate token balance for each accounts
    for (let address of addresses) {
        const total = await (async () => {
            if (network.comptrollerAddress) {
                const result = await lens.getCompBalanceMetadataExt(network.compAddress, network.comptrollerAddress, address)

                return result.balance.add(result.allocated)
            } else {
                return comp.balanceOf(address)
            }
        })()

        addBalance(address, total)
    }

    // Get accounts which are contracts
    const contracts = []

    for (let address of addresses) {
        const isContract = await provider.getCode(address) !== '0x'

        if (isContract) {
            contracts.push(address)
        }
    }

    // Redirect token holding to original owner
    // Loop until all tokens were redirected
    let nbTransfers = contracts.length
    while (nbTransfers != 0) {
        nbTransfers = 0

        for (let contract of contracts) {
            delete balances[contract]

            // const owner = await (() => {
            //     try {
            //         return await test(contract, 'owner()', [])
            //     } catch {
            //         return false
            //     }
            // })()

            // if (owner) {
            //     const isDSProxy = 
            // }


        }

        // handle DSproxy
        // - has owner
        // is in proxies[owner] of 0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4 Maker proxy Regitry
        // handle InstaDapp
        // - accountID => accountLink
    }

    return balances
}
