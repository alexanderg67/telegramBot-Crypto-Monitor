const { Telegraf , Markup,session} = require('telegraf');
const bot = new Telegraf('5926862904sdsdsdsdsdssds');
const cron = require('node-cron');
const axios=require('axios')
const fs=require('fs')
const fsExtra = require('fs-extra');
const coinArr=require('./data/coins');
 
bot.use( session() )

 
bot.use(async (ctx,next) => {
    ctx.session ??= { counter: 0 } //если не существует session обьект, то создаем
    next()
})
bot.use(async (ctx,next) => {
    try{
    if( ctx.session.stepChangePercentAllCoins) {
    let newFileContent=[]
    ctx.session.stepChangePercentAllCoins=0
    const text=ctx.update.message.text.trim()
    const inputValues=text.split(' ')
    const tgUserId= ctx.update.message.from.id
    if(text.match(/^[0-9 ]+/) && inputValues.length==2) {
        const fileCBContent=fs.readFileSync('./callbacks.txt', 'utf8').split('\n')
         
        fileCBContent.pop()
        console.log(tgUserId)
        fileCBContent.forEach ( e=> {
            if( e.startsWith(tgUserId)) {
                const coinId=e.split(';')[1]
                const changedLine=`${tgUserId};${coinId};${inputValues[0]};${inputValues[1]};onetime;0`
                newFileContent.push(changedLine) 
            }
            else {
            newFileContent.push(e)    
            }
    
        })    
         newFileContent=newFileContent.join('\n')+'\n'
          
         fs.writeFileSync('./callbacks.txt', newFileContent)
         await ctx.replyWithHTML(`⚙️ Настройки монет \n\n`+
         `✅ Процент был изменен на  ${inputValues[0]}%, абсолютное изменение в USD- ${inputValues[1]}`)
    }else{
    await ctx.replyWithHTML('🆕 Изменение не удалось \n\n Введите верные цифры через пробел')    
    }
     
    
    
    }else{
    next()
    }

    } catch(err) {
        console.log(err)
        await ctx.reply('Произошла ошибка. Попробуйте позже')
    }    
    })

bot.use(async (ctx,next) => {
    try{
if( ctx.session.stepChangePercent) {
    ctx.session.stepChangePercent=0
    const text=ctx.update.message.text.trim()
    const inputValues=text.split(' ')
    
    if(text.match(/^[0-9 ]+/) && inputValues.length==2) {
        const tgUserId= ctx.update.message.from.id
        console.log('match yes')
        //ctx.session.CoinForChange
        const fileCBContent=fs.readFileSync('./callbacks.txt', 'utf8').toString()
        const replace = `^${tgUserId};${ctx.session.CoinForChange};.*\n`;
        const  reg = new RegExp(replace,'m');
        const fileNewContent=fileCBContent.replace(reg,`${tgUserId};${ctx.session.CoinForChange};${inputValues[0]};${inputValues[1]};onetime;0\n`);
        fs.writeFileSync('./callbacks.txt', fileNewContent )
        await ctx.replyWithHTML(`⚙️ Настройки монеты ${ctx.session.CoinForChange} \n\n`+
        `✅ Процент был изменен на  ${inputValues[0]}%, абсолютное изменение в USD- ${inputValues[1]}`)
    }else{
    await ctx.replyWithHTML('🆕 Изменение не удалось \n\n Введите верные цифры')
    }
     

}else{
next()
}
} catch(err) {
        console.log(err)
        await ctx.reply('Произошла ошибка. Попробуйте позже')
    }    
})
 
