<template>
  <div class="container">
    <div class="header">Наблюдение изменений в папке</div>
    <div class="border" />
    <div class="buttons">
      <q-btn
        color="primary"
        size="lg"
        @click="openElectronFileDialog"
        >Выбрать папку</q-btn
      >
      <q-btn
        v-if="folder && folder !== 'Папка не выбрана'"
        :color="isWatching ? 'negative' : 'positive'"
        size="lg"
        @click="handleWatching"
      >
        {{ isWatching ? 'Стоп' : 'Старт' }}
      </q-btn>
      <q-btn
        v-if="logs.length"
        size="lg"
        @click="logs = []"
        >Очистить лог</q-btn
      >
      <q-btn
        v-if="logs.length"
        size="lg"
        @click="saveFile"
        >Сохранить лог в файл</q-btn
      >
    </div>

    <q-card class="my-card card">
      <q-card-section>
        <div v-if="folder === 'Папка не выбрана' || !folder">
          <div class="folder padding-left">Папка не выбрана</div>
        </div>
        <div
          v-else
          class="folder justifyBetween padding-left"
        >
          Выбранная папка: {{ folder }}
          <q-btn
            color="primary"
            @click="deleteFolderWatch"
          >
            Убрать слежение
          </q-btn>
        </div>
      </q-card-section>
    </q-card>

    <q-card
      class="my-card"
      bordered
      flat
    >
      <q-card-section>
        <div class="text-h6 padding-left">Настройки</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="actions padding-left">Какие действия логировать:</div>
        <q-checkbox
          v-model="changes.folderAdd"
          label="Добавление папки"
          size="md"
        />
        <q-checkbox
          v-model="changes.folderDelete"
          label="Удаление папки"
          size="md"
        />
        <q-checkbox
          v-model="changes.fileAdd"
          label="Добавление файла"
          size="md"
        />
        <q-checkbox
          v-model="changes.fileDelete"
          label="Удаление файла"
          size="md"
        />
        <q-checkbox
          v-model="changes.fileChange"
          label="Изменение файла"
          size="md"
        />
      </q-card-section>

      <q-separator inset />

      <q-card-section>
        <div class="actions padding-left">Уведомления:</div>
        <q-checkbox
          :model-value="notifications.win10"
          label="Уведомление для Windows 10"
          size="md"
          @update:model-value="
            (value) => {
              notifications.win10 = value
              notifications.win7 = false
            }
          "
        />
        <q-checkbox
          :model-value="notifications.win7"
          label="Звуковое уведомление для Windows 7"
          size="md"
          @update:model-value="
            (value) => {
              notifications.win7 = value
              notifications.win10 = false
            }
          "
        />
      </q-card-section>
      <q-separator inset />
      <q-card-section>
        <q-checkbox
          v-model="isDeep"
          :disable="isWatching"
          label="Отслеживать изменения во вложенных папках"
          size="md"
          @update:model-value="updateDeep"
        >
          <q-tooltip v-if="isWatching">
            <div class="prompt">Для изменения необходимо остановить слежение</div>
          </q-tooltip>
        </q-checkbox>
      </q-card-section>
      <q-separator inset />
      <q-card-section>
        <q-btn
          color="primary"
          label="Настроить отправку в телеграмм"
          @click="isModalShown = true"
        />
      </q-card-section>
    </q-card>

    <q-card
      v-if="logs.length"
      class="my-card card"
    >
      <q-card-section>
        <div class="logs logsContainer">
          <div class="folder">Логи действий:</div>
          <div
            v-for="(log, index) in logs"
            :key="index"
            :class="classHandler(log.action)"
          >
            {{ log.message }}
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-dialog
      v-model="isModalShown"
      persistent
    >
      <q-card>
        <q-card-section>
          <div class="text-h6">Настройки для телеграмм-бота</div>
        </q-card-section>
        <q-card-section class="q-pt-none modal">
          <q-checkbox
            v-model="isBotActive"
            label="Посылать уведомления чат-боту"
            size="md"
          />
          <q-input
            v-model="token"
            :disable="!isBotActive"
            label="Введите token"
            outlined
          />
          <q-input
            v-model="chatId"
            :disable="!isBotActive"
            label="Введите chat id"
            outlined
          />
        </q-card-section>
        <q-card-section>
          <a
            href="https://sitogon.ru/blog/252-kak-sozdat-telegram-bot-poluchit-ego-token-i-chat-id?ysclid=lt1euonoa0631465213"
            rel="noreferrer"
            target="_blank"
          >
            Инструкция как узнать token и id чата в телеграмм
          </a>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            v-close-popup
            :disabled="isBotActive && (!token || !chatId)"
            color="primary"
            label="OK"
            flat
            @click="onSave"
          />
          <q-tooltip v-if="isBotActive && (!token || !chatId)">
            <div class="prompt">Необходим указать chat_id и токен</div>
          </q-tooltip>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script lang="ts" setup>
import { electronApi } from 'src/api/electron-api'
import { ref, reactive, watch } from 'vue'
import useSound from 'vue-use-sound'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import soundNotice from '../assets/audio/notice.mp3'
import debounce from 'lodash.debounce'

const onSave = () => {
  localStorage.setItem('bot', JSON.stringify(isBotActive.value))
  localStorage.setItem('token', token.value)
  localStorage.setItem('chatId', chatId.value)
}

