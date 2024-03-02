<template>
  
  <div class="container">
    <h3>Наблюдение изменений в папке</h3>
    <div class="buttons">
      <q-btn @click="openElectronFileDialog" color="primary" size="lg">Выбрать папку</q-btn>
      <q-btn v-if="logs.length" @click="logs = []" size="lg">Очистить лог</q-btn>
    </div>  

    
     <q-card class="my-card card">
      <q-card-section>
        <div v-if="folder === 'Папка не выбрана' || !folder ">
          <div class="folder">Папка не выбрана</div>
        </div>
        <div v-else class="folder">
          Выбранная папка: {{ folder }}
        </div>
      </q-card-section>
    </q-card>

    <q-card class="my-card card">
        <div class="actions actions__margin">Какие действия логировать:</div>
        <q-checkbox size="md" v-model="changes.folderAdd" label="Добавление папки" />
        <q-checkbox size="md" v-model="changes.folderDelete" label="Удаление папки" />
        <q-checkbox size="md" v-model="changes.fileAdd" label="Добавление файла" />
        <q-checkbox size="md" v-model="changes.fileDelete" label="Удаление файла" />
        <q-checkbox size="md" v-model="changes.fileChange" label="Изменение файла" />
    </q-card>

    <q-card v-if="!isFirstLoading" class="my-card card">
      <q-card-section>
        <div class="logs">
          <div class="folder">Логи действий:</div>
          <div
            v-for="(log, index) in logs"
            :key="index"
            :class="{ 'red': log.action === 'delete', 'green' : log.action === 'change'}"
          >
            {{ log.message }}
          </div>
        </div>
      </q-card-section>
    </q-card>

  </div>

  

    <!-- <div>
      <q-btn @click="logs = []">test send</q-btn>
    </div> -->
    <!-- <div>
      <q-btn @click="getMessage()">test invoke</q-btn>
    </div> -->
    
    
    
</template>

<script lang="ts" setup>
// import { Todo, Meta } from 'components/models';
// import { defineComponent, ref } from 'vue';
// import useStore from 'src/pinia';
import { electronApi } from 'src/api/electron-api';
import { ref, reactive } from 'vue';

interface Log {
  path: string | string[]
  action: 'change' | 'delete'
  message: string
}


const folder = ref<string | string []| undefined>()
const logs = ref<Log[]>([])
const isFirstLoading = ref(true)

const changes = reactive<Record<string, boolean>>({
  folderAdd: true,
  folderDelete: true,
  fileAdd: true,
  fileDelete: true,
  fileChange: true,
})


const openElectronFileDialog = async () => {
  const response = await electronApi.openFileDialog('AHA', 'folder', { name: 'images', extensions: ['jpg'] });
  if (response) {
    isFirstLoading.value = true
    folder.value = response
  } else {
    folder.value = undefined
  }
};

const broadcastChannel = new BroadcastChannel('logs');

broadcastChannel.addEventListener('message', ({ data }) => {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-argument
  logs.value.push(data)
  isFirstLoading.value = false
});

// const getMessage = async () => {
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
//   const info = await electronApi.getSomeInfo()
//   console.log(info)
// }

// // let eventSource: EventSource;
// onMounted(() => {
// //   async () => {
// //     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
// //   const result = await electronApi.ipcRenderer.invoke('getSomeInfo')
// //   console.log('resulst ZDES', result)
// //   // ...
// // }
//   // eventSource = new EventSource('../src-electron/electron-preload.js');
//   //   eventSource.addEventListener('message', (evt) => {
//   //       console.log(evt)
//   //   });
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-call
//   // electronApi.onLog((data:any) => {
//   //   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
//   //   logs.value = data
//   // })

  
  
// })

// somefile.vue
// SEND event to electron-preload.js contextBridge
// electronApi.registerKeys(/*some data*/);

// RECIEVE events from electron-main.js through the electron-preload.js contextBridge
// eslint-disable-next-line @typescript-eslint/no-unsafe-call





 
</script>

<style>

.container {
  padding: 20px;
}

.card {
  margin-top: 20px;
  margin-bottom: 20px;
}

.folder, .logs, .actions {
  font-size: 20px;
}

.actions__margin {
  padding-left: 10px;
  padding-top: 10px;
}

.green {
  color: #21BA45;
}

.red {
  color: #f56c6c;
}

.buttons {
  display: flex;
  gap: 12px;
}

</style>
