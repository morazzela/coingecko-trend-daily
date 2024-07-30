const { Axios } = require("axios")

const MINIMUM_MARKET_CAP = 1000000000
const CATEGORIES_TRIM = 20

const client = new Axios({
    baseURL: "https://api.coingecko.com/api/v3/",
    headers: {
        "Accept": "application/json"
    }
})

;(async () => {
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

    let message = "Top " + CATEGORIES_TRIM + " categories by market cap change in the last 24h:\n\n"

    categoriesByChange.forEach(category => {
        message += ` - ${category.market_cap_change_24h > 0 ? "🟢" : "🔴"} "${category.name}" : ${(category.market_cap_change_24h > 0 ? "+" : "") + formatNumber(category.market_cap_change_24h)}%\n`
    })

    message += "\n\nTop " + CATEGORIES_TRIM + " categories by market cap:\n\n"

    categoriesByMarketCap.forEach(category => {
        message += ` - ${category.market_cap_change_24h > 0 ? "🟢" : "🔴"} "${category.name}" : $${formatNumber(category.market_cap, 0)} (${(category.market_cap_change_24h > 0 ? "+" : "") + formatNumber(category.market_cap_change_24h)}%)\n`
    })

    console.log(message)
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

function throwError(err) {
    console.error(err)
    process.exit(1)
}
