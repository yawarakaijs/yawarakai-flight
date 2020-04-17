// Dependecies
let axios = require('axios')
let cheerio = require('cheerio')
let Compo = require('../../../component')

// main

let main = {
    async getData (ctx, flightNum, flightData, date) {
        let flight
        flightNum += flightData

        let flightNumInputPattern = /(([a-z]\d)|([a-z]+)|(\d[a-z]))(-)\d{3,4}/gi

        if (!flightNumInputPattern.test(flightNum)) {
            let flightNumInputPattern1 = /(([a-z]\d)|([a-z]+)|(\d[a-z]))( )\d{3,4}/gi
            let flightNumInputPattern2 = /(([a-z]\d)|([a-z]+)|(\d[a-z]))\d{3,4}/gi

            if (flightNumInputPattern1.test(flightNum)) {
                let array = flightNum.split(' ')
                flight = array[0] + "-" + array[1]
            }
            if (flightNumInputPattern2.test(flightNum)) {
                flight = flightNum.slice(0, 2) + "-" + flightNum.replace(flightNum.slice(0, 2), '')
            }
        }
        else {
            flight = flightNum
        }

        let info = [flight, date]

        Compo.Interface.Log.Log.info(ctx.from.first_name + " 申请查询航班信息: " + info[0] + " " + info[1])

        // Link Prefix

        let linkPrefix

        switch (config.components.flight.locale) {
            case "zh-CN":
                linkPrefix = "https://www.cn.kayak.com/tracker/"
                break
            case "zh-HK":
                linkPrefix = "https://www.kayak.com.hk/tracker/"
                break
            case "en-US":
                linkPrefix = "https://www.kayak.com/tracker/"
                break
            default:
                linkPrefix = "https://www.kayak.com/tracker/"
                break
        }

        let link = linkPrefix + info[0] + "/" + info[1]
        return axios.get(link).then(htmlString => {
            let $ = cheerio.load(htmlString.data)
            let flightStatus = $('div.statusLines').text().split('\n')
            if (flightStatus[1] == undefined) {
                Compo.Interface.Log.Log.warning(`无该航班信息 ${info[0]}。`)
                return undefined
            }

            let flight = {
                num: info[0],
                date: info[1],

                depart: flightStatus[1],
                departAirport: flightStatus[2],
                departSchechuleDate: flightStatus[3],
                departSchechuleDateInfo: flightStatus[4],
                departSchechuleTime: flightStatus[5],
                departSchechuleTimeInfo: flightStatus[6],
                departActualTime: flightStatus[7],
                departActualTimeInfo: flightStatus[8],
                departTerminal: flightStatus[9],
                departTerminalInfo: flightStatus[10],
                departGate: flightStatus[11],
                departGateInfo: flightStatus[12],

                arrival: flightStatus[14],
                arrivalAirport: flightStatus[15],
                arrivalSchechuleDate: flightStatus[16],
                arrivalSchechuleDateInfo: flightStatus[17],
                arrivalSchechuleTime: flightStatus[18],
                arrivalSchechuleTimeInfo: flightStatus[19],
                arrivalActualTime: flightStatus[20],
                arrivalActualTimeInfo: flightStatus[21],
                arrivalTerminal: flightStatus[22],
                arrivalTerminalInfo: flightStatus[23],
                arrivalGate: flightStatus[24],
                arrivalGateInfo: flightStatus[25],
            }

            let data = new Array()

            data.push(`${flight.departAirport} -> ${flight.arrivalAirport}`)
            data.push("")
            data.push(`*${flight.depart}*`)
            data.push(`${flight.departSchechuleDate}: *${flight.departSchechuleDateInfo}*`)
            data.push(`${flight.departSchechuleTime}: *${flight.departSchechuleTimeInfo}*`)
            data.push(`${flight.departActualTime}: ${flight.departActualTimeInfo}`)
            data.push(`${flight.departTerminal}: ${flight.departTerminalInfo} ${flight.departGate}: *${flight.departGateInfo}*`)
            data.push("")
            data.push(`*${flight.arrival}*`)
            data.push(`${flight.arrivalSchechuleDate}: *${flight.arrivalSchechuleDateInfo}*`)
            data.push(`${flight.arrivalSchechuleTime}: *${flight.arrivalSchechuleTimeInfo}*`)
            data.push(`${flight.arrivalActualTime}: ${flight.arrivalActualTimeInfo}`)
            data.push(`${flight.arrivalTerminal}: ${flight.arrivalTerminalInfo} ${flight.arrivalGate}: *${flight.arrivalGateInfo}*`)

            data = { data: data.join("\n"), flight: flight }
            return data
        })
    },
    sceneEnterCount: 0
}

