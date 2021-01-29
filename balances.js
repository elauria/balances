const { exchanges } = require('./env');
const { getExchange } = require("./ccxt");
const { table } = require("table");
const CoinGecko = require("coingeckojs");
const chalk = require("chalk");
const pairs = require("./pairs.json")

const args = process.argv.slice(2);

const settings = {
  hideBalances: args.indexOf("--hideBalances") !== -1,
  hideSmall: args.indexOf("--hideSmall") !== -1,
  help: args.indexOf("--help") !== -1
}

const ignoreSymbols = ['usd', 'usdt'];

const validateColumn = (c) => {
  if (settings.hideBalances && c.private)
    return false
  return true;
}

const validateSymbol = (c) => {
  if (ignoreSymbols.indexOf(c.symbol) !== -1) return false;
  return true;
}

const format = (amount, precision = 0.01, color = false) => {
  if (isNaN(amount)) return amount;
  precision = precision <= 1 ? precision : 1 / Math.pow(10, precision);
  amount = Math.round((amount * 1) / precision) / (1 / precision);
  if (!color || amount === 0) return amount;
  if (amount > 0) return chalk.green(amount);
  return chalk.red(amount);
};

const getHeader = (columns) =>
  columns.map(c => c.label);

const getFooter = async (columns, rows, balances) => {
  const total = [];
  const CoinGeckoClient = new CoinGecko();
  const btcPrice = await CoinGeckoClient.simple.price({
    ids: 'bitcoin',
    vs_currencies: 'usd'
  })
  const usd = ['usd', 0, ...columns.slice(2).fill('', 0, columns.length-2)];
  for (const b of balances.filter((s) => !validateSymbol(s))) {
    usd[1] = format(usd[1]+b.balance);
    usd[2] = usd[1];
    usd[3] = format(usd[1]/btcPrice.data.bitcoin.usd, 0.00000001);
  }
  for (const i in columns) {
    if (columns[i].total) {
      total.push(columns[i].format(rows.reduce((a, r) => a+r[i],0)))
    } else {
      total.push('');
    }
  }
  total[0] = `Total (${rows.length})`;
  total[2] = format(total[2]+usd[1]);
  total[3] = format(total[2]/btcPrice.data.bitcoin.usd, 0.000001)
  total[6] = '% Risked:';
  total[7] = format(100/total[2]*(total[2]-usd[1]));
  const weightIndex = columns.findIndex(c => c.id === 'weight');
  const btcValueIndex = columns.findIndex(c => c.id === 'btcValue');
  for (const row of [...rows, usd]) {
    row[weightIndex] = format(100/total[btcValueIndex] * row[btcValueIndex], 0.01) + '%'
  }
  return [usd, total];
}

const columns = [
  {
    id: 'symbol',
    label: 'Symbol',
    private: false,
    data: (b) => b.coingecko ? b.coingecko.symbol : b.symbol,
    format: (c) => c
  },
  {
    id: 'balance',
    label: 'Balance',
    private: true,
    data: (b) => b.balance,
    format: (c) => format(c, 0.00000001)
  },
  {
    id: 'usdValue',
    label: '$',
    private: true,
    total: true,
    data: (b) => b.coingecko ? b.balance * b.coingecko.usd.current_price : '',
    format,
  },
  {
    id: 'btcValue',
    label: '₿',
    private: true,
    total: true,
    data: (b) => b.coingecko ? b.balance * b.coingecko.btc.current_price : '',
    format: (c) => format(c, 0.00000001)
  },
  {
    id: 'chg1h',
    label: 'Δ 1h',
    private: false,
    data: (b) => b.coingecko ? b.coingecko.btc.price_change_percentage_1h_in_currency : '',
    format: (c) => format(c, 0.01, true)
  },
  {
    id: 'chg1d',
    label: 'Δ 1d',
    private: false,
    data: (b) => b.coingecko ? b.coingecko.btc.price_change_percentage_24h_in_currency : '',
    format: (c) => format(c, 0.01, true)
  },
  {
    id: 'chg7d',
    label: 'Δ 7d',
    private: false,
    data: (b) => b.coingecko ? b.coingecko.btc.price_change_percentage_7d_in_currency : '',
    format: (c) => format(c, 0.01, true)
  },
  {
    id: 'weight',
    label: 'W',
    private: true,
    data: (b) => (''),
    format: (c) => format(c, 0.01)
  }
].filter(validateColumn)

const coinFilter = (c, b) => {
  if (pairs[b.symbol])
    return c.id === pairs[b.symbol]
  return c.symbol === b.symbol
}

const getBalances = async () => {
  let balances = {};
  for (const e of exchanges) {
    const exchange = getExchange(e.id, e.params);
    let { info, ...result } = await exchange.fetchBalance();
    const b = Object
      .keys(result)
      .filter(symbol => !!result[symbol].total)
      .map(symbol => {
        symbol = symbol.toLowerCase()
        if (!balances[symbol])
          balances[symbol] = {symbol, balance: 0};
        balances[symbol].balance += result[symbol.toUpperCase()].total
      });
  }
  return Object.keys(balances).map(b => balances[b]);
}

const addCoingeckoData = async (balances) => {
  try {
    const CoinGeckoClient = new CoinGecko();
    const {data} = await CoinGeckoClient.coins.list();
    for (const balance of balances) {
      balance.coingecko = data.filter((c) => coinFilter(c, balance))[0]
      if (!balance.coingecko)
        throw `Couldn't find Coingeck data for ${balance.symbol}`
    }
    const usdPrices = await CoinGeckoClient.coins.markets({
      ids: balances.map(c => c.coingecko.id),
      vs_currency: "usd",
      price_change_percentage: "1h,24h,7d",
    });
    const btcPrices = await CoinGeckoClient.coins.markets({
      ids: balances.map(c => c.coingecko.id),
      vs_currency: "btc",
      price_change_percentage: "1h,24h,7d",
    });
    for (const balance of balances) {
      balance.coingecko.usd = usdPrices
        .data
        .filter(c => c.id === balance.coingecko.id)
        .pop()
      balance.coingecko.btc = btcPrices
        .data
        .filter(c => c.id === balance.coingecko.id)
        .pop()
    }
  } catch (err) {
    console.error(err);
  }
} 

const getRows = async (balances) => {
  try {
    const rows = [];
    for (const balance of balances) {
      rows.push(getRow(balance)); 
    }
    return rows;
  } catch (err) {
    console.error(err);
  }
}

const getRow = (b) => {
  return columns.map(c => c.format(c.data(b)));
}

const printHelp = () => {
  console.log(`balances [options]
    Options:
    ---hideSmall      Avoids assets with small balances from printing
    ---hideBalances   Avoids all balances from printing; usefull for privacy
  `);
}

const main = async () => {
  try {
    if (settings.help)
      return printHelp();
    let header = getHeader(columns);
    let balances = await getBalances();
    await addCoingeckoData(balances.filter(validateSymbol));
    let rows = await getRows(
      balances
        .filter(validateSymbol)
    )
    rows = rows.sort((a,b) => a[0]<b[0]?-1:1)
    if (settings.hideSmall)
      rows = rows
        .filter(r => r[2] > 5);
    let data = [
      header,
      ...rows,
    ];
    if (!settings.hideBalances) {
      let footer = await getFooter(columns, rows, balances);
      data = [...data, ...footer];
    }
    console.log(table(data));
  } catch (err) {
    console.error(err);
  }
};

main();