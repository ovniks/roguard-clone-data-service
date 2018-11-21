const fs = require('fs')
const jsdom = require("jsdom")
const { JSDOM } = jsdom

function cloneMonsterData(pages) {
    for (let i = 1; i <= pages; i++) {
        if (i === 1) {
            serializeMonsterData('', resp => {
                fs.writeFile(`./database/monster/data${i}.json`, JSON.stringify(resp, null, 4), function (err) {
                    if (err) return console.log(err)
                })
            })
        } else {
            serializeMonsterData('?page=' + i, resp => {
                fs.writeFile(`./database/monster/data${i}.json`, JSON.stringify(resp, null, 4), function (err) {
                    if (err) return console.log(err)
                })
            })
        }
    }
}

function serializeMonsterData(pages, callback) {
    JSDOM.fromURL(`https://www.roguard.net/db/monsters/${pages}`).then(resp => {
        const dom = new JSDOM(resp.serialize());
        const tbody = dom.window.document.querySelector('tbody').innerHTML
        const match = tbody.match(/<tr[\s\S]*?<\/tr>/g)

        const monsterData = [];

        match.forEach(element => {
            const monsterImage = (element.match(/src\s*=\s*\\*"(.+?)\\*"\s*/) !== null) ? element.match(/src\s*=\s*\\*"(.+?)\\*"\s*/)[1] : null
            const monsterName = element.match(/<a (.*)>(.+?)<\/a>/)[2]
            const monsterElement = element.match(/<div style="color: (.*);">(.+?) • (.*)<\/div>/)[2];
            const monsterRace = element.match(/<div style="color: (.*);">(.+?) • (.*)<\/div>/)[3];
            const monsterInfo = element.match(/<td><div>(.+?)<\/div><div>(.+?)<\/div><\/td>/)
            const monsterLevel = monsterInfo[1]
            const monsterHp = monsterInfo[2]
            const monsterExp = element.match(/<td><div>(.* Base Exp)<\/div><div>(.* Job Exp)<\/div><\/td>/)
            const monsterBaseExp = monsterExp[1]
            const monsterJobExp = monsterExp[2]
            const monsterUrl = element.match(/<a href="(.*)">/)[1]

            serializeMonsterFullData(monsterUrl, (resp) => {
                monsterData.push(
                    {
                        'imgsrc': monsterImage,
                        'name': monsterName,
                        'element': monsterElement,
                        'race': monsterRace,
                        'level': monsterLevel,
                        'hp': monsterHp,
                        'base_exp': monsterBaseExp,
                        'job_exp': monsterJobExp,
                        'metadata': resp
                    })

                callback(monsterData)
            })

        })

    })
}