bot.use(async (ctx,next) => {
    try {
    if( ctx.session.stepAddCoin) {
        ctx.session.stepAddCoin=0
        const inputCoinTicker=ctx.message.text.trim().toLowerCase()
        const coin= coinArr.find( c=> c.symbol===inputCoinTicker)
        if (coin) {
            const selectKeyboard = Markup.inlineKeyboard([
                [ Markup.button.callback(`${coin.symbol.toUpperCase()} ${coin.name}` , 'select_'+coin.symbol)],
                 
             ]);
            ctx.replyWithHTML('🆕 Добавление монеты \n\n'+
            'Подтвердите добавление монеты', selectKeyboard )
            
        }else{
        ctx.replyWithHTML('🆕 Добавление монеты \n\n'
        +'Извините, такой тикер монеты не найден')
        }
        
    }else{
        next()
    }
 } catch(err) {
        console.log(err)
        await ctx.reply('Произошла ошибка. Попробуйте позже')
    }        
})
bot.start ( async ctx => {
await ctx.replyWithHTML('📟  Бот CryptoMonitor позволяет добавлять токены в лист отслеживания. Задаются процентное изменение цены за сутки и абсолютное изменение цены за сутки.\nБот уведомит Вас сообщением при изменениях.'+
    '\n Доступны команды:\n /add_coin Добавление токена в лист отслеживания\n /coins Отображение листа отслеживания и редактирование'
 )
})
bot.help ( async ctx => {
await ctx.replyWithHTML('⚙️  Бот CryptoMonitor позволяет добавлять токены в лист отслеживания. Задаются процентное изменение цены за сутки и абсолютное изменение цены за сутки.\nБот уведомит Вас сообщением при изменениях.'+
    '\n Доступны команды:\n /add_coin Добавление токена в лист отслеживания\n /coins Отображение листа отслеживания и редактирование'
 )
})
bot.command('add_coin',async ctx => {
    ctx.session.stepAddCoin=1
    ctx.replyWithHTML('🆕 Добавление монеты \n\n'
    +'Введите тикер монеты. Например: ETH')
})
bot.command(/^EDIT_[a-zA-Z]+/,async ctx => {
    try{

    const tgUserId= ctx.update.message.from.id
    const coinId=ctx.update.message.text.split('_')[1]
    const coin = coinArr.find(c=> c.id===coinId)
    if (!coin)
    return   await ctx.replyWithHTML(`⚙️ Настройка монет\n\n`+ 'Такой монеты нет в вашем списке!' )
    const callbackArray=fs.readFileSync('./callbacks.txt', 'utf8').split('\n')
    const coinEntry=callbackArray.find( c=> c.startsWith(`${tgUserId};${coin.id}`))
    if (!coinEntry)
    return   await ctx.replyWithHTML(`⚙️ Настройки монеты ${coin.name} \n\n`+ 'Такой монеты нет в вашем списке' )
     
    const [ user,coinID2, percentChange,valueChange]=coinEntry.split(';')
    
    const editCoinKeyboard = Markup.inlineKeyboard([
        [ Markup.button.callback(`🔔${percentChange}% - Изменить ` , `changePercent_${coin.id}`),
          Markup.button.callback(`🗑 Удалить` , `deleteCoin_${coin.id}`)], ])

    const now = new Date();
    const year=now.getFullYear()
    const month=now.getMonth()
    const day=now.getDate()
    const startOfDay = new Date(year, month, day).getTime()
    const unixTimeFrom=startOfDay/1000
    const unixTimeTo=Math.floor( now.getTime()/1000)
    let minValue, maxValue,currentValue 
     
     
      
    const res= await axios.get( `https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart/range?vs_currency=usd&from=${unixTimeFrom}&to=${unixTimeTo}&precision=2` )
    if( res) {
        
        const data=res.data 
         if ( data.prices.length<2) { 
            console.log('get result with 1 price value')
         let priceText=''
         
         if(data.prices[0]) {
            const priceArray=data.prices[0]
            const price=priceArray[1]
            priceText=`Текущая цена $${price} \n`
         }
         return await ctx.replyWithHTML(`⚙️ Настройки монеты ${coin.name} \n\n` + 
         priceText+ 
         `Отслеживать изменение цены на ${percentChange}% или на ${valueChange}$ `,editCoinKeyboard)
         }
          
        
         const priceArray=data.prices
         priceArray.forEach ( c =>{
         if(!minValue){
            minValue=c[1]
         }
         if(!maxValue){
            maxValue=c[1]
         }
          if ( Number(minValue) > Number (c[1]) ){
            minValue=Number(c[1])
            }
            if ( Number(maxValue) < Number (c[1]) ){
            maxValue=Number(c[1])
                }
         })


         
    }
    const result2= await axios.get( `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coin.id}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=1h%2C24h&locale=en&precision=2` )
        if( result2) {
            const coinData=result2.data[0]
            
            currentValue=coinData.current_price

        }
        //count percent change from midnight
        const CryptoFileContent=fs.readFileSync(`./coindata/${coin.id}.txt`, 'utf8').toString().split("\n");
            midnightValue =CryptoFileContent.find ( e => e.startsWith('0:00')).split(',')[1]
             
            console.log(11111111,midnightValue, 'current',currentValue )
            let coinPercentChange =  ( (currentValue-midnightValue)*100)/midnightValue
            coinPercentChange=coinPercentChange.toFixed(2)
            
            if (Number(coinPercentChange) > 0){
                coinPercentChange='+'+ coinPercentChange
            }
            


        await ctx.replyWithHTML(`⚙️ Настройки монеты ${coin.name} \n\n`
         +`Изменение за сутки ${coinPercentChange}% \n`+
         `Текущая цена $${currentValue} \n`+
         `Минимум  $${minValue} \n`+
         `Максимум $${maxValue} \n`+
         `Отслеживать изменение цены на ${percentChange}% или на ${valueChange}$ `,editCoinKeyboard)
     
    
        
     
     
   
 } catch(err) {
        console.log(err)
        await ctx.reply('Произошла ошибка. Попробуйте позже')
    }       
    
})