// Inner

exports.commands = {
    async flight (context) {

        let ctx = context.ctx
        let data = context.args.join(" ")

        let flightNumPattern = /(([a-z]\d)|([a-z]+)|(\d[a-z]))(-| )?\d{3,4}/gi
        let flightNumInputPattern = /(([a-z]\d)|([a-z]+)|(\d[a-z]))(-)\d{3,4}/gi
        let flightNum = new String("")
        let flightData = flightNumPattern[Symbol.match](data)
        if (!flightData || flightData == null) {
            if (scene.has(context.ctx)) {
                if (main.sceneEnterCount < 2) {
                    main.sceneEnterCount++
                    return "输入上面说的信息就好啦"
                }
                else if (main.sceneEnterCount === 2) {
                    main.sceneEnterCount++
                    return "按照指示来就好了呀 qwq"
                }
                else if (main.sceneEnterCount === 3) {
                    main.sceneEnterCount++
                    this.telegram.sendMessage(context.ctx.message.chat.id, "是不是没有理解呢...")
                    this.telegram.sendMessage(context.ctx.message.chat.id, "请按照以下格式输入要查询的航班: \nAR-NUMB YYYY-MM-DD \nAR 是航空公司短标识，NUMB 是航线标识，日期格式应为：1970-01-01", { reply_to_message_id: context.ctx.message.message_id })
                }
                else if (main.sceneEnterCount === 4) {
                    main.sceneEnterCount++
                    return "好烦了啦，不理你了（哼"
                }
                else if (main.sceneEnterCount === 5) {
                    main.sceneEnterCount++
                    return "说了不理你了啦。\n就不能看看上面怎么说的嘛？"
                }
                else if (main.sceneEnterCount === 6) {
                    main.sceneEnterCount++
                    this.telegram.sendMessage(context.ctx.message.chat.id, "呜呜呜，能不能好好交流嘛 QAQ，你这样调戏人家，主人看到会很不开心的！")
                    this.telegram.sendMessage(context.ctx.message.chat.id, "请按照以下格式输入要查询的航班！！！: \nAR-NUMB YYYY-MM-DD \nAR 是航空公司短标识，NUMB 是航线标识，日期格式应为：1970-01-01", { reply_to_message_id: context.ctx.message.message_id })
                }
                else if (main.sceneEnterCount === 7 || main.sceneEnterCount === 8) {
                    main.sceneEnterCount++
                    return "（呜）"
                }
                else {
                    return undefined
                }
            }
            else {
                main.sceneEnterCount = 0
                scene.enter(context.ctx)
                this.telegram.sendMessage(context.ctx.message.chat.id, "把你想要查找的航班号发给我吧w", { reply_to_message_id: context.ctx.message.message_id })
                this.telegram.sendMessage(context.ctx.message.chat.id, "请按照以下格式输入要查询的航班: \nAR-NUMB YYYY-MM-DD \nAR 是航空公司短标识，NUMB 是航线标识，日期格式应为：1970-01-01")
                main.sceneEnterCount = 1
            }
        }
        else {
            let Time = new Date()
            let CurrentTime = Time.getFullYear() + "-" + ("0" + (Time.getMonth() + 1)).slice(-2) + "-" + ("0" + Time.getDate()).slice(-2)
            let CurrentTimeInfo = Time.getFullYear() + ("0" + (Time.getMonth() + 1)).slice(-2) + ("0" + Time.getDate()).slice(-2)

            let date = new String("")
            let datePattern = /(\d{4})-(\d{2})-(\d{2})/g
            date = datePattern[Symbol.match](data)

            let dateInfo

            if (!date || date == null) {
                date = CurrentTime
            }
            else {
                dateInfo = date[0].replace("-", "")
                let dateRange = CurrentTimeInfo + 6
                if (dateInfo > dateRange) {
                    this.telegram.sendMessage(ctx.message.chat.id, "不能查询那个日期的航班喔，只能查询最近 7 天的航班呢w \n很抱歉啦，也有正在尽力寻找其他解决办法呢w", { reply_to_message_id: ctx.message.message_id })
                    return undefined
                }
            }

            let message = await this.telegram.sendMessage(ctx.message.chat.id, "正在申请查询航班信息...")
            let result = await main.getData(ctx, flightNum, flightData, date, data).catch(err => {
                Compo.Interface.Log.Log.fatal(err)
                this.telegram.sendMessage(ctx.message.chat.id, "抱歉，航班查询服务目前暂不可用。", { reply_to_message_id: ctx.message.message_id })
            })
            if (result == undefined) {
                this.telegram.sendMessage(ctx.message.chat.id, "找不到这个航班呢喵 qwq\n可能是搜索的日期没有该航班呢", { reply_to_message_id: ctx.message.message_id })
                return undefined
            }
            this.telegram.sendMessage(ctx.message.chat.id, result.data, { reply_to_message_id: ctx.message.message_id, parse_mode: "Markdown" })
            this.telegram.deleteMessage(message.chat.id, message.message_id)
            return undefined
        }

    }
}

