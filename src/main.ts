import { Plugin } from "obsidian";
import { Settings, SettingsTab, DEFAULT_SETTINGS } from "./settings";

export default class Desmos extends Plugin {
    settings: Settings;

    async onload() {
        await this.loadSettings();

        this.addSettingTab(new SettingsTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