bot.command('coins',async ctx => {
    try{
const callbackArray=fs.readFileSync('./callbacks.txt', 'utf8').split('\n')
callbackArray.pop()
const tgUserId= ctx.message.from.id
const userCoins=callbackArray.filter( c=> c.startsWith(`${tgUserId};`))
if(userCoins.length>=1) { 
let coinList=[]
userCoins.forEach ( c => coinList.push(c.split(';')[1]  ) )
let growCoinText='', fallCoinText=''
const res= await axios.get( `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinList}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=1h%2C24h&locale=en&precision=2` )
        if( res) {
        const data=res.data
        console.log(data)
        data.forEach( crypto => {
            let midnightValue=0
             
            const CryptoFileContent=fs.readFileSync(`./coindata/${crypto.id}.txt`, 'utf8').toString().split("\n");
            midnightValue =CryptoFileContent.find ( e => e.startsWith('0:00')).split(',')[1]
             
            console.log(crypto.current_price, '   ',midnightValue )
            let percentChange =  ( (crypto.current_price-midnightValue)*100)/midnightValue
            percentChange=percentChange.toFixed(2)
            if( crypto.current_price > midnightValue){
            
             
            growCoinText+=`<b>${crypto.name}</b> ${crypto.current_price}$    +${percentChange}% 🚀\n`
                 
            }else{
                fallCoinText+=`<b>${crypto.name}</b> ${crypto.current_price}$    ${percentChange}% 🔙\n`
                 
            }

        })
         
            

        }

const changeCoinsKeyboard = Markup.inlineKeyboard([
        [ Markup.button.callback('Настроить монеты' , 'changeCoins')],
         
     ]);
     if( growCoinText){
        growCoinText=`Сегодня растут: \n  ${growCoinText}`
     } 
     if( fallCoinText){
        fallCoinText=`Сегодня падают: \n  ${fallCoinText}`
     }
      
    ctx.replyWithHTML('🆕 Мои монеты \n\n ' +
     growCoinText+ fallCoinText +
     '\n Для добавления токена нажмите /add_coin'
    , changeCoinsKeyboard )
}else{
 await ctx.reply('У вас еще не добавлены монеты')
}
} catch(err) {
        console.log(err)
        await ctx.reply('Произошла ошибка. Попробуйте позже')
    }    

})