exports.scenes = {
    async flight (context) {

        let status = scene.status(context.ctx)
        let stage = status.stage
        switch (stage) {
            case 0:

                let ctx = context.ctx
                let data = context.ctx.message.text

                let flightNumPattern = /(([a-z]\d)|([a-z]+)|(\d[a-z]))(-| )?\d{3,4}/gi
                let flightNumInputPattern = /(([a-z]\d)|([a-z]+)|(\d[a-z]))(-)\d{3,4}/gi
                let flightNum = new String("")
                let flightData = flightNumPattern[Symbol.match](data)

                if (!flightData || flightData == null) {
                    this.telegram.sendMessage(context.ctx.message.from.id, "输入的内容好像并不是航班号呢... 再试一次？")
                    break
                }
                else {

                    let Time = new Date()
                    let CurrentTime = Time.getFullYear() + "-" + ("0" + (Time.getMonth() + 1)).slice(-2) + "-" + ("0" + Time.getDate()).slice(-2)
                    let CurrentTimeInfo = Time.getFullYear() + ("0" + (Time.getMonth() + 1)).slice(-2) + ("0" + Time.getDate()).slice(-2)

                    let date = new String("")
                    let datePattern = /(\d{4})-(\d{2})-(\d{2})/g
                    date = datePattern[Symbol.match](data)

                    let dateInfo

                    if (!date || date == null) {
                        date = CurrentTime
                    }
                    else {
                        dateInfo = date[0].replace("-", "")
                        let dateRange = CurrentTimeInfo + 6
                        if (dateInfo > dateRange) {
                            this.telegram.sendMessage(ctx.message.chat.id, "不能查询那个日期的航班喔，只能查询最近 7 天的航班呢w \n很抱歉啦，也有正在尽力寻找其他解决办法呢w", { reply_to_message_id: ctx.message.message_id })
                            break
                        }
                    }
                    this.telegram.sendMessage("好的呢，稍等一下哦")
                    let message = await this.telegram.sendMessage(ctx.message.chat.id, "正在申请查询航班信息...")
                    let result = await main.getData(ctx, flightNum, flightData, date, data).catch(err => {
                        Compo.Interface.Log.Log.fatal(err)
                        this.telegram.sendMessage(ctx.message.chat.id, "抱歉，航班查询服务目前暂不可用。", { reply_to_message_id: ctx.message.message_id })
                    })

                    if (result == undefined) {
                        this.telegram.sendMessage(ctx.message.chat.id, "找不到这个航班呢喵 qwq\n可能是搜索的日期没有该航班呢", { reply_to_message_id: ctx.message.message_id })
                        break
                    }
                    
                    this.telegram.sendMessage(ctx.message.chat.id, result.data, { reply_to_message_id: ctx.message.message_id, parse_mode: "Markdown" })
                    this.telegram.deleteMessage(message.chat.id, message.message_id)

                    scene.exit(context.ctx)
                    break
                }

            default:
                break
        }

    }
}

