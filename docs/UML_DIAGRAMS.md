# 🎨 UML Diagrams - Ethereum MEV Arbitrage Bot

## Table of Contents
- [System Architecture](#system-architecture)
- [Class Diagram](#class-diagram)
- [Sequence Diagrams](#sequence-diagrams)
- [Component Diagram](#component-diagram)
- [State Diagram](#state-diagram)
- [Deployment Diagram](#deployment-diagram)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MEV ARBITRAGE BOT SYSTEM                      │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│                  │         │                  │         │                  │
│  Ethereum Node   │◄────────┤  Arbitrage Bot   │────────►│ Telegram API     │
│  (RPC/WSS)       │         │  (Node.js)       │         │                  │
│                  │         │                  │         │                  │
└──────────────────┘         └──────────────────┘         └──────────────────┘
        ▲                             │                            │
        │                             │                            │
        │                             ▼                            ▼
        │                    ┌──────────────────┐         ┌──────────────────┐
        │                    │                  │         │                  │
        │                    │  Smart Contract  │         │  User/Developer  │
        │                    │  (Solidity)      │         │                  │
        │                    │                  │         │                  │
        │                    └──────────────────┘         └──────────────────┘
        │                             │
        └─────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                              DEX Layer                               │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Uniswap V2  │  │  SushiSwap   │  │  Uniswap V3  │   ...more    │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                           Flashloan Provider                         │
├─────────────────────────────────────────────────────────────────────┤
│                            Aave V3                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Class Diagram

### Core Classes

```mermaid
classDiagram
    class ArbitrageBot {
        -wallet: Wallet
        -provider: Provider
        -config: Config
        -priceFetcher: PriceFetcher
        -gasEstimator: GasEstimator
        -profitCalculator: ProfitCalculator
        -telegramNotifier: TelegramNotifier
        -arbitrageContract: Contract
        -isRunning: boolean
        -stats: Statistics
        +start(): Promise~void~
        +stop(): Promise~void~
        +scanForOpportunities(): Promise~void~
        +findArbitrageOpportunity(token, prices): Opportunity
        +executeArbitrage(opportunity): Promise~void~
        +getStatsMessage(): string
        -startMonitoring(): void
        -startMempoolMonitoring(): void
        -schedulePeriodicTasks(): void
    }

    class PriceFetcher {
        -provider: Provider
        -config: Config
        -priceCache: Map
        -cacheTimeout: number
        +fetchPrices(tokenAddress): Promise~Prices~
        +getUniswapV2Price(token, weth): Promise~number~
        +getSushiSwapPrice(token, weth): Promise~number~
        +getUniswapV3Price(token, weth): Promise~number~
        +getTokenDecimals(token): Promise~number~
        +clearCache(): void
    }

    class GasEstimator {
        -provider: Provider
        -gasCache: BigNumber
        -lastUpdate: number
        +estimateGasPrice(): Promise~BigNumber~
        +estimateEIP1559GasPrice(): Promise~Object~
        +getExternalGasPrice(): Promise~Object~
        +estimateGasLimit(tx): Promise~BigNumber~
        +calculateTransactionCost(limit, price): BigNumber
        +isGasPriceAcceptable(price, max): boolean
        +getOptimalGasPrice(urgency): Promise~BigNumber~
    }

    class ProfitCalculator {
        -config: Config
        -flashloanFee: number
        -dexFee: number
        +calculateProfit(opp, amount, gas): ProfitInfo
        +isProfitable(opp, gas): Promise~boolean~
        +calculateOptimalTradeSize(opp, liquidity): BigNumber
        +estimateSlippage(amount, liquidity): BigNumber
        +calculatePriceImpact(amount, r0, r1): ImpactInfo
        +calculateBreakEvenGasPrice(opp, amount): BigNumber
        +getProfitabilityScore(opp, gas): number
    }

    class TelegramNotifier {
        -config: Config
        -bot: Telegraf
        -chatId: string
        -enabled: boolean
        +sendMessage(message): Promise~void~
        +sendOpportunityAlert(opp): Promise~void~
        +sendSuccessNotification(trade): Promise~void~
        +sendErrorNotification(error, context): Promise~void~
        +sendDailySummary(stats): Promise~void~
        +stop(): void
        -initializeBot(): void
    }

    class FlashloanArbitrage {
        <<Smart Contract>>
        -owner: address
        -minProfitBasisPoints: uint256
        +executeArbitrage(asset, amount, params): void
        +executeOperation(asset, amount, premium, initiator, params): bool
        +withdrawProfits(token, amount): void
        +setMinProfitBasisPoints(minProfit): void
        +emergencyWithdraw(token): void
        +getBalance(token): uint256
        -executeArbitrageTrades(...): uint256
        -swapV2(...): uint256
        -swapV3(...): uint256
    }

    ArbitrageBot --> PriceFetcher
    ArbitrageBot --> GasEstimator
    ArbitrageBot --> ProfitCalculator
    ArbitrageBot --> TelegramNotifier
    ArbitrageBot --> FlashloanArbitrage
```

### Data Models

```mermaid
classDiagram
    class Opportunity {
        +token: string
        +buyDex: string
        +sellDex: string
        +buyPrice: number
        +sellPrice: number
        +profitPercentage: number
        +timestamp: number
    }

    class ProfitInfo {
        +grossProfit: BigNumber
        +flashloanFee: BigNumber
        +gasCost: BigNumber
        +netProfit: BigNumber
        +profitPercentage: BigNumber
    }

    class Statistics {
        +totalOpportunities: number
        +executedTrades: number
        +successfulTrades: number
        +failedTrades: number
        +totalProfit: BigNumber
        +totalGasSpent: BigNumber
    }

    class Config {
        +network: NetworkConfig
        +wallet: WalletConfig
        +contracts: ContractConfig
        +dexes: DexConfig
        +tokens: TokenConfig
        +bot: BotConfig
        +telegram: TelegramConfig
        +logging: LoggingConfig
    }

    class Trade {
        +token: string
        +buyDex: string
        +sellDex: string
        +txHash: string
        +profit: string
        +gasSpent: string
        +success: boolean
        +timestamp: number
    }
```

---

## Sequence Diagrams

### 1. Bot Startup Sequence

```mermaid
sequenceDiagram
    participant User
    participant Main
    participant Bot as ArbitrageBot
    participant Telegram
    participant Contract
    participant Ethereum

    User->>Main: npm start
    Main->>Main: Load config from .env
    Main->>Ethereum: Create WebSocket connection
    Main->>Main: Create wallet instance
    Main->>Bot: new ArbitrageBot(wallet, provider, config)
    Bot->>Bot: Initialize services
    Main->>Bot: start()
    Bot->>Contract: Verify contract deployment
    Contract-->>Bot: Contract OK
    Bot->>Bot: startMonitoring()
    Bot->>Bot: schedulePeriodicTasks()
    Bot->>Telegram: sendMessage("Bot started")
    Telegram-->>User: 🚀 Bot Started notification
    Bot-->>Main: Bot running
    Main->>User: ✅ Bot is running...
```

### 2. Arbitrage Detection and Execution

```mermaid
sequenceDiagram
    participant Bot as ArbitrageBot
    participant PF as PriceFetcher
    participant PC as ProfitCalculator
    participant GE as GasEstimator
    participant Contract
    participant Aave
    participant UniV2 as Uniswap V2
    participant Sushi as SushiSwap
    participant Telegram

    loop Every CHECK_INTERVAL ms
        Bot->>PF: fetchPrices(token)
        PF->>UniV2: getReserves()
        UniV2-->>PF: reserves
        PF->>Sushi: getReserves()
        Sushi-->>PF: reserves
        PF-->>Bot: {uniswapV2: 2000, sushiswap: 2005}
        
        Bot->>Bot: findArbitrageOpportunity()
        
        alt Opportunity Found
            Bot->>GE: estimateGasPrice()
            GE-->>Bot: gasPrice
            
            Bot->>PC: isProfitable(opportunity, gasPrice)
            PC->>PC: calculateProfit()
            PC-->>Bot: true/false
            
            alt Is Profitable
                Bot->>Telegram: sendOpportunityAlert()
                Bot->>Contract: executeArbitrage(token, amount, params)
                Contract->>Aave: flashLoanSimple()
                Aave->>Contract: onFlashLoanReceived()
                Contract->>UniV2: swapExactTokensForTokens()
                UniV2-->>Contract: tokens received
                Contract->>Sushi: swapExactTokensForTokens()
                Sushi-->>Contract: tokens received
                Contract->>Aave: repay loan + premium
                Contract->>Contract: Check profit > minProfit
                Contract-->>Bot: Transaction receipt
                
                alt Transaction Success
                    Bot->>Bot: Update statistics
                    Bot->>Telegram: sendSuccessNotification()
                    Telegram-->>Bot: Message sent
                else Transaction Failed
                    Bot->>Bot: Update failure stats
                    Bot->>Telegram: sendErrorNotification()
                end
            end
        end
    end
```

### 3. Flashloan Arbitrage Execution Flow

```mermaid
sequenceDiagram
    participant Bot
    participant Contract as FlashloanArbitrage
    participant Aave as Aave Pool
    participant DEX1 as DEX A (Cheaper)
    participant DEX2 as DEX B (Expensive)

    Bot->>Contract: executeArbitrage(WETH, 10 ETH, params)
    
    Contract->>Aave: flashLoanSimple(WETH, 10 ETH)
    Note over Aave: Aave validates and transfers
    
    Aave->>Contract: transfer(10 ETH)
    Aave->>Contract: executeOperation()
    
    Note over Contract: Decode parameters
    
    Contract->>DEX1: approve(10 ETH)
    Contract->>DEX1: swapExactTokensForTokens(10 ETH → USDC)
    DEX1-->>Contract: 20,000 USDC received
    
    Contract->>DEX2: approve(20,000 USDC)
    Contract->>DEX2: swapExactTokensForTokens(20,000 USDC → ETH)
    DEX2-->>Contract: 10.1 ETH received
    
    Note over Contract: Calculate profit: 10.1 - 10.009 (loan+fee) = 0.091 ETH
    
    Contract->>Contract: require(profit > minProfit)
    
    Contract->>Aave: approve(10.009 ETH)
    Contract->>Contract: Return true
    
    Aave->>Contract: Pull 10.009 ETH
    
    Note over Contract: Profit: 0.091 ETH remains in contract
    
    Contract-->>Bot: emit ArbitrageExecuted(0.091 ETH)
    
    Bot->>Bot: Update statistics
```

### 4. Price Monitoring Flow

```mermaid
sequenceDiagram
    participant Bot
    participant PF as PriceFetcher
    participant UV2 as Uniswap V2 Factory
    participant Pair as Token Pair
    participant Cache

    Bot->>PF: fetchPrices(tokenAddress)
    
    PF->>Cache: Check cache for token
    
    alt Cache Hit (< 5 seconds old)
        Cache-->>PF: Return cached prices
        PF-->>Bot: prices
    else Cache Miss
        PF->>UV2: getPair(token, WETH)
        UV2-->>PF: pairAddress
        
        PF->>Pair: getReserves()
        Pair-->>PF: reserve0, reserve1
        
        PF->>Pair: token0()
        Pair-->>PF: token0Address
        
        PF->>PF: Calculate price from reserves
        
        Note over PF: Repeat for each DEX
        
        PF->>Cache: Store prices with timestamp
        PF-->>Bot: {uniswapV2: price1, sushiswap: price2, ...}
    end
```

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ARBITRAGE BOT SYSTEM                            │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   Entry Point        │
│   (src/index.js)     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Core Layer                                    │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │              ArbitrageBot (src/bot/)                           │  │
│  │  • Orchestrates all operations                                 │  │
│  │  • Makes trading decisions                                     │  │
│  │  • Manages bot lifecycle                                       │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
           │
           ├──────────────┬──────────────┬──────────────┬──────────────┐
           ▼              ▼              ▼              ▼              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Services Layer                                 │
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │ PriceFetcher │ │ GasEstimator │ │    Profit    │ │  Telegram   │ │
│  │              │ │              │ │  Calculator  │ │  Notifier   │ │
│  │ • Fetch DEX  │ │ • Estimate   │ │ • Calculate  │ │ • Send      │ │
│  │   prices     │ │   gas prices │ │   profits    │ │   alerts    │ │
│  │ • Cache data │ │ • EIP-1559   │ │ • Validate   │ │ • Daily     │ │
│  │ • Multi-DEX  │ │   support    │ │   trades     │ │   reports   │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └─────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
           │
           ├──────────────┬──────────────┐
           ▼              ▼              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Utilities Layer                                │
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │
│  │    Logger    │ │    Config    │ │   ABIs       │                 │
│  │  (Winston)   │ │  (dotenv)    │ │  (JSON)      │                 │
│  └──────────────┘ └──────────────┘ └──────────────┘                 │
└──────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     Blockchain Layer                                  │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │              Smart Contract (Solidity)                         │  │
│  │         contracts/FlashloanArbitrage.sol                       │  │
│  │  • Execute flashloan arbitrage                                 │  │
│  │  • Interact with DEXes                                         │  │
│  │  • Manage profits                                              │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     External Services                                 │
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Ethereum │  │   DEXes  │  │   Aave   │  │ Telegram │             │
│  │   Node   │  │  (V2/V3) │  │   Pool   │  │   API    │             │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## State Diagram

### Bot State Machine

```mermaid
stateDiagram-v2
    [*] --> Initializing: npm start
    
    Initializing --> Ready: Config loaded, Services initialized
    Initializing --> Error: Initialization failed
    
    Ready --> Monitoring: start()
    
    Monitoring --> ScanningPrices: Check interval triggered
    
    ScanningPrices --> Monitoring: No opportunity found
    ScanningPrices --> ValidatingOpportunity: Opportunity detected
    
    ValidatingOpportunity --> Monitoring: Not profitable
    ValidatingOpportunity --> ExecutingTrade: Profitable opportunity
    
    ExecutingTrade --> TradeSuccess: Transaction confirmed
    ExecutingTrade --> TradeFailed: Transaction reverted
    
    TradeSuccess --> Monitoring: Continue monitoring
    TradeFailed --> Monitoring: Continue monitoring
    
    Monitoring --> Stopped: stop()
    Error --> Stopped: stop()
    
    Stopped --> [*]
    
    note right of Monitoring
        • Watching mempool
        • Scanning prices
        • Waiting for opportunities
    end note
    
    note right of ExecutingTrade
        • Request flashloan
        • Execute swaps
        • Repay loan
        • Atomic transaction
    end note
```

### Trade Execution States

```mermaid
stateDiagram-v2
    [*] --> OpportunityDetected
    
    OpportunityDetected --> CheckingGasPrice
    
    CheckingGasPrice --> GasTooHigh: Gas > MAX_GAS_PRICE
    CheckingGasPrice --> CalculatingProfit: Gas acceptable
    
    GasTooHigh --> [*]: Skip trade
    
    CalculatingProfit --> NotProfitable: Profit < MIN_THRESHOLD
    CalculatingProfit --> ReadyToExecute: Profit sufficient
    
    NotProfitable --> [*]: Skip trade
    
    ReadyToExecute --> SubmittingTransaction
    
    SubmittingTransaction --> Pending: Transaction sent
    SubmittingTransaction --> Failed: Submission error
    
    Pending --> Confirming: Included in block
    Pending --> Dropped: Transaction dropped
    
    Confirming --> Success: Status = 1
    Confirming --> Reverted: Status = 0
    
    Success --> [*]: Update stats
    Reverted --> [*]: Update stats
    Failed --> [*]: Update stats
    Dropped --> [*]: Update stats
```

---

## Deployment Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Production Environment                       │
└─────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                          User Machine                               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     Developer                                 │  │
│  │  • Configuration                                              │  │
│  │  • Monitoring                                                 │  │
│  │  • Telegram App                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
                                │
                                │ SSH / HTTPS
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                    VPS / Cloud Server (AWS/DigitalOcean)            │
│  OS: Ubuntu 20.04 LTS                                               │
│  Location: us-east-1 (Low latency to Ethereum nodes)               │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                       Node.js Runtime                         │  │
│  │  Version: 16.x LTS                                            │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │            PM2 Process Manager                          │  │  │
│  │  │  ┌──────────────────────────────────────────────────┐  │  │  │
│  │  │  │         MEV Arbitrage Bot                        │  │  │  │
│  │  │  │  • src/index.js (Entry point)                    │  │  │  │
│  │  │  │  • src/bot/ (Core logic)                         │  │  │  │
│  │  │  │  • src/services/ (Services)                      │  │  │  │
│  │  │  │  • src/utils/ (Utilities)                        │  │  │  │
│  │  │  └──────────────────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    File System                                │  │
│  │  • /app/ (Application code)                                   │  │
│  │  • /logs/ (Log files)                                         │  │
│  │  • /.env (Environment variables - secured)                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS/WSS
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                    RPC Provider (Infura/Alchemy)                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              WebSocket Connection (Real-time)                 │  │
│  │  • Block updates                                              │  │
│  │  • Mempool transactions                                       │  │
│  │  • Event subscriptions                                        │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                        Ethereum Mainnet                             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  Smart Contracts                              │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │  │
│  │  │ Flashloan      │  │ Uniswap V2     │  │ SushiSwap      │  │  │
│  │  │ Arbitrage      │  │ Router         │  │ Router         │  │  │
│  │  │ (Deployed)     │  │                │  │                │  │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  │  │
│  │  ┌────────────────┐  ┌────────────────┐                      │  │
│  │  │ Uniswap V3     │  │ Aave Pool      │                      │  │
│  │  │ Router         │  │                │                      │  │
│  │  └────────────────┘  └────────────────┘                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘

                                │
                                │ HTTPS
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                        Telegram API                                 │
│  • Bot API                                                          │
│  • Message delivery                                                 │
│  • Notifications                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA FLOW DIAGRAM                           │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │  Ethereum    │
                    │  Blockchain  │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
       ┌──────────┐  ┌──────────┐  ┌──────────┐
       │ Uniswap  │  │ SushiSwap│  │   Aave   │
       │   V2/V3  │  │          │  │   Pool   │
       └────┬─────┘  └────┬─────┘  └────┬─────┘
            │             │             │
            │ Price Data  │ Price Data  │ Flashloan
            │             │             │
            └─────────────┼─────────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │  PriceFetcher   │
                 │  • Fetch prices │
                 │  • Cache        │
                 └────────┬────────┘
                          │
                          │ Prices Object
                          │
                          ▼
                 ┌─────────────────┐
                 │ ArbitrageBot    │
                 │ • Find opp      │
                 └────────┬────────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             ▼             ▼
     ┌────────────┐ ┌────────────┐ ┌──────────────┐
     │    Gas     │ │   Profit   │ │  Telegram    │
     │ Estimator  │ │ Calculator │ │  Notifier    │
     └──────┬─────┘ └──────┬─────┘ └──────┬───────┘
            │              │              │
            │ Gas Price    │ Profit Info  │ Notifications
            │              │              │
            └──────────────┼──────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Decision Logic  │
                  │ Execute?        │
                  └────────┬────────┘
                           │
                           │ Execute Command
                           │
                           ▼
                  ┌─────────────────┐
                  │ Smart Contract  │
                  │ (On-chain)      │
                  └────────┬────────┘
                           │
                           │ Transaction
                           │
                           ▼
                  ┌─────────────────┐
                  │   Ethereum      │
                  │   Network       │
                  └────────┬────────┘
                           │
                           │ Receipt
                           │
                           ▼
                  ┌─────────────────┐
                  │  Logs & Stats   │
                  │  Database       │
                  └─────────────────┘
```

---

## Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     TECHNOLOGY STACK                         │
└─────────────────────────────────────────────────────────────┘

Backend (Node.js)
├── Runtime: Node.js v16+
├── Language: JavaScript (ES6+)
├── Framework: None (Pure Node.js)
└── Package Manager: npm / yarn

Libraries & Dependencies
├── Blockchain
│   ├── ethers.js v5.7.2 (Ethereum interaction)
│   ├── web3.js v1.10.0 (Alternative Ethereum library)
│   └── hardhat v2.14.0 (Development environment)
├── DeFi Protocols
│   ├── @uniswap/v2-periphery
│   ├── @uniswap/v3-periphery
│   └── @aave/core-v3
├── Utilities
│   ├── dotenv (Environment variables)
│   ├── axios (HTTP requests)
│   ├── bignumber.js (Precise calculations)
│   └── winston (Logging)
├── Notifications
│   └── telegraf (Telegram bot)
└── Scheduling
    └── node-cron (Scheduled tasks)

Smart Contracts
├── Language: Solidity v0.8.19
├── Framework: Hardhat
├── Testing: Waffle + Chai
└── Libraries: OpenZeppelin, Aave V3

Infrastructure
├── Server: VPS (AWS, DigitalOcean, etc.)
├── OS: Ubuntu 20.04 LTS
├── Process Manager: PM2
└── Reverse Proxy: Nginx (optional)

External Services
├── RPC Provider: Infura / Alchemy
├── Blockchain: Ethereum Mainnet
├── Messaging: Telegram API
└── Block Explorer: Etherscan API

Development Tools
├── Version Control: Git
├── Code Editor: VSCode / Cursor
├── Linter: ESLint
└── Testing: Jest + Hardhat
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   SECURITY LAYERS                            │
└─────────────────────────────────────────────────────────────┘

Layer 1: Infrastructure Security
├── Firewall: UFW configured
├── SSH: Key-based authentication only
├── Updates: Automatic security updates
└── Monitoring: System monitoring tools

Layer 2: Application Security
├── Environment Variables: Secure .env file
├── Private Keys: Encrypted storage
├── API Keys: Rotated regularly
└── Rate Limiting: Prevent abuse

Layer 3: Smart Contract Security
├── Access Control: onlyOwner modifiers
├── Reentrancy Protection: Checks-Effects-Interactions
├── Emergency Functions: Pause & withdraw
└── Audit: Third-party security audit recommended

Layer 4: Operational Security
├── Profit Limits: Min/max thresholds
├── Gas Limits: Maximum gas price
├── Position Sizing: Trade size limits
└── Circuit Breakers: Automatic shutdown triggers

Layer 5: Monitoring & Alerts
├── Real-time Logs: Winston logging
├── Error Tracking: Error notifications
├── Performance Metrics: Stats tracking
└── Telegram Alerts: Instant notifications
```

---

## Scalability Considerations

```
Current Architecture
├── Single bot instance
├── Sequential trade execution
├── Limited to configured tokens
└── Manual intervention required

Future Enhancements
├── Multi-instance deployment
│   └── Parallel opportunity scanning
├── Distributed processing
│   └── Redis for state management
├── Machine Learning integration
│   └── Predictive opportunity detection
├── Cross-chain support
│   └── Multi-blockchain arbitrage
└── Advanced strategies
    ├── Sandwich attacks
    ├── Liquidation arbitrage
    └── NFT arbitrage
```

---

**Note**: These UML diagrams can be rendered using tools like:
- [Mermaid Live Editor](https://mermaid.live/)
- [PlantUML](https://plantuml.com/)
- [Draw.io](https://draw.io/)
- [Lucidchart](https://www.lucidchart.com/)

For best results, copy the Mermaid code blocks into the Mermaid Live Editor.