bot.action('changeCoins',async ctx => {
    try{
const callbackArray=fs.readFileSync('./callbacks.txt', 'utf8').split('\n')
callbackArray.pop()
const tgUserId= ctx.update.callback_query.from.id
const userCoins=callbackArray.filter( c=> c.startsWith(`${tgUserId};`))
if(userCoins.length>=1) {
let coinList=[], changeText=''
  userCoins.forEach ( c => {
    
     const [userId, coinId,percentChange ,valueChange]=c.split(';')
     const coin=coinArr.find( c=> c.id===coinId ) 
     coinList.push(coin) 
     changeText+=`${coin.name} 🔔 ${percentChange} % или ${valueChange}$    /EDIT_${coin.id}\n`
  })
   
  const listCoinsKeyboard = Markup.inlineKeyboard([
    [ Markup.button.callback('⚙️Изменить % всех монет' , 'changePercentAllCoins'),
    Markup.button.callback('🗑 Удалить все монеты' , 'deleteAllCoins')],
     
 ]);
  await ctx.replyWithHTML('🆕 Настройки монет \n\n ' +
    'Нажмите <b>EDIT</b> для настройки конкретной монеты\n' + changeText
     
    , listCoinsKeyboard )
} else{
    await ctx.reply('У вас не монет' ) 
}

} catch(err) {
        console.log(err)
        await ctx.reply('Произошла ошибка. Попробуйте позже')
    }    
})

bot.action('deleteAllCoins',async ctx => {
    try{

    const tgUserId= ctx.update.callback_query.from.id
    const fileCBContent=fs.readFileSync('./callbacks.txt', 'utf8').toString();
    const callbackArray=fileCBContent.split('\n')
    callbackArray.pop()
    coinList=callbackArray.filter( c=> c.startsWith(tgUserId))
    coinList=coinList.map( c=> c.split(';')[1])
     
    
    const replace = `^${tgUserId};.*\n`;
    const  reg = new RegExp(replace,"gm");
    const fileNewContent=fileCBContent.replace(reg, '');
    //delete coins which not used in file callbacks.txt
    coinList.forEach( coin => {
    if( !fileNewContent.includes(`;${coin};`)) {
    fs.unlinkSync(`./coindata/${coin}.txt`);
    }  
    })
    fs.writeFileSync('./callbacks.txt', fileNewContent )
    await ctx.replyWithHTML('🗑 Удаление монет \n\n ' +
    'Все монеты из вашего списка были удалены'  )
} catch(err) {
        console.log(err)
        await ctx.reply('Произошла ошибка. Попробуйте позже')
    }    
})


bot.action(/^deleteCoin_/,async ctx => {
    try{
    const coinId=ctx.match.input.slice(11)  
    const tgUserId= ctx.update.callback_query.from.id
    console.log(tgUserId)
    const fileCBContent=fs.readFileSync('./callbacks.txt', 'utf8').toString();
    const replace = `^${tgUserId};${coinId}.*\n`;
    const  reg = new RegExp(replace,"gm");
    console.log(reg)
    const fileNewContent=fileCBContent.replace(reg, '');
    if( !fileNewContent.includes(`;${coinId};`)) {
      //delete file with coin values
    fs.unlinkSync(`./coindata/${coinId}.txt`);
     }
    fs.writeFileSync('./callbacks.txt', fileNewContent )
    await ctx.replyWithHTML('🗑 Удаление монет \n\n ' +
    `Монета ${coinId} удалена и больше не отслеживается`)
} catch(err) {
        console.log(err)
        await ctx.reply('Произошла ошибка. Попробуйте позже')
}    
})

bot.action(/^changePercent_/,async ctx => {
    try{
    const coinId=ctx.match.input.slice(14) 
    ctx.session.stepChangePercent=1
    ctx.session.CoinForChange=coinId
    await ctx.replyWithHTML(`⚙️ Настройки монеты ${coinId} \n\n`
    +'Введите новый % порога изменения цены  и абсолютное изменение цены в долларах за сутки для отслеживания. Вводите через пробел. Пример: 5 200')
} catch(err) {
        console.log(err)
        await ctx.reply('Произошла ошибка. Попробуйте позже')
    }    
})

