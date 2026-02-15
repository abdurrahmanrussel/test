# Opening Range Breakout (ORB) Strategy

The Opening Range Breakout (ORB) Strategy is a day trading methodology that capitalizes on the volatility and momentum that occurs when price breaks beyond the New York market opening hour's range. The strategy identifies the high and low prices established during a defined morning window and enters trades when price decisively breaks through these support and resistance levels.

This is a production-grade, fully automated strategy built with professional coding standards, comprehensive error handling, and extensive customization options. Whether you are backtesting ORB concepts or executing live trades, this strategy provides the tools and flexibility to trade with confidence.

---

## Who Should Use This?

- **Trader Type:** Day Trader  
- **Market Type:** Futures, Forex, Crypto, etc.  
- **Account Type:** Prop Firm, Cash, Managed, etc.  
- **Platform:** NinjaTrader  

---

## How It Works

1. **Range Formation**  
   The strategy builds the opening range between your specified start and end times.

2. **Entry Signal**  
   Triggers on breakout above or below the range with optional Fair Value Gap (FVG) confirmation.

3. **Trade Setup**  
   Automatically places a stop loss and up to two profit targets.

4. **Management**  
   Monitors breakeven conditions, trailing opportunities, and pullback entries.

5. **Exit**  
   Executes on profit targets or stop loss with detailed reporting.

---

## Key Features

### Flexible Opening Range Definition

- Customizable range start and end times  
- Adaptable to different market sessions (US equities, futures, forex)

### Advanced Entry Control

- Market or limit order entry options  
- Optional Fair Value Gap (FVG) confirmation filter  
- Configurable entry time windows to avoid late-day trades  

### Professional Trade Management

**Multiple Profit Target Methods**

- Fixed Distance (ticks)  
- Risk-to-Reward Ratio  
- ORB Range Percentage  
- Dollar Amount (fixed profit targets)  

**Intelligent Stop Loss Methods**

- Fixed Ticks  
- Previous Candle High/Low  
- ORB Range Percentage  
- Dollar Amount Risk  

Additional management features:

- Breakeven protection with configurable trigger conditions  
- Trailing stop loss with dynamic updates  

### Risk Management Tools

- Fixed or percentage-based contract sizing  
- Daily profit and loss limits  
- Win/loss streak limits  
- Account percentage risk controls  
- Maximum stop loss constraints  

### Advanced Position Management

- **Pullback Averaging:** Add to profitable positions on pullbacks  
- **Runner Positions:** Allow partial positions to continue running  
- Position tracking with detailed metrics  
- Visual overlay of entries, exits, and levels on chart  

---

## Disclaimer

Trading involves risk. Past performance does not guarantee future results. Always test thoroughly before live trading. Trade at your own risk.
