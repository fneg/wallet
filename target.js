const CDP = require('chrome-remote-interface');
const cheerio = require("cheerio");
const fs = require("fs");
const Process = require("process");



async function CDPPromise(options){
    return new Promise((resolve, reject)=>{
        CDP(options, (client) => {
            console.log('Connected!');
            resolve(client)
        }).on('error', (err) => {
            reject(err);
        });
    })
}

function sleep(ms,message) {
    let currentTime = new Date(new Date().setHours(new Date().getHours() + 8)).toISOString().replace("Z", " ").replace("T", " ");
    console.log("Begin Sleep:"+currentTime+"  "+message)

    return new Promise(resolve=>setTimeout(resolve, ms))
}



async function updateAccount(wsUrl,port){
    const options = {
        // target: 'ws://127.0.0.1:21222/devtools/page/728BBB1710DC34E0C0185F740C934140'
        target:wsUrl
    };
    let client = await CDPPromise(options);
    const {Network, Page, Runtime} = client;
    await Network.enable();
    await Page.enable();
    async function eevaluate(expression){
        const result = await Runtime.evaluate({
            expression: expression
        });
        let value  = result.result.value;
        return value;
    }

    async function fsAppend(path,data){
        return new Promise((resolve, reject)=>{
            fs.appendFile(path,data,(e)=>{
                if(e){
                    reject(e)
                }
                else {
                    resolve()
                }
            })
        })

    }
    async function writeCode(html,port){
        let $ = cheerio.load(html)
        let str = ""
        $("div").find("input").each((i, ele) => {
            str += $(ele).attr("value")+","
        })
        console.log("zhujici:",str)
        await fsAppend("C:\\Users\\Administrator\\Desktop\\aptos-wallet-server\\aptos-wallet-server\\zhujici\\"+String(port)+".txt",str+ "\n")
    }
    // 'document.querySelector("").click()'
    ///'window.location.reload()'  重新加载
    let windowReload = 'window.location.reload()'
    //指向Home
    let home = 'document.querySelector("#root > div > div > div.css-oeissr > div > div:nth-child(1) > a > button > svg").click()'
    //领水
    let requireFaucet = 'document.querySelector("#root > div > div > div.css-qecnrk > div > div > div > div > button.chakra-button").click()';
    //查水
    let getFaucet = 'document.querySelector("#root > div > div > div.css-qecnrk > div > div > div.chakra-stack.css-e876sj > div > div > ul > span > span.chakra-heading").textContent'
    //点击设置
    let setting = 'document.querySelector("#root > div > div > div.css-oeissr > div > div:nth-child(5) > a > p").click()'
    //切换账户
    let switchAccount = 'document.querySelector("#root > div > div > div.css-qecnrk > div > div:nth-child(8) > a > div > div").click()'
    //添加账户
    let addAccount = 'document.querySelector("#root > div > div > div.css-qecnrk > div > div > div > button").click()'
    //添加新账户
    let addNewAccount =  'document.querySelector("#root > div > div > div.css-qecnrk > div > a:nth-child(1) > button").click()'
    //shanchu zhanghu
    let  delAccount = 'document.querySelector("#root > div > div > div.css-qecnrk > div > div:nth-child(9) > div > div > div").click()'
    //获取助记词html
    let code = `document.querySelector("#root > div > div > div.css-1doq91a > form > div > div > div > div.chakra-stack > div").innerHTML`
    //save
    let save = 'document.querySelector("#root > div > div > div.css-1doq91a > form > div > div > div > div.css-1lnv95 > label > span.chakra-checkbox__control").click()'
    //提交
    let submint = 'document.querySelector("#root > div > div > div.css-1doq91a > form > div > div > button").click()'

    //导出助记词
    let recovery =  'document.querySelector("#root > div > div > div.css-qecnrk > div > div:nth-child(7) > a > div > div > div").click()'
    let recoveryData ='document.querySelector("#root > div > div > div.css-qecnrk > div > div > div > p").textContent'

    //导出密钥
    let credential = 'document.querySelector("#root > div > div > div.css-qecnrk > div > div:nth-child(6) > a > div > div > div").click()'
    let creData = 'document.querySelector("#root > div > div > div.css-qecnrk > div > div > div.chakra-stack").textContent'

    // await eevaluate(recoveryData)
    async function createAccount(){
        await eevaluate(setting)
        await sleep(1000)
        await eevaluate(switchAccount)
        await sleep(1000)
        await eevaluate(addAccount)
        await sleep(1000)
        await eevaluate(addNewAccount)
        await sleep(1000)
        let codeData =await eevaluate(code)
        console.log(codeData)
        await sleep(1000)
        await writeCode(codeData,port)

        await sleep(1000)
        await eevaluate(save)
        await sleep(1000)
        await eevaluate(submint)
        await sleep(1000)
    }

    async function exportAccount(){
        await eevaluate(setting)
        await sleep(1000)
        await eevaluate(recovery)
        await sleep(1000)
        let data =  await eevaluate(recoveryData)
        console.log(data)
        if(!data){
            await sleep(1000,"助记词导出异常")
            await exportAccount()
        }
    }


    async function resolveFaucet(){
        await eevaluate(windowReload)
        await sleep(2000,"windows reload")
        await eevaluate(home)
        let faucet = await eevaluate(getFaucet);
        if (faucet==0){
            await eevaluate(requireFaucet)
            await sleep(1000,"faucet==0")
            await resolveFaucet()
        }else if(!faucet && typeof(faucet)=="undefined"){
            //加载时间不够，
            resolveFaucet()
        }else{
            faucet = faucet.replace(",","")
            if (faucet%50000==0){
                client.close()
                return true
            }
            else {
                //切换账户
                await createAccount()
                await sleep(1000)
                await resolveFaucet()
                // await exportAccount()
            }
        }
        console.log(faucet);
    }

    return await resolveFaucet()


}


async function deleteAccount(wsUrl){
    const options = {
        // target: 'ws://127.0.0.1:21222/devtools/page/728BBB1710DC34E0C0185F740C934140'
        target:wsUrl
    };
    let client = await CDPPromise(options);
    const {Network, Page, Runtime} = client;
    await Network.enable();
    await Page.enable();
    async function eevaluate(expression){
        const result = await Runtime.evaluate({
            expression: expression
        });
        let value  = result.result.value;
        return value;
    }
    let setting = 'document.querySelector("#root > div > div > div.css-oeissr > div > div:nth-child(5) > a > p").click()'
    let  delAccount = 'document.querySelector("#root > div > div > div.css-qecnrk > div > div:nth-child(9) > div > div > div").click()'
    await sleep(1000,"begin delete account")
    await eevaluate(setting)
    await sleep(1000,"deleting account")
    await eevaluate(delAccount)
    await sleep(10000,"deleted account")

}

module.exports= {
    updateAccount:updateAccount,
    deleteAccount:deleteAccount
}