bot.action('changePercentAllCoins',async ctx => {
    ctx.session.stepChangePercentAllCoins=1
     
    await ctx.replyWithHTML(`⚙️ Настройки монет   \n\n`
    +'Введите новый % порога изменения цены  и абсолютное изменение цены в долларах за сутки для отслеживания. Вводите через пробел. Пример: 5 200')
})

bot.action(/^select_/,async ctx => {
    try{
    const coinTicker=ctx.match.input.slice(7)
    const tgUserId= ctx.update.callback_query.from.id
    const coin= coinArr.find( c=> c.symbol===coinTicker)
    const callbackArray=fs.readFileSync('./callbacks.txt', 'utf8').split('\n')
    if( callbackArray.length>=1){
        callbackArray.pop()
        console.log(callbackArray)
        const existsRecord= callbackArray.find ( e => e.startsWith(`${tgUserId};${coin.id};`))
        if(existsRecord){
            return await  ctx.replyWithHTML('🆕 Добавление монеты \n\n'
            +`Монета ${coinTicker} уже в списке` )
        }
        
    }
     
    // Если нет файла в /coindata для токена,то создаем и вставляем значение в 00-00
    if (!fs.existsSync(`./coindata/${coin.id}.txt`)){
        const now = new Date();
        const year=now.getFullYear()
        const month=now.getMonth()
        const day=now.getDate()
        const startOfDay = new Date(year, month, day).getTime()
        const unixTimeFrom=startOfDay/1000
        
        const unixTimeTo=unixTimeFrom+ 390
         
         
         
         console.log('unixTimeFrom ', unixTimeFrom)
            console.log('unixTimeTo ', unixTimeTo)
        const res= await axios.get( `https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart/range?vs_currency=usd&from=${unixTimeFrom}&to=${unixTimeTo}&precision=2` )
        if( res) {
            
            const data=res.data 
            console.log(data)
            if (data.prices.length >=1){
                
            const pricesArr= data.prices[0]
            const  midnightPrice= pricesArr[1]
            console.log(midnightPrice)
            fs.appendFileSync(`./coindata/${coin.id}.txt`, `0:00,${midnightPrice}\n` )
            }
        }  
    }
   
    fs.appendFileSync('./callbacks.txt', `${tgUserId};${coin.id};5;100;onetime;0\n`)
    await  ctx.replyWithHTML('🆕 Добавление монеты \n\n'
    +`Добавлена монета ${coinTicker} . Зайдите /coins в для редактирования условий уведомлений`)

    } catch(err) {
        console.log(err)
        await ctx.reply('Произошла ошибка. Попробуйте позже')
    }    
})


