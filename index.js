const TelegramBot = require('node-telegram-bot-api')
const express = require('express')
const cors = require('cors')

require('dotenv').config()
// require('dotenv').config({ path: '../.env' })

// const token =
//     process.env.NODE_ENV === 'prod'
//         ? process.env.TELEGRAM_BOT_TOKEN
//         : process.env.TELEGRAM_BOT_TOKEN_testing
 
const token = process.env.TELEGRAM_BOT_TOKEN_testing

console.log('token :>> ', token)

 const webAppUrl = 'https://serene-moonbeam-93eead.netlify.app'

const bot = new TelegramBot(token, { polling: true })
const app = express()

app.use(express.json())
app.use(cors())

bot.on('message', async (msg) => {
    const chatId = msg.chat.id
    const text = msg.text

    console.log('text :>> ', text)
    if (text === '/start') {
        await bot.sendMessage(chatId, 'Ниже появится кнопка, заполни форму', {
            reply_markup: {
                keyboard: [
                    [
                        {
                            text: 'Заполнить форму',
                            web_app: { url: webAppUrl + '/form' },
                        },
                    ],
                ],
            },
        })

        await bot.sendMessage(chatId, 'Заходи в наш интернет магазин по кнопке ниже', {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Сделать заказ',
                            web_app: { url: webAppUrl },
                        },
                    ],
                ],
            },
        })
    }

    if (msg?.web_app_data?.data) {
        try {
            const data = JSON.parse(msg?.web_app_data?.data)
            console.log(data)
            await bot.sendMessage(chatId, 'Спасибо за обратную связь!')
            await bot.sendMessage(chatId, 'Ваша страна: ' + data?.country)
            await bot.sendMessage(chatId, 'Ваша улица: ' + data?.street)

            setTimeout(async () => {
                await bot.sendMessage(chatId, 'Всю информацию вы получите в этом чате')
            }, 3000)
        } catch (e) {
            console.log(e)
        }
    }
})

app.post('/web-data', async (req, res) => {
    const { queryId, products = [], totalPrice } = req.body
    try {
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Успешная покупка',
            input_message_content: {
                message_text: ` Поздравляю с покупкой, вы приобрели товар на сумму ${totalPrice}, ${products
                    .map((item) => item.title)
                    .join(', ')}`,
            },
        })
        return res.status(200).json({})
    } catch (e) {
        return res.status(500).json({})
    }
})

 
var server = app.listen(process.env.PORT,process.env.HOST, () => {
     const host = server.address().address
    const port = server.address().port
    console.log('Web server started at http://%s:%s', host, port)
})

 