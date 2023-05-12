class EDSM {
    constructor() {
        this.data = {}
        this.dataError = false
    }

    request(url) {
        return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('HTTP error' + response.status)
            }
            return response.json()
        })
        .then(json => this.data = json)
        .catch(() => this.dataError = true)
    }
}