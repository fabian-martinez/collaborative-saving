import { ref, watch } from 'vue';

const STORAGE_KEY = 'cs_mobile_privacy_hidden';

// Estado global compartido reactivo
const isHidden = ref<boolean>(localStorage.getItem(STORAGE_KEY) === 'true');

watch(isHidden, (newVal) => {
  localStorage.setItem(STORAGE_KEY, String(newVal));
});

export function usePrivacyMode() {
  function togglePrivacy() {
    isHidden.value = !isHidden.value;
  }

  function setPrivacy(value: boolean) {
    isHidden.value = value;
  }

  return {
    isHidden,
    togglePrivacy,
    setPrivacy
  };
}