exports.inlines = {
    async main (ctx) {
        let data = ctx.inlineQuery.query

        let flightNumPattern = /(([a-z]\d)|([a-z]+)|(\d[a-z]))(-| )?\d{3,4}/gi
        let flightNumInputPattern = /(([a-z]\d)|([a-z]+)|(\d[a-z]))(-)\d{3,4}/gi
        let flightNum = new String("")
        let flightData = flightNumPattern[Symbol.match](data)
        if (!flightData || flightData == null) {
            return undefined
        }

        let Time = new Date()
        let CurrentTime = Time.getFullYear() + "-" + ("0" + (Time.getMonth() + 1)).slice(-2) + "-" + ("0" + Time.getDate()).slice(-2)
        let CurrentTimeInfo = Time.getFullYear() + ("0" + (Time.getMonth() + 1)).slice(-2) + ("0" + Time.getDate()).slice(-2)

        let date = new String("")
        let datePattern = /(\d{4})-(\d{2})-(\d{2})/g
        date = datePattern[Symbol.match](data)

        let dateInfo

        if (!date || date == null) {
            date = CurrentTime
        }
        else {
            dateInfo = date[0].replace("-", "")
            let dateRange = CurrentTimeInfo + 6
            if (dateInfo > dateRange) {
                return [{
                    type: "article",
                    id: ctx.inlineQuery.id,
                    title: "查询失败",
                    description: "不能查询那个日期的航班喔，只能查询最近 7 天的航班呢w \n很抱歉啦，也有正在尽力寻找其他解决办法呢w",
                    thumb: "https://i.loli.net/2019/11/19/2IySvl8FZhUxd9c.png",
                    input_message_content: { message_text: "航班查询失败" }
                }]
            }
        }

        let result = await main.getData(ctx, flightNum, flightData, date, data).catch(err => {
            return undefined
        })
        if (result == undefined) {
            return undefined
        }
        else {
            date = new Date(result.flight.date)

            data = [{
                type: "article",
                id: ctx.inlineQuery.id,
                title: result.flight.num + " " + result.flight.departSchechuleDateInfo,
                description: result.flight.departSchechuleTimeInfo + " -> " + result.flight.arrivalActualTimeInfo,
                thumb_url: "https://i.loli.net/2019/11/21/mDbIqPokTR675wn.png",
                input_message_content: { message_text: result.data, parse_mode: "Markdown" }
            }]

            return data
        }
    }
}

// Register

let scene = new Compo.Interface.Scene("flight")

exports.register = {
    // As the example to Yawarakai Compos
    commands: [
        {
            function: 'flight',
            help: "AR-NUMB YYYY-MM-DD \nAR 是航空公司短标识，NUMB 是航线标识，日期格式应为：1970-01-01"
        }
    ],
    inlines: [
        {
            function: "main"
        }
    ],
    messages: [
        // {
        // function: 'main'
        // }
    ],
    callbackQuery: [
        // {
        //     function: 'main'
        // }
    ],
    scenes: [
        {
            name: 'flight',
            function: this.scenes.flight
        }
    ]
}