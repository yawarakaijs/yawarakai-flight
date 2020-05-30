// Dependecies
let axios = require('axios')
let cheerio = require('cheerio')
let Compo = require('../../../component')
let pMap = require('p-map')

// main

let main = {
    getDetailedData(partOfFlight) {
        return new Promise((resolve, reject) => {
            const flightDateTimeFormat = new Intl.DateTimeFormat('en', { year: 'numeric', month: '2-digit', day: '2-digit', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', })
            let detailedQueryLink = `https://www.flightstats.com/v2/api-next${partOfFlight['url']}`
            detailedQueryLink = detailedQueryLink.replace('?year=', '/').replace('&month=', '/').replace('&date=', '/').replace('&flightId=', '/')
            
            axios.get(detailedQueryLink).then(detailedQueryData => {
                let detailedInfo = detailedQueryData.data
                
                let detailedSchedule = detailedInfo['data']['schedule']
                let transformDateTime = (scheduleData, keys) => {
                    for (let key of keys) {
                        let [{ value: month },,{ value: day },,{ value: year },,{ value: hour },,{ value: minute },,{ value: second }] = flightDateTimeFormat.formatToParts(new Date(scheduleData[key]))
                        scheduleData[key] = {
                            "date": `${year}-${month}-${day}`,
                            "time": `${hour}:${minute}:${second}`
                        }
                    }
                }
                transformDateTime(detailedSchedule, ['scheduledDeparture', 'estimatedActualDeparture', 'scheduledArrival', 'estimatedActualArrival'])
                
                let departureAirport = detailedInfo['data']['departureAirport']
                let arrivalAirport = detailedInfo['data']['arrivalAirport']
                
                let flight = {
                    num: `${partOfFlight['AR']}-${partOfFlight['NUMB']}`,
                    date: `${detailedSchedule['scheduledDeparture']['date']}`,
                    
                    depart: "出发",
                    departAirport: `${departureAirport['name']} (${departureAirport['iata']})`,
                    departSchechuleDate: "出发日期",
                    departSchechuleDateInfo: `${detailedSchedule['scheduledDeparture']['date']}`,
                    departSchechuleTime: "预定出发时间",
                    departSchechuleTimeInfo: `${detailedSchedule['scheduledDeparture']['time']} ${departureAirport['times']['scheduled']['timezone']}`,
                    departActualTime: `${detailedSchedule['estimatedActualDepartureTitle'] === 'Actual' ? '实际' : '预计'}出发时间`,
                    departActualTimeInfo: `${detailedSchedule['estimatedActualDeparture']['time']} ${departureAirport['times']['estimatedActual']['timezone']}`,
                    departTerminal: "航站楼",
                    departTerminalInfo: `${departureAirport['terminal'] === null ? '-' : departureAirport['terminal']}`,
                    departGate: "闸口",
                    departGateInfo: `${departureAirport['gate'] === null ? '-' : departureAirport['gate']}`,

                    arrival: "抵达",
                    arrivalAirport: `${arrivalAirport['name']} (${arrivalAirport['iata']})`,
                    arrivalSchechuleDate: "抵达日期",
                    arrivalSchechuleDateInfo: `${detailedSchedule['scheduledArrival']['date']}`,
                    arrivalSchechuleTime: "预定出发时间",
                    arrivalSchechuleTimeInfo: `${detailedSchedule['scheduledArrival']['time']} ${arrivalAirport['times']['scheduled']['timezone']}`,
                    arrivalActualTime: `${detailedSchedule['estimatedActualArrival'] === 'Actual' ? '实际' : '预计'}抵达时间`,
                    arrivalActualTimeInfo: `${detailedSchedule['estimatedActualArrival']['time']} ${arrivalAirport['times']['estimatedActual']['timezone']}`,
                    arrivalTerminal: "航站楼",
                    arrivalTerminalInfo: `${arrivalAirport['terminal'] === null ? '-' : arrivalAirport['terminal']}`,
                    arrivalGate: "闸口",
                    arrivalGateInfo: `${arrivalAirport['gate'] === null ? '-' : arrivalAirport['gate']}`,
                    arrivalBaggage: "行李",
                    arrivalBaggageInfo:  `${arrivalAirport['baggage'] === null ? '-' : arrivalAirport['baggage']}`,
                }

                let content = new Array()

                content.push(`${flight.departAirport} -> ${flight.arrivalAirport}`)
                content.push("")
                content.push(`*${flight.depart}*`)
                content.push(`${flight.departSchechuleDate}: *${flight.departSchechuleDateInfo}*`)
                content.push(`${flight.departSchechuleTime}: *${flight.departSchechuleTimeInfo}*`)
                content.push(`${flight.departActualTime}: ${flight.departActualTimeInfo}`)
                content.push(`${flight.departTerminal}: ${flight.departTerminalInfo} ${flight.departGate}: *${flight.departGateInfo}*`)
                content.push("")
                content.push(`*${flight.arrival}*`)
                content.push(`${flight.arrivalSchechuleDate}: *${flight.arrivalSchechuleDateInfo}*`)
                content.push(`${flight.arrivalSchechuleTime}: *${flight.arrivalSchechuleTimeInfo}*`)
                content.push(`${flight.arrivalActualTime}: ${flight.arrivalActualTimeInfo}`)
                content.push(`${flight.arrivalTerminal}: ${flight.arrivalTerminalInfo} ${flight.arrivalGate}: *${flight.arrivalGateInfo}* ${flight.arrivalBaggage}: *${flight.arrivalBaggageInfo}*`)
                
                resolve({
                    type: "article",
                    title: `${partOfFlight['AR']}-${partOfFlight['NUMB']} ${departureAirport['iata']} -> ${arrivalAirport['iata']}`,
                    description: `${detailedSchedule['scheduledDeparture']['date']} ${detailedSchedule['scheduledDeparture']['time']} -> ${detailedSchedule['scheduledArrival']['date']} ${detailedSchedule['scheduledArrival']['time']}`,
                    thumb_url: "https://i.loli.net/2019/11/21/mDbIqPokTR675wn.png",
                    input_message_content: {
                        message_text: content.join("\n"),
                        parse_mode: "Markdown"
                    }
                })
            })
        })
    },
    async getData (ctx, flightNum, flightData, date, data, type) {
        let flight
        flightNum += flightData

        let flightNumInputPattern = /(([a-z]\d)|([a-z]+)|(\d[a-z]))(-)\d{3,4}/gi
        let flightStatsURLPattern = /\/flight-tracker\/([A-Za-z0-9]+)\/(\d+)\?year=(\d{4})&month=(\d{2})&date=(\d{2})&flightId=(\d+)/

        if (!flightNumInputPattern.test(flightNum)) {
            let flightNumInputPattern1 = /(([a-z]\d)|([a-z]+)|(\d[a-z]))( )\d{3,4}/gi
            let flightNumInputPattern2 = /(([a-z]\d)|([a-z]+)|(\d[a-z]))\d{3,4}/gi

            if (flightNumInputPattern1.test(flightNum)) {
                let array = flightNum.split(' ')
                flight = {
                    "AR": array[0],
                    "NUMB": array[1]
                }
            }
            if (flightNumInputPattern2.test(flightNum)) {
                flight = {
                    "AR": flightNum.slice(0, 2),
                    "NUMB": flightNum.replace(flightNum.slice(0, 2), '')
                }
            }
        }
        else {
            return undefined
        }

        let info = [flight, date]
        Compo.Interface.Log.Log.info(ctx.from.first_name + " 申请查询航班信息: " + flight['AR'] + "-" + flight['NUMB'] + " " + info[1])

        let link = `https://www.flightstats.com/v2/api-next/flight-tracker/other-days/${flight['AR']}/${flight['NUMB']}`
        return axios.get(link).then(async htmlString => {
            try {
                let flightStatus = htmlString.data
                if (flightStatus && flightStatus.data) {
                    let date2
                    if (date !== undefined) {
                        const dateTimeFormat = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: '2-digit' })
                        let [{ value: month },,{ value: day },,{ value: year }] = dateTimeFormat.formatToParts(new Date(date))
                        date2 = `${month}-${day}`;
                    }
                    else {
                        return undefined
                    }

                    let allFlightRoutes = new Array()
                    for (let data of flightStatus.data) {
                        if (data['date2'] === date2) {
                            let multiFlights = data['flights']
                            for (let partOfFlight of multiFlights) {
                                partOfFlight['AR'] = flight['AR']
                                partOfFlight['NUMB'] = flight['NUMB']
                                allFlightRoutes.push(partOfFlight)
                            }
                        }
                    }
                    
                    if (type === 'inline') {
                        let result = await pMap(allFlightRoutes, main.getDetailedData, {concurrency: 4})
                        return { data: result }
                    }
                    else if (type === 'scenes' || type === 'commands') {
                        if (allFlightRoutes.length === 1) {
                            let result = await getDetailedData(allFlightRoutes[0])
                            return { data: result, single: true }
                        } else {
                            let keys = new Array()
                            for (let route of allFlightRoutes) {
                                let matched = route['url'].match(flightStatsURLPattern)
                                if (matched) {
                                    keys.push([{
                                        text: `${route['departureAirport']['city']} (${route['departureAirport']['iata']}) ${route['departureTime24']} -> ${route['arrivalAirport']['city']} (${route['arrivalAirport']['iata']}) ${route['arrivalTime24']}`,
                                        callback_data: `flight://null?f=${matched[1]}:${matched[2]}:${matched[3]}-${matched[4]}-${matched[5]}:${matched[6]}`
                                    }])
                                }
                            }
                            return { data: keys, single: false }
                        }
                    }
                }                
            } catch (err) {
                Compo.Interface.Log.Log.warning(`无法获取 flightstats 数据 ${flight['AR']}-${flight['NUMB']}。`)
                return undefined
            }
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
            let result = await main.getData(ctx, flightNum, flightData, date, data, 'commands').catch(err => {
                Compo.Interface.Log.Log.fatal(err)
                this.telegram.sendMessage(ctx.message.chat.id, "抱歉，航班查询服务目前暂不可用。", { reply_to_message_id: ctx.message.message_id })
            })
            if (result == undefined) {
                this.telegram.sendMessage(ctx.message.chat.id, "找不到这个航班呢喵 qwq\n可能是搜索的日期没有该航班呢", { reply_to_message_id: ctx.message.message_id })
                return undefined
            }
            
            if (result.single === true) {
                this.telegram.sendMessage(ctx.message.chat.id, result.data, { reply_to_message_id: ctx.message.message_id, parse_mode: "Markdown" })
                this.telegram.deleteMessage(message.chat.id, message.message_id)
            } else {
                this.telegram.sendMessage(context.ctx.message.chat.id, "是哪一段航程呢～？", {
                    reply_markup: {
                        inline_keyboard: result.data
                    },
                    parse_mode: "Markdown"
                })
            }

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

                    this.telegram.sendMessage("好的呢，稍等一下哦")
                    let message = await this.telegram.sendMessage(ctx.message.chat.id, "正在申请查询航班信息...")
                    let result = await main.getData(ctx, flightNum, flightData, date, data, 'scenes').catch(err => {
                        Compo.Interface.Log.Log.fatal(err)
                        this.telegram.sendMessage(ctx.message.chat.id, "抱歉，航班查询服务目前暂不可用。", { reply_to_message_id: ctx.message.message_id })
                    })

                    if (result == undefined) {
                        this.telegram.sendMessage(ctx.message.chat.id, "找不到这个航班呢喵 qwq\n可能是搜索的日期没有该航班呢", { reply_to_message_id: ctx.message.message_id })
                        break
                    }
                    
                    if (result.single === true) {
                        this.telegram.sendMessage(ctx.message.chat.id, result.data, { reply_to_message_id: ctx.message.message_id, parse_mode: "Markdown" })
                        this.telegram.deleteMessage(message.chat.id, message.message_id)
                    } else {
                        this.telegram.sendMessage(context.ctx.message.chat.id, "是哪一段航程呢～？", {
                            reply_markup: {
                                inline_keyboard: result.data
                            },
                            parse_mode: "Markdown"
                        })
                    }

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

        let result = await main.getData(ctx, flightNum, flightData, date, data, 'inline').catch(err => {
            return undefined
        })
        if (result == undefined) {
            return undefined
        }
        else {
            result.data.map(elt => elt['id'] = ctx.inlineQuery.id)
            return result.data
        }
    }
}

exports.callbackQuery = {
    async main(ctx) {
        if (!ctx.update.callback_query.data.startsWith("flight")) { return undefined }
        let callbackData = ctx.update.callback_query
        let message = callbackData.message
        
        let data = callbackData.data
        const flightCallbackQueryPattern = /^flight\:\/\/null\?f=([A-Za-z0-9]+):([0-9]{3,4}):(\d{4})-(\d{2})-(\d{2}):(\d+)$/
        let matches = data.match(flightCallbackQueryPattern)
        if (matches) {
            let partOfFlight = {
                "AR": matches[1],
                "NUMB": matches[2],
                "url": `/flight-tracker/${matches[1]}/${matches[2]}?year=${matches[3]}&month=${matches[4]}&date=${matches[5]}&flightId=${matches[6]}`
            }
            
            message = await this.telegram.editMessageText(
                message.chat.id,
                message.message_id,
                null,
                "正在查询该段航程信息～"
            ).catch(err => {
                throw err
            })
            
            let result = await main.getDetailedData(partOfFlight)
            
            this.telegram.sendMessage(message.chat.id, result['input_message_content']['message_text'], { reply_to_message_id: ctx.update.callback_query.message.message_id, parse_mode: "Markdown" })
            this.telegram.deleteMessage(message.chat.id, message.message_id)
        }
        else {
            this.telegram.sendMessage(ctx.message.chat.id, "输入的内容好像有点问题呢... 再试一次？")
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
         {
             function: 'main'
         }
    ],
    scenes: [
        {
            name: 'flight',
            function: this.scenes.flight
        }
    ]
}
