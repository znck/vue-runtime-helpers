<template>
  <h1 class="test">Hello {{ who }}</h1>
</template>

<script>
export default {
  data() {
    return { who: 'World' }
  }
}
</script>

<style>
.test {
  color: red;
}
</style>
