# Balances

Show aggregated balances from multiple crypto exchanges with an ASCII table.

# Setup

```shell
npm i
```
Add your read-only exchange keys to an `env` file using this format:

```
EXCHANGENAME_API_KEY=
EXCHANGENAME_SECRET=
```

Add a list of exchanges with ID (as per [ccxt](https://github.com/ccxt/ccxt)) to env.js file:

```JavaScript
module.exports = {
	exchanges: [
		{
			id: 'ftx',
			params: {
				headers: { "FTX-SUBACCOUNT": "my-subaccount" },
			}
		},
		{
			id: 'binance',
		}
	]
}
```

# Run

```shell
node balances --help
```

# Troubleshooting

```
Couldn't find Coingecko data for XYZ
```

The script was unable to find coin XYZ in CoinGecko's API, due to a missmatch between the symbol that your exchange is using and the symbol that Coingecko is using (symbols in Coingecko are not unique and may vary greatly).

Find the correct 'id' in [Coingecko](https://www.coingecko.com/api/documentations/v3#/coins/get_coins_list) and add it to pairs.json:

```
{ 
	...
	XYZ: <coingecko id>
}
```

Enjoy!
