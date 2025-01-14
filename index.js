'use strict';

import {
  NativeModules,
  Platform,
  Linking
} from 'react-native';

const RNAppUpdate = NativeModules.RNAppUpdate;

const jobId = -1;

class AppUpdate {
  constructor(options) {
    this.options = options;
  }

  GET(url, success, error) {
    fetch(url)
      .then((response) => response.json())
      .then((json) => {
        success && success(json);
      })
      .catch((err) => {
        error && error(err);
      });
  }

  getApkVersion() {
    if (jobId !== -1) {
      return;
    }
    if (!this.options.apkVersionUrl) {
      console.log("apkVersionUrl doesn't exist.");
      return;
    }
    this.GET(this.options.apkVersionUrl, this.getApkVersionSuccess.bind(this), this.getVersionError.bind(this));
  }

  getApkVersionSuccess(remote) {
    // console.log("getApkVersionSuccess", remote);
    if(RNAppUpdate && RNAppUpdate.versionCode && remote && remote.versionCode){
    if (RNAppUpdate.versionCode < remote.versionCode) {
      if (remote.forceUpdate) {
        if(this.options.forceUpdateApp) {
          this.options.forceUpdateApp();
        }
        this.downloadApk(remote);
      } else if (this.options.needUpdateApp) {
        this.options.needUpdateApp((isUpdate) => {
          if (isUpdate) {
            if(remote && remote.playStoreUrl)
              Linking.openURL(remote.playStoreUrl)
            else
              this.downloadApk(remote);
          }
        });
      }
    } else if(this.options.notNeedUpdateApp) {
      this.options.notNeedUpdateApp();
    }
  }else if(this.options.notNeedUpdateApp) {
    this.options.notNeedUpdateApp();
  }
  }

  downloadApk(remote) {

  }

  getAppStoreVersion() {
    if (!this.options.iosAppId) {
      console.log("iosAppId doesn't exist.");
      return;
    }
    this.GET("https://itunes.apple.com/lookup?id=" + this.options.iosAppId, this.getAppStoreVersionSuccess.bind(this), this.getVersionError.bind(this));
  }

  getAppStoreVersionSuccess(data) {
    if (data.resultCount < 1) {
      console.log("iosAppId is wrong.");
      return;
    }
    const result = data.results[0];
    const version = result.version;
    const trackViewUrl = result.trackViewUrl;
    if (version !== RNAppUpdate.versionName) {
      if (this.options.needUpdateApp) {
        this.options.needUpdateApp((isUpdate) => {
          if (isUpdate) {
            RNAppUpdate.installFromAppStore(trackViewUrl);
          }
        });
      }
    }
  }

  getVersionError(err) {
    console.log("getVersionError", err);
  }

  downloadApkError(err) {
    console.log("downloadApkError", err);
    this.options.onError && this.options.onError();
  }

  checkUpdate() {
    if (Platform.OS === 'android') {
      this.getApkVersion();
    } else {
      this.getAppStoreVersion();
    }
  }
}

export default AppUpdate;
