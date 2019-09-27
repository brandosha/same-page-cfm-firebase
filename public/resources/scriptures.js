/* Page crawling script. Open table of contents and maximize everything before running
console.log(JSON.stringify([...document.getElementsByClassName("subItems-2yUxK")[0].children].map(el=>{var children=[...el.children],chapters=1,href=children[0].href;if(children.length>1){href=children[1].children[0].children[0].href;chapters=children[1].children.length}href=href.substr(52,href.length-53);return{names:[children[0].textContent.trim().toLowerCase()],chapters:chapters,path:href}})))
*/

/* Phantomjs script. Set scriptureData variable to result from page crawling script removing title pages
var page = require('webpage').create();
page.onError = function (_) { }

function getChapterLengths(index) {
    if (index >= scriptureData.length) {
        console.log(JSON.stringify(scriptureData))
        phantom.exit()
        return
    }
    var data = scriptureData[index]
    console.log('Getting chapter lengths for ' + data.name)
    var chapterLengths = []
    function forFunc(i) {
        if (i >= data.chapters) {
            scriptureData[index].verses = chapterLengths
            getChapterLengths(index + 1)
            return
        }
        var chapter = i+1
        console.log('Reading ' + data.name + ' ' + chapter)
        var chapterPage = 'http://www.churchofjesuschrist.org/study/scriptures' + data.path + chapter

        page.open(chapterPage,function(status) {
            if (status === 'success') {
                var verses = page.evaluate(function() {
                    return document.getElementsByClassName('verse').length
                })
                chapterLengths.push(verses)
            } else {
                console.log('Could not open page ' + chapterPage + ' STATUS: ' + status)
            }
            setTimeout(function() { forFunc(chapter) },100)
        })
    }
    forFunc(0)
}
getChapterLengths(0)
*/

function parseMessageForScriptureRef(message) {
    var htmlStr = message
    htmlStr = htmlStr.replace(/</g,'&lt;').replace(/>/g,'&gt;')
    
    var refs = []
    scriptures.forEach(scripture => {
        scripture.names.forEach(scriptureName => {
            var refMatcher = new RegExp('\\b'+scriptureName+' [0-9]{1,3}(:[0-9][0-9,-]*)?', 'g')
            var match;
            while (match = refMatcher.exec(htmlStr.toLowerCase())) {
                refs.unshift({
                    match: match,
                    scripture: scripture,
                    name: scriptureName
                })
            }
        })
    })

    refs = refs.sort((a,b) => b.match.index - a.match.index)
    refs.forEach((ref, i) => {
        var match = ref.match
        var matchStr = match[0]
        if (refs[i-1] !== undefined) {
            var endIndex = match.index + matchStr.length
            if (endIndex > refs[i-1].match.index) {
                var overflow = endIndex - refs[i-1].match.index
                matchStr = matchStr.substr(0, matchStr.length - overflow)
            }
        }

        var numRef = matchStr.substr(ref.name.length + 1)
        var [chapter, verses] = numRef.split(':')

        var chapterInt = parseInt(chapter)
        if (
            isNaN(chapterInt) ||
            chapterInt.toString() !== chapter ||
            chapterInt < 1 ||
            chapterInt > ref.scripture.chapters
        ) return

        var href = 'https://churchofjesuschrist.org/study/scriptures' + ref.scripture.path + chapterInt
        var refLength = matchStr.length
        if (verses === '') refLength -= 1

        if (verses !== undefined && verses !== '') {
            var versesRefLength = verses.length
            
            var maxVerse = ref.scripture.verses[chapterInt - 1]
            var verseNums = verses.split(/[-,]/)
            var validVerses = true
            verseNums.forEach(verseStr => {
                var verse = parseInt(verseStr)
                if (
                    !validVerses || 
                    isNaN(verse) || 
                    verse < 1 || 
                    verse > maxVerse
                ) {
                    versesRefLength -= verseStr.length + 1
                    validVerses = false
                }
            })
            
            var versesRef = verses.substr(0, versesRefLength)
            if (versesRef.length > 0) {
                href += '.' + verses.substr(0, versesRefLength) + '#' + verseNums[0]
                refLength -= (verses.length - versesRefLength)
            } else {
                refLength -= verses.length + 1
            }
        }
        
        htmlStr = insert(htmlStr, '</a>', match.index + refLength)
        htmlStr = insert(htmlStr, '<a href="' + href + '" target="_blank">', match.index)
    })

    return htmlStr
}

