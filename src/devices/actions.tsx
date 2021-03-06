import { Farmbot } from "farmbot";
import { store } from "../store";
import { devices } from "../device";
import { error, warning, success } from "../logger";
import { Thunk, Everything, ReduxAction } from "../interfaces";
import { put } from "axios";
import { DeviceAccountSettingsUpdate,
         DeviceAccountSettings,
         BotState,
         HardwareState } from "../devices/interfaces";
import { t } from "i18next";
import { Sequence, configKey } from "farmbot/interfaces";
import { MovementRequest } from "farmbot/bot_commands";
import { ErrorResponse, Response, Notification } from "farmbot/jsonrpc";
import { beep } from "../util";

const ON = 1,
  OFF = 0,
  DIGITAL = 0;

export function checkControllerUpdates() {
  let noun = "Check for Updates";
  devices
    .current
    .checkUpdates()
    .then(commandOK(noun), commandErr(noun));
}

export function powerOff() {
  let noun = "Power Off Bot";
  devices
    .current
    .powerOff()
    .then(commandOK(noun), commandErr(noun));
}

export function reboot() {
  let noun = "Reboot Bot";
  devices
    .current
    .reboot()
    .then(commandOK(noun), commandErr(noun));
}

export function checkArduinoUpdates() {
    let noun = "Check Firmware Updates";
  devices
    .current
    .checkArduinoUpdates()
    .then(commandOK(noun), commandErr(noun));
}

export function emergencyStop() {
  let noun = "Emergency stop";
  devices
    .current
    .emergencyStop()
    .then(commandOK(noun), commandErr(noun));
}

export function sync() {
  let noun = "Sync";
  devices
    .current
    .sync()
    .then(commandOK(noun), commandErr(noun));
}

export function execSequence(sequence: Sequence) {
  const noun = "Sequence execution";
  return devices
    .current
    .execSequence(sequence)
    .then(commandOK(noun), commandErr(noun));
}

export let saveAccountChanges: Thunk = function (dispatch, getState) {
  let state = getState();
  let bot = getState().bot.account;
  let url = state.auth.iss;
  return updateDevice(url, bot, dispatch);
};

let commandErr = (noun = "Command") => () => {
  let msg = noun + " request failed.";
  error(msg, t("Farmbot Didn't Get That!"));
};

let commandOK = (noun = "Command") => () => {
  let msg = noun + " request sent to device.";
  success(msg, t("Request sent"));
};

interface UpdateDeviceParams {
  id?: number;
  name?: string;
  uuid?: string;
  webcam_url?: string;
}

export function updateDevice(apiUrl: string, optns: DeviceAccountSettingsUpdate, dispatch: Function) {
  return put<DeviceAccountSettingsUpdate>(apiUrl + "/api/device", optns)
    .then(res => dispatch({ type: "REPLACE_DEVICE_ACCOUNT_INFO", payload: res.data }))
    .catch((payload) => dispatch({ type: "DEVICE_ACCOUNT_ERR", payload }));
  ;
}

export function changeDevice(newAttrs: any) {
  // Flips the "dirty" flag to true.
  return {
    type: "CHANGE_DEVICE",
    payload: newAttrs
  };
}

export function addDevice(deviceAttrs: DeviceAccountSettings): Thunk {
  return (dispatch, getState) => {
    updateDevice(getState().auth.iss, deviceAttrs, dispatch);
  };
}

export function settingToggle(name: configKey, bot: BotState) {
  // TODO : This should be an atomic operation handled at the bot level
  // as a lower level command.
  const noun = "Setting toggle";
  return devices
    .current
    .updateCalibration({
      [name]: ((bot.hardware as any)[name] === 0) ? ON : OFF
    })
    .then(commandOK(noun), commandErr(noun));
};

export function moveRelative(props: MovementRequest) {
  const noun = "Relative movement";

  return devices
    .current
    .moveRelative(props)
    .then(commandOK(noun), commandErr(noun));
}

