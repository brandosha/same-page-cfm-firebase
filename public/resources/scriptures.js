/* Page crawling script. Open table of contents and maximize everything before running
console.log(JSON.stringify([...document.getElementsByClassName('subItems-2yUxK')[0].children].map(el => { var href,children = [...el.children]; if (children.length < 2) { console.log(el); href = children[0].href; return { name: children[0].textContent.trim().toLowerCase(),chapters: 1,path: href.substr(52,href.length-53)} }; href = children[1].children[0].children[0].href; href = href.substr(52,href.length-53); return { name: children[0].textContent.trim().toLowerCase(),chapters: children[1].children.length,path: href} } )))
*/

/* Phantomjs script. Set scriptureData variable to result from page crawling script removing title pages
var page = require('webpage').create();
function getChapterLengths(index) {
    if (index >= scriptureData.length) {
        console.log(JSON.stringify(scriptureData))
        phantom.exit()
        return
    }
    var data = scriptureData[index]
    var chapterLengths = []
    function forFunc(i) {
        if (i >= data.chapters) {
            scriptureData[index].verses = chapterLengths
            getChapterLengths(index + 1)
            return
        }
        var chapter = i+1
        var chapterPage = 'http://www.churchofjesuschrist.org/study/scriptures' + data.path + chapter

        page.open(chapterPage, function(status) {
            if (status === 'success') {
                var verses = page.evaluate(function() {
                    return document.getElementsByClassName('verse').length
                })
                chapterLengths.push(verses)
            } else {
                console.log('Could not open page ' + chapterPage + ' STATUS: ' + status)
            }
            setTimeout(function() { forFunc(chapter) }, 100)
        })
    }
    forFunc(0)
}
getChapterLengths(0)
*/


