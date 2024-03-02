<template>
  <router-view />
</template>

<script lang="ts">


import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'MainLayout',
  setup() {
    const test = ref(false);

    return {
      test,
    };
  },
});
</script>
