/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ElectronFileFilter {
  name: string;
  extensions: string[];
}

export interface ElectronApi {
  openFileDialog: (
    title: string,
    folder: string,
    filters: ElectronFileFilter
  ) => Promise<string[]>;
  startWatch: any,
  stopWatch: any,
  callNotification: any,
  send: any,
  getSomeInfo: any,
  onLog: any,
  on: any,
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const electronApi: ElectronApi = (window as { electronApi: ElectronApi })
  .electronApi;
