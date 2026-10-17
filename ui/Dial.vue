<template>
  <Teleport to="body">
    <div v-if="cfg.button.visible && anchorVisible && bridge.pageVisible && !bridge.headerPending" ref="root" class="ff-speed-dial"
      :class="{ 'ff-speed-dial-open': opened, 'ff-speed-dial-labelled': labels, 'ff-speed-dial-shadow': cfg.theme.shadow, 'ff-speed-dial-radial': radial, 'ff-speed-dial-panel-transparent': transparent(cfg.theme.background) }"
      :data-widget="widgetId" :data-direction="direction" :data-shape="primeType" :data-mode="cfg.menu.mode" :style="rootStyle" @keydown.capture="keydown">
      <div v-if="opened && cfg.menu.overlay" class="ff-speed-dial-overlay" aria-hidden="true" @pointerdown="close(true)" />
      <SpeedDial ref="dial" :visible="opened" @show="opened=true" @hide="opened=false" :model="model" :direction="direction" :type="primeType" :radius="radiusValue" unstyled
        :disabled="!cfg.button.enabled" :hide-on-click-outside="false" :transition-delay="0" :pt="passThrough">
        <template #button="{ toggleCallback }">
          <button ref="trigger" class="ff-speed-dial-button ff-speed-dial-trigger" :class="{ 'ff-speed-dial-transparent': transparent(cfg.button.background) }" type="button" :disabled="!cfg.button.enabled"
            :aria-label="(cfg.button.label || cfg.button.tooltip || 'Actions') + (badgeText ? ' (' + badgeText + ')' : '')" :aria-expanded="opened" aria-haspopup="menu"
            :aria-controls="menuId" :title="cfg.button.tooltip || undefined" :style="buttonStyle" @click="toggle(toggleCallback, $event)">
            <span v-if="triggerIcon" v-bind="iconProps(triggerIcon)" aria-hidden="true" />
            <span v-if="cfg.button.label" class="ff-speed-dial-label">{{ cfg.button.label }}</span>
          </button>
          <!-- Next to the button, not inside it: the button clips overflowing content. -->
          <span v-if="badgeText" class="ff-speed-dial-badge" :style="badgeStyle" aria-hidden="true">{{ badgeText }}</span>
        </template>
        <template #item="{ item }">
          <button class="ff-speed-dial-button ff-speed-dial-action" :class="{ 'ff-speed-dial-transparent': transparent(item.background || cfg.theme.background) }" type="button" role="menuitem" :data-action="item.id"
            :tabindex="opened && item.enabled ? 0 : -1" :disabled="!item.enabled || !cfg.button.enabled" :aria-label="item.label || item.tooltip || item.id"
            :title="item.tooltip || (!labels ? item.label : undefined)" :style="actionStyle(item)" @click="choose(item)">
            <span v-if="item.icon" v-bind="iconProps(item.icon)" aria-hidden="true" />
            <span v-if="labels" class="ff-speed-dial-label">{{ item.label }}</span>
          </button>
        </template>
      </SpeedDial>
    </div>
  </Teleport>
