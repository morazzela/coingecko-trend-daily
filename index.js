const axios = require("axios")
const dotenv = require("dotenv")

dotenv.config()

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY
const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

;(async () => {
    await work()
})()

async function work() {
    const res = await axios.get("https://api.coingecko.com/api/v3/coins/categories", {
        params: {
            order: "market_cap_change_24h_desc",
        },
        headers: {
            "x-cg-demo-api-key": COINGECKO_API_KEY,
        }
    })

    if (res.status !== 200) {
        console.error("Status code is " + res.status)
        return
    }

    const nbThemes = 10

    let msg = "Top " + nbThemes + " themes today:\n\n"
    
    for (let i = 0; i < nbThemes; i++) {
        const theme = res.data[i]
        const change = theme['market_cap_change_24h']
        msg += `${i+1}. <a href="https://www.coingecko.com/categories/${theme['id']}">${theme['name']}</a> <i>(${change > 0 ? "+" : ""}${formatNumber(change)}%)</i>\n`
    }

    await axios.post(`https://api.telegram.org/bot${TELEGRAM_API_KEY}/sendMessage`, {
        chat_id: TELEGRAM_CHAT_ID,
        text: msg,
        parse_mode: "html"
    })
}

function formatNumber(nb) {
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
    }).format(nb)
}
