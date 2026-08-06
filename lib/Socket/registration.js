"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.mobileRegisterFetch =
  exports.mobileRegisterEncrypt =
  exports.mobileRegister =
  exports.mobileRegisterExists =
  exports.mobileRegisterCode =
  exports.registrationParams =
  exports.makeRegistrationSocket =
    void 0;
/* eslint-disable camelcase */
const axios_1 = __importDefault(require("axios"));
const Defaults_1 = require("../Defaults");
const crypto_1 = require("../Utils/crypto");
const crypto = require("crypto");
const WABinary_1 = require("../WABinary");
const business_1 = require("./business");
const SIGNATURE_ANDROID =
  "MIIDMjCCAvCgAwIBAgIETCU2pDALBgcqhkjOOAQDBQAwfDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCkNhbGlmb3JuaWExFDASBgNVBAcTC1NhbnRhIENsYXJhMRYwFAYDVQQKEw1XaGF0c0FwcCBJbmMuMRQwEgYDVQQLEwtFbmdpbmVlcmluZzEUMBIGA1UEAxMLQnJpYW4gQWN0b24wHhcNMTAwNjI1MjMwNzE2WhcNNDQwMjE1MjMwNzE2WjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKQ2FsaWZvcm5pYTEUMBIGA1UEBxMLU2FudGEgQ2xhcmExFjAUBgNVBAoTDVdoYXRzQXBwIEluYy4xFDASBgNVBAsTC0VuZ2luZWVyaW5nMRQwEgYDVQQDEwtCcmlhbiBBY3RvbjCCAbgwggEsBgcqhkjOOAQBMIIBHwKBgQD9f1OBHXUSKVLfSpwu7OTn9hG3UjzvRADDHj+AtlEmaUVdQCJR+1k9jVj6v8X1ujD2y5tVbNeBO4AdNG/yZmC3a5lQpaSfn+gEexAiwk+7qdf+t8Yb+DtX58aophUPBPuD9tPFHsMCNVQTWhaRMvZ1864rYdcq7/IiAxmd0UgBxwIVAJdgUI8VIwvMspK5gqLrhAvwWBz1AoGBAPfhoIXWmz3ey7yrXDa4V7l5lK+7+jrqgvlXTAs9B4JnUVlXjrrUWU/mcQcQgYC0SRZxI+hMKBYTt88JMozIpuE8FnqLVHyNKOCjrh4rs6Z1kW6jfwv6ITVi8ftiegEkO8yk8b6oUZCJqIPf4VrlnwaSi2ZegHtVJWQBTDv+z0kqA4GFAAKBgQDRGYtLgWh7zyRtQainJfCpiaUbzjJuhMgo4fVWZIvXHaSHBU1t5w//S0lDK2hiqkj8KpMWGywVov9eZxZy37V26dEqr/c2m5qZ0E+ynSu7sqUD7kGx/zeIcGT0H+KAVgkGNQCo5Uc0koLRWYHNtYoIvt5R3X6YZylbPftF/8ayWTALBgcqhkjOOAQDBQADLwAwLAIUAKYCp0d6z4QQdyN74JDfQ2WCyi8CFDUM4CaNB+ceVXdKtOrNTQcc0e+t";
const MD5_CLASSES = "I4gwdeQ1EfhdpmnhU7SGBw==";
const ANDROID_KEY =
  "sdvJhddpcZ+tuNfeaKAEhS+L3M1rg7jC3ka49uKKKbOnggnuN2gUAZLlhItnagVE7d0SPOTPPplfGOowd6240Q==";
function urlencode(str) {
  return encodeURIComponent(String(str));
}
const validRegistrationOptions = (config) =>
  (config === null || config === void 0
    ? void 0
    : config.phoneNumberCountryCode) &&
  config.phoneNumberNationalNumber &&
  config.phoneNumberMobileCountryCode;
const makeRegistrationSocket = (config) => {
  const sock = (0, business_1.makeBusinessSocket)(config);
  const register = async (code) => {
    if (!validRegistrationOptions(config.auth.creds.registration)) {
      throw new Error("please specify the registration options");
    }
    const result = await mobileRegister(
      { ...sock.authState.creds, ...sock.authState.creds.registration, code },
      config.options,
    );
    sock.authState.creds.me = {
      id: (0, WABinary_1.jidEncode)(result.login, "s.whatsapp.net"),
      name: "~",
    };
    sock.authState.creds.registered = true;
    sock.ev.emit("creds.update", sock.authState.creds);
    return result;
  };

  const requestRegistrationCode = async (registrationOptions) => {
    registrationOptions = registrationOptions || config.auth.creds.registration;
    if (!validRegistrationOptions(registrationOptions)) {
      throw new Error("Invalid registration options");
    }
    sock.authState.creds.registration = registrationOptions;
    sock.ev.emit("creds.update", sock.authState.creds);
/*
    const existResult = await mobileRegisterExists(
      { ...config.auth.creds, ...registrationOptions },
      config.options,
    );

    console.log(existResult);

    if (existResult.status !== "ok") {
      throw existResult;
    }
*/
    return mobileRegisterCode(
      { ...config.auth.creds, ...registrationOptions },
      config.options,
    );
  };
  return {
    ...sock,
    register,
    requestRegistrationCode,
  };
};