bot.launch().then(() => console.log('Started'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
cron.schedule('*/3 * * * *', async () => { //     запуск каждые 10 минут
    try{
    const now = new Date();
     const hours = now.getHours();
     const minutes = now.getMinutes();
     const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
     const formattedTime=hours+ ':'+formattedMinutes
     console.log('******************'+formattedTime)
     let midnightFlag=false
     if(formattedTime==='0:00'){
      midnightFlag=true
     }
     //если время 0:00 ,то удаляем файлы по токенам в папке coindata за прошлый день и не сравниваеми , не делаем уведомления юзерам 
     // и выставляем onetime;0
     if(midnightFlag){
        console.log('midnight true')   
        const fileCBContent=fs.readFileSync('./callbacks.txt', 'utf8').toString();
        const fileNewContent=fileCBContent.replace(/onetime;1/g, 'onetime;0');
        fs.writeFileSync('./callbacks.txt', fileNewContent )
        fsExtra.emptyDirSync('./coindata')
     }
     
     
    
    const fileContent=fs.readFileSync('./callbacks.txt', 'utf8').toString().split("\n");
    
    fileContent.pop()
    console.log('filecontent: ',fileContent )
    if( fileContent.length< 1)
    return;
    console.log('skip return')
     const cryptoArr=[]
      
     fileContent.forEach ( e=> {
       
        const cryptoName=e.split(';')[1]
        if(!cryptoArr.includes(cryptoName)) {
        cryptoArr.push(cryptoName)
        }
               
     } )
      
     console.log('cryptoarr:' + cryptoArr)
     const cryptoList=cryptoArr.toString()
     let cryptoCompareData=[]
     const res= await axios.get( `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${cryptoList}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=1h%2C24h&locale=en&precision=2` )
        if( res) {
            
            const data=res.data
            data.forEach( crypto => {
                 
                let MidnightValue=0
                if ( !midnightFlag) { //if not iteration at 00-00
                     console.log('midnight flag false -get midnight value from files /coindata')
                const CryptoFileContent=fs.readFileSync(`./coindata/${crypto.id}.txt`, 'utf8').toString().split("\n");
                MidnightValue =CryptoFileContent.find ( e => e.startsWith('0:00')).split(',')[1]
                }

                const cryptoRates={ id: crypto.id, current_price: crypto.current_price ,startDay_price: MidnightValue}
                cryptoCompareData.push(cryptoRates)
                
                fs.appendFileSync(`./coindata/${crypto.id}.txt`, `${hours}:${formattedMinutes},${crypto.current_price}\n` )
            })
        }
          
         
        if ( !midnightFlag) { //if not iteration at 00-00 
        console.log('compare old,new prices and inform users')
        
        fileContent.forEach(e=> {
             const informRecordArray=e.split(';')
             const userTgId=informRecordArray[0]
             const informPeriod=informRecordArray[4]
             const sentNotificationFlag=Number(informRecordArray[5] )
             const cryptoName=informRecordArray[1]
             const percentRequired=Number( informRecordArray[2] )
             const valueDiffRequired= Number( informRecordArray[3] )  
            if(!sentNotificationFlag) {
                console.log('cryptoName',cryptoName)
            const crypto=cryptoCompareData.find( e=> e.id==cryptoName)

            console.log('crtypoe found: ',crypto)
            console.log('here',crypto.current_price, '  ', crypto.startDay_price )
            
            let percentChange =  ( (crypto.current_price-crypto.startDay_price)*100)/crypto.startDay_price
            percentChange=percentChange.toFixed(2)
            const percentChangeBase=Math.abs(percentChange)
            let valueChange=Math.abs(crypto.current_price-crypto.startDay_price).toFixed(2)
            valueChange=Number(valueChange)
            console.log(valueChange)
            console.log(valueDiffRequired)
            
             
            if( percentChangeBase >=percentRequired) {
            const fileCBContent=fs.readFileSync('./callbacks.txt', 'utf8').toString();
            const newLine=e.replace('onetime;0', 'onetime;1')
             
            const fileNewContent=fileCBContent.replace(e,newLine);
            fs.writeFileSync('./callbacks.txt', fileNewContent )
            if (percentChange < 0){
            bot.telegram.sendMessage(userTgId ,`🔻️ ${cryptoName} ${percentChange}% Текущая цена: $${crypto.current_price}  ` ) 
            }else{
                bot.telegram.sendMessage(userTgId ,`🚀  ${cryptoName} +${percentChange}% Текущая цена: $${crypto.current_price}  ` ) 
            }
             
            }else if (valueChange>=valueDiffRequired) {
                console.log('информирование по изменению значения цены')
                const fileCBContent=fs.readFileSync('./callbacks.txt', 'utf8').toString();
                const newLine=e.replace('onetime;0', 'onetime;1')
                const fileNewContent=fileCBContent.replace(e,newLine);
                fs.writeFileSync('./callbacks.txt', fileNewContent )

                if (percentChange < 0){
                    bot.telegram.sendMessage(userTgId ,`Токен достиг заданного абсолютного изменения цены\n 🔻️ ${cryptoName} ${percentChange}% Текущая цена: $${crypto.current_price}  ` ) 
                    }else{
                    bot.telegram.sendMessage(userTgId ,`Токен достиг заданного абсолютного изменения цены\n 🚀  ${cryptoName} +${percentChange}% Текущая цена: $${crypto.current_price}  ` ) 
                    }

            }
            console.log(percentChange,'------------------')
        }
             
        } )
        }
        
    } catch(err) {
        console.log(err)
    }    
  });