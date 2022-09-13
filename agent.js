const puppeteer = require('puppeteer')
const request = require('request')
const config = require('./config')

const extensionFaucet = require('./target')
const CDP = require('chrome-remote-interface');



async function requestPromise(port){
    return new Promise((resolve, reject)=>{
        request(`http://127.0.0.1:${port}/json/version`,(err,res,body)=>{
            if(err){
                reject(err)
            }
            else {
                resolve(body)
            }
        })
    })
}

async function CDPPromise(options) {
    return new Promise((resolve, reject) => {
        CDP(options, (client) => {
            console.log('Connected!');
            resolve(client)
        }).on('error', (err) => {
            reject(err);
        });
    })
}


function sleep(ms,message="") {
    let currentTime = new Date(new Date().setHours(new Date().getHours() + 8)).toISOString().replace("Z", " ").replace("T", " ");
    console.log("Begin Sleep:" + currentTime+" "+message)
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
    let port = config.port
    console.log(port)
    let data = await requestPromise(port)
    data= JSON.parse(data)
    let ws = data["webSocketDebuggerUrl"]
    console.log(ws)

    let browser = await puppeteer.connect({
        browserWSEndpoint: ws
    })
    let pages = await browser.pages()
    let page = pages[0]
    console.log(pages.length)
    await page.goto("https://aptoslabs.com/nft_offers/aptos-zero")

    //检查扩展页面是否打开
    async function checkExtensionIndex() {
        let targets = await browser.targets()
        let ws = "";
        for (let target of targets) {
            //分3类页面1.type：other url带extension 为钱包页面
            //2 type :page url 带aptos  为主页面
            //3
            let targetId = target._targetId
            let wsUrl = `ws://127.0.0.1:${port}/devtools/page/${targetId}`
            let extension = target.url()
            let type = await target.type()
            if (type == "other" && extension == "chrome-extension://ejjladinnckdgjemekebdpeokbikhfci/index.html") {
                console.log(wsUrl)
                console.log(extension)
                ws = wsUrl
                break;
            }
        }
        if (!ws) {
            await sleep(1000,"checkExtensionIndex")
            await checkExtensionIndex()
        } else {
            return ws
        }
    }

    async function approveProote(ws) {
        const options = {
            // target: 'ws://127.0.0.1:21222/devtools/page/728BBB1710DC34E0C0185F740C934140'
            target: ws
        };
        //#prompt > div > div.css-1i48ryo > button.chakra-button.css-1zb9ui
        let expression = 'document.querySelector("#prompt > div > div.css-1i48ryo > button.chakra-button.css-1zb9ui").click()'
        let client = await CDPPromise(options);
        const {Network, Page, Runtime} = client;
        await Network.enable();
        await Page.enable();
        await Runtime.evaluate({
            expression: expression
        });
    }

    async function checkExtensionPromote(nums = 0) {
        let targets = await browser.targets()
        let ws = "";
        for (let target of targets) {
            //分3类页面1.type：other url带extension 为钱包页面
            //2 type :page url 带aptos  为主页面
            //3
            let targetId = target._targetId

            let wsUrl = `ws://127.0.0.1:${port}/devtools/page/${targetId}`
            let extension = target.url()
            let type = await target.type()
            if (type == "page" && extension == "chrome-extension://ejjladinnckdgjemekebdpeokbikhfci/prompt.html") {
                console.log(wsUrl)
                console.log(extension)
                ws = wsUrl
                console.log(targetId)
                await approveProote(ws).catch(e => {
                    console.log(e)
                })
            }
        }
        //await page.waitForNavigation()
        let sign = await page.$eval('#nft_offer_aptos-zero > ol > li.pl-10.relative.border-dotted.pb-16.border-neutral-400 > p',
            el => el.innerHTML).catch(e=>{
                console.log(e)
        });
        if (!!sign && sign.includes("Your NFT is ready to mint")) {
            return true
        } else {
            if (nums < 20) {
                await sleep(1000,"checkExtensionPromote")
                return await checkExtensionPromote(nums + 1)
            }
        }
    }
    async function checkExtensionPromote2(nums = 0) {
        let targets = await browser.targets()
        let ws = "";
        for (let target of targets) {
            //分3类页面1.type：other url带extension 为钱包页面
            //2 type :page url 带aptos  为主页面
            //3
            let targetId = target._targetId

            let wsUrl = `ws://127.0.0.1:${port}/devtools/page/${targetId}`
            let extension = target.url()
            let type = await target.type()
            if (type == "page" && extension == "chrome-extension://ejjladinnckdgjemekebdpeokbikhfci/prompt.html") {
                console.log(wsUrl)
                console.log(extension)
                ws = wsUrl
                console.log(targetId)
                await approveProote(ws).catch(e => {
                    console.log(e)
                })
            }
        }
            if (nums < 20) {
                await sleep(1000,"checkExtensionPromote2")
                return await checkExtensionPromote2(nums + 1)
            }

    }

    let wsUrl = await checkExtensionIndex()
    console.log("wsUrl:" + wsUrl)

    //target 切换到新的账户
    let ret = await extensionFaucet.updateAccount(wsUrl,port)
    if (ret) {
        console.log("next")
    }
    await page.click("#nft_offer_aptos-zero > ol > li.pl-10.relative.border-dotted.pb-16.border-neutral-400.border-l-2 > div:nth-child(4) > button")
    await page.waitForSelector("button[data-wallet=petra]")
    await page.click("button[data-wallet=petra]")

    let promoteWSUrl = await checkExtensionPromote()
    console.log("promoteWSUrl:" + promoteWSUrl)
    if (!promoteWSUrl) {
        await main()
    } else {
        console.log("promoteWSUrl:" + promoteWSUrl)
    }
    await page.waitForSelector("#nft_offer_aptos-zero > ol > li.pl-10.relative.border-dotted.pb-16.border-neutral-400 > div:nth-child(4) > a")
    console.log("claim nft")
    await page.click("#nft_offer_aptos-zero > ol > li.pl-10.relative.border-dotted.pb-16.border-neutral-400 > div:nth-child(4) > a")
    
    await checkExtensionPromote2()
    let wait =await page.waitForSelector("body > div > main > div > div > section > div > h1 > span:nth-child(3) > span",{timeout:10*1000})
    console.log("wait:",wait)
    await extensionFaucet.deleteAccount(wsUrl)



    // console.log(page.length)


    // let sess = await targets[3].createCDPSession()
    //
    // console.log(sess)

    // const client = await targets[2].createCDPSession();


    await browser.disconnect()


}



async function test(){
    let a = new Array(1000000)
    for(let ele of a){
        await main().catch(async e=>{
            console.log(e)
            await sleep(5000)
        })
    }
}

test()



