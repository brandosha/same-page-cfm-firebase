var loader = Vue.component('loader', {
    template:
    `
    <div class="loader-container">
        <div 
        v-for="(del, index) in delayArr"
        :key="index"
        :class="'d'+del"
        ></div>
    </div>
    `,
    props: ['delays'],
    data () {
        return {
            delayArr: this.delays.split('')
        }
    }
})

var fullPageLoader = Vue.component('full-page-loader', {
    template:
    `
    <div :style="styles">
        <loader :delays="delays"></loader>
    </div>
    `,
    props: ['delays'],
    data: function() {
        return {
            styles: {
                'position': 'fixed',
                'top': 0,
                'right': 0,
                'width': '100%',
                'height': '100%',
                'background-color': 'white',
                'display': 'flex',
                'flex-direction': 'column',
                'justify-content': 'center'
            }
        }
    }
})