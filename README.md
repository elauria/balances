# Balances

Show's aggregate balances from multiple exchanges on an ascii table

# Setup

> npm i

Add your read-only exchange keys to an .env file of format:

> EXCHANGENAME_API_KEY=...
> EXCHANGENAME_SECRET=

Add a list of exchanges with to env.js file:

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

# Run

> $ node balances --help

Enjoy!