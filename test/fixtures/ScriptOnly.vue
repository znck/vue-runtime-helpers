<script>
export default {
  data() {
    return { who: 'World' }
  },
  render(h) {
    return h('h1', { class: 'test' }, ['Hello ' + this.who])
  }
}
</script>

<style>
.test {
  color: red;
}
</style>