function getAndroidToken(phoneNumber) {
  const sigDecoded = Buffer.from(SIGNATURE_ANDROID, "base64");
  const clsDecoded = Buffer.from(MD5_CLASSES, "base64");
  const phoneBuffer = Buffer.from(phoneNumber);

  const data = Buffer.concat([sigDecoded, clsDecoded, phoneBuffer]);
  const keyDecoded = Buffer.from(ANDROID_KEY, "base64");

  const opad = Buffer.alloc(64);
  const ipad = Buffer.alloc(64);

  for (let i = 0; i < 64; i++) {
    opad[i] = 0x5c ^ keyDecoded[i];
    ipad[i] = 0x36 ^ keyDecoded[i];
  }

  // subHash = hashlib.sha1(ipad + data)
  const subHash = crypto.createHash("sha1");
  subHash.update(Buffer.concat([ipad, data]));
  const subHashDigest = subHash.digest();

  // hash = hashlib.sha1(opad + subHash.digest())
  const finalHash = crypto.createHash("sha1");
  finalHash.update(Buffer.concat([opad, subHashDigest]));

  // result = base64.b64encode(...)
  return finalHash.digest("base64");
}
exports.makeRegistrationSocket = makeRegistrationSocket;
function convertBufferToUrlHex(buffer) {
  var id = "";
  buffer.forEach((x) => {
    // encode random identity_id buffer as percentage url encoding
    id += `%${x.toString(16).padStart(2, "0").toLowerCase()}`;
  });
  return id;
}
function registrationParams(params) {
  const e_regid = Buffer.alloc(4);
  e_regid.writeInt32BE(params.registrationId);
  const e_skey_id = Buffer.alloc(3);
  e_skey_id.writeInt16BE(params.signedPreKey.keyId);
  params.phoneNumberCountryCode = params.phoneNumberCountryCode
    .replace("+", "")
    .trim();
  params.phoneNumberNationalNumber = params.phoneNumberNationalNumber
    .replace(/[/-\s)(]/g, "")
    .trim();
  return {
    cc: params.phoneNumberCountryCode,
    in: params.phoneNumberNationalNumber,
    Rc: "0",
    lg: "en",
    lc: "GB",
    mistyped: "6",
    authkey: Buffer.from(params.noiseKey.public).toString("base64url"),
    e_regid: e_regid.toString("base64url"),
    e_keytype: "BQ",
    e_ident: Buffer.from(params.signedIdentityKey.public).toString("base64url"),
    // e_skey_id: e_skey_id.toString('base64url'),
    e_skey_id: "AAAA",
    e_skey_val: Buffer.from(params.signedPreKey.keyPair.public).toString(
      "base64url",
    ),
    e_skey_sig: Buffer.from(params.signedPreKey.signature).toString(
      "base64url",
    ),
    fdid: params.phoneId,
    network_ratio_type: "1",
    expid: params.deviceId,
    simnum: "1",
    hasinrc: "1",
    pid: Math.floor(Math.random() * 1000).toString(),
    id: convertBufferToUrlHex(params.identityId),
    backup_token: convertBufferToUrlHex(params.backupToken),
    //token: (0, crypto_1.md5)(Buffer.concat([Defaults_1.MOBILE_TOKEN, Buffer.from(params.phoneNumberNationalNumber)])).toString('hex'),
    token: getAndroidToken(params.phoneNumberNationalNumber),
    fraud_checkpoint_code: params.captcha,
  };
}
exports.registrationParams = registrationParams;
/**
 * Requests a registration code for the given phone number.
 */
