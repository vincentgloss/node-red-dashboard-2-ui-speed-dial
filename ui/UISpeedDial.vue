<template><div ref="host" class="ff-speed-dial-host" /></template>
<script>
import { createApp, reactive } from 'vue'
import PrimeVue from 'primevue/config'
import Dial from './Dial.vue'
export default {
  name: 'UISpeedDial', props: ['id', 'props', 'state'], inject: ['$socket'],
  mounted () {
    const scope = this.props.scope
    const placement = scope === 'group' ? 'group' : this.props.placement === 'header' ? 'header' : 'float'
    // headerPending hides the button until it found its place in the header (or gave up and floats).
    this.bridge = reactive({ config: this.props.speedDialConfig, scope, placement, headerAnchor: null, headerPending: placement === 'header', pageVisible: true })
    // Only a group widget needs room in the layout; floating and header buttons are positioned over the page.
    if (scope !== 'group') Object.assign(this.$refs.host.style, { minHeight: '0', height: '0' })
    this.innerApp = createApp(Dial, { bridge: this.bridge, anchorElement: this.$refs.host, widgetId: this.id, select: action => this.$socket.emit('widget-change', this.id, { action }) })
    this.innerApp.use(PrimeVue, { unstyled: true, ripple: false })
    this.innerApp.mount(this.$refs.host)
    // "Selected pages" is registered for the whole dashboard and shows itself only on those pages.
    if (scope === 'pages') {
      this.stopPageWatch = this.$watch(() => this.$route?.meta?.id, id => { this.bridge.pageVisible = (this.props.pages || []).includes(id) }, { immediate: true })
    }
    if (placement === 'header') {
      this.attachHeader(0)
      this.stopHeaderWatch = this.$watch(() => this.$route?.fullPath, () => this.$nextTick(() => this.attachHeader(0)))
    }
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
  methods: {
    // The Dashboard offers #app-bar-actions for own header content. A placeholder there reserves the room and the
    // button is positioned over it. Without a header (hidden in the Dashboard settings) the button floats top right.
    attachHeader (attempt) {
      if (this.headerSlot?.isConnected) return
      const bar = document.getElementById('app-bar-actions')
      if (!bar) {
        if (attempt < 60) this.headerTimer = requestAnimationFrame(() => this.attachHeader(attempt + 1))
        else Object.assign(this.bridge, { headerAnchor: null, headerPending: false })
        return
      }
      if (!this.headerSlot) {
        this.headerSlot = document.createElement('div')
        this.headerSlot.className = 'ff-speed-dial-header-slot'
      }
      bar.appendChild(this.headerSlot)
      Object.assign(this.bridge, { headerAnchor: this.headerSlot, headerPending: false })
    }
  },
  beforeUnmount () {
    this.$socket.off('msg-input:' + this.id, this.onSnapshot)
    this.$socket.off('widget-load:' + this.id, this.onLoad)
    this.$socket.off('speed-dial:state:' + this.id, this.onSnapshot)
    this.$socket.off('connect', this.requestSnapshot)
    this.stopPageWatch?.()
    this.stopHeaderWatch?.()
    cancelAnimationFrame(this.headerTimer)
    this.headerSlot?.remove()
    this.innerApp?.unmount()
  }
}
</script>
<style>
.ff-speed-dial-host { position: relative; height: 100%; min-height: 64px; }
.ff-speed-dial-header-slot { display: inline-block; flex-shrink: 0; margin: 0 6px; vertical-align: middle; }
</style>