var scriptures = [
    // Old Testament
    {
        name: "genesis",
        chapters: 50,
        verses: [31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26],
        path: "/ot/gen/"
    }, {
        name: "exodus",
        chapters: 40,
        verses: [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34],
        path: "/ot/ex/"
    }, {
        name: "leviticus",
        chapters: 27,
        verses: [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34],
        path: "/ot/lev/"
    }, {
        name: "numbers",
        chapters: 36,
        verses: [54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13],
        path: "/ot/num/"
    }, {
        name: "deuteronomy",
        chapters: 34,
        verses: [46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12],
        path: "/ot/deut/"
    }, {
        name: "joshua",
        chapters: 24,
        verses: [18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33],
        path: "/ot/josh/"
    }, {
        name: "judges",
        chapters: 21,
        verses: [36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25],
        path: "/ot/judg/"
    }, {
        name: "ruth",
        chapters: 4,
        verses: [22,23,18,22],
        path: "/ot/ruth/"
    }, {
        name: "1 samuel",
        chapters: 31,
        verses: [28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,42,15,23,29,22,44,25,12,25,11,31,13],
        path: "/ot/1-sam/"
    }, {
        name: "2 samuel",
        chapters: 24,
        verses: [27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25],
        path: "/ot/2-sam/"
    }, {
        name: "1 kings",
        chapters: 22,
        verses: [53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53],
        path: "/ot/1-kgs/"
    }, {
        name: "2 kings",
        chapters: 25,
        verses: [18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30],
        path: "/ot/2-kgs/"
    }, {
        name: "1 chronicles",
        chapters: 29,
        verses: [54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30],
        path: "/ot/1-chr/"
    }, {
        name: "2 chronicles",
        chapters: 36,
        verses: [17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23],
        path: "/ot/2-chr/"
    }, {
        name: "ezra",
        chapters: 10,
        verses: [11,70,13,24,17,22,28,36,15,44],
        path: "/ot/ezra/"
    }, {
        name: "nehemiah",
        chapters: 13,
        verses: [11,20,32,23,19,19,73,18,38,39,36,47,31],
        path: "/ot/neh/"
    }, {
        name: "esther",
        chapters: 10,
        verses: [22,23,15,17,14,14,10,17,32,3],
        path: "/ot/esth/"
    }, {
        name: "job",
        chapters: 42,
        verses: [22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,30,24,34,17],
        path: "/ot/job/"
    }, {
        name: "psalms",
        chapters: 150,
        verses: [6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,7,12,15,21,10,20,14,9,6],
        path: "/ot/ps/"
    }, {
        name: "proverbs",
        chapters: 31,
        verses: [33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31],
        path: "/ot/prov/"
    }, {
        name: "ecclesiastes",
        chapters: 12,
        verses: [18,26,22,16,20,12,29,17,18,20,10,14],
        path: "/ot/eccl/"
    }, {
        name: "song of solomon",
        chapters: 8,
        verses: [17,17,11,16,16,13,13,14],
        path: "/ot/song/"
    }, {
        name: "isaiah",
        chapters: 66,
        verses: [31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24],
        path: "/ot/isa/"
    }, {
        name: "jeremiah",
        chapters: 52,
        verses: [19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34],
        path: "/ot/jer/"
    }, {
        name: "lamentations",
        chapters: 5,
        verses: [22,22,66,22,22],
        path: "/ot/lam/"
    }, {
        name: "ezekiel",
        chapters: 48,
        verses: [28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35],
        path: "/ot/ezek/"
    }, {
        name: "daniel",
        chapters: 12,
        verses: [21,49,30,37,31,28,28,27,27,21,45,13],
        path: "/ot/dan/"
    }, {
        name: "hosea",
        chapters: 14,
        verses: [11,23,5,19,15,11,16,14,17,15,12,14,16,9],
        path: "/ot/hosea/"
    }, {
        name: "joel",
        chapters: 3,
        verses: [20,32,21],
        path: "/ot/joel/"
    }, {
        name: "amos",
        chapters: 9,
        verses: [15,16,15,13,27,14,17,14,15],
        path: "/ot/amos/"
    }, {
        name: "obadiah",
        chapters: 1,
        verses: [21],
        path: "/ot/obad/"
    }, {
        name: "jonah",
        chapters: 4,
        verses: [17,10,10,11],
        path: "/ot/jonah/"
    }, {
        name: "micah",
        chapters: 7,
        verses: [16,13,12,13,15,16,20],
        path: "/ot/micah/"
    }, {
        name: "nahum",
        chapters: 3,
        verses: [15,13,19],
        path: "/ot/nahum/"
    }, {
        name: "habakkuk",
        chapters: 3,
        verses: [17,20,19],
        path: "/ot/hab/"
    }, {
        name: "zephaniah",
        chapters: 3,
        verses: [18,15,20],
        path: "/ot/zeph/"
    }, {
        name: "haggai",
        chapters: 2,
        verses: [15,23],
        path: "/ot/hag/"
    }, {
        name: "zechariah",
        chapters: 14,
        verses: [21,13,10,14,11,15,14,23,17,12,17,14,9,21],
        path: "/ot/zech/"
    }, {
        name: "malachi",
        chapters: 4,
        verses: [14,17,18,6],
        path: "/ot/mal/"
    },
    // New Testament
    {
        name: "matthew",
        chapters: 28,
        path: "/nt/matt/",
        verses: [25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39, 28, 27, 35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20]
    }, {
        name: "mark",
        chapters: 16,
        path: "/nt/mark/",
        verses: [45, 28, 35, 41, 43, 56, 37, 38, 50, 52, 33, 44, 37, 72, 47, 20]
    }, {
        name: "luke",
        chapters: 24,
        path: "/nt/luke/",
        verses: [80, 52, 38, 44, 39, 49, 50, 56, 62, 42, 54, 59, 35, 35, 32, 31, 37, 43, 48, 47, 38, 71, 56, 53]
    }, {
        name: "john",
        chapters: 21,
        path: "/nt/john/",
        verses: [51, 25, 36, 54, 47, 71, 53, 59, 41, 42, 57, 50, 38, 31, 27, 33, 26, 40, 42, 31, 25]
    }, {
        name: "acts",
        chapters: 28,
        path: "/nt/acts/",
        verses: [26, 47, 26, 37, 42, 15, 60, 40, 43, 48, 30, 25, 52, 28, 41, 40, 34, 28, 41, 38, 40, 30, 35, 27, 27, 32, 44, 31]
    }, {
        name: "romans",
        chapters: 16,
        path: "/nt/rom/",
        verses: [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27]
    }, {
        name: "1 corinthians",
        chapters: 16,
        path: "/nt/1-cor/",
        verses: [31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24]
    }, {
        name: "2 corinthians",
        chapters: 13,
        path: "/nt/2-cor/",
        verses: [24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14]
    }, {
        name: "galatians",
        chapters: 6,
        path: "/nt/gal/",
        verses: [24, 21, 29, 31, 26, 18]
    }, {
        name: "ephesians",
        chapters: 6,
        path: "/nt/eph/",
        verses: [23, 22, 21, 32, 33, 24]
    }, {
        name: "philippians",
        chapters: 4,
        path: "/nt/philip/",
        verses: [30, 30, 21, 23]
    }, {
        name: "colossians",
        chapters: 4,
        path: "/nt/col/",
        verses: [29, 23, 25, 18]
    }, {
        name: "1 thessalonians",
        chapters: 5,
        path: "/nt/1-thes/",
        verses: [10, 20, 13, 18, 28]
    }, {
        name: "2 thessalonians",
        chapters: 3,
        path: "/nt/2-thes/",
        verses: [12, 17, 18]
    }, {
        name: "1 timothy",
        chapters: 6,
        path: "/nt/1-tim/",
        verses: [20, 15, 16, 16, 25, 21]
    }, {
        name: "2 timothy",
        chapters: 4,
        path: "/nt/2-tim/",
        verses: [18, 26, 17, 22]
    }, {
        name: "titus",
        chapters: 3,
        path: "/nt/titus/",
        verses: [16, 15, 15]
    }, {
        name: "philemon",
        chapters: 1,
        path: "/nt/philem/",
        verses: [25]
    }, {
        name: "hebrews",
        chapters: 13,
        path: "/nt/heb/",
        verses: [14, 18, 19, 16, 14, 20, 28, 13, 28, 39, 40, 29, 25]
    }, {
        name: "james",
        chapters: 5,
        path: "/nt/james/",
        verses: [27, 26, 18, 17, 20]
    }, {
        name: "1 peter",
        chapters: 5,
        path: "/nt/1-pet/",
        verses: [25, 25, 22, 19, 14]
    }, {
        name: "2 peter",
        chapters: 3,
        path: "/nt/2-pet/",
        verses: [21, 22, 18]
    }, {
        name: "1 john",
        chapters: 5,
        path: "/nt/1-jn/",
        verses: [10, 29, 24, 21, 21]
    }, {
        name: "2 john",
        chapters: 1,
        path: "/nt/2-jn/",
        verses: [13]
    }, {
        name: "3 john",
        chapters: 1,
        path: "/nt/3-jn/",
        verses: [14]
    }, {
        name: "jude",
        chapters: 1,
        path: "/nt/jude/",
        verses: [25]
    }, {
        name: "revelation",
        chapters: 22,
        path: "/nt/rev/",
        verses: [20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18, 24, 21, 15, 27, 21]
    },
    // Book of Mormon
    {
        name: '1 nephi',
        chapters: 22,
        verses: [20,24,31,22,6,22,38,6,22,36,23,42,30,36,39,55,25,24,22,26,31],
        path: '/bofm/1-ne/'
    }, {
        name: '2 nephi',
        chapters: 33,
        verses: [32,30,25,35,34,18,11,25,54,25,8,22,26,6,30,13,25,22,21,34,16,6,22,32,30,33,35,32,14,18,21,9,15],
        path: '/bofm/2-ne/'
    }, {
        name: 'jacob',
        chapters: 7,
        verses: [19,35,14,18,77,13,27],
        path: '/bofm/jacob/'
    }, {
        name: 'enos',
        chapters: 1,
        verses: [27],
        path: '/bofm/enos/'
    }, {
        name: 'jarom',
        chapters: 1,
        verses: [15],
        path: '/bofm/jarom/'
    }, {
        name: 'omni',
        chapters: 1,
        verses: [30],
        path: '/bofm/omni/'
    }, {
        name: 'words of mormon',
        chapters: 1,
        verses: [18],
        path: '/bofm/w-of-m/'
    }, {
        name: 'mosiah',
        chapters: 29,
        verses: Array(29).fill(77),
        path: '/bofm/mosiah/'
    }, {
        name: 'alma',
        chapters: 63,
        verses: Array(63).fill(77),
        path: '/bofm/alma/'
    }, {
        name: 'helaman',
        chapters: 16,
        verses: Array(16).fill(77),
        path: '/bofm/hel/'
    }, {
        name: '3 nephi',
        chapters: 30,
        verses: Array(30).fill(77),
        path: '/bofm/3-ne/'
    }, {
        name: '4 nephi',
        chapters: 1,
        verses: Array(1).fill(77),
        path: '/bofm/4-ne/'
    }, {
        name: 'mormon',
        chapters: 9,
        verses: Array(9).fill(77),
        path: '/bofm/morm/'
    }, {
        name: 'ether',
        chapters: 15,
        verses: Array(15).fill(77),
        path: '/bofm/ether/'
    }, {
        name: 'moroni',
        chapters: 10,
        verses: Array(10).fill(77),
        path: '/bofm/moro/'
    }
]