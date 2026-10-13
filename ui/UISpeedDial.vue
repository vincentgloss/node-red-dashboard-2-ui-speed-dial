<template><div ref="host" class="ff-speed-dial-host" /></template>
<script>
import { createApp, reactive } from 'vue'
import PrimeVue from 'primevue/config'
import Dial from './Dial.vue'
export default {
  name: 'UISpeedDial', props: ['id', 'props', 'state'], inject: ['$socket'],
  mounted () {
    this.bridge = reactive({ config: this.props.speedDialConfig, scope: this.props.scope, dark: false })
    this.innerApp = createApp(Dial, { bridge: this.bridge, anchorElement: this.$refs.host, widgetId: this.id, select: action => this.$socket.emit('widget-change', this.id, { action }) })
    this.innerApp.use(PrimeVue, { unstyled: true, ripple: false })
    this.innerApp.mount(this.$refs.host)
    this.themeElement = this.$refs.host.closest('[class*="v-theme--"]')
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.updateTheme = () => { this.bridge.dark = this.themeElement ? this.themeElement.classList.contains('v-theme--dark') : this.mediaQuery.matches }
    this.themeObserver = new MutationObserver(this.updateTheme)
    if (this.themeElement) this.themeObserver.observe(this.themeElement, { attributes: true, attributeFilter: ['class'] })
    this.mediaQuery.addEventListener('change', this.updateTheme)
    this.updateTheme()
    this.onSnapshot = msg => {
      if (msg?.speedDialConfig) {
        this.bridge.config = msg.speedDialConfig
        this.$store.commit('data/bind', { widgetId: this.id, msg })
      }
    }
    this.onLoad = msg => { this.onSnapshot(msg); this.requestSnapshot() }
    this.requestSnapshot = () => this.$socket.emit('widget-change', this.id, { type: 'load' })
    this.$socket.on('msg-input:' + this.id, this.onSnapshot)
    this.$socket.on('widget-load:' + this.id, this.onLoad)
    this.$socket.on('speed-dial:state:' + this.id, this.onSnapshot)
    this.$socket.on('connect', this.requestSnapshot)
    this.$socket.emit('widget-load', this.id)
  },
  beforeUnmount () {
    this.$socket.off('msg-input:' + this.id, this.onSnapshot)
    this.$socket.off('widget-load:' + this.id, this.onLoad)
    this.$socket.off('speed-dial:state:' + this.id, this.onSnapshot)
    this.$socket.off('connect', this.requestSnapshot)
    this.themeObserver?.disconnect()
    this.mediaQuery?.removeEventListener('change', this.updateTheme)
    this.innerApp?.unmount()
  }
}
</script>
<style>.ff-speed-dial-host { position: relative; height: 100%; min-height: 64px; }</style>