function serializeMonsterFullData(url, callback) {
    JSDOM.fromURL(`https://www.roguard.net${url}`).then(resp => {
        const dom = new JSDOM(resp.serialize());
        const content = dom.window.document.querySelector('#content').innerHTML
        const splitDiv = content.split('<div style="width: 230px; display: inline-block; margin-top: 10px; vertical-align:top; margin-right: 5px;">')

        // monster description
        const monsterDescription = splitDiv[0].match(/<p style="padding: 10px;">(.*)<\/p>/)[1]

        // common data dom element
        const commonDom = new JSDOM(splitDiv[1])
        const commonTbody = commonDom.window.document.querySelector('tbody').innerHTML
        const commonMatch = commonTbody.match(/<tr[\s\S]*?<\/tr>/g)

        // common data
        const monsterLevel = commonMatch[1].match(/<td class="text-right">(.*)<\/td>/)[1]
        const monsterType = commonMatch[2].match(/<td class="text-right">(.*)<\/td>/)[1]
        const monsterZone = commonMatch[3].match(/<td class="text-right">(.*)<\/td>/)[1]
        const monsterRace = commonMatch[4].match(/<td class="text-right"><a href=".*">(.*)<\/a><\/td>/)[1]
        const monsterElement = commonMatch[5].match(/<td class="text-right"><a href=".*">(.*)<\/a><\/td>/)[1]
        const monsterSize = commonMatch[6].match(/<td class="text-right"><a href=".*">(.*)<\/a><\/td>/)[1]
        const monsterPassiveLevel = commonMatch[7].match(/<td class="text-right">(.*)<\/td>/)[1]
        const monsterBaseExp = commonMatch[8].match(/<td class="text-right">(.*)<\/td>/)[1]
        const monsterJobExp = commonMatch[9].match(/<td class="text-right">(.*)<\/td>/)[1]

        // attributes data dom element
        const attributesDom = new JSDOM(splitDiv[2])
        const attributesTbody = attributesDom.window.document.querySelector('tbody').innerHTML
        const attributesMatch = attributesTbody.match(/<tr[\s\S]*?<\/tr>/g)

        // attributes data
        const monsterATK = attributesMatch[0].match(/<td class="text-right">(.*)<\/td>/)[1]
        const monsterMATK = attributesMatch[1].match(/<td class="text-right">(.*)<\/td>/)[1]
        const monsterDEF = attributesMatch[2].match(/<td class="text-right">(.*)<\/td>/)[1]
        const monsterMDEF = attributesMatch[3].match(/<td class="text-right">(.*)<\/td>/)[1]
        const monsterHP = attributesMatch[4].match(/<td class="text-right">(.*)<\/td>/)[1]
        const monsterHit = attributesMatch[5].match(/<td class="text-right">(.*)<\/td>/)[1]
        const monsterFlee = attributesMatch[6].match(/<td class="text-right">(.*)<\/td>/)[1]
        const monsterMoveSpd = attributesMatch[7].match(/<td class="text-right">(.*)<\/td>/)[1]
        const monsterATKSpd = attributesMatch[8].match(/<td class="text-right">(.*)<\/td>/)[1]

        // card data dom element
        const cardTbody = attributesDom.window.document.querySelector('div').innerHTML
        const cardMatch = cardTbody.match(/<div[\s\S]*?<\/div>/g)

        // card data
        const cardImg = cardMatch[0].match(/src="\/\/(.*)"/)[1]
        const cardName = cardMatch[1].match(/<a .*>(.*)<\/a>/)[1]

        let cardEffect = 'unknown'
        let cardBuff = 'unknown'

        if (cardMatch[3].match(/<div .*>(.*)<br>\n(.*)<\/div>/)) {
            cardEffect = cardMatch[3].match(/<div .*>((.*)<br>\n(.*))<\/div>/)[1].replace('<br>\n', ', ')
        } else {
            cardEffect = cardMatch[3].match(/<div .*>(.*)<\/div>/)[1]
        }

        if (cardMatch[5].match(/<div .*>(.*)<br>\n(.*)<\/div>/)) {
            cardBuff = cardMatch[5].match(/<div .*>((.*)<br>\n(.*))<\/div>/)[1].replace('<br>\n', ', ')
        } else {
            cardBuff = cardMatch[5].match(/<div .*>(.*)<\/div>/)[1]
        }

        // drop data dom element        
        const dropDom = splitDiv[2].split('<div style="width: 230px; display: inline-block; margin-top: 10px; vertical-align:top;">')
        const dropElement = dropDom[2].split('<div style="text-align: center; margin-bottom: 4px;">').slice(1)

        // drop data
        const dropList = []
        dropElement.forEach(element => {
            dropList.push(
                {
                    'imgsrc': element.match(/src="\/\/(.*)"/)[1],
                    'name': element.match(/<a .*>(.*)<\/a>/)[1],
                    'drop_rate': element.match(/((.*)%)/)[1].replace(/ /g, "").replace('(', "") })
        });

        // location data dom element
        const locationElement = dropDom[3].split('<div style="text-align: center; margin-top: 5px;">').slice(1)

        // location data
        const locationList = []
        locationElement.forEach(element => {
            locationList.push({
                'location': element.match(/<a .*>(.*)<\/a>/)[1],
                'suggestion_level': element.match(/<\/a>(.*)<\/div>/)[1].replace(/ /g, "")
            })
        })

        const metadata = {
            'description': monsterDescription,
            'common_data': {
                'level': monsterLevel,
                'type': monsterType,
                'zone': monsterZone,
                'race': monsterRace,
                'element': monsterElement,
                'size': monsterSize,
                'passive_level': monsterPassiveLevel,
                'base_exp': monsterBaseExp,
                'job_exp': monsterJobExp
            },
            'attribute_data': {
                'atk': monsterATK,
                'matk': monsterMATK,
                'def': monsterDEF,
                'mdef': monsterMDEF,
                'hp': monsterHP,
                'hit': monsterHit,
                'flee': monsterFlee,
                'move_spd': monsterMoveSpd,
                'atk_spd': monsterATKSpd
            },
            'card_data': {
                'imgsrc': cardImg,
                'name': cardName,
                'effect': cardEffect,
                'perma_buff': cardBuff
            },
            'drop_data': dropList,
            'location_data': locationList
        }

        callback(metadata)
    })
}

module.exports = {

    clone(pages) {
        cloneMonsterData(pages)
    }

}