interface Log {
  path: string | string[]
  action: string
  message: string
}

const folder = ref<string | string[] | undefined>(localStorage.getItem('folder') ?? undefined)
const logs = ref<Log[]>([])
const isWatching = ref(false)

const [play] = useSound(soundNotice)

const changes = reactive<Record<string, boolean>>({
  folderAdd: true,
  folderDelete: true,
  fileAdd: true,
  fileDelete: true,
  fileChange: true,
})

const notifications = reactive<Record<string, boolean>>({
  win10: false,
  win7: false,
})

const isDeep = ref(JSON.parse(localStorage.getItem('deep')!) ?? true)

const isModalShown = ref(false)

const isBotActive = ref(JSON.parse(localStorage.getItem('bot')!) ?? false)
const chatId = ref(localStorage.getItem('chatId') ?? '')
const token = ref(localStorage.getItem('token') ?? '')

const handleWatching = () => {
  if (isWatching.value) {
    return stop()
  }
  return start()
}

const updateDeep = (value: boolean) => {
  if (!isWatching.value) {
    isDeep.value = value
    localStorage.setItem('deep', JSON.stringify(value))
  }
}

const start = () => {
  electronApi.startWatch(folder.value, isDeep.value)
  isWatching.value = true
}

const stop = () => {
  electronApi.stopWatch()
  isWatching.value = false
}

const deleteFolderWatch = () => {
  localStorage.removeItem('folder')
  if (isWatching.value) {
    stop()
    return (folder.value = undefined)
  }
  return (folder.value = undefined)
}

const getNotification = debounce(() => {
  if (notifications.win10) {
    electronApi.callNotification('notice')
  } else if (notifications.win7) {
    play()
  }
}, 2000)

const sendToTelegram = debounce(async (text: string) => {
  if (isBotActive.value) {
    await sendMessage(text)
  }
}, 2000)

const openElectronFileDialog = async () => {
  const response = await electronApi.openFileDialog('AHA', 'folder', {
    name: 'images',
    extensions: ['jpg'],
  })
  if (response) {
    console.log(response)
    if (String(response) === 'Папка не выбрана' && folder.value) {
      return
    }
    folder.value = response
    localStorage.setItem('folder', String(response))
  } else {
    // folder.value = undefined
  }
}

const handleLogsToWatch = (data: Log) => {
  if (changes.folderAdd && data.action === 'folderAdded') {
    logs.value.push(data)
    getNotification()
    sendToTelegram(data.message)
  }
  if (changes.folderDelete && data.action === 'folderDeleted') {
    logs.value.push(data)
    getNotification()
    sendToTelegram(data.message)
  }
  if (changes.fileAdd && data.action === 'fileAdded') {
    logs.value.push(data)
    getNotification()
    sendToTelegram(data.message)
  }
  if (changes.fileDelete && data.action === 'fileDeleted') {
    logs.value.push(data)
    getNotification()
    sendToTelegram(data.message)
  }
  if (changes.fileChange && data.action === 'fileChanged') {
    logs.value.push(data)
    getNotification()
    sendToTelegram(data.message)
  }
}

const broadcastChannel = new BroadcastChannel('logs')

broadcastChannel.addEventListener('message', ({ data }) => {
  handleLogsToWatch(data as Log)
})

const classHandler = (action: string) => {
  if (action === 'fileDeleted' || action === 'folderDeleted') {
    return 'red'
  } else if (action === 'fileAdded' || action === 'folderAdded') {
    return 'green'
  } else {
    return 'blue'
  }
}

const saveFile = () => {
  const data = JSON.stringify(logs.value, null, 2)
  const blob = new Blob([data], { type: 'text/plain' })
  const e = document.createEvent('MouseEvents')
  const a = document.createElement('a')
  a.download = 'logs.json'
  a.href = window.URL.createObjectURL(blob)
  a.dataset.downloadurl = ['text/json', a.download, a.href].join(':')
  e.initEvent('click', true, false)
  a.dispatchEvent(e)
}

const sendMessage = async (text: string) => {
  const url = `https://api.telegram.org/bot${token.value}/sendMessage` // The url to request

  const obj = {
    chat_id: chatId.value, // Telegram chat id
    text: text, // The text to send
  }

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(obj),
  })
}

watch(isBotActive, () => {
  if (!isBotActive.value) {
    token.value = ''
    chatId.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('chatId')
  }
})
</script>

<style>
.header {
  font-size: 38px;
  margin-top: 20px;
  margin-bottom: 20px;
}

.border {
  border-bottom: 1px solid #dcdfe6;
  margin-bottom: 20px;
}

.container {
  padding: 20px;
}

.card {
  margin-top: 20px;
  margin-bottom: 20px;
}

.folder,
.logs,
.actions,
.prompt {
  font-size: 20px;
}

.justifyBetween {
  display: flex;
  justify-content: space-between;
}

.logsContainer {
  max-height: 400px;
  overflow-y: scroll;
}

.padding-left {
  padding-left: 10px;
}

.green {
  color: #21ba45;
}

.red {
  color: #f56c6c;
}

.blue {
  color: #1976d2;
}

.buttons {
  display: flex;
  gap: 20px;
}

.modal {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>
