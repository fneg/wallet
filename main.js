const puppeteer = require('puppeteer')
const config = require('./config')
async function main() {
    let port = config.port
    let CRX_PATH = `C:\\Users\\Administrator\\Desktop\\aptos-wallet-server\\aptos-wallet-server\\chromedata\\${port}\\ejjladinnckdgjemekebdpeokbikhfci\\0.1.10_0`;
    let userdata = `C:\\Users\\Administrator\\Desktop\\aptos-wallet-server\\aptos-wallet-server\\chromedata\\${port}`
    let browser = await puppeteer.launch({
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        headless: false,
        ignoreHTTPSErrors: true,
        args: [`--disable-extensions-except=${CRX_PATH}`,
            `--load-extension=${CRX_PATH}`,
            `--remote-debugging-port=${port}`,
            '--system-developer-mode=true',
            '--remote-debugging-ip=0.0.0.0',
            `--user-data-dir=${userdata}`
        ]
    })
    ws =await browser.wsEndpoint()
    console.log(ws)
    let page = (await browser.pages())[0]

    await page.goto("https://aptoslabs.com/nft_offers/aptos-zero")
        setInterval(async ()=>{
        await page.reload()
    },180*1000)



}

main()