// TODO: Move this into FarmbotJS,
type pinNum = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export function pinToggle(pin_number: pinNum, bot: BotState) {
  // TODO : This should be an atomic operation handled at the bot level
  // as a lower level command.
  const noun = "Setting toggle";
  let key = `pin${pin_number}`;
  let pin_value = ((bot.hardware as any)[key] === 0) ? ON : OFF;
  return devices
    .current
    .writePin({ pin_number, pin_value, pin_mode: DIGITAL })
    .then(commandOK(noun), commandErr(noun));
}

export function homeAll(speed: number) {
  let noun = "'Home All' command";
  devices
    .current
    .homeAll({ speed })
    .then(commandOK(noun), commandErr(noun));
}

export function readStatus() {
  let noun = "'Read Status' command";
  return devices
    .current
    .readStatus()
    .then(commandOK(noun), commandErr(noun));
}

export function connectDevice(token: string): {} | ((dispatch: any) => any) {
  return (dispatch) => {
    let bot = new Farmbot({ token });
    return bot
      .connect()
      .then(() => {
        devices.current = bot;
        readStatus();
        bot.on("notification",
          function (msg: any) {
            console.warn("You promised you'd fix this!!");
            switch (msg.method) {
              case "status_update":
                dispatch(botNotification(msg));
                beep();
                break;
              case "log_message":
                dispatch(logNotification(msg));
                break;
            };
          });
      }, (err) => dispatch(fetchDeviceErr(err)));
  };
};

function botNotification(statusMessage: Notification<[HardwareState]>) {
  return {
    type: "BOT_CHANGE",
    payload: statusMessage.params[0]
  };
}

function logNotification(botLog:
  Notification<[{ message: string, time: number, status: HardwareState }]>) {
  return {
    type: "BOT_LOG",
    payload: botLog.params[0]
  };
}

function fetchDeviceErr(err: Error) {
  return {
    type: "FETCH_DEVICE_ERR",
    payload: err
  };
}

export interface ChangeSettingsBuffer {
  key: configKey;
  val: number;
};

export function changeSettingsBuffer(key: configKey, val: string):
  ReduxAction<ChangeSettingsBuffer> {

  return {
    type: "CHANGE_SETTINGS_BUFFER",
    payload: { key, val: parseInt(val, 10) }
  };
}

export function changeStepSize(integer: number) {
  return {
    type: "CHANGE_STEP_SIZE",
    payload: integer
  };
}

export function commitAxisChanges() {
  return function (
    dispatch: Function,
    getState: () => Everything) {
    let {axisBuffer, hardware} = getState().bot;
    let speed: number = devices.current.getState()["speed"] as number;
    /** Pick the value in axisBuffer or hardware settings dictionary.
     *  axisBuffer has higher priortiy, but may not be available. */
    function pick(attr: string,
      fallback?: number) {
      return Number(axisBuffer[attr] || (hardware as any)[attr] || fallback);
    };
    let packet: MovementRequest = {
      speed: pick("speed", speed),
      x: pick("x", 0),
      y: pick("y", 0),
      z: pick("z", 0),
    };
    let noun = "Move Absolute Command";
    return devices
      .current
      .moveAbsolute(packet)
      .then(commandOK(noun), commandErr(noun));
  };
}

export function commitSettingsChanges() {
  return function (dispatch: Function,
    getState: () => Everything): Thenable<void> {
    let { settingsBuffer, hardware } = getState().bot;
    let packet = _({})
      .assign(hardware)
      .assign(settingsBuffer)
      .value();
    return devices
      .current
      .updateCalibration(packet)
      .then(
      (resp) => dispatch(commitSettingsChangesOk(resp)),
      (err) => dispatch(commitSettingsChangesErr(err)));
  };
}

function commitSettingsChangesOk(_: any) {
  return {
    type: "COMMIT_SETTINGS_OK",
    payload: {}
  };
}

function commitSettingsChangesErr(_: any) { error(t("Unable to commit settings changes.")); }

export function changeAxisBuffer(key: string, val: number) {
  return {
    type: "CHANGE_AXIS_BUFFER",
    payload: { key, val }
  };
}