function insert(str,insertion,index) {
    return str.substr(0,index) + insertion + str.substr(index)
}

var scriptures = [{
	names: ["genesis", "gen", "gen."],
	chapters: 50,
	path: "/ot/gen/",
	verses: [31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27, 33, 38, 18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43, 55, 32, 20, 31, 29, 43, 36, 30, 23, 23, 57, 38, 34, 34, 28, 34, 31, 22, 33, 26]
}, {
	names: ["exodus", "ex", "ex."],
	chapters: 40,
	path: "/ot/ex/",
	verses: [17, 16, 17, 35, 19, 30, 38, 36, 24, 20, 47, 8, 59, 57, 33, 34, 16, 30, 37, 27, 24, 33, 44, 23, 55, 46, 34]
}, {
	names: ["leviticus", "lev", "lev."],
	chapters: 27,
	path: "/ot/lev/",
	verses: [17, 16, 17, 35, 19, 30, 38, 36, 24, 20, 47, 8, 59, 57, 33, 34, 16, 30, 37, 27, 24, 33, 44, 23, 55, 46, 34]
}, {
	names: ["numbers", "num", "num."],
	chapters: 36,
	path: "/ot/num/",
	verses: [54, 34, 51, 49, 31, 27, 89, 26, 23, 36, 35, 16, 33, 45, 41, 50, 13, 32, 22, 29, 35, 41, 30, 25, 18, 65, 23, 31, 40, 16, 54, 42, 56, 29, 34, 13]
}, {
	names: ["deuteronomy", "deut", "deut."],
	chapters: 34,
	path: "/ot/deut/",
	verses: [46, 37, 29, 49, 33, 25, 26, 20, 29, 22, 32, 32, 18, 29, 23, 22, 20, 22, 21, 20, 23, 30, 25, 22, 19, 19, 26, 68, 29, 20, 30, 52, 29, 12]
}, {
	names: ["joshua", "josh", "josh."],
	chapters: 24,
	path: "/ot/josh/",
	verses: [18, 24, 17, 24, 15, 27, 26, 35, 27, 43, 23, 24, 33, 15, 63, 10, 18, 28, 51, 9, 45, 34, 16, 33]
}, {
	names: ["judges", "judg", "judg."],
	chapters: 21,
	path: "/ot/judg/",
	verses: [36, 23, 31, 24, 31, 40, 25, 35, 57, 18, 40, 15, 25, 20, 20, 31, 13, 31, 30, 48, 25]
}, {
	names: ["ruth"],
	chapters: 4,
	path: "/ot/ruth/",
	verses: [22, 23, 18, 22]
}, {
	names: ["1 samuel", "1 sam", "1 sam."],
	chapters: 31,
	path: "/ot/1-sam/",
	verses: [28, 36, 21, 22, 12, 21, 17, 22, 27, 27, 15, 25, 23, 52, 35, 23, 58, 30, 24, 42, 15, 23, 29, 22, 44, 25, 12, 25, 11, 31, 13]
}, {
	names: ["2 samuel", "2 sam", "2 sam."],
	chapters: 24,
	path: "/ot/2-sam/",
	verses: [27, 32, 39, 12, 25, 23, 29, 18, 13, 19, 27, 31, 39, 33, 37, 23, 29, 33, 43, 26, 22, 51, 39, 25]
}, {
	names: ["1 kings", "1 kgs", "1 kgs."],
	chapters: 22,
	path: "/ot/1-kgs/",
	verses: [53, 46, 28, 34, 18, 38, 51, 66, 28, 29, 43, 33, 34, 31, 34, 34, 24, 46, 21, 43, 29, 53]
}, {
	names: ["2 kings", "2 kgs", "2 kgs."],
	chapters: 25,
	path: "/ot/2-kgs/",
	verses: [18, 25, 27, 44, 27, 33, 20, 29, 37, 36, 21, 21, 25, 29, 38, 20, 41, 37, 37, 21, 26, 20, 37, 20, 30]
}, {
	names: ["1 chronicles", "1 chr", "1 chr."],
	chapters: 29,
	path: "/ot/1-chr/",
	verses: [54, 55, 24, 43, 26, 81, 40, 40, 44, 14, 47, 40, 14, 17, 29, 43, 27, 17, 19, 8, 30, 19, 32, 31, 31, 32, 34, 21, 30]
}, {
	names: ["2 chronicles", "2 chr", "2 chr."],
	chapters: 36,
	path: "/ot/2-chr/",
	verses: [17, 18, 17, 22, 14, 42, 22, 18, 31, 19, 23, 16, 22, 15, 19, 14, 19, 34, 11, 37, 20, 12, 21, 27, 28, 23, 9, 27, 36, 27, 21, 33, 25, 33, 27, 23]
}, {
	names: ["ezra"],
	chapters: 10,
	path: "/ot/ezra/",
	verses: [11, 70, 13, 24, 17, 22, 28, 36, 15, 44]
}, {
	names: ["nehemiah", "neh", "neh."],
	chapters: 13,
	path: "/ot/neh/",
	verses: [11, 20, 32, 23, 19, 19, 73, 18, 38, 39, 36, 47, 31]
}, {
	names: ["esther", "esth", "esth."],
	chapters: 10,
	path: "/ot/esth/",
	verses: [22, 23, 15, 17, 14, 14, 10, 17, 32, 3]
}, {
	names: ["job"],
	chapters: 42,
	verses: [22, 13, 26, 21, 27, 30, 21, 22, 35, 22, 20, 25, 28, 22, 35, 22, 16, 21, 29, 29, 34, 30, 17, 25, 6, 14, 23, 28, 25, 31, 40, 22, 33, 37, 16, 33, 24, 41, 30, 24, 34, 17],
	path: "/ot/job/"
}, {
	names: ["psalms", "ps", "ps."],
	chapters: 150,
	path: "/ot/ps/",
	verses: [6, 12, 8, 8, 12, 10, 17, 9, 20, 18, 7, 8, 6, 7, 5, 11, 15, 50, 14, 9, 13, 31, 6, 10, 22, 12, 14, 9, 11, 12, 24, 11, 22, 22, 28, 12, 40, 22, 13, 17, 13, 11, 5, 26, 17, 11, 9, 14, 20, 23, 19, 9, 6, 7, 23, 13, 11, 11, 17, 12, 8, 12, 11, 10, 13, 20, 7, 35, 36, 5, 24, 20, 28, 23, 10, 12, 20, 72, 13, 19, 16, 8, 18, 12, 13, 17, 7, 18, 52, 17, 16, 15, 5, 23, 11, 13, 12, 9, 9, 5, 8, 28, 22, 35, 45, 48, 43, 13, 31, 7, 10, 10, 9, 8, 18, 19, 2, 29, 176, 7, 8, 9, 4, 8, 5, 6, 5, 6, 8, 8, 3, 18, 3, 3, 21, 26, 9, 8, 24, 13, 10, 7, 12, 15, 21, 10, 20, 14, 9, 6]
}, {
	names: ["proverbs", "prov", "prov."],
	chapters: 31,
	path: "/ot/prov/",
	verses: [33, 22, 35, 27, 23, 35, 27, 36, 18, 32, 31, 28, 25, 35, 33, 33, 28, 24, 29, 30, 31, 29, 35, 34, 28, 28, 27, 28, 27, 33, 31]
}, {
	names: ["ecclesiastes", "eccl", "eccl."],
	chapters: 12,
	path: "/ot/eccl/",
	verses: [18, 26, 22, 16, 20, 12, 29, 17, 18, 20, 10, 14]
}, {
	names: ["song of solomon", "song", "song."],
	chapters: 8,
	path: "/ot/song/",
	verses: [17, 17, 11, 16, 16, 13, 13, 14]
}, {
	names: ["isaiah", "isa", "isa."],
	chapters: 66,
	path: "/ot/isa/",
	verses: [31, 22, 26, 6, 30, 13, 25, 22, 21, 34, 16, 6, 22, 32, 9, 14, 14, 7, 25, 6, 17, 25, 18, 23, 12, 21, 13, 29, 24, 33, 9, 20, 24, 17, 10, 22, 38, 22, 8, 31, 29, 25, 28, 28, 25, 13, 15, 22, 26, 11, 23, 15, 12, 17, 13, 12, 21, 14, 21, 22, 11, 12, 19, 12, 25, 24]
}, {
	names: ["jeremiah", "jer", "jer."],
	chapters: 52,
	path: "/ot/jer/",
	verses: [19, 37, 25, 31, 31, 30, 34, 22, 26, 25, 23, 17, 27, 22, 21, 21, 27, 23, 15, 18, 14, 30, 40, 10, 38, 24, 22, 17, 32, 24, 40, 44, 26, 22, 19, 32, 21, 28, 18, 16, 18, 22, 13, 30, 5, 28, 7, 47, 39, 46, 64, 34]
}, {
	names: ["lamentations", "lam", "lam."],
	chapters: 5,
	path: "/ot/lam/",
	verses: [22, 22, 66, 22, 22]
}, {
	names: ["ezekiel", "ezek", "ezek."],
	chapters: 48,
	path: "/ot/ezek/",
	verses: [28, 10, 27, 17, 17, 14, 27, 18, 11, 22, 25, 28, 23, 23, 8, 63, 24, 32, 14, 49, 32, 31, 49, 27, 17, 21, 36, 26, 21, 26, 18, 32, 33, 31, 15, 38, 28, 23, 29, 49, 26, 20, 27, 31, 25, 24, 23, 35]
}, {
	names: ["daniel", "dan", "dan."],
	chapters: 12,
	path: "/ot/dan/",
	verses: [21, 49, 30, 37, 31, 28, 28, 27, 27, 21, 45, 13]
}, {
	names: ["hosea"],
	chapters: 14,
	path: "/ot/hosea/",
	verses: [11, 23, 5, 19, 15, 11, 16, 14, 17, 15, 12, 14, 16, 9]
}, {
	names: ["joel"],
	chapters: 3,
	path: "/ot/joel/",
	verses: [20, 32, 21]
}, {
	names: ["amos"],
	chapters: 9,
	path: "/ot/amos/",
	verses: [15, 16, 15, 13, 27, 14, 17, 14, 15]
}, {
	names: ["obadiah", "obad", "obad."],
	chapters: 1,
	path: "/ot/obad/",
	verses: [21]
}, {
	names: ["jonah"],
	chapters: 4,
	path: "/ot/jonah/",
	verses: [17, 10, 10, 11]
}, {
	names: ["micah"],
	chapters: 7,
	path: "/ot/micah/",
	verses: [16, 13, 12, 13, 15, 16, 20]
}, {
	names: ["nahum"],
	chapters: 3,
	path: "/ot/nahum/",
	verses: [15, 13, 19]
}, {
	names: ["habakkuk", "hab", "hab."],
	chapters: 3,
	path: "/ot/hab/",
	verses: [17, 20, 19]
}, {
	names: ["zephaniah", "zeph", "zeph."],
	chapters: 3,
	path: "/ot/zeph/",
	verses: [18, 15, 20]
}, {
	names: ["haggai", "hag", "hag."],
	chapters: 2,
	path: "/ot/hag/",
	verses: [15, 23]
}, {
	names: ["zechariah", "zech", "zech."],
	chapters: 14,
	path: "/ot/zech/",
	verses: [21, 13, 10, 14, 11, 15, 14, 23, 17, 12, 17, 14, 9, 21]
}, {
	names: ["malachi", "mal", "mal."],
	chapters: 4,
	path: "/ot/mal/",
	verses: [14, 17, 18, 6]
}, {
	names: ["matthew", "matt", "matt."],
	chapters: 28,
	path: "/nt/matt/",
	verses: [25, 23, 17, 25, 48, 34, 29, 34, 38, 42, 30, 50, 58, 36, 39, 28, 27, 35, 30, 34, 46, 46, 39, 51, 46, 75, 66, 20]
}, {
	names: ["mark"],
	chapters: 16,
	path: "/nt/mark/",
	verses: [45, 28, 35, 41, 43, 56, 37, 38, 50, 52, 33, 44, 37, 72, 47, 20]
}, {
	names: ["luke"],
	chapters: 24,
	path: "/nt/luke/",
	verses: [80, 52, 38, 44, 39, 49, 50, 56, 62, 42, 54, 59, 35, 35, 32, 31, 37, 43, 48, 47, 38, 71, 56, 53]
}, {
	names: ["john"],
	chapters: 21,
	path: "/nt/john/",
	verses: [51, 25, 36, 54, 47, 71, 53, 59, 41, 42, 57, 50, 38, 31, 27, 33, 26, 40, 42, 31, 25]
}, {
	names: ["acts"],
	chapters: 28,
	path: "/nt/acts/",
	verses: [26, 47, 26, 37, 42, 15, 60, 40, 43, 48, 30, 25, 52, 28, 41, 40, 34, 28, 41, 38, 40, 30, 35, 27, 27, 32, 44, 31]
}, {
	names: ["romans", "rom", "rom."],
	chapters: 16,
	path: "/nt/rom/",
	verses: [32, 29, 31, 25, 21, 23, 25, 39, 33, 21, 36, 21, 14, 23, 33, 27]
}, {
	names: ["1 corinthians", "1 cor", "1 cor."],
	chapters: 16,
	path: "/nt/1-cor/",
	verses: [31, 16, 23, 21, 13, 20, 40, 13, 27, 33, 34, 31, 13, 40, 58, 24]
}, {
	names: ["2 corinthians", "2 cor", "2 cor."],
	chapters: 13,
	path: "/nt/2-cor/",
	verses: [24, 17, 18, 18, 21, 18, 16, 24, 15, 18, 33, 21, 14]
}, {
	names: ["galatians", "gal", "gal."],
	chapters: 6,
	path: "/nt/gal/",
	verses: [24, 21, 29, 31, 26, 18]
}, {
	names: ["ephesians", "eph", "eph."],
	chapters: 6,
	path: "/nt/eph/",
	verses: [23, 22, 21, 32, 33, 24]
}, {
	names: ["philippians", "philip", "philip."],
	chapters: 4,
	path: "/nt/philip/",
	verses: [30, 30, 21, 23]
}, {
	names: ["colossians", "col", "col."],
	chapters: 4,
	path: "/nt/col/",
	verses: [29, 23, 25, 18]
}, {
	names: ["1 thessalonians", "1 thes", "1 thes."],
	chapters: 5,
	path: "/nt/1-thes/",
	verses: [10, 20, 13, 18, 28]
}, {
	names: ["2 thessalonians", "2 thes", "2 thes."],
	chapters: 3,
	path: "/nt/2-thes/",
	verses: [12, 17, 18]
}, {
	names: ["1 timothy", "1 tim", "1 tim."],
	chapters: 6,
	path: "/nt/1-tim/",
	verses: [20, 15, 16, 16, 25, 21]
}, {
	names: ["2 timothy", "2 tim", "2 tim."],
	chapters: 4,
	path: "/nt/2-tim/",
	verses: [18, 26, 17, 22]
}, {
	names: ["titus"],
	chapters: 3,
	path: "/nt/titus/",
	verses: [16, 15, 15]
}, {
	names: ["philemon", "philem", "philem."],
	chapters: 1,
	path: "/nt/philem/",
	verses: [25]
}, {
	names: ["hebrews", "heb", "heb."],
	chapters: 13,
	path: "/nt/heb/",
	verses: [14, 18, 19, 16, 14, 20, 28, 13, 28, 39, 40, 29, 25]
}, {
	names: ["james"],
	chapters: 5,
	path: "/nt/james/",
	verses: [27, 26, 18, 17, 20]
}, {
	names: ["1 peter", "1 pet", "1 pet."],
	chapters: 5,
	path: "/nt/1-pet/",
	verses: [25, 25, 22, 19, 14]
}, {
	names: ["2 peter", "2 pet", "2 pet."],
	chapters: 3,
	path: "/nt/2-pet/",
	verses: [21, 22, 18]
}, {
	names: ["1 john", "1 jn", "1 jn."],
	chapters: 5,
	path: "/nt/1-jn/",
	verses: [10, 29, 24, 21, 21]
}, {
	names: ["2 john", "2 jn", "2 jn."],
	chapters: 1,
	path: "/nt/2-jn/",
	verses: [13]
}, {
	names: ["3 john", "3 jn", "3 jn."],
	chapters: 1,
	path: "/nt/3-jn/",
	verses: [14]
}, {
	names: ["jude"],
	chapters: 1,
	path: "/nt/jude/",
	verses: [25]
}, {
	names: ["revelation", "rev", "rev."],
	chapters: 22,
	path: "/nt/rev/",
	verses: [20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18, 24, 21, 15, 27, 21]
}, {
	names: ["1 nephi", "1 ne", "1 ne."],
	chapters: 22,
	path: "/bofm/1-ne/",
	verses: [20, 24, 31, 22, 6, 22, 38, 6, 22, 36, 23, 42, 30, 36, 39, 55, 25, 24, 22, 26, 31]
}, {
	names: ["2 nephi", "2 ne", "2 ne."],
	chapters: 33,
	path: "/bofm/2-ne/",
	verses: [32, 30, 25, 35, 34, 18, 11, 25, 54, 25, 8, 22, 26, 6, 30, 13, 25, 22, 21, 34, 16, 6, 22, 32, 30, 33, 35, 32, 14, 18, 21, 9, 15]
}, {
	names: ["jacob"],
	chapters: 7,
	path: "/bofm/jacob/",
	verses: [19, 35, 14, 18, 77, 13, 27]
}, {
	names: ["enos"],
	chapters: 1,
	path: "/bofm/enos/",
	verses: [27]
}, {
	names: ["jarom"],
	chapters: 1,
	path: "/bofm/jarom/",
	verses: [15]
}, {
	names: ["omni"],
	chapters: 1,
	path: "/bofm/omni/",
	verses: [30]
}, {
	names: ["words of mormon", "w of m", "w of m."],
	chapters: 1,
	path: "/bofm/w-of-m/",
	verses: [18]
}, {
	names: ["mosiah"],
	chapters: 29,
	path: "/bofm/mosiah/",
	verses: [18, 41, 27, 30, 15, 7, 33, 21, 19, 22, 29, 37, 35, 12, 31, 15, 20, 35, 29, 26, 36, 16, 39, 25, 24, 39, 37, 20, 47]
}, {
	names: ["alma"],
	chapters: 63,
	path: "/bofm/alma/",
	verses: [33, 38, 27, 20, 62, 8, 27, 32, 34, 32, 46, 37, 31, 29, 19, 21, 39, 43, 36, 30, 23, 35, 18, 30, 17, 37, 30, 14, 17, 60, 38, 43, 23, 41, 16, 30, 47, 15, 19, 26, 15, 31, 54, 24, 24, 41, 36, 25, 30, 40, 37, 40, 23, 24, 35, 57, 36, 41, 13, 36, 21, 52, 17]
}, {
	names: ["helaman", "hel", "hel."],
	chapters: 16,
	path: "/bofm/hel/",
	verses: [34, 14, 37, 26, 52, 41, 29, 28, 41, 19, 38, 26, 39, 31, 17, 25]
}, {
	names: ["3 nephi", "3 ne", "3 ne."],
	chapters: 30,
	path: "/bofm/3-ne/",
	verses: [30, 19, 26, 33, 26, 30, 26, 25, 22, 19, 41, 48, 34, 27, 24, 20, 25, 39, 36, 46, 29, 17, 14, 18, 6, 21, 33, 40, 9, 2]
}, {
	names: ["4 nephi", "4 ne", "4 ne."],
	chapters: 1,
	path: "/bofm/4-ne/",
	verses: [49]
}, {
	names: ["mormon", "morm", "morm."],
	chapters: 9,
	path: "/bofm/morm/",
	verses: [19, 29, 22, 23, 24, 22, 10, 41, 37]
}, {
	names: ["ether"],
	chapters: 15,
	path: "/bofm/ether/",
	verses: [43, 25, 28, 19, 6, 30, 27, 26, 35, 34, 23, 41, 31, 31, 34]
}, {
	names: ["moroni", "moro", "moro."],
	chapters: 10,
	path: "/bofm/moro/",
	verses: [4, 3, 4, 3, 2, 9, 48, 30, 26, 34]
}, {
	names: ["doctrine and covenants", "d & c", "d&c", "d and c", "dc"],
	chapters: 138,
	path: "/dc-testament/dc/",
	verses: [39, 3, 20, 7, 35, 37, 8, 12, 14, 70, 30, 9, 1, 11, 6, 6, 9, 47, 41, 84, 12, 4, 7, 19, 16, 2, 18, 16, 50, 11, 13, 5, 18, 12, 27, 8, 4, 42, 24, 3, 12, 93, 35, 6, 75, 33, 4, 6, 28, 46, 20, 44, 7, 10, 6, 20, 16, 65, 24, 17, 39, 9, 66, 43, 6, 13, 14, 35, 8, 18, 11, 26, 6, 7, 36, 119, 15, 22, 4, 5, 7, 24, 6, 120, 12, 11, 8, 141, 21, 37, 6, 2, 53, 17, 17, 9, 28, 48, 8, 17, 101, 34, 40, 86, 41, 8, 100, 8, 80, 16, 11, 34, 10, 2, 19, 1, 16, 6, 7, 1, 46, 9, 17, 145, 4, 3, 12, 25, 9, 23, 8, 66, 74, 12, 7, 42, 10, 60]
}, {
	names: ["moses"],
	chapters: 8,
	path: "/pgp/moses/",
	verses: [42, 31, 25, 32, 59, 68, 69, 30]
}, {
	names: ["abraham", "abr", "abr."],
	chapters: 5,
	path: "/pgp/abr/",
	verses: [31, 25, 28, 31, 21]
}, {
	names: ["joseph smith—matthew", "joseph smith-matthew", "joseph smith matthew", "js—m", "js—m.", "js-m", "js-m.", "jsm", "jsm."],
	chapters: 1,
	path: "/pgp/js-m/",
	verses: [55]
}, {
	names: ["joseph smith—history", "joseph smith-history", "joseph smith history", "js—h", "js—h.", "js-h", "js-h.", "jsh", "jsh."],
	chapters: 1,
	path: "/pgp/js-h/",
	verses: [75]
}, {
	names: ["articles of faith", "a of f", "a of f."],
	chapters: 1,
	path: "/pgp/a-of-f/",
	verses: [13]
}]