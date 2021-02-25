# Balances

Show aggregated balances from multiple crypto exchanges with an ASCII table.

# Setup

```shell
npm i
```
Add your read-only exchange keys to an `.env` file using this format:

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

Enjoy!
