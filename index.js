const axios = require("axios")
const dotenv = require("dotenv")

dotenv.config()

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
const MINIMUM_MARKET_CAP = 1000000000
const CATEGORIES_TRIM = 20

const client = new axios.Axios({
    baseURL: "https://api.coingecko.com/api/v3/",
    headers: {
        "Accept": "application/json"
    }
})

;(async () => {
    /* const res = await client.get("https://api.telegram.org/bot" + TELEGRAM_TOKEN + "/getUpdates")

    console.log(JSON.parse(res.data).result[0].channel_post)
    process.exit(0) */

    const connected = await checkConnection()
    
    if ( ! connected) {
        throwError("Impossible de se connecter à l'API")
    } 

    await work()
})()

async function work() {
    const res = await client.get("coins/categories?order=market_cap_change_24h_desc")

    if (res.status !== 200) {
        throwError("Impossible de récupérer la liste des catégories")
    }

    let categories = JSON.parse(res.data)

    if ( ! Array.isArray(categories)) {
        throwError("Les données récupérées ne sont pas un tableau")
    }
    
    categories = categories.filter(category => {
        return category.market_cap >= MINIMUM_MARKET_CAP
    })

    const { categoriesByChange, categoriesByMarketCap } = prepareCategories(categories)

    let message = "<u>Top " + CATEGORIES_TRIM + " categories by market cap change in the last 24h:</u>\n\n"

    categoriesByChange.forEach(category => {
        message += ` - ${category.market_cap_change_24h > 0 ? "🟢" : "🔴"} "${category.name}" : ${(category.market_cap_change_24h > 0 ? "+" : "") + formatNumber(category.market_cap_change_24h)}%\n`
    })

    message += "\n\n<u>Top " + CATEGORIES_TRIM + " categories by market cap:</u>\n\n"

    categoriesByMarketCap.forEach(category => {
        message += `${category.market_cap_change_24h > 0 ? "🟢" : "🔴"} "${category.name}" : $${formatNumber(category.market_cap, 0)} (${(category.market_cap_change_24h > 0 ? "+" : "") + formatNumber(category.market_cap_change_24h)}%)\n`
    })

    await sendMessage(message)

    await sleep(60 * 60 * 24 * 1000)
}

function prepareCategories(categories) {
    return {
        categoriesByChange: prepareCategoriesByChange(categories),
        categoriesByMarketCap: prepareCategoriesByMarketCap(categories),
    }
}

function prepareCategoriesByChange(categories) {
    categories = categories.sort((a, b) => {
        return Math.abs(a.market_cap_change_24h) > Math.abs(b.market_cap_change_24h) ? -1 : 1
    })

    categories = categories.slice(0, CATEGORIES_TRIM)

    return categories
}

function prepareCategoriesByMarketCap(categories) {
    categories = categories.sort((a, b) => {
        return a.market_cap > b.market_cap ? -1 : 1
    })

    categories = categories.slice(0, CATEGORIES_TRIM)

    return categories
}

function formatNumber(val, digits) {
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
    }).format(val)
}

async function checkConnection() {
    const res = await client.get("ping")
    return res.status === 200
}

async function sendMessage(message) {
    console.log("sending message")
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: TELEGRAM_CHAT_ID,
        parse_mode: "html",
        text: message,
        disable_web_page_preview: true,
    }).catch((err) => {
        throw err
    })
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function throwError(err) {
    console.error(err)
    process.exit(1)
}
