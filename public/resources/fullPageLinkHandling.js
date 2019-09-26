var fullPage = 'standalone' in navigator && navigator.standalone === true
function handleFullPageLinks() {
    if (!fullPage) return
    $('a').click(event => {
        var newLocation = $(event.target).attr('href')
        if (
            newLocation !== undefined && 
            newLocation.substr(0, 1) !== '#' && 
            (
                newLocation.substr(0, 1) === '/' ||
                newLocation.includes(location.hostname)
            )
        ) {
            event.preventDefault()
            loader.show()
            if (navigator.onLine) location.href = newLocation
        }
    })
}