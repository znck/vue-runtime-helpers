<script>
export default {
  functional: true,
  render(h, { props }) {
    return h('h1', { class: 'test' }, ['Hello ' + props.who])
  }
}
</script>

<style>
.test {
  color: red;
}
</style>