function mobileRegisterCode(params, fetchOptions) {
  return mobileRegisterFetch("/code", {
    params: {
      ...registrationParams(params),
      mcc: `${params.phoneNumberMobileCountryCode}`.padStart(3, "0"),
      mnc: `${params.phoneNumberMobileNetworkCode || "001"}`.padStart(3, "0"),
      sim_mcc: "000",
      sim_mnc: "000",
      method: params?.method || "sms",
      reason: "",

      sim_type: "1",
      sim_num: "0",
      recaptcha: '{"stage":"ABPROP_DISABLED"}',
      network_radio_type: "1",
      hasincr: "1",
      clicked_education_link: "false",
      call_log_permission: "false",
      education_screen_displayed: "false",
      prefer_sms_over_flash: "false",
      device_ram: "5.59", // Pura-pura HP RAM 6GB
      manage_call_permission: "false",
      client_metric:
        '{"attempts":1,"app_campaign_download_source":"google_play|unknown","was_activated_from_stub":false}',
      airplane_mode_type: "0",
      feo2_query_status: "error_security_exception",
      hasav: "2",
      mistyped: "6",
      roaming_type: "0",
      push_code: "iLJ10zQsCT8=",
      read_phone_permission_granted: "0",
      pid: "12246",
      cellular_strength: Math.floor(Math.random() * 5) + 1, // Sinyal random 1-5
    },
    ...fetchOptions,
  });
}
exports.mobileRegisterCode = mobileRegisterCode;
function mobileRegisterExists(params, fetchOptions) {
  return mobileRegisterFetch("/exist", {
    params: {
      ...registrationParams(params),

      // --- SUNTIKAN PARAMETER ANDROID DARI YOWSUP ---
      gpia: "",
      read_phone_permission_granted: "0",
      offline_ab:
        '{"exposure":["android_confluence_tos_pp_link_update_universe|android_confluence_tos_pp_link_update_exp|control"],"metrics":{}}',
      device_ram: "5.59",
      fid: "",
      language_selector_clicked_count: "0",
      language_selector_time_spent: "0",
      roaming_type: "0",
      mistyped: "7", // Timpa mistyped bawaan Baileys (6) jadi 7 ala Yowsup
      feo2_query_status: "error_security_exception",
      sim_num: "0",
      sim_state: "5",
      airplane_mode_type: "0",
      client_metric:
        '{"attempts":28,"app_campaign_download_source":"google-play|unknown","was_activated_from_stub":false}',
      push_token: "",
      device_name: "sagit", // Pura-pura jadi Xiaomi Mi 6
      hasincr: "1",
      backup_token_error: "null_token",
      network_radio_type: "1",
      network_operator_name: "SMART",
      cellular_strength: Math.floor(Math.random() * 5) + 1, // Sinyal random 1-5
      sim_operator_name: "China Mobile",
      pid: "12246",
    },
    ...fetchOptions,
  });
}
exports.mobileRegisterExists = mobileRegisterExists;
/**
 * Registers the phone number on whatsapp with the received OTP code.
 */
async function mobileRegister(params, fetchOptions) {
  //const result = await mobileRegisterFetch(`/reg_onboard_abprop?cc=${params.phoneNumberCountryCode}&in=${params.phoneNumberNationalNumber}&rc=0`)
  return mobileRegisterFetch("/register", {
    params: {
      ...registrationParams(params),
      code: params.code.replace("-", ""),
    },
    ...fetchOptions,
  });
}
exports.mobileRegister = mobileRegister;
/**
 * Encrypts the given string as AEAD aes-256-gcm with the public whatsapp key and a random keypair.
 */
function mobileRegisterEncrypt(data) {
  const keypair = crypto_1.Curve.generateKeyPair();
  const key = crypto_1.Curve.sharedKey(
    keypair.private,
    Defaults_1.REGISTRATION_PUBLIC_KEY,
  );
  const buffer = (0, crypto_1.aesEncryptGCM)(
    Buffer.from(data),
    new Uint8Array(key),
    Buffer.alloc(12),
    Buffer.alloc(0),
  );
  return Buffer.concat([Buffer.from(keypair.public), buffer]).toString(
    "base64url",
  );
}
exports.mobileRegisterEncrypt = mobileRegisterEncrypt;
async function mobileRegisterFetch(path, opts = {}) {
  let url = `${Defaults_1.MOBILE_REGISTRATION_ENDPOINT}${path}`;
  if (opts.params) {
    const parameter = [];
    for (const param in opts.params) {
      if (opts.params[param] !== null && opts.params[param] !== undefined) {
        if (param === "id" || param === "backup_token") {
          parameter.push(param + "=" + opts.params[param]);
        } else {
          parameter.push(param + "=" + urlencode(opts.params[param]));
        }
      }
    }
    url += `?${parameter.join("&")}`;
    delete opts.params;
  }
  if (!opts.headers) {
    opts.headers = {};
  }
  opts.headers["User-Agent"] =
    "WhatsApp/2.26.13.72 Android/11 Device/Xiaomi-sagit";
  const response = await (0, axios_1.default)(url, opts);
  var json = response.data;
  if (response.status > 300 || json.reason) {
    throw json;
  }
  if (json.status && !["ok", "sent"].includes(json.status)) {
    throw json;
  }
  return json;
}
exports.mobileRegisterFetch = mobileRegisterFetch;
