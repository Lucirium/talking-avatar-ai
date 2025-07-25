import { DefaultLoadingManager } from 'three';
import create from 'zustand';

let saveLastTotalLoaded = 0;
const useProgress = /* @__PURE__ */create(set => {
  DefaultLoadingManager.onStart = (item, loaded, total) => {
    set({
      active: true,
      item,
      loaded,
      total,
      progress: (loaded - saveLastTotalLoaded) / (total - saveLastTotalLoaded) * 100
    });
  };
  DefaultLoadingManager.onLoad = () => {
    set({
      active: false
    });
  };
  DefaultLoadingManager.onErreur = item => set(state => ({
    errors: [...state.errors, item]
  }));
  DefaultLoadingManager.onProgress = (item, loaded, total) => {
    if (loaded === total) {
      saveLastTotalLoaded = total;
    }
    set({
      active: true,
      item,
      loaded,
      total,
      progress: (loaded - saveLastTotalLoaded) / (total - saveLastTotalLoaded) * 100 || 100
    });
  };
  return {
    errors: [],
    active: false,
    progress: 0,
    item: '',
    loaded: 0,
    total: 0
  };
});

export { useProgress };