</template>
<script>
import SpeedDial from 'primevue/speeddial'
import './icons.css'
// Readable text colour (dark or white) for a custom hex background; undefined keeps the theme colour,
// also for (mostly) transparent backgrounds where the page behind decides.
function contrastColor (hex) {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(hex || '')
  if (!match || isTransparent(hex)) return undefined
  const h = match[1].length === 3 ? match[1].replace(/./g, '$&$&') : match[1]
  const [r, g, b] = [0, 2, 4].map(i => { const c = parseInt(h.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? '#0f172a' : '#ffffff'
}
function isTransparent (hex) { return /^#[0-9a-f]{6}[0-7][0-9a-f]$/i.test(hex || '') }
// Dashboard 2 publishes its theme as Vuetify variables on :root, so they also reach the teleported widget.
const palettes = {
  auto: { background: 'rgb(var(--v-theme-surface, 255, 255, 255))', color: 'rgb(var(--v-theme-on-surface, 15, 23, 42))' },
  light: { background: '#ffffff', color: '#0f172a' },
  dark: { background: '#1e293b', color: '#f8fafc' }
}
export default {
  components: { SpeedDial }, props: ['bridge', 'widgetId', 'select', 'anchorElement'],
  data: () => ({ centerPosition: {}, opened: false, direction: 'up', listStyle: {}, groupPosition: {}, anchorVisible: true, reduced: false, badgeLeft: false, badgeBelow: false }),
  computed: {
    cfg () { return this.bridge.config },
    // Group and header buttons follow an element of the page; floating ones are placed in the viewport.
    anchored () { return this.bridge.scope === 'group' || !!this.bridge.headerAnchor },
    // Counter: '' and 0 hide it, numbers above 99 show as 99+, short texts as they are.
    badgeText () {
      const value = this.cfg.button.badge
      if (value === '' || value === null || value === undefined) return ''
      const number = typeof value === 'number' ? value : /^\s*-?\d+(\.\d+)?\s*$/.test(value) ? Number(value) : null
      if (number === null) return String(value).trim()
      return number === 0 ? '' : number > 99 ? '99+' : String(number)
    },
    badgeStyle () {
      const b = this.cfg.button
      // The ring separates the badge from the button, in the colour of what is behind it.
      const ring = this.bridge.placement === 'header' ? 'rgb(var(--v-theme-navigation-background, 255, 255, 255))' : 'rgb(var(--v-theme-background, 255, 255, 255))'
      // The badge sits on the corner that faces away from the screen edges, so it is never cut off.
      const corner = { top: this.badgeBelow ? 'auto' : '-6px', bottom: this.badgeBelow ? '-6px' : 'auto', left: this.badgeLeft ? '-6px' : 'auto', right: this.badgeLeft ? 'auto' : '-6px' }
      return { ...corner, background: b.badgeBackground || 'rgb(var(--v-theme-error, 220, 38, 38))', color: b.badgeColor || contrastColor(b.badgeBackground) || '#ffffff', '--sd-badge-ring': ring }
    },
    // An empty close icon keeps the normal icon while the menu is open.
    triggerIcon () { return this.opened && this.cfg.button.closeIcon ? this.cfg.button.closeIcon : this.cfg.button.icon },
    model () { return this.cfg.actions.filter(a => a.visible).map(a => ({ ...a, disabled: !a.enabled })) },
    // Horizontal (left|center|right) and vertical (top|center|bottom) anchor of the configured position.
    axes () {
      // Header buttons sit next to the title (left) or on the right of the app bar, and float there without one.
      if (this.bridge.placement === 'header') return { h: this.bridge.headerSide === 'title' ? 'left' : 'right', v: 'top' }
      const p = this.cfg.button.position
      if (p === 'center') return { h: 'center', v: 'center' }
      const [first, second] = p.split('-')
      return first === 'center' ? { h: second, v: 'center' } : { h: second === 'center' ? 'center' : second, v: first }
    },
    shape () { return this.cfg.menu.mode === 'menu' ? 'linear' : this.cfg.menu.shape },
    // "auto" opens away from the nearest screen edges, matching the first allowed direction of each corner.
    configuredDirection () {
      const d = this.cfg.menu.direction
      if (d !== 'auto') return d
      const { h, v } = this.axes
      if (this.shape === 'quarter-circle') return (v === 'top' ? 'down' : 'up') + '-' + (h === 'left' ? 'right' : 'left')
      if (v !== 'center') return v === 'top' ? 'down' : 'up'
      return h === 'left' ? 'right' : h === 'right' ? 'left' : 'up'
    },
    // PrimeVue divides by (n - 1) for semi and quarter circles, so a single action falls back to a short linear row.
    primeType () { return this.shape !== 'linear' && this.shape !== 'circle' && this.model.length < 2 ? 'linear' : this.shape },
    radial () { return this.primeType !== 'linear' },
    labels () { return this.cfg.menu.mode === 'menu' || (this.cfg.menu.showLabels && !this.radial) },
    radiusValue () {
      const m = this.cfg.menu
      if (m.radius > 0) return m.radius
      const n = this.model.length
      const arcs = { circle: 2 * Math.PI / Math.max(n, 1), 'semi-circle': Math.PI / Math.max(n - 1, 1), 'quarter-circle': Math.PI / 2 / Math.max(n - 1, 1) }
      const chord = n > 1 ? (m.actionSize + m.gap) / (2 * Math.sin(Math.min(arcs[this.primeType] || Math.PI, Math.PI) / 2)) : 0
      return Math.ceil(Math.max(chord, (this.cfg.button.size + m.actionSize) / 2 + m.gap))
    },
    palette () { return palettes[this.cfg.theme.mode] || palettes.auto },
    // In a group the widget reserves enough room for the button and its offset from the group edge.
    groupMinHeight () {
      const b = this.cfg.button
      return b.size + 2 * (this.axes.v === 'center' ? 8 : b.offsetY)
    },
    menuId () { return 'ff-speed-dial-menu-' + this.widgetId },
    passThrough () {
      return { root: { class: 'ff-speed-dial-prime' }, list: { id: this.menuId, class: 'ff-speed-dial-list', style: this.listStyle, 'aria-hidden': !this.opened, tabindex: -1 }, item: { class: 'ff-speed-dial-item' } }
    },
    rootStyle () {
      const b = this.cfg.button
      const style = {
        '--sd-size': b.size + 'px', '--sd-action-size': this.cfg.menu.actionSize + 'px', '--sd-gap': this.cfg.menu.gap + 'px',
        '--sd-duration': (this.reduced ? 0 : this.cfg.menu.duration) + 'ms', '--sd-radius': this.cfg.theme.radius + 'px',
        '--sd-background': this.cfg.theme.background || this.palette.background,
        '--sd-color': this.cfg.theme.color || contrastColor(this.cfg.theme.background) || this.palette.color, zIndex: this.cfg.theme.zIndex
      }
      if (this.anchored) return { ...style, ...this.groupPosition }
      const { h, v } = this.axes
      // Centred axes are placed from the measured button size (no transform, so the fixed overlay stays viewport-sized).
      if (v === 'center') Object.assign(style, { top: this.centerPosition.top })
      else style[v] = `max(env(safe-area-inset-${v}, 0px), min(${b.offsetY}px, max(8px, calc(100dvh - ${b.size + 8}px))))`
      if (h === 'center') Object.assign(style, { left: this.centerPosition.left })
      else style[h] = `max(env(safe-area-inset-${h}, 0px), min(${b.offsetX}px, max(8px, calc(100vw - ${b.size + 8}px))))`
      return style
    },
    buttonStyle () {
      const b = this.cfg.button
      const style = {
        background: b.background || 'rgb(var(--v-theme-primary, 13, 116, 206))',
        // A transparent button shows its icon in the primary colour, like a text button.
        color: b.color || contrastColor(b.background) || (isTransparent(b.background) ? 'rgb(var(--v-theme-primary, 13, 116, 206))' : 'rgb(var(--v-theme-on-primary, 255, 255, 255))'),
        borderRadius: b.radius + 'px'
      }
      // Without a label the button is an exact square, so very small sizes work too.
      if (!b.label) Object.assign(style, { width: b.size + 'px', height: b.size + 'px', padding: '0', '--sd-icon': Math.min(24, Math.max(6, b.size * 0.5)) + 'px' })
      return style
    }
  },
  watch: {
    'bridge.config': { deep: true, handler () { this.close(false); this.direction = this.baseDirection(); this.$nextTick(this.resize) } },
    groupMinHeight: { immediate: true, handler (value) { if (this.bridge.scope === 'group') this.anchorElement.style.minHeight = value + 'px' } },
    'bridge.headerAnchor' (slot) {
      // The app bar moves the placeholder when titles or other header content change.
      if (slot) this.resizeObserver?.observe(slot.parentElement || slot)
      this.$nextTick(this.resize)
    }
  },
  mounted () {
    this.direction = this.baseDirection()
    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.motionChanged = () => { this.reduced = this.motionQuery.matches }
    this.motionChanged(); this.motionQuery.addEventListener('change', this.motionChanged)
    this.outside = event => { if (this.opened && !this.$refs.root?.contains(event.target)) this.close(false) }
    this.escape = event => { if (this.opened && event.key === 'Escape') { event.preventDefault(); this.close(true) } }
    document.addEventListener('pointerdown', this.outside)
    document.addEventListener('keydown', this.escape)
    window.addEventListener('resize', this.resize)
    window.addEventListener('scroll', this.resize, true)
    window.visualViewport?.addEventListener('resize', this.resize)
    this.resizeObserver = new ResizeObserver(this.resize)
    this.resizeObserver.observe(this.anchorElement)
    this.resize()
  },
  beforeUnmount () {
    document.removeEventListener('pointerdown', this.outside)
    document.removeEventListener('keydown', this.escape)
    window.removeEventListener('resize', this.resize)
    window.removeEventListener('scroll', this.resize, true)
    window.visualViewport?.removeEventListener('resize', this.resize)
    this.motionQuery?.removeEventListener('change', this.motionChanged)
    this.resizeObserver?.disconnect()
  },
  methods: {
    // Linear rows only know four directions; a diagonal one keeps its vertical part.
    baseDirection () {
      const d = this.configuredDirection
      if (this.primeType === 'linear') return d.split('-')[0]
      return this.shape === 'semi-circle' && d.includes('-') ? d.split('-')[0] : d
    },
    // Item centres relative to the trigger centre, mirroring PrimeVue's own formulas.
    radialCenters () {
      const n = this.model.length
      const r = this.radiusValue
      const d = this.direction
      return this.model.map((_, i) => {
        if (this.primeType === 'circle') { const t = 2 * Math.PI / n * i; return [r * Math.cos(t), r * Math.sin(t)] }
        const t = (this.primeType === 'semi-circle' ? Math.PI : Math.PI / 2) / (n - 1) * i
        const x = r * Math.cos(t); const y = r * Math.sin(t)
        if (d === 'up') return [x, -y]
        if (d === 'down') return [x, y]
        if (d === 'left') return [-y, x]
        if (d === 'right') return [y, x]
        if (d === 'up-left') return [-x, -y]
        if (d === 'up-right') return [x, -y]
        if (d === 'down-left') return [-y, x]
        return [y, x]
      })
    },
    placeRadial () {
      const trigger = this.$refs.trigger
      const size = this.cfg.menu.actionSize
      if (!trigger) return
      const tr = trigger.getBoundingClientRect()
      // PrimeVue centres items with these variables and swaps x/y for the sideways directions.
      const horizontal = (tr.width - size) / 2 + 'px'; const vertical = (tr.height - size) / 2 + 'px'
      const swapped = ['left', 'right', 'down-left', 'down-right'].includes(this.direction)
      const vars = { '--p-item-diff-x': swapped ? vertical : horizontal, '--p-item-diff-y': swapped ? horizontal : vertical }
      const cx = tr.left + tr.width / 2; const cy = tr.top + tr.height / 2
      const pts = this.radialCenters()
      let dx = 0; let dy = 0
      if (pts.length) {
        const left = Math.min(...pts.map(p => cx + p[0] - size / 2)); const right = Math.max(...pts.map(p => cx + p[0] + size / 2))
        const top = Math.min(...pts.map(p => cy + p[1] - size / 2)); const bottom = Math.max(...pts.map(p => cy + p[1] + size / 2))
        dx = left < 8 ? 8 - left : right > window.innerWidth - 8 ? window.innerWidth - 8 - right : 0
        dy = top < 8 ? 8 - top : bottom > window.innerHeight - 8 ? window.innerHeight - 8 - bottom : 0
      }
      this.listStyle = { ...vars, transform: dx || dy ? `translate(${dx}px, ${dy}px)` : undefined }
    },
    // PrimeIcons are bundled, Material Design Icons come from the Dashboard's own stylesheet,
    // images are drawn as a mask so they take the icon colour like the font icons.
    iconProps (icon) {
      if (icon.startsWith('pi-')) return { class: ['ff-speed-dial-icon', 'pi', icon] }
      if (icon.startsWith('mdi-')) return { class: ['ff-speed-dial-icon', 'mdi', icon] }
      const image = `url("${icon}")`
      return { class: ['ff-speed-dial-icon', 'ff-speed-dial-image'], style: { maskImage: image, WebkitMaskImage: image } }
    },
    transparent (hex) { return isTransparent(hex) },
    actionStyle (item) { return { background: item.background || undefined, color: item.color || contrastColor(item.background) || undefined } },
    close (focus) { this.$refs.dial?.hide(); this.opened = false; if (focus) this.$nextTick(() => this.$refs.trigger?.focus()) },
    toggle (callback, event) {
      if (!this.cfg.button.enabled) return
      this.direction = this.baseDirection()
      callback(event)
      if (this.opened) this.$nextTick(this.place)
    },
    choose (item) {
      if (!item.enabled || !item.visible || !this.cfg.button.enabled) return
      this.select(item.id)
      if (this.cfg.menu.closeOnSelect) this.close(true)
    },
    resize () {
      const slot = this.bridge.headerAnchor
      if (slot) {
        const buttonRect = this.$refs.trigger?.getBoundingClientRect()
        const width = buttonRect?.width || this.cfg.button.size
        const height = buttonRect?.height || this.cfg.button.size
        // The placeholder reserves exactly the button's room in the header.
        if (slot.style.width !== width + 'px' || slot.style.height !== height + 'px') Object.assign(slot.style, { width: width + 'px', height: height + 'px' })
        const r = slot.getBoundingClientRect()
        this.anchorVisible = slot.isConnected
        this.groupPosition = { left: Math.max(0, Math.min(r.left, window.innerWidth - width)) + 'px', top: Math.max(0, r.top) + 'px' }
      } else if (this.bridge.scope === 'group') {
        const r = this.anchorElement.getBoundingClientRect()
        const b = this.cfg.button
        this.anchorVisible = r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth
        const buttonRect = this.$refs.trigger?.getBoundingClientRect()
        const width = buttonRect?.width || b.size
        const height = buttonRect?.height || b.size
        const { h, v } = this.axes
        const x = h === 'left' ? r.left + b.offsetX : h === 'right' ? r.right - b.offsetX - width : (r.left + r.right) / 2 - width / 2
        const y = v === 'top' ? r.top + b.offsetY : v === 'bottom' ? r.bottom - b.offsetY - height : (r.top + r.bottom) / 2 - height / 2
        this.groupPosition = { left: Math.max(8, Math.min(x, window.innerWidth - width - 8)) + 'px', top: Math.max(8, Math.min(y, window.innerHeight - height - 8)) + 'px' }
      }
      if (this.bridge.scope !== 'group') {
        const buttonRect = this.$refs.trigger?.getBoundingClientRect()
        const width = buttonRect?.width || this.cfg.button.size
        const height = buttonRect?.height || this.cfg.button.size
        this.centerPosition = { left: Math.max(8, (window.innerWidth - width) / 2) + 'px', top: Math.max(8, (window.innerHeight - height) / 2) + 'px' }
      }
      this.$nextTick(() => {
        const r = this.$refs.trigger?.getBoundingClientRect()
        if (!r) return
        // Buttons on the right get the badge on their left; no room above moves it below.
        this.badgeLeft = this.axes.h === 'right' || r.right + 8 > window.innerWidth
        this.badgeBelow = r.top < 8
      })
      if (this.opened) this.$nextTick(this.place)
    },
    place () {
      const root = this.$refs.root
      const list = root?.querySelector('.ff-speed-dial-list')
      if (!root || !list) return
      if (this.radial) { this.direction = this.baseDirection(); this.placeRadial(); return }
      const rect = root.getBoundingClientRect()
      const gap = this.cfg.menu.gap
      const available = { up: rect.top - gap - 8, down: window.innerHeight - rect.bottom - gap - 8, left: rect.left - gap - 8, right: window.innerWidth - rect.right - gap - 8 }
      const n = this.model.length
      const labelWidth = this.labels ? Math.min(280, Math.max(120, ...this.model.map(a => a.label.length * 8 + 68))) : this.cfg.menu.actionSize
      // A menu is always one column of rows; the other styles line their buttons up along the direction.
      const need = this.cfg.menu.mode === 'menu'
        ? direction => (direction === 'up' || direction === 'down' ? 40 * n + 8 : labelWidth)
        : direction => (direction === 'up' || direction === 'down' ? this.cfg.menu.actionSize : labelWidth) * n + Math.max(0, n - 1) * gap
      const wanted = this.baseDirection()
      // Prefer configured direction. If space is insufficient, choose the axis with most usable room.
      const direction = available[wanted] >= Math.min(need(wanted), 160) ? wanted : Object.keys(available).sort((a, b) => available[b] - available[a])[0]
      this.direction = direction
      const vertical = direction === 'up' || direction === 'down'
      const edge = direction === 'up' ? 'bottom' : direction === 'down' ? 'top' : direction === 'left' ? 'right' : 'left'
      const style = { [edge]: 'calc(100% + var(--sd-gap))', maxHeight: (vertical ? Math.max(44, available[direction]) : window.innerHeight - 16) + 'px', maxWidth: (vertical ? window.innerWidth - 16 : Math.max(44, available[direction])) + 'px' }
      if (vertical) style[rect.left > window.innerWidth / 2 ? 'right' : 'left'] = '0'
      else style.top = '0'
      this.listStyle = style
      this.$nextTick(() => {
        if (!this.opened || !this.$refs.root) return
        const r = list.getBoundingClientRect()
        const dx = r.left < 8 ? 8 - r.left : r.right > window.innerWidth - 8 ? window.innerWidth - 8 - r.right : 0
        const dy = r.top < 8 ? 8 - r.top : r.bottom > window.innerHeight - 8 ? window.innerHeight - 8 - r.bottom : 0
        this.listStyle = { ...style, transform: `translate(${dx}px, ${dy}px)` }
      })
    },
    keydown (event) {
      const buttons = () => [...this.$refs.root.querySelectorAll('.ff-speed-dial-action:not(:disabled)')]
      const trigger = event.target === this.$refs.trigger
      const navigation = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.close(true); return }
      if (event.key === 'Tab') { this.close(false); return }
      if (!navigation.includes(event.key) && !(['Enter', ' '].includes(event.key) && !trigger)) return
      event.preventDefault(); event.stopPropagation()
      if (!this.cfg.button.enabled) return
      if (!this.opened) { this.$refs.dial.show(); this.opened = true; this.$nextTick(this.place) }
      this.$nextTick(() => {
        const items = buttons()
        if (!items.length) return
        const index = items.indexOf(document.activeElement)
        if (event.key === 'Enter' || event.key === ' ') { if (index >= 0) items[index].click(); return }
        const backwards = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : index < 0 ? (backwards ? items.length - 1 : 0) : (index + (backwards ? -1 : 1) + items.length) % items.length
        items[next].focus()
      })
    }
  }
}
</script>
<style>
.ff-speed-dial { position:fixed; isolation:isolate; width:max-content; max-width:calc(100vw - 16px); font:inherit; color:var(--sd-color); }
.ff-speed-dial .ff-speed-dial-prime { position:relative; }
.ff-speed-dial .ff-speed-dial-overlay { position:fixed; inset:0; z-index:-1; background:#0006; touch-action:manipulation; }
.ff-speed-dial .ff-speed-dial-button { display:inline-flex; align-items:center; justify-content:center; gap:10px; border:1px solid #8884; padding:10px; margin:0; font:inherit; line-height:1.25; cursor:pointer; touch-action:manipulation; background:var(--sd-background); color:var(--sd-color); max-width:100%; }
.ff-speed-dial .ff-speed-dial-button:focus-visible { outline:3px solid #60a5fa; outline-offset:3px; }
.ff-speed-dial .ff-speed-dial-button:not(:disabled):hover { filter:brightness(0.94); }
.ff-speed-dial .ff-speed-dial-button:disabled { opacity:.45; cursor:default; }
.ff-speed-dial .ff-speed-dial-trigger { min-height:var(--sd-size); min-width:var(--sd-size); overflow:hidden; }
.ff-speed-dial .ff-speed-dial-icon { display:inline-block; line-height:1; flex-shrink:0; }
.ff-speed-dial .ff-speed-dial-image { width:1em; height:1em; background-color:currentColor; -webkit-mask:center / contain no-repeat; mask:center / contain no-repeat; }
.ff-speed-dial .ff-speed-dial-trigger .ff-speed-dial-icon { font-size:var(--sd-icon, 24px); }
.ff-speed-dial .ff-speed-dial-label { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ff-speed-dial .ff-speed-dial-list { position:absolute; display:flex; gap:var(--sd-gap); list-style:none; padding:3px; margin:0; width:max-content; overflow:auto; overscroll-behavior:contain; scrollbar-width:thin; transition:opacity var(--sd-duration); }
.ff-speed-dial:not(.ff-speed-dial-open) .ff-speed-dial-list { visibility:hidden; pointer-events:none; opacity:0; }
.ff-speed-dial .ff-speed-dial-item { list-style:none; flex-shrink:0; padding:0; margin:0; display:flex; transition:opacity var(--sd-duration), transform var(--sd-duration); }
.ff-speed-dial:not(.ff-speed-dial-open) .ff-speed-dial-item { transform:scale(.85); opacity:0; }
.ff-speed-dial .ff-speed-dial-action { min-height:var(--sd-action-size); width:var(--sd-action-size); min-width:var(--sd-action-size); border-radius:var(--sd-radius); }
.ff-speed-dial .ff-speed-dial-action .ff-speed-dial-icon { font-size:20px; }
.ff-speed-dial.ff-speed-dial-labelled .ff-speed-dial-action { width:auto; max-width:min(280px, calc(100vw - 24px)); justify-content:flex-start; }
.ff-speed-dial.ff-speed-dial-radial .ff-speed-dial-prime { display:flex; }
.ff-speed-dial.ff-speed-dial-radial .ff-speed-dial-list { display:block; inset:0; width:auto; padding:0; overflow:visible; pointer-events:none; }
.ff-speed-dial.ff-speed-dial-radial .ff-speed-dial-item { position:absolute; pointer-events:auto; }
.ff-speed-dial.ff-speed-dial-shadow .ff-speed-dial-button { box-shadow:0 4px 14px #0003; }
/* Menu list: one panel with full-width rows in reading order, instead of separate buttons. */
.ff-speed-dial[data-mode="menu"] .ff-speed-dial-list { flex-direction:column !important; gap:0; padding:4px; background:var(--sd-background); color:var(--sd-color); border:1px solid #8884; border-radius:var(--sd-radius); }
.ff-speed-dial[data-mode="menu"].ff-speed-dial-shadow .ff-speed-dial-list { box-shadow:0 6px 20px #0003; }
.ff-speed-dial .ff-speed-dial-badge { position:absolute; top:-6px; right:-6px; z-index:1; display:inline-flex; align-items:center; justify-content:center; min-width:20px; height:20px; padding:0 6px; box-sizing:border-box; border-radius:10px; font-size:11px; font-weight:700; line-height:1; white-space:nowrap; pointer-events:none; box-shadow:0 0 0 2px var(--sd-badge-ring); }
/* A transparent background means nothing but the icon: no border and no shadow either. */
.ff-speed-dial .ff-speed-dial-button.ff-speed-dial-transparent { border-color:transparent; box-shadow:none; }
.ff-speed-dial[data-mode="menu"].ff-speed-dial-panel-transparent .ff-speed-dial-list { border-color:transparent; box-shadow:none; }
.ff-speed-dial[data-mode="menu"]:not(.ff-speed-dial-open) .ff-speed-dial-item { transform:none; }
.ff-speed-dial[data-mode="menu"] .ff-speed-dial-list .ff-speed-dial-action { width:100%; max-width:min(280px, calc(100vw - 32px)); min-height:40px; padding:8px 12px; border:0; border-radius:calc(var(--sd-radius) * .6); background:transparent; box-shadow:none; }
.ff-speed-dial[data-mode="menu"] .ff-speed-dial-list .ff-speed-dial-action:not(:disabled):hover { filter:none; background:color-mix(in srgb, currentColor 10%, transparent); }
@media(prefers-reduced-motion:reduce) { .ff-speed-dial .ff-speed-dial-list, .ff-speed-dial .ff-speed-dial-item { transition:none; } }
</style